import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createListbox } from "../../packages/core/src/listbox.ts"
import type { ListboxProps } from "../../packages/core/src/listbox.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { find, focused, mount } from "./page.ts"

const PAGE = `
  <button id="before">Before</button>
  <div id="list">
    <div id="apple">Apple</div>
    <div id="banana">Banana</div>
    <div id="off">Blueberry</div>
    <div id="cherry">Cherry</div>
  </div>
  <button id="after">After</button>`

function listbox(given: Partial<ListboxProps<string>> = {}) {
  const root = mount(PAGE)
  const heard: string[][] = []
  const made = createListbox(
    signal<ListboxProps<string>>({
      id: "list",
      onValueChange: (value) => void heard.push(value),
      ...given,
    })
  )
  for (const id of ["apple", "banana", "off", "cherry"]) {
    onTestFinished(
      bind(
        find(root, id),
        made.item(id, () => ({ disabled: id === "off" }))
      )
    )
  }
  onTestFinished(bind(find(root, "list"), made.root))
  return { root, made, heard }
}

const press = (key: string) => userEvent.keyboard(key.length === 1 ? key : `{${key}}`)
const selected = (root: HTMLElement) =>
  [...root.querySelectorAll('[aria-selected="true"]')].map((each) => each.id)

describe("a listbox", () => {
  it("is one stop for Tab, entered at the first item or the chosen one, and left by Tab", async () => {
    const { root } = listbox({ defaultValue: ["banana"] })
    const list = find(root, "list")
    expect(list.getAttribute("role")).toBe("listbox")
    expect(list.getAttribute("tabindex")).toBe("0")
    find(root, "before").focus()
    await press("Tab")
    expect(focused()).toBe("banana")
    // While focus is inside, the list is no stop of its own: Shift+Tab leaves.
    expect(list.getAttribute("tabindex")).toBe("-1")
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}")
    expect(focused()).toBe("before")
    expect(list.getAttribute("tabindex")).toBe("0")
    await press("Tab")
    await press("Tab")
    expect(focused()).toBe("after")
  })

  it("moves with the arrows and by typing, and chooses with Space, Enter or a press", async () => {
    const { root, heard } = listbox()
    find(root, "before").focus()
    await press("Tab")
    expect(focused()).toBe("apple")
    await press("ArrowDown")
    await press("ArrowDown")
    // Past the disabled item.
    expect(focused()).toBe("cherry")
    await press("ArrowDown")
    expect(focused()).toBe("cherry")
    await press(" ")
    expect(selected(root)).toEqual(["cherry"])
    await press("b")
    expect(focused()).toBe("banana")
    await press("Enter")
    // One at a time.
    expect(selected(root)).toEqual(["banana"])
    await press("Enter")
    expect(selected(root)).toEqual(["banana"])
    await userEvent.click(find(root, "apple"))
    expect(focused()).toBe("apple")
    find(root, "off").click()
    expect(selected(root)).toEqual(["apple"])
    expect(heard).toEqual([["cherry"], ["banana"], ["apple"]])
    expect(find(root, "apple").hasAttribute("data-selected")).toBe(true)
  })

  it("holds several when it is told to: a press adds or takes away", async () => {
    const { root, made, heard } = listbox({ multiple: true, defaultValue: ["apple"] })
    expect(find(root, "list").getAttribute("aria-multiselectable")).toBe("true")
    find(root, "cherry").click()
    find(root, "apple").click()
    find(root, "banana").click()
    expect(selected(root)).toEqual(["banana", "cherry"])
    expect(made.value.peek()).toEqual(["cherry", "banana"])
    expect(heard.length).toBe(3)
  })

  it("does nothing while it is disabled", async () => {
    const { root, made } = listbox({ disabled: true })
    expect(find(root, "list").getAttribute("tabindex")).toBe("-1")
    find(root, "apple").click()
    expect(made.value.peek()).toEqual([])
  })
})
