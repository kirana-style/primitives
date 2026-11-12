import { describe, expect, it } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import type { Direction } from "../../packages/core/src/direction.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import type { ReadonlySignal } from "../../packages/core/src/reactivity.ts"
import { createRoving, stepTo } from "../../packages/core/src/services/roving.ts"
import type { Orientation } from "../../packages/core/src/services/roving.ts"
import { find, focused, mount } from "./page.ts"

const ROW = `
  <div id="set">
    <button id="a">A</button>
    <button id="b">B</button>
    <button id="off" disabled>Off</button>
    <button id="c">C</button>
    <button id="soft" aria-disabled="true">Soft</button>
    <input id="other" />
  </div>`

function row(
  options: {
    orientation?: Orientation | "both"
    loop?: boolean
    direction?: ReadonlySignal<Direction>
    dir?: Direction
  } = {}
) {
  const root = mount(ROW)
  const set = find(root, "set")
  if (options.dir) set.setAttribute("dir", options.dir)
  const roving = createRoving()
  const moved: (string | undefined)[] = []
  // Registered out of order: the page's order is what the arrows follow.
  for (const id of ["soft", "c", "off", "b", "a"]) roving.register(find(root, id))
  set.addEventListener("keydown", (event) => {
    const { orientation = "horizontal", loop, direction } = options
    moved.push(
      roving.move(event, { orientation, ...(loop === undefined ? {} : { loop }), direction })?.id
    )
  })
  return { root, roving, moved }
}

const press = (key: string) => userEvent.keyboard(`{${key}}`)

describe("roving focus", () => {
  it("moves in the page's order, past what is disabled, and wraps", async () => {
    const { root, roving, moved } = row()
    expect(roving.enabled().map((each) => each.id)).toEqual(["a", "b", "c"])
    find(root, "a").focus()
    await press("ArrowRight")
    expect(focused()).toBe("b")
    await press("ArrowRight")
    expect(focused()).toBe("c")
    await press("ArrowRight")
    expect(focused()).toBe("a")
    await press("ArrowLeft")
    expect(focused()).toBe("c")
    expect(moved).toEqual(["b", "c", "a", "c"])
  })

  it("stops at the ends when it does not loop", async () => {
    const { root } = row({ loop: false })
    find(root, "c").focus()
    await press("ArrowRight")
    expect(focused()).toBe("c")
    find(root, "a").focus()
    await press("ArrowLeft")
    expect(focused()).toBe("a")
  })

  it("goes to the first and the last with Home and End", async () => {
    const { root } = row()
    find(root, "b").focus()
    await press("End")
    expect(focused()).toBe("c")
    await press("Home")
    expect(focused()).toBe("a")
  })

  it("answers only the arrows of its orientation", async () => {
    const { root, moved } = row({ orientation: "vertical" })
    find(root, "a").focus()
    await press("ArrowRight")
    expect(focused()).toBe("a")
    await press("ArrowDown")
    expect(focused()).toBe("b")
    await press("ArrowUp")
    expect(focused()).toBe("a")
    expect(moved).toEqual([undefined, "b", "a"])
  })

  it("takes both axes when asked", async () => {
    const { root } = row({ orientation: "both" })
    find(root, "a").focus()
    await press("ArrowDown")
    expect(focused()).toBe("b")
    await press("ArrowRight")
    expect(focused()).toBe("c")
  })

  it("turns left and right around where the page reads right to left", async () => {
    const { root } = row({ dir: "rtl" })
    find(root, "a").focus()
    await press("ArrowLeft")
    expect(focused()).toBe("b")
    await press("ArrowRight")
    expect(focused()).toBe("a")
  })

  it("follows a provider's direction before the page's, as it changes", async () => {
    const direction = signal<Direction>("ltr")
    const { root } = row({ dir: "rtl", direction })
    find(root, "a").focus()
    await press("ArrowRight")
    expect(focused()).toBe("b")
    direction.set("rtl")
    await press("ArrowRight")
    expect(focused()).toBe("a")
  })

  it("leaves a key from outside the set alone", async () => {
    const { root, moved } = row()
    find(root, "other").focus()
    await press("ArrowRight")
    await press("Home")
    expect(focused()).toBe("other")
    expect(moved).toEqual([undefined, undefined])
  })

  it("forgets an element that leaves", () => {
    const root = mount(`<button id="a">A</button><button id="b">B</button>`)
    const roving = createRoving()
    roving.register(find(root, "a"))
    const leave = roving.register(find(root, "b"))
    leave()
    expect(roving.enabled().map((each) => each.id)).toEqual(["a"])
    find(root, "a").remove()
    expect(roving.enabled()).toEqual([])
  })
})

describe("a step in a list", () => {
  it("wraps or stays on the end", () => {
    expect(stepTo(3, 2, 1, true)).toBe(0)
    expect(stepTo(3, 0, -1, true)).toBe(2)
    expect(stepTo(3, 2, 1, false)).toBe(2)
    expect(stepTo(3, 0, -1, false)).toBe(0)
    expect(stepTo(3, 1, "first", false)).toBe(0)
    expect(stepTo(3, 1, "last", true)).toBe(2)
  })

  it("starts at the first row from none", () => {
    expect(stepTo(3, -1, 1, false)).toBe(0)
    expect(stepTo(3, -1, 1, true)).toBe(0)
  })
})
