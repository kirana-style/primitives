import { describe, expect, it } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { createList, pointerMoved } from "../../packages/core/src/services/list.ts"
import type { ListRow } from "../../packages/core/src/services/list.ts"
import { find, focused, mount } from "./page.ts"

const LIST = `
  <div id="list" tabindex="-1">
    <div id="apple" role="option" tabindex="-1">Apple <kbd aria-hidden="true">⌘B</kbd></div>
    <div id="off" role="option" tabindex="-1">Avocado</div>
    <div role="none">
      <div id="banana" role="option" tabindex="-1">Banana</div>
      <div id="inner" tabindex="-1">
        <div id="blueberry" role="option" tabindex="-1">Blueberry</div>
      </div>
    </div>
    <div id="cherry" role="option" tabindex="-1">Cherry</div>
    <div id="stranger" role="option" tabindex="-1">Not a row of this list</div>
  </div>`

function list(options: { loop?: boolean } = {}) {
  const root = mount(LIST)
  const element = find(root, "list")
  const made = createList({ selector: '[role="option"]', loop: () => options.loop ?? false })
  // A list inside one of the rows: its rows are its own.
  const nested = createList({ selector: '[role="option"]' })
  const rows: Record<string, ListRow> = {}
  // Attached out of order: the page's order is what the keys follow.
  for (const id of ["cherry", "banana", "off", "apple"]) {
    rows[id] = made.row(() => ({ disabled: id === "off" }))
    rows[id].attach(find(root, id))
  }
  nested.attach(find(root, "inner"))
  rows.blueberry = nested.row()
  rows.blueberry.attach(find(root, "blueberry"))
  const detach = made.attach(element)
  element.addEventListener("keydown", (event) => made.key(event))
  element.focus()
  return { root, made, nested, rows, detach }
}

const press = (key: string) => userEvent.keyboard(key.length === 1 ? key : `{${key}}`)
const ids = (rows: ListRow[]) => rows.map((each) => each.element()?.id)

describe("list navigation", () => {
  it("reads its own rows in the page's order, without the disabled", () => {
    const { made, nested } = list()
    expect(ids(made.rows())).toEqual(["apple", "banana", "cherry"])
    expect(ids(nested.rows())).toEqual(["blueberry"])
  })

  it("moves with the arrows, Home and End, and stops at the ends", async () => {
    const { made, rows } = list()
    await press("ArrowDown")
    expect(focused()).toBe("apple")
    expect(rows.apple!.active.peek()).toBe(true)
    await press("ArrowDown")
    expect(focused()).toBe("banana")
    expect(rows.apple!.active.peek()).toBe(false)
    await press("End")
    expect(focused()).toBe("cherry")
    await press("ArrowDown")
    expect(focused()).toBe("cherry")
    await press("Home")
    expect(focused()).toBe("apple")
    await press("ArrowUp")
    expect(focused()).toBe("apple")
    expect(made.highlighted.peek()).toBe(rows.apple)
  })

  it("goes round when it loops, and up from nothing starts at the end", async () => {
    const { made } = list({ loop: true })
    await press("ArrowUp")
    expect(focused()).toBe("cherry")
    await press("ArrowDown")
    expect(focused()).toBe("apple")
    made.highlight(undefined, true)
    expect(focused()).toBe("list")
    expect(made.highlighted.peek()).toBe(undefined)
  })

  it("finds a row by typing its name, not its hidden text", async () => {
    const { rows } = list()
    await press("c")
    expect(focused()).toBe("cherry")
    await press("ArrowUp")
    // "⌘B" beside Apple is not its name.
    await press("b")
    expect(focused()).toBe("banana")
    expect(rows.apple!.label()).toBe("Apple")
    // A disabled row is not found.
    await new Promise((done) => setTimeout(done, 600))
    await press("a")
    expect(focused()).toBe("apple")
  })

  it("answers only the keys that are its own", () => {
    const { root, made } = list()
    const key = (name: string, init: KeyboardEventInit = {}) => {
      const event = new KeyboardEvent("keydown", { key: name, cancelable: true, ...init })
      Object.defineProperty(event, "currentTarget", { value: find(root, "list") })
      return made.key(event)
    }
    expect(key("Enter")).toBe(false)
    expect(key(" ")).toBe(false)
    expect(key("a", { ctrlKey: true })).toBe(false)
    expect(key("ArrowLeft")).toBe(false)
    expect(key("z")).toBe(true)
  })

  it("a row that leaves takes its highlight with it", () => {
    const { root, made, rows } = list()
    const banana = made.row()
    const leave = banana.attach(find(root, "banana"))
    made.highlight(banana)
    expect(banana.active.peek()).toBe(true)
    leave()
    expect(made.highlighted.peek()).toBe(undefined)
    expect(banana.active.peek()).toBe(false)
    expect(made.rowOf(find(root, "banana"))).toBe(undefined)
    expect(made.rowOf(find(root, "apple"))).toBe(rows.apple)
  })

  it("scrolls itself to show a row, and never the page", async () => {
    const root = mount(`<div style="height: 3000px"></div>${LIST}`)
    const element = find(root, "list")
    element.style.cssText = "height: 30px; overflow: auto; border: 3px solid"
    for (const each of element.querySelectorAll<HTMLElement>('[role="option"]')) {
      each.style.height = "20px"
    }
    const made = createList({ selector: '[role="option"]' })
    const rows = ["apple", "banana", "cherry"].map((id) => {
      const row = made.row()
      row.attach(find(root, id))
      return row
    })
    made.attach(element)
    window.scrollTo(0, 0)
    made.highlight(rows[2], true)
    // The list is far below what is on screen: it shows its row, and the page stays.
    expect(window.scrollY).toBe(0)
    const box = element.getBoundingClientRect()
    const cherry = find(root, "cherry").getBoundingClientRect()
    expect(cherry.bottom).toBeLessThanOrEqual(box.bottom - 3 + 0.5)
    expect(cherry.top).toBeGreaterThanOrEqual(box.top + 3 - 0.5)
    made.highlight(rows[0], true)
    expect(find(root, "apple").getBoundingClientRect().top).toBeGreaterThanOrEqual(box.top + 2.5)
    expect(window.scrollY).toBe(0)
  })

  it("a pointer at rest is not a pointer moving, whatever comes to lie under it", () => {
    list()
    const move = (x: number, y: number) => {
      const event = new PointerEvent("pointermove", { screenX: x, screenY: y, bubbles: true })
      let moved: boolean | undefined
      const ask = (heard: Event) => void (moved = pointerMoved(heard as PointerEvent))
      document.body.addEventListener("pointermove", ask, { once: true })
      document.body.dispatchEvent(event)
      return moved
    }
    move(900, 900)
    expect(move(910, 900)).toBe(true)
    // The browser's own move for what opened or scrolled under it: the same place.
    expect(move(910, 900)).toBe(false)
    expect(move(910, 901)).toBe(true)
  })

  it("has no rows and no highlight once its element is gone", () => {
    const { made, rows, detach } = list()
    made.highlight(rows.apple)
    detach()
    expect(made.rows()).toEqual([])
    expect(made.highlighted.peek()).toBe(undefined)
  })
})
