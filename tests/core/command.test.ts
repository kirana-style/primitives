import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createCommand } from "../../packages/core/src/command.ts"
import type { CommandProps } from "../../packages/core/src/command.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { find, mount } from "./page.ts"

const settled = () => new Promise<void>((resolve) => setTimeout(resolve))

const PAGE = `
  <div id="root">
    <input id="input" />
    <div id="list">
      <div id="file"><div id="file-h">File</div><div data-item="new">New file</div><div data-item="open" data-keywords="load">Open</div></div>
      <div id="line"></div>
      <div id="edit"><div id="edit-h">Edit</div><div data-item="copy">Copy</div><div data-item="paste" data-off>Paste</div></div>
    </div>
  </div>`

function palette(given: Partial<CommandProps> = {}) {
  const root = mount(PAGE)
  const heard: string[] = []
  const props = signal<CommandProps>({
    id: "c",
    onSelect: (value, by) => void heard.push(`${value} ${by.source}`),
    ...given,
  })
  const made = createCommand(props)
  const input = find<HTMLInputElement>(root, "input")
  const list = find(root, "list")
  onTestFinished(bind(find(root, "root"), made.root))
  for (const name of ["file", "edit"]) {
    const group = made.group(`c-${name}`)
    const element = find(root, name)
    // Its part names the element: found first.
    const heading = find(root, `${name}-h`)
    const items = [...element.querySelectorAll<HTMLElement>("[data-item]")]
    onTestFinished(bind(element, group.part))
    onTestFinished(bind(heading, group.heading))
    for (const each of items) {
      const value = each.dataset.item!
      const part = made.item(
        value,
        () => ({
          id: `c-${value}`,
          disabled: each.hasAttribute("data-off"),
          keywords: each.dataset.keywords?.split(" "),
        }),
        group
      )
      onTestFinished(bind(each, part))
    }
  }
  onTestFinished(bind(find(root, "line"), made.separator()))
  onTestFinished(bind(input, made.input))
  onTestFinished(bind(list, made.list))
  const shown = () =>
    [...list.querySelectorAll<HTMLElement>('[role="option"]')]
      .filter((each) => !each.hidden && !each.parentElement!.hidden)
      .map((each) => each.id.slice(2))
  const active = () => input.getAttribute("aria-activedescendant")?.slice(2)
  const press = async (key: string) => {
    await userEvent.keyboard(`{${key}}`)
    await settled()
  }
  return { root, props, made, input, list, heard, shown, active, press }
}

describe("a command list", () => {
  it("has no highlight until it is used, then the first command", async () => {
    const { input, active, press, heard } = palette()
    expect(input.getAttribute("role")).toBe("combobox")
    expect(input.getAttribute("aria-controls")).toBe("c-list")
    expect(active()).toBe(undefined)
    input.focus()
    await settled()
    expect(active()).toBe("new")
    await press("ArrowDown")
    expect(active()).toBe("open")
    await press("ArrowDown")
    await press("ArrowDown")
    // The last that can be chosen: a disabled one is passed over, and the list has an end.
    expect(active()).toBe("copy")
    await press("Enter")
    expect(heard).toEqual(["copy virtual"])
  })

  it("goes round its ends with loop", async () => {
    const { input, active, press } = palette({ loop: true })
    input.focus()
    await settled()
    await press("ArrowUp")
    expect(active()).toBe("copy")
    await press("ArrowDown")
    expect(active()).toBe("new")
  })

  it("is filtered by what is typed: labels, keywords, groups and the line between them", async () => {
    const { root, input, list, made, shown, active } = palette()
    input.focus()
    await userEvent.keyboard("lo")
    await settled()
    expect(shown()).toEqual(["open"])
    expect(active()).toBe("open")
    expect(find(root, "edit").hidden).toBe(true)
    expect(find(root, "file").hidden).toBe(false)
    expect(find(root, "line").hidden).toBe(true)
    expect(find(root, "file").getAttribute("aria-labelledby")).toBe("c-file-heading")
    await userEvent.keyboard("z")
    await settled()
    expect(shown()).toEqual([])
    expect(made.empty.peek()).toBe(true)
    expect(list.hasAttribute("data-empty")).toBe(true)
    await userEvent.keyboard("{Backspace}{Backspace}{Backspace}")
    await settled()
    expect(shown()).toEqual(["new", "open", "copy", "paste"])
    expect(find(root, "line").hidden).toBe(false)
  })

  it("takes the caller's own filter, or none", async () => {
    const first = palette({ filter: (label, query) => label.startsWith(query) })
    first.input.focus()
    await userEvent.keyboard("O")
    await settled()
    expect(first.shown()).toEqual(["open"])
    const second = palette({ filter: null })
    second.input.focus()
    await userEvent.keyboard("zzz")
    await settled()
    expect(second.shown()).toEqual(["new", "open", "copy", "paste"])
  })

  it("follows a caller who holds the text, and one who refuses a change", async () => {
    const { input, props, shown } = palette({
      inputValue: "",
      onInputValueChange: (_value, by) => by.cancel(),
    })
    input.focus()
    await userEvent.keyboard("c")
    await settled()
    // Refused: the list is as it was, and the input says what the caller holds.
    expect(shown()).toEqual(["new", "open", "copy", "paste"])
    props.set({ ...props.peek(), inputValue: "cop" })
    await settled()
    expect(input.value).toBe("cop")
    expect(shown()).toEqual(["copy"])
  })

  it("lets a heading stand with no group around it", () => {
    const root = mount(`<div id="lone">Recent</div>`)
    const made = createCommand(signal<CommandProps>({ id: "c" }))
    onTestFinished(bind(find(root, "lone"), made.heading))
    expect(find(root, "lone").attributes.length).toBe(1)
  })

  it("chooses what is pressed, but not a disabled item", async () => {
    const { root, heard } = palette()
    await userEvent.click(root.querySelector<HTMLElement>("#c-open")!)
    root.querySelector<HTMLElement>("#c-paste")!.click()
    expect(heard).toEqual(["open mouse"])
  })
})
