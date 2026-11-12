import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { signal } from "../../packages/core/src/reactivity.ts"
import { createHover } from "../../packages/core/src/services/hover.ts"
import type { HoverOptions } from "../../packages/core/src/services/hover.ts"
import { find, mount } from "./page.ts"

// The trigger, the popup under it, and the strip between them:
//   trigger  10..110 × 10..40
//   popup    10..110 × 60..110
const PAGE = `
  <button id="trigger" style="position: fixed; left: 10px; top: 10px; width: 100px; height: 30px">T</button>
  <div id="popup" style="position: fixed; left: 10px; top: 60px; width: 100px; height: 50px">P</div>`

type Handlers = Record<string, (event: never) => void>

function popup(options: Partial<HoverOptions> = {}) {
  const root = mount(PAGE)
  const open = signal(false)
  const reasons: string[] = []
  const hover = createHover({
    open,
    setOpen(next, by) {
      reasons.push(`${next ? "open" : "close"}: ${by.reason}`)
      open.set(next)
    },
    options: () => ({ delay: 600, closeDelay: 100, disabled: false, ...options }),
    trigger: () => find(root, "trigger"),
    popup: () => (open.peek() ? find(root, "popup") : undefined),
  })
  const handlers: Handlers = hover.handlers()
  const stop = hover.start()
  const pointer = (type: string, pointerType = "mouse") =>
    handlers[type]!(new PointerEvent(type, { pointerType }) as never)
  onTestFinished(() => {
    // The page's one open popup is module state: leave none behind.
    pointer("onPointerDown")
    stop()
  })
  return {
    root,
    open,
    reasons,
    hover,
    handlers,
    enter: (pointerType?: string) => pointer("onPointerEnter", pointerType),
    leave: () => pointer("onPointerLeave"),
    down: () => pointer("onPointerDown"),
    moveTo: (x: number, y: number) =>
      document.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y })),
  }
}

// Each test starts long after the last: "one just closed" is the page's, shared by every popup.
let clock = Date.now()

describe("a popup that opens on hover", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
    clock += 60_000
    vi.setSystemTime(clock)
  })
  afterEach(() => void vi.useRealTimers())

  it("opens once the pointer has rested on the trigger", () => {
    const { open, enter, hover } = popup()
    enter()
    vi.advanceTimersByTime(599)
    expect(open.peek()).toBe(false)
    vi.advanceTimersByTime(1)
    expect(open.peek()).toBe(true)
    expect(hover.instant.peek()).toBeUndefined()
  })

  it("stays closed when the pointer only passes over", () => {
    const { open, enter, leave } = popup()
    enter()
    vi.advanceTimersByTime(300)
    leave()
    vi.advanceTimersByTime(1000)
    expect(open.peek()).toBe(false)
  })

  it("opens at once with no delay", () => {
    const { open, enter } = popup({ delay: 0 })
    enter()
    expect(open.peek()).toBe(true)
  })

  it("does not open for a finger, or when disabled", () => {
    const touch = popup()
    touch.enter("touch")
    vi.advanceTimersByTime(1000)
    expect(touch.open.peek()).toBe(false)

    const off = popup({ disabled: true })
    off.enter()
    vi.advanceTimersByTime(1000)
    expect(off.open.peek()).toBe(false)
  })

  it("closes a moment after the pointer leaves both the trigger and the popup", () => {
    const { open, enter, moveTo, reasons } = popup({ delay: 0 })
    enter()
    moveTo(300, 300)
    vi.advanceTimersByTime(99)
    expect(open.peek()).toBe(true)
    vi.advanceTimersByTime(1)
    expect(open.peek()).toBe(false)
    expect(reasons).toEqual(["open: trigger-hover", "close: trigger-hover"])
  })

  it("stays open on the trigger, on the popup, and on the way between them", () => {
    const { open, enter, moveTo } = popup({ delay: 0 })
    enter()
    for (const [x, y] of [
      [50, 20],
      [50, 50],
      [50, 80],
    ] as const) {
      moveTo(x, y)
      vi.advanceTimersByTime(500)
      expect(open.peek()).toBe(true)
    }
    // Beside the strip, at its height.
    moveTo(200, 50)
    vi.advanceTimersByTime(100)
    expect(open.peek()).toBe(false)
  })

  it("stays open when the pointer comes back in time", () => {
    const { open, enter, moveTo } = popup({ delay: 0 })
    enter()
    moveTo(300, 300)
    vi.advanceTimersByTime(60)
    moveTo(50, 80)
    vi.advanceTimersByTime(500)
    expect(open.peek()).toBe(true)
  })

  it("closes at a press on the trigger, and says so", () => {
    const { open, enter, down, hover, reasons } = popup({ delay: 0 })
    enter()
    down()
    expect(open.peek()).toBe(false)
    expect(hover.instant.peek()).toBe("dismiss")
    expect(reasons.at(-1)).toBe("close: trigger-press")
  })

  it("opens the next one at once just after one closed, and waits again later", () => {
    const first = popup()
    first.enter()
    vi.advanceTimersByTime(600)
    first.down()

    const second = popup()
    vi.advanceTimersByTime(300)
    second.enter()
    expect(second.open.peek()).toBe(true)
    expect(second.hover.instant.peek()).toBe("delay")
    second.down()

    const third = popup()
    vi.advanceTimersByTime(401)
    third.enter()
    expect(third.open.peek()).toBe(false)
    vi.advanceTimersByTime(600)
    expect(third.open.peek()).toBe(true)
  })

  it("closes the open one when the pointer reaches another's trigger", () => {
    const first = popup({ delay: 0 })
    first.enter()
    const second = popup()
    second.enter()
    expect(first.open.peek()).toBe(false)
    expect(first.reasons.at(-1)).toBe("close: sibling-open")
    expect(second.open.peek()).toBe(true)
  })

  it("stops following the pointer when it is stopped", () => {
    const root = mount(PAGE)
    const open = signal(true)
    const hover = createHover({
      open,
      setOpen: (next) => open.set(next),
      options: () => ({ delay: 0, closeDelay: 0, disabled: false }),
      trigger: () => find(root, "trigger"),
      popup: () => find(root, "popup"),
    })
    const stop = hover.start()
    stop()
    document.dispatchEvent(new PointerEvent("pointermove", { clientX: 300, clientY: 300 }))
    expect(open.peek()).toBe(true)
  })
})

describe("a popup that opens on focus", () => {
  it("opens at once for the keyboard's focus and closes when it leaves", async () => {
    const { root, open, handlers, hover, reasons } = popup()
    const trigger = find(root, "trigger")
    trigger.addEventListener("focusin", (event) => handlers.onFocus!(event as never))
    trigger.addEventListener("focusout", (event) => handlers.onBlur!(event as never))
    await userEvent.tab()
    expect(document.activeElement).toBe(trigger)
    expect(open.peek()).toBe(true)
    expect(hover.instant.peek()).toBe("focus")
    // While the keyboard holds it, the pointer moving away does not close it.
    document.dispatchEvent(new PointerEvent("pointermove", { clientX: 300, clientY: 300 }))
    expect(open.peek()).toBe(true)
    trigger.blur()
    expect(open.peek()).toBe(false)
    expect(reasons).toEqual(["open: trigger-focus", "close: trigger-focus"])
  })
})
