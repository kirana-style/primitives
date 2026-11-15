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

  describe("with places to rest", () => {
    const TWO = { snapPoints: [0.4, 1] }
    const rests = (sheet: HTMLElement) => sheet.style.getPropertyValue("--drawer-snap-point-offset")
    const flick = (sheet: HTMLElement, by: number) => {
      pointer(sheet, "pointerdown", 100, 100)
      pointer(sheet, "pointermove", 100, 100 + Math.sign(by) * 5)
      return new Promise<void>((resolve) =>
        setTimeout(() => {
          pointer(sheet, "pointermove", 100, 100 + by)
          pointer(sheet, "pointerup", 100, 100 + by)
          resolve()
        }, 20)
      )
    }

    it("opens at the smallest, and says how far from whole it rests", async () => {
      const { sheet, backdrop, made } = drawer(TWO)
      await settled()
      expect(made.snapPoint.peek()).toBe(0.4)
      // Three fifths of its two hundred are out of view.
      expect(rests(sheet)).toBe("120px")
      expect(rests(backdrop)).toBe("120px")
      expect(sheet.style.transform).toBe("")
    })

    it("opens where it is told, and whole when it has none", async () => {
      const whole = drawer()
      await settled()
      expect(whole.made.snapPoint.peek()).toBe(1)
      expect(rests(whole.sheet)).toBe("0px")
      const told = drawer({ ...TWO, defaultSnapPoint: 1 })
      await settled()
      expect(rests(told.sheet)).toBe("0px")
    })

    it("is dragged to the place nearest where it is let go", async () => {
      const heard: [number, string][] = []
      const { sheet, made, movement } = drawer({
        ...TWO,
        onSnapPointChange: (value, details) => void heard.push([value, details.reason]),
      })
      await settled()
      await pull(sheet, { y: -100 })
      expect(made.snapPoint.peek()).toBe(1)
      expect(rests(sheet)).toBe("0px")
      expect(movement("y")).toBe("")
      await pull(sheet, { y: 40 })
      expect(made.snapPoint.peek()).toBe(1)
      await pull(sheet, { y: 70 })
      expect(made.snapPoint.peek()).toBe(0.4)
      expect(rests(sheet)).toBe("120px")
      expect(made.open.peek()).toBe(true)
      expect(heard).toEqual([
        [1, "swipe"],
        [0.4, "swipe"],
      ])
    })

    it("goes no further out than its largest", async () => {
      const { sheet, movement } = drawer(TWO)
      await settled()
      await pull(sheet, { y: -300 }, false)
      expect(movement("y")).toBe("-120px")
      pointer(sheet, "pointerup", 100, -200)
    })

    it("is dragged by a pointer that has left it: pressed at its edge, moved away", async () => {
      const { root, sheet, made } = drawer(TWO)
      await settled()
      // The moves and the release reach what is behind, never the drawer.
      const behind = find(root, "trigger")
      pointer(sheet, "pointerdown", 100, 100)
      for (const y of [80, 50, 20]) {
        await new Promise((resolve) => setTimeout(resolve, 40))
        pointer(behind, "pointermove", 100, y)
      }
      expect(sheet.hasAttribute("data-swiping")).toBe(true)
      pointer(behind, "pointerup", 100, 20)
      expect(made.snapPoint.peek()).toBe(1)
      // And nothing is heard once it is let go.
      pointer(behind, "pointermove", 100, 300)
      expect(sheet.hasAttribute("data-swiping")).toBe(false)
    })

    it("closes when it is let go well past its smallest", async () => {
      const { sheet, made, why } = drawer(TWO)
      await settled()
      // A quarter of what shows at its smallest is twenty.
      await pull(sheet, { y: 15 })
      expect(made.open.peek()).toBe(true)
      await pull(sheet, { y: 30 })
      expect(made.open.peek()).toBe(false)
      expect(why).toEqual(["swipe"])
    })

    it("a flick goes one place on: up to the next, down to the one before, then out", async () => {
      const { sheet, made } = drawer(TWO)
      await settled()
      await flick(sheet, -30)
      expect(made.snapPoint.peek()).toBe(1)
      await flick(sheet, 30)
      expect(made.snapPoint.peek()).toBe(0.4)
      expect(made.open.peek()).toBe(true)
      await flick(sheet, 30)
      expect(made.open.peek()).toBe(false)
    })

    it("is moved by a caller, who may hold it or refuse", async () => {
      const { sheet, made } = drawer(TWO)
      await settled()
      made.setSnapPoint(1, { reason: "button", canceled: false, cancel() {} } as never)
      expect(rests(sheet)).toBe("0px")
      const held = drawer({ ...TWO, snapPoint: 1 })
      await settled()
      await pull(held.sheet, { y: 70 })
      // Held at whole: asked, not moved.
      expect(held.made.snapPoint.peek()).toBe(1)
      const refused = drawer({ ...TWO, onSnapPointChange: (_, details) => details.cancel() })
      await settled()
      await pull(refused.sheet, { y: -100 })
      expect(refused.made.snapPoint.peek()).toBe(0.4)
      expect(refused.movement("y")).toBe("")
    })

    it("rests at the nearest of its places when it is given one that is none", async () => {
      const { sheet, made } = drawer({ snapPoints: [1, 0.25, 0.6], defaultSnapPoint: 0.5 })
      await settled()
      expect(made.snapPoint.peek()).toBe(0.6)
      expect(rests(sheet)).toBe("80px")
    })

    it("rests towards the edge it closes at", async () => {
      const { sheet } = drawer({ ...TWO, swipeDirection: "up" })
      await settled()
      expect(rests(sheet)).toBe("-120px")
    })
  })
})
