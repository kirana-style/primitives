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
  it("highlights the first shown command from the start, so Enter does it", async () => {
    const { root, input, active, press, heard } = palette()
    expect(root.querySelector("#c-new")!.hasAttribute("data-highlighted")).toBe(true)
    expect(root.querySelector("#c-new")!.getAttribute("aria-selected")).toBe("true")
    // Named to a reader once focus is in the input, where it is read.
    expect(active()).toBe(undefined)
    input.focus()
    await settled()
    expect(active()).toBe("new")
    await press("Enter")
    expect(heard).toEqual(["new virtual"])
    // The first is the highlight: the next is a step from it.
    await press("ArrowDown")
    expect(active()).toBe("open")
    await userEvent.keyboard("co")
    await settled()
    expect(active()).toBe("copy")
    expect(root.querySelector("#c-open")!.hasAttribute("data-highlighted")).toBe(false)
  })

  it("highlights the first of the rows a caller draws for the text, once they are drawn", async () => {
    const root = mount(`<input id="i" /><div id="l"></div>`)
    const props = signal<CommandProps>({ id: "d", filter: null })
    const made = createCommand(props)
    const input = find<HTMLInputElement>(root, "i")
    const list = find(root, "l")
    onTestFinished(bind(input, made.input))
    onTestFinished(bind(list, made.list))
    const unbind = new Map<string, () => void>()
    // The caller's own list, drawn from data a moment after the text changes.
    const draw = (values: string[]) => {
      for (const [value, stop] of unbind) {
        if (values.includes(value)) continue
        stop()
        list.querySelector(`#d-${value}`)!.remove()
        unbind.delete(value)
      }
      for (const value of values) {
        if (unbind.has(value)) continue
        const element = document.createElement("div")
        element.textContent = value
        list.prepend(element)
        unbind.set(
          value,
          bind(
            element,
            made.item(value, () => ({ id: `d-${value}` }))
          )
        )
      }
    }
    onTestFinished(() => draw([]))
    draw(["apple", "apricot"].reverse())
    await settled()
    const active = () => input.getAttribute("aria-activedescendant")
    const lit = () => list.querySelector("[data-highlighted]")?.id
    expect(lit()).toBe("d-apple")
    input.focus()
    await settled()
    expect(active()).toBe("d-apple")
    await userEvent.keyboard("b")
    await settled()
    // The old rows are still the page's: the first of them, until the new ones come.
    expect(active()).toBe("d-apple")
    draw(["banana", "blueberry"].reverse())
    await settled()
    expect(active()).toBe("d-banana")
    expect(lit()).toBe("d-banana")
  })

  it("names an item given no value by its label, or by its text as it reads then", async () => {
    const root = mount(
      `<div id="list"><div id="a">Shown</div><div id="b"> Plain  <i>text</i><span hidden>no</span></div></div>`
    )
    const heard: string[] = []
    const made = createCommand(
      signal<CommandProps>({ id: "v", onSelect: (value) => void heard.push(value) })
    )
    // An item writes its id: found first.
    const [list, labelled, plain] = ["list", "a", "b"].map((id) => find(root, id))
    onTestFinished(bind(list!, made.list))
    onTestFinished(
      bind(
        labelled!,
        made.item(undefined, () => ({ id: "v-a", label: "Given" }))
      )
    )
    onTestFinished(
      bind(
        plain!,
        made.item(undefined, () => ({ id: "v-b" }))
      )
    )
    await settled()
    labelled!.click()
    plain!.click()
    plain!.querySelector("i")!.textContent = "words"
    plain!.click()
    expect(heard).toEqual(["Given", "Plain text", "Plain words"])
  })

  it("draws its first item highlighted before any element is known, as a server does", () => {
    const made = createCommand(signal<CommandProps>({ id: "s" }))
    const one = made.item("one", () => ({ id: "s-one", disabled: true }))
    const two = made.item("two", () => ({ id: "s-two" }))
    expect(one.props.peek()["data-highlighted"]).toBe(undefined)
    expect(two.props.peek()["data-highlighted"]).toBe("")
    expect(two.props.peek()["aria-selected"]).toBe("true")
    // The input is drawn before its items: it names none until focus is in it.
    expect(made.input.props.peek()["aria-activedescendant"]).toBe(undefined)
  })

  it("has no highlight until it is used without autoHighlight, then the first command", async () => {
    const { input, active, press, heard } = palette({ autoHighlight: false })
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

  it("says its text in its part, so a server draws it", () => {
    const made = createCommand(signal<CommandProps>({ id: "c", defaultInputValue: "cop" }))
    expect(made.input.props.peek().value).toBe("cop")
  })

  it("chooses what is pressed, but not a disabled item", async () => {
    const { root, heard } = palette()
    await userEvent.click(root.querySelector<HTMLElement>("#c-open")!)
    root.querySelector<HTMLElement>("#c-paste")!.click()
    expect(heard).toEqual(["open mouse"])
  })
})
