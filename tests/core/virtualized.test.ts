import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createCombobox } from "../../packages/core/src/combobox.ts"
import { createListbox } from "../../packages/core/src/listbox.ts"
import type { ListboxProps } from "../../packages/core/src/listbox.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { createSelect } from "../../packages/core/src/select.ts"
import type { SelectProps } from "../../packages/core/src/select.ts"
import type { ListCollection } from "../../packages/core/src/services/list.ts"
import { find, focused, mount } from "./page.ts"

const COUNT = 10_000
const SEEN = 12
const name = (index: number) => `Row ${index}`

/**
 * A window of rows as a virtualizer keeps one: `SEEN` rows in the page from `start`, drawn a
 * moment after it is asked to move, as a framework draws.
 */
function windowed(draw: (index: number, element: HTMLElement) => () => void, host: HTMLElement) {
  let start = 0
  let undo: (() => void)[] = []
  const paint = () => {
    for (const each of undo) each()
    undo = []
    for (const each of host.querySelectorAll("div")) each.remove()
    for (let index = start; index < Math.min(COUNT, start + SEEN); index++) {
      const element = document.createElement("div")
      element.id = `r${index}`
      element.textContent = name(index)
      host.append(element)
      undo.push(draw(index, element))
    }
  }
  paint()
  onTestFinished(() => {
    for (const each of undo) each()
  })
  return {
    drawn: () => host.querySelectorAll("div").length,
    scrollToIndex(index: number) {
      if (index >= start && index < start + SEEN) return
      start = Math.max(0, Math.min(COUNT - SEEN, index - 2))
      queueMicrotask(paint)
    },
  }
}

const press = (key: string) => userEvent.keyboard(key.length === 1 ? key : `{${key}}`)
const settled = () => new Promise((resolve) => setTimeout(resolve, 10))

function listbox(given: Partial<ListboxProps<number>> = {}) {
  const root = mount(`<button id="before">Before</button><div id="list"></div>`)
  const host = find(root, "list")
  const collection: ListCollection = {
    count: COUNT,
    label: name,
    disabled: (index) => index === 1,
    indexOf: (value) => value as number,
    scrollToIndex: (index) => rows.scrollToIndex(index),
  }
  const made = createListbox(
    signal<ListboxProps<number>>({ id: "list", virtualized: collection, ...given })
  )
  const rows = windowed(
    (index, element) =>
      bind(
        element,
        made.item(index, () => ({ index, disabled: index === 1 }))
      ),
    host
  )
  onTestFinished(bind(host, made.root))
  return { root, made, rows }
}

describe("a list of which only some rows are in the page", () => {
  it("draws a window of ten thousand, and says each row's place among them all", () => {
    const { root, rows } = listbox()
    expect(rows.drawn()).toBe(SEEN)
    expect(find(root, "r3").getAttribute("aria-setsize")).toBe(String(COUNT))
    expect(find(root, "r3").getAttribute("aria-posinset")).toBe("4")
  })

  it("goes to a row that is not drawn: it is brought in, and takes focus", async () => {
    const { root, made } = listbox()
    find(root, "before").focus()
    await press("Tab")
    expect(focused()).toBe("r0")
    await press("ArrowDown")
    // Past a disabled row, by its place.
    expect(focused()).toBe("r2")
    await press("End")
    await settled()
    expect(focused()).toBe(`r${COUNT - 1}`)
    expect(root.querySelector("#r0")).toBe(null)
    await press("ArrowDown")
    expect(focused()).toBe(`r${COUNT - 1}`)
    await press(" ")
    expect(made.value.peek()).toEqual([COUNT - 1])
    await press("Home")
    await settled()
    expect(focused()).toBe("r0")
  })

  it("focused again by a script, goes back to its row rather than keeping focus itself", async () => {
    const { root } = listbox()
    const list = find(root, "list")
    // As a test tool focuses: twice.
    list.focus()
    list.focus()
    expect(focused()).toBe("r0")
  })

  it("finds a row far away by typing its name", async () => {
    const { root } = listbox()
    find(root, "before").focus()
    await press("Tab")
    await userEvent.keyboard("row 77")
    await settled()
    expect(focused()).toBe("r77")
    expect(find(root, "r77").hasAttribute("data-highlighted")).toBe(true)
  })

  it("is entered at what is chosen, wherever that is", async () => {
    const { root } = listbox({ defaultValue: [5000] })
    find(root, "before").focus()
    await press("Tab")
    await settled()
    expect(focused()).toBe("r5000")
    expect(find(root, "r5000").getAttribute("aria-selected")).toBe("true")
  })

  it("moves through ten thousand rows without reading the page for them", async () => {
    const { root } = listbox()
    find(root, "before").focus()
    await press("Tab")
    const began = performance.now()
    for (let step = 0; step < 40; step++) {
      find(root, "list").dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true })
      )
      await Promise.resolve()
    }
    await settled()
    expect(focused()).toBe("r41")
    // Forty steps: a list that walked every row for each would take far longer.
    expect(performance.now() - began).toBeLessThan(500)
  })
})

describe("a combobox over a collection", () => {
  it("moves its highlight by place, and the caller does the filtering", async () => {
    const root = mount(`<input id="input" /><div id="list"></div>`)
    const host = find(root, "list")
    const collection: ListCollection = {
      count: COUNT,
      label: name,
      scrollToIndex: (index) => rows.scrollToIndex(index),
    }
    const made = createCombobox(signal({ id: "c", inline: true, virtualized: collection }))
    const rows = windowed(
      (index, element) =>
        bind(
          element,
          made.item(index, () => ({ id: `c-${index}`, index }))
        ),
      host
    )
    onTestFinished(bind(find(root, "input"), made.input))
    onTestFinished(bind(host, made.popup))
    const input = find(root, "input")
    input.focus()
    await press("ArrowDown")
    expect(input.getAttribute("aria-activedescendant")).toBe("c-0")
    await press("ArrowUp")
    await press("ArrowUp")
    // Focus never leaves the input; every row drawn is shown, whatever was typed.
    await userEvent.keyboard("zz")
    await settled()
    expect(focused()).toBe("input")
    expect(root.querySelectorAll("[hidden]").length).toBe(0)
    expect(made.empty.peek()).toBe(false)
  })
})

describe("a select over a collection", () => {
  it("opens on its chosen row, wherever that is among them all", async () => {
    const root = mount(`<button id="trigger">Pick</button><div id="list" tabindex="-1"></div>`)
    const host = find(root, "list")
    const collection: ListCollection = {
      count: COUNT,
      label: name,
      indexOf: (value) => value as number,
      scrollToIndex: (index) => rows.scrollToIndex(index),
    }
    const made = createSelect(
      signal<SelectProps<number>>({ id: "s", defaultValue: 7000, virtualized: collection })
    )
    onTestFinished(made.mount())
    onTestFinished(bind(find(root, "trigger"), made.trigger))
    const rows = windowed(
      (index, element) =>
        bind(
          element,
          made.item(index, () => ({ index }))
        ),
      host
    )
    onTestFinished(bind(host, made.popup))
    find(root, "trigger").click()
    await settled()
    await settled()
    expect(focused()).toBe("r7000")
    expect(find(root, "r7000").getAttribute("aria-selected")).toBe("true")
    expect(find(root, "r7000").getAttribute("aria-posinset")).toBe("7001")
    await press("ArrowDown")
    expect(focused()).toBe("r7001")
  })
})
