import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import {
  DRAWER_CLOSE,
  DRAWER_REST,
  DRAWER_SLOP,
  createDrawer,
} from "../../packages/core/src/drawer.ts"
import type { DrawerProps } from "../../packages/core/src/drawer.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { find, focused, mount, style } from "./page.ts"

const PAGE = `
  <button id="trigger">Open</button>
  <div id="backdrop" class="backdrop"></div>
  <div id="sheet" class="sheet">
    <h2 id="title">Filters</h2>
    <button id="apply">Apply</button>
    <input id="name" aria-label="Name" />
    <div id="list" class="list"><div class="tall">Rows</div></div>
    <button id="close">Close</button>
  </div>`

function drawer(given: Partial<DrawerProps> = {}) {
  style(`
    .backdrop { position: fixed; inset: 0; }
    .sheet { position: fixed; inset: auto 0 0; height: 200px; background: white;
      transform: translateY(var(--drawer-swipe-movement-y, 0)); }
    .sheet[data-swipe-direction="right"] { inset: 0 0 0 auto; width: 200px; height: auto;
      transform: translateX(var(--drawer-swipe-movement-x, 0)); }
    .sheet[data-starting-style], .sheet[data-ending-style] { opacity: 0; }
    .list { height: 40px; overflow-y: auto; }
    .tall { height: 200px; }`)
  const root = mount(PAGE)
  const why: string[] = []
  const props = signal<DrawerProps>({
    id: "dw",
    defaultOpen: true,
    onOpenChange: (open, details) => void why.push(open ? "open" : details.reason),
    ...given,
  })
  const made = createDrawer(props)
  // Found before they are parts: the drawer takes an id of its own.
  const sheet = find(root, "sheet")
  const backdrop = find(root, "backdrop")
  onTestFinished(bind(find(root, "trigger"), made.trigger))
  onTestFinished(bind(backdrop, made.backdrop))
  onTestFinished(bind(sheet, made.popup))
  onTestFinished(bind(find(root, "title"), made.title))
  onTestFinished(bind(find(root, "close"), made.close))
  onTestFinished(made.mount())
  const movement = (axis: "x" | "y", of: HTMLElement = sheet) =>
    of.style.getPropertyValue(`--drawer-swipe-movement-${axis}`)
  return { root, sheet, backdrop, made, why, movement }
}

const pointer = (target: Element, type: string, x: number, y: number) =>
  target.dispatchEvent(
    new PointerEvent(type, {
      clientX: x,
      clientY: y,
      button: 0,
      pointerId: 1,
      bubbles: true,
      cancelable: true,
    })
  )
const settled = () => new Promise((resolve) => setTimeout(resolve, 30))
/** A slow drag, so only how far it goes decides. */
async function pull(target: Element, by: { x?: number; y?: number }, release = true) {
  pointer(target, "pointerdown", 100, 100)
  for (const part of [0.25, 0.5, 0.75, 1]) {
    await new Promise((resolve) => setTimeout(resolve, 40))
    pointer(target, "pointermove", 100 + (by.x ?? 0) * part, 100 + (by.y ?? 0) * part)
  }
  if (release) pointer(target, "pointerup", 100 + (by.x ?? 0), 100 + (by.y ?? 0))
}

describe("a drawer", () => {
  it("is a dialog: its role, its name, its first control focused, its page held", async () => {
    const { root, sheet } = drawer()
    await settled()
    expect(sheet.getAttribute("role")).toBe("dialog")
    expect(sheet.getAttribute("aria-modal")).toBe("true")
    expect(sheet.getAttribute("aria-labelledby")).toBe("dw-title")
    expect(sheet.getAttribute("data-swipe-direction")).toBe("down")
    // Its first control, as a dialog's: not the drawer itself.
    expect(focused()).toBe("apply")
    expect(find(root, "trigger").getAttribute("aria-expanded")).toBe("true")
  })

  it("says how far it is dragged, and is not moved by the component", async () => {
    const { sheet, backdrop, movement } = drawer()
    await settled()
    await pull(sheet, { y: 30 }, false)
    expect(sheet.hasAttribute("data-swiping")).toBe(true)
    expect(backdrop.hasAttribute("data-swiping")).toBe(true)
    expect(movement("y")).toBe("30px")
    expect(movement("x")).toBe("0px")
    expect(sheet.style.getPropertyValue("--drawer-swipe-progress")).toBe("0.15")
    expect(movement("y", backdrop)).toBe("30px")
    // Nothing but what it says: where the drawer goes is the design's.
    expect(sheet.style.transform).toBe("")
    pointer(sheet, "pointerup", 100, 130)
  })

  it("springs back from a short drag, and from one the other way", async () => {
    const { sheet, made, why, movement } = drawer()
    await settled()
    await pull(sheet, { y: 200 * DRAWER_CLOSE - 10 })
    expect(made.open.peek()).toBe(true)
    expect(sheet.hasAttribute("data-swiping")).toBe(false)
    expect(movement("y")).toBe("")
    await pull(sheet, { y: -120 })
    expect(movement("y")).toBe("")
    expect(why).toEqual([])
  })

  it("is not dragged by a press that barely moves", async () => {
    const { sheet } = drawer()
    await settled()
    pointer(sheet, "pointerdown", 100, 100)
    pointer(sheet, "pointermove", 100, 100 + DRAWER_SLOP - 1)
    expect(sheet.hasAttribute("data-swiping")).toBe(false)
    pointer(sheet, "pointerup", 100, 100 + DRAWER_SLOP - 1)
  })

  it("closes when it is let go far enough, and leaves from where it was", async () => {
    const { sheet, made, why, movement } = drawer()
    await settled()
    await pull(sheet, { y: 200 * DRAWER_CLOSE + 10 })
    expect(made.open.peek()).toBe(false)
    expect(why).toEqual(["swipe"])
    // Through its exit, how far it went stays written.
    expect(movement("y")).toBe("60px")
    await expect.poll(() => made.mounted.peek()).toBe(false)
  })

  it("is not a flick when the pointer rested before it was let go", async () => {
    const { sheet, made } = drawer()
    await settled()
    pointer(sheet, "pointerdown", 100, 100)
    pointer(sheet, "pointermove", 100, 105)
    await new Promise((resolve) => setTimeout(resolve, 20))
    pointer(sheet, "pointermove", 100, 135)
    await new Promise((resolve) => setTimeout(resolve, DRAWER_REST + 60))
    pointer(sheet, "pointerup", 100, 135)
    expect(made.open.peek()).toBe(true)
  })

  it("closes on a flick, however short", async () => {
    const { sheet, made, why } = drawer()
    await settled()
    pointer(sheet, "pointerdown", 100, 100)
    pointer(sheet, "pointermove", 100, 105)
    await new Promise((resolve) => setTimeout(resolve, 20))
    pointer(sheet, "pointermove", 100, 135)
    pointer(sheet, "pointerup", 100, 135)
    expect(made.open.peek()).toBe(false)
    expect(why).toEqual(["swipe"])
  })

  it("stays when a caller refuses", async () => {
    const { sheet, made, movement } = drawer({ onOpenChange: (_, details) => details.cancel() })
    await settled()
    await pull(sheet, { y: 120 })
    expect(made.open.peek()).toBe(true)
    expect(movement("y")).toBe("")
  })

  it("goes the way it is told", async () => {
    const { sheet, made, movement } = drawer({ swipeDirection: "right" })
    await settled()
    expect(sheet.getAttribute("data-swipe-direction")).toBe("right")
    await pull(sheet, { y: 120 })
    expect(made.open.peek()).toBe(true)
    await pull(sheet, { x: 30 }, false)
    expect(movement("x")).toBe("30px")
    expect(movement("y")).toBe("0px")
    pointer(sheet, "pointermove", 220, 100)
    pointer(sheet, "pointerup", 220, 100)
    expect(made.open.peek()).toBe(false)
  })

  it("leaves a field to its text, and what scrolls to its scroll", async () => {
    const { root, sheet, made } = drawer()
    await settled()
    await pull(find(root, "name"), { y: 120 })
    expect(made.open.peek()).toBe(true)
    const list = find(root, "list")
    list.scrollTop = 30
    await pull(list, { y: 120 })
    expect(made.open.peek()).toBe(true)
    // At its top, there is nothing left to scroll that way: the drawer is what moves.
    list.scrollTop = 0
    await pull(list, { y: 120 })
    expect(made.open.peek()).toBe(false)
    expect(sheet.hasAttribute("data-swiping")).toBe(false)
  })

  it("does not press the button a drag ends on", async () => {
    const { root, sheet, made } = drawer()
    await settled()
    let pressed = 0
    find(root, "apply").addEventListener("click", () => pressed++)
    await pull(find(root, "apply"), { y: 20 })
    // The click a browser makes of a press and a release on one element.
    find(root, "apply").click()
    expect(pressed).toBe(0)
    expect(made.open.peek()).toBe(true)
    await userEvent.click(find(root, "apply"))
    expect(pressed).toBe(1)
    expect(sheet.hasAttribute("data-swiping")).toBe(false)
  })

  it("says its size, and begins where it lies when it is opened again", async () => {
    const { root, sheet, made, movement } = drawer()
    await settled()
    expect(sheet.style.getPropertyValue("--drawer-height")).toBe("200px")
    await pull(sheet, { y: 120 })
    await expect.poll(() => made.mounted.peek()).toBe(false)
    find(root, "trigger").click()
    expect(made.open.peek()).toBe(true)
    expect(movement("y")).toBe("")
  })
})
