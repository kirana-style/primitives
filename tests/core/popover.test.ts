import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { details } from "../../packages/core/src/part.ts"
import { createPopover } from "../../packages/core/src/popover.ts"
import type { PopoverProps } from "../../packages/core/src/popover.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { find, focused, mount, park } from "./page.ts"

// The trigger at 10..110 × 10..40; the popup is placed under it. Every part is kept in the
// page, as an adapter draws them with `keepMounted`.
const PAGE = `
  <button id="before">Before</button>
  <button id="trigger" style="position: fixed; left: 10px; top: 10px; width: 100px; height: 30px">T</button>
  <div id="backdrop" style="position: fixed; inset: 0"></div>
  <div id="positioner">
    <div id="popup" style="width: 120px; height: 60px">
      <div id="arrow" style="width: 10px; height: 10px"></div>
      <input id="first" />
      <button id="close">Close</button>
    </div>
  </div>
  <button id="after">After</button>`

function popover(given: Partial<PopoverProps> = {}) {
  const root = mount(PAGE)
  const reasons: string[] = []
  const made = createPopover(
    signal<PopoverProps>({
      id: "p",
      onOpenChange: (open, by) => reasons.push(`${open ? "open" : "close"}: ${by.reason}`),
      ...given,
    })
  )
  // Found before they are bound: a part that writes `id` renames its element.
  const trigger = find(root, "trigger")
  const popup = find(root, "popup")
  const backdrop = find(root, "backdrop")
  const arrow = find(root, "arrow")
  const stops = [
    bind(trigger, made.trigger),
    bind(backdrop, made.backdrop),
    bind(find(root, "positioner"), made.positioner),
    bind(popup, made.popup),
    bind(arrow, made.arrow),
    bind(find(root, "close"), made.close),
    made.mount(),
  ]
  onTestFinished(() => {
    made.setOpen(false, details("test"))
    for (const stop of stops.reverse()) stop()
  })
  return {
    root,
    made,
    reasons,
    trigger,
    popup,
    backdrop,
    arrow,
    enter: () => trigger.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" })),
    moveTo: (x: number, y: number) =>
      document.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y })),
  }
}

const inert = (root: HTMLElement, id: string) => find(root, id).hasAttribute("inert")
const locked = () => getComputedStyle(document.documentElement).overflow === "hidden"

describe("a popover", () => {
  it("points an arrow at its trigger, and says where it is", async () => {
    const { made, arrow, trigger } = popover()
    expect(arrow.getAttribute("aria-hidden")).toBe("true")
    trigger.click()
    await expect.poll(() => arrow.style.left).not.toBe("")
    expect(made.open.peek()).toBe(true)
    expect(arrow.getAttribute("data-side")).toBe("bottom")
    expect(arrow.getAttribute("data-align")).toBe("center")
    expect(arrow.hasAttribute("data-uncentered")).toBe(false)
    const box = arrow.getBoundingClientRect()
    expect(box.left + box.width / 2).toBe(60)
  })

  it("has a backdrop that says whether it is open, and a press on it closes the popover", async () => {
    const { made, backdrop, trigger, reasons } = popover()
    expect(backdrop.getAttribute("role")).toBe("presentation")
    expect(backdrop.hasAttribute("data-closed")).toBe(true)
    trigger.click()
    expect(backdrop.hasAttribute("data-open")).toBe(true)
    expect(backdrop.hasAttribute("data-closed")).toBe(false)
    backdrop.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))
    expect(made.open.peek()).toBe(false)
    expect(reasons).toEqual(["open: trigger-press", "close: outside-press"])
  })

  it("leaves the page alone when it is not modal", async () => {
    const { root, trigger } = popover()
    trigger.click()
    await expect.poll(focused).toBe("first")
    expect(inert(root, "after")).toBe(false)
    expect(locked()).toBe(false)
    find(root, "close").focus()
    await userEvent.tab()
    expect(focused()).toBe("after")
  })

  it("holds the page when it is modal: inert, not scrolling, Tab kept inside", async () => {
    const { root, made, trigger, backdrop } = popover({ modal: true })
    trigger.click()
    await expect.poll(focused).toBe("first")
    expect(inert(root, "after")).toBe(true)
    expect(inert(root, "before")).toBe(true)
    // Its own backdrop is still the pointer's.
    expect(backdrop.hasAttribute("inert")).toBe(false)
    expect(locked()).toBe(true)
    expect(getComputedStyle(document.body).pointerEvents).not.toBe("none")
    find(root, "close").focus()
    await userEvent.tab()
    expect(focused()).toBe("first")
    made.setOpen(false, details("test"))
    expect(inert(root, "after")).toBe(false)
    await expect.poll(locked).toBe(false)
  })

  it("keeps Tab inside and leaves the page live when it only traps focus", async () => {
    const { root, trigger } = popover({ modal: "trap-focus" })
    trigger.click()
    await expect.poll(focused).toBe("first")
    expect(inert(root, "after")).toBe(false)
    expect(locked()).toBe(false)
    find(root, "close").focus()
    await userEvent.tab()
    expect(focused()).toBe("first")
    await userEvent.tab({ shift: true })
    expect(focused()).toBe("close")
  })
})

// Each test starts long after the last: "one just closed" is the page's, shared by every popup.
let clock = Date.now()
let later = 0

describe("a popover its trigger opens on hover", () => {
  beforeEach(async () => {
    await park()
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] })
    clock += 60_000
    vi.setSystemTime(clock)
    // The clock the service reads starts again with each set of fake timers: each test
    // begins later on it than the one before ended.
    vi.advanceTimersByTime((later += 600_000))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function hovered(given: Partial<PopoverProps> = {}) {
    const drawn = popover(given)
    drawn.made.hovering.set({ openOnHover: true })
    return drawn
  }

  it("does not open for the pointer unless its trigger asks", () => {
    const { made, enter } = popover()
    enter()
    vi.advanceTimersByTime(1000)
    expect(made.open.peek()).toBe(false)
    made.hovering.set({ openOnHover: true })
    enter()
    vi.advanceTimersByTime(300)
    expect(made.open.peek()).toBe(true)
  })

  it("opens once the pointer has rested on the trigger, and closes when it leaves", () => {
    const { made, reasons, enter, moveTo } = hovered()
    enter()
    vi.advanceTimersByTime(299)
    expect(made.open.peek()).toBe(false)
    vi.advanceTimersByTime(1)
    expect(made.open.peek()).toBe(true)
    // On the trigger, and on the way to the popup under it: still open.
    moveTo(50, 20)
    moveTo(50, 60)
    expect(made.open.peek()).toBe(true)
    moveTo(400, 400)
    expect(made.open.peek()).toBe(false)
    expect(reasons).toEqual(["open: trigger-hover", "close: trigger-hover"])
  })

  it("waits as its trigger says", () => {
    const { made, enter, moveTo } = hovered()
    made.hovering.set({ openOnHover: true, delay: 50, closeDelay: 200 })
    enter()
    vi.advanceTimersByTime(50)
    expect(made.open.peek()).toBe(true)
    moveTo(400, 400)
    vi.advanceTimersByTime(199)
    expect(made.open.peek()).toBe(true)
    vi.advanceTimersByTime(1)
    expect(made.open.peek()).toBe(false)
  })

  it("says its trigger is pressed only when a press opened it, as Base UI does", () => {
    const { made, trigger, enter } = hovered()
    enter()
    vi.advanceTimersByTime(300)
    expect(made.open.peek()).toBe(true)
    expect(trigger.hasAttribute("data-pressed")).toBe(false)
  })

  it("takes no focus and holds no page while the pointer opened it", () => {
    const { root, made, backdrop, enter } = hovered({ modal: true })
    find(root, "before").focus()
    enter()
    vi.advanceTimersByTime(300)
    expect(made.open.peek()).toBe(true)
    expect(focused()).toBe("before")
    expect(inert(root, "after")).toBe(false)
    expect(locked()).toBe(false)
    // The trigger is under the backdrop: the pointer still reaches it.
    expect(backdrop.style.pointerEvents).toBe("none")
  })

  it("is kept by a press that comes just after the pointer opened it, as a pressed one", async () => {
    const { root, made, backdrop, trigger, reasons, enter, moveTo } = hovered({ modal: true })
    enter()
    vi.advanceTimersByTime(300)
    vi.advanceTimersByTime(400)
    trigger.click()
    expect(made.open.peek()).toBe(true)
    // From here it is a popover that was pressed: focus moves in and the page is held.
    await expect.poll(focused).toBe("first")
    expect(inert(root, "after")).toBe(true)
    expect(locked()).toBe(true)
    expect(backdrop.style.pointerEvents).toBe("")
    // And the pointer leaving does not close it.
    moveTo(400, 400)
    vi.advanceTimersByTime(1000)
    expect(made.open.peek()).toBe(true)
    // The next press closes it.
    trigger.click()
    expect(made.open.peek()).toBe(false)
    expect(reasons).toEqual(["open: trigger-hover", "close: trigger-press"])
  })

  it("is closed by a press that comes later", () => {
    const { made, trigger, reasons, enter } = hovered()
    enter()
    vi.advanceTimersByTime(300)
    vi.advanceTimersByTime(500)
    trigger.click()
    expect(made.open.peek()).toBe(false)
    expect(reasons).toEqual(["open: trigger-hover", "close: trigger-press"])
  })

  it("still opens by a press, and the pointer's wait then changes nothing", async () => {
    const { made, trigger, reasons, enter, moveTo } = hovered()
    enter()
    vi.advanceTimersByTime(100)
    trigger.click()
    expect(made.open.peek()).toBe(true)
    await expect.poll(focused).toBe("first")
    // The wait ends: it is open already, and stays the press's.
    vi.advanceTimersByTime(300)
    moveTo(400, 400)
    vi.advanceTimersByTime(1000)
    expect(made.open.peek()).toBe(true)
    expect(reasons).toEqual(["open: trigger-press"])
  })

  it("is not the pointer's when its caller refuses the opening", () => {
    const { made, trigger, enter } = hovered({
      onOpenChange: (open, by) => {
        if (open && by.reason === "trigger-hover") by.cancel()
      },
    })
    enter()
    vi.advanceTimersByTime(300)
    expect(made.open.peek()).toBe(false)
    trigger.click()
    expect(made.open.peek()).toBe(true)
    // A press opened it: the next press closes it, however soon.
    trigger.click()
    expect(made.open.peek()).toBe(false)
  })
})

// A press of the pointer: a click that counts one press. `click()` alone is the keyboard's.
const press = (element: HTMLElement) =>
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }))

describe("a popover, in Base UI's words", () => {
  it("says its trigger is pressed while the popover a press opened is open", async () => {
    const { made, trigger } = popover()
    expect(trigger.hasAttribute("data-pressed")).toBe(false)
    press(trigger)
    expect(trigger.hasAttribute("data-pressed")).toBe(true)
    press(trigger)
    expect(trigger.hasAttribute("data-pressed")).toBe(false)
    // Opened some other way, its trigger was never pressed.
    made.setOpen(true, details("imperative-action"))
    expect(made.open.peek()).toBe(true)
    expect(trigger.hasAttribute("data-pressed")).toBe(false)
  })

  it("says why its motion should be skipped: a press from the keyboard, or Escape", async () => {
    const { popup, trigger } = popover()
    // A pointer's press: the usual motion.
    press(trigger)
    expect(popup.hasAttribute("data-instant")).toBe(false)
    popup.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    expect(popup.getAttribute("data-instant")).toBe("dismiss")
    // A click with no pointer behind it is the keyboard's.
    trigger.click()
    expect(popup.getAttribute("data-instant")).toBe("click")
  })

  it("fades its arrow with it, and says on its positioner whether the trigger is in view", async () => {
    const { root, arrow, trigger } = popover()
    const positioner = find(root, "positioner")
    expect(arrow.hasAttribute("data-closed")).toBe(true)
    expect(arrow.hasAttribute("data-open")).toBe(false)
    press(trigger)
    expect(arrow.hasAttribute("data-open")).toBe(true)
    expect(arrow.hasAttribute("data-closed")).toBe(false)
    await expect.poll(() => arrow.style.left).not.toBe("")
    expect(positioner.hasAttribute("data-anchor-hidden")).toBe(false)
    trigger.style.top = "-200px"
    await expect.poll(() => positioner.hasAttribute("data-anchor-hidden")).toBe(true)
  })

  it("writes its size on the positioner and on itself, and the old size then the new as it changes", async () => {
    const { root, popup, trigger } = popover()
    const positioner = find(root, "positioner")
    press(trigger)
    // Measured once it is placed.
    await expect.poll(() => positioner.style.getPropertyValue("--positioner-width")).toBe("120px")
    expect(positioner.style.getPropertyValue("--positioner-height")).toBe("60px")
    expect(popup.style.getPropertyValue("--popup-width")).toBe("auto")
    // Its size is its content's from here on, through the variable, with a transition on it.
    popup.style.width = "var(--popup-width)"
    popup.style.height = "auto"
    popup.style.transition = "width 10s linear"
    const wide = document.createElement("div")
    wide.style.width = "400px"
    popup.append(wide)
    await expect.poll(() => positioner.style.getPropertyValue("--positioner-width")).toBe("400px")
    // The old width was computed first: the popup is on its way from it to the new one.
    expect(popup.style.getPropertyValue("--popup-width")).toBe("400px")
    expect(popup.getAnimations()).toHaveLength(1)
    expect(Number.parseFloat(getComputedStyle(popup).width)).toBeLessThan(200)
    // And `auto` again once that motion has ended.
    for (const each of popup.getAnimations()) each.finish()
    await expect.poll(() => popup.style.getPropertyValue("--popup-width")).toBe("auto")
  })
})
