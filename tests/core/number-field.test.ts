import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { NUMBER_HOLD, createNumberField } from "../../packages/core/src/number-field.ts"
import type {
  NumberFieldProps,
  NumberFieldScrubOptions,
} from "../../packages/core/src/number-field.ts"
import { forElement } from "../../packages/core/src/part.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { mount } from "./page.ts"

function field(given: Partial<NumberFieldProps> = {}) {
  const root = mount(
    `<form class="form"><div class="root"><button class="down">-</button><input class="in" /><button class="up">+</button><input class="hidden" /></div></form><button class="next">Next</button>`
  )
  const heard: (number | null)[] = []
  const done: string[] = []
  const props = signal<NumberFieldProps>({
    id: "n",
    name: "amount",
    onValueChange: (value) => void heard.push(value),
    onValueCommitted: (value, by) => void done.push(`${value} ${by.reason}`),
    ...given,
  })
  const made = createNumberField(props)
  const input = root.querySelector<HTMLInputElement>(".in")!
  const up = root.querySelector<HTMLButtonElement>(".up")!
  const down = root.querySelector<HTMLButtonElement>(".down")!
  const hidden = root.querySelector<HTMLInputElement>(".hidden")!
  onTestFinished(made.mount())
  onTestFinished(bind(root.querySelector<HTMLElement>(".root")!, made.root))
  onTestFinished(bind(input, made.input))
  onTestFinished(bind(up, made.increment))
  onTestFinished(bind(down, made.decrement))
  onTestFinished(bind(hidden, made.hidden))
  const next = root.querySelector<HTMLElement>(".next")!
  const form = root.querySelector<HTMLFormElement>(".form")!
  return { root, props, made, input, up, down, hidden, heard, done, next, form }
}

const press = (target: Element, type: string, init: PointerEventInit = {}) =>
  target.dispatchEvent(
    new PointerEvent(type, { button: 0, pointerType: "mouse", bubbles: true, ...init })
  )

describe("a number field", () => {
  it("writes its number as its locale does, and submits it plain", () => {
    const { input, hidden } = field({ defaultValue: 1234.5, locale: "en-US" })
    expect(input.value).toBe("1,234.5")
    expect(hidden.value).toBe("1234.5")
    expect(hidden.name).toBe("amount")
    expect(input.getAttribute("aria-roledescription")).toBe("Number field")
    const german = field({ defaultValue: 1234.5, locale: "de-DE" })
    expect(german.input.value).toBe("1.234,5")
  })

  it("follows what is typed while it is a number, and writes it out whole on leaving", async () => {
    const { input, heard, done, next, made } = field({ locale: "en-US" })
    input.focus()
    await userEvent.keyboard("1234.50")
    expect(input.value).toBe("1234.50")
    expect(made.value.peek()).toBe(1234.5)
    expect(heard.at(-1)).toBe(1234.5)
    expect(done).toEqual([])
    next.focus()
    expect(input.value).toBe("1,234.5")
    expect(done).toEqual(["1234.5 input-blur"])
    expect(input.hasAttribute("data-touched")).toBe(true)
    expect(input.hasAttribute("data-dirty")).toBe(true)
  })

  it("takes only what a number is written with", async () => {
    const { input, made } = field({ locale: "en-US" })
    input.focus()
    await userEvent.keyboard("1a2b")
    expect(input.value).toBe("12")
    expect(made.value.peek()).toBe(12)
    await userEvent.keyboard("{Backspace}{Backspace}")
    expect(made.value.peek()).toBe(null)
  })

  it("reads a number as its locale writes one", async () => {
    const { input, made } = field({ locale: "de-DE" })
    input.focus()
    await userEvent.keyboard("1.234,5")
    expect(made.value.peek()).toBe(1234.5)
    const percent = field({ locale: "en-US", format: { style: "percent" }, defaultValue: 0.25 })
    expect(percent.input.value).toBe("25%")
    percent.input.focus()
    await userEvent.keyboard("{Control>}a{/Control}50%")
    expect(percent.made.value.peek()).toBe(0.5)
  })

  it("steps with the arrows, by more with Shift and less with Alt, and to its ends", async () => {
    const { input, made, done } = field({ defaultValue: 5, min: 0, max: 20 })
    input.focus()
    await userEvent.keyboard("{ArrowUp}")
    expect(made.value.peek()).toBe(6)
    expect(input.value).toBe("6")
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}")
    expect(made.value.peek()).toBe(16)
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}")
    expect(made.value.peek()).toBe(20)
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}")
    expect(made.value.peek()).toBe(19.9)
    await userEvent.keyboard("{Home}")
    expect(made.value.peek()).toBe(0)
    await userEvent.keyboard("{End}")
    expect(made.value.peek()).toBe(20)
    expect(done.at(-1)).toBe("20 keyboard")
  })

  it("steps without the sums decimals make, and from nothing to its least", async () => {
    const { input, made } = field({ step: 0.1, defaultValue: 0.2 })
    input.focus()
    await userEvent.keyboard("{ArrowUp}")
    expect(made.value.peek()).toBe(0.3)
    const empty = field({ min: 3 })
    empty.input.focus()
    await userEvent.keyboard("{ArrowUp}")
    expect(empty.made.value.peek()).toBe(3)
  })

  it("lands on a multiple of its step when asked", async () => {
    const { input, made } = field({ step: 5, defaultValue: 7, snapOnStep: true })
    input.focus()
    await userEvent.keyboard("{ArrowUp}")
    expect(made.value.peek()).toBe(10)
    await userEvent.keyboard("{ArrowDown}{ArrowDown}")
    expect(made.value.peek()).toBe(0)
  })

  it("has buttons that step it, go on while held, and stop at its ends", async () => {
    const { up, down, made, done, input } = field({ defaultValue: 8, max: 10, min: 0 })
    press(up, "pointerdown")
    press(up, "pointerup")
    expect(made.value.peek()).toBe(9)
    expect(done).toEqual(["9 increment-press"])
    expect(document.activeElement).toBe(input)
    press(down, "pointerdown")
    await new Promise((resolve) => setTimeout(resolve, NUMBER_HOLD + 200))
    press(down, "pointerup")
    expect(made.value.peek()).toBeLessThan(7)
    press(up, "pointerdown")
    press(up, "pointerup")
    made.stepBy(100, {
      reason: "test",
      event: undefined,
      source: "programmatic",
      cancel() {},
      canceled: false,
    })
    expect(made.value.peek()).toBe(10)
    expect(up.disabled).toBe(true)
    expect(up.hasAttribute("data-disabled")).toBe(true)
    expect(down.disabled).toBe(false)
    // A press no pointer made.
    down.click()
    expect(made.value.peek()).toBe(9)
  })

  it("keeps what a caller holds, and stays when a caller refuses", async () => {
    const { input, props, made } = field({
      value: 4,
      onValueChange: (_value, by) => by.cancel(),
    })
    input.focus()
    await userEvent.keyboard("{ArrowUp}")
    expect(made.value.peek()).toBe(4)
    expect(input.value).toBe("4")
    props.set({ ...props.peek(), value: 9 })
    expect(input.value).toBe("9")
  })

  it("goes back to the number it began with when its form is reset", async () => {
    const { input, made, form } = field({ defaultValue: 2 })
    input.focus()
    await userEvent.keyboard("{ArrowUp}{ArrowUp}")
    expect(made.value.peek()).toBe(4)
    form.reset()
    expect(made.value.peek()).toBe(2)
    expect(input.value).toBe("2")
    expect(input.hasAttribute("data-dirty")).toBe(false)
  })

  it("does nothing when it is read only or disabled", async () => {
    const { input, up, made } = field({ defaultValue: 2, readOnly: true })
    input.focus()
    await userEvent.keyboard("{ArrowUp}")
    press(up, "pointerdown")
    press(up, "pointerup")
    expect(made.value.peek()).toBe(2)
    expect(input.readOnly).toBe(true)
    expect(input.hasAttribute("data-readonly")).toBe(true)
  })

  it("keeps the id its caller gives the input, which its label and its buttons name", () => {
    const root = mount(`
      <label for="qty">Quantity</label>
      <div class="root"><input class="input" id="qty" /><button class="up">+</button></div>
      <div class="other"><input class="input" /></div>`)
    const named = createNumberField(signal<NumberFieldProps>({ id: "n" }))
    const input = root.querySelector<HTMLInputElement>(".root .input")!
    const up = root.querySelector<HTMLButtonElement>(".up")!
    onTestFinished(bind(input, named.input))
    onTestFinished(bind(up, named.increment))
    expect(input.id).toBe("qty")
    expect(root.querySelector("label")!.control).toBe(input)
    expect(up.getAttribute("aria-controls")).toBe("qty")
    expect(forElement(named.input.props.peek(), { id: "qty" }, "input").id).toBeUndefined()
    // With none of the caller's, the input is named after its root.
    const unnamed = createNumberField(signal<NumberFieldProps>({ id: "n2" }))
    const other = root.querySelector<HTMLInputElement>(".other .input")!
    onTestFinished(bind(other, unnamed.input))
    expect(other.id).toBe("n2-input")
  })
})

/**
 * No test can make a browser lock the pointer: the lock is played here by a stand-in that
 * answers as a browser does (`pointerLockElement`, `pointerlockchange`). What the core does with
 * a locked pointer is held; that a browser gives one is not.
 */
function lockStandIn(refuses = false) {
  let element: Element | null = null
  const asked: string[] = []
  const body = document.body as HTMLElement & { requestPointerLock: unknown }
  Object.defineProperty(document, "pointerLockElement", { configurable: true, get: () => element })
  Object.defineProperty(document, "exitPointerLock", {
    configurable: true,
    value() {
      asked.push("exit")
      element = null
      document.dispatchEvent(new Event("pointerlockchange"))
    },
  })
  body.requestPointerLock = () => {
    asked.push("lock")
    if (!refuses) return Promise.resolve()
    document.dispatchEvent(new Event("pointerlockerror"))
    return Promise.reject(new DOMException("refused", "NotAllowedError"))
  }
  onTestFinished(() => {
    delete (document as unknown as Record<string, unknown>).pointerLockElement
    delete (document as unknown as Record<string, unknown>).exitPointerLock
    delete (body as unknown as Record<string, unknown>).requestPointerLock
  })
  return {
    asked,
    give() {
      element = body
      document.dispatchEvent(new Event("pointerlockchange"))
    },
  }
}

// WebKit is never asked for a lock: the banner it shows moves the page.
const webkit = /AppleWebKit/.test(navigator.userAgent) && !/Chrom/.test(navigator.userAgent)

function scrubbed(given: Partial<NumberFieldProps> = {}, options: NumberFieldScrubOptions = {}) {
  const made = field({ defaultValue: 10, ...given })
  const area = document.createElement("label")
  area.textContent = "Amount"
  made.root.querySelector(".root")!.prepend(area)
  made.made.scrub.set(options)
  onTestFinished(bind(area, made.made.scrubArea))
  return { ...made, area }
}

/** A pointer of one kind: pressed on the area, moved over the page, let go there. */
const drag = (pointerType: string) => ({
  down: (target: Element, x: number, y: number) =>
    target.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: x,
        clientY: y,
        button: 0,
        pointerId: 7,
        pointerType,
        bubbles: true,
        cancelable: true,
      })
    ),
  // Where it is and how far it came: a free pointer is read by the first, a locked one by
  // the second.
  move: (x: number, y: number, init: PointerEventInit = {}) =>
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: x,
        clientY: y,
        pointerId: 7,
        pointerType,
        cancelable: true,
        ...init,
      })
    ),
  up: (x: number, y: number) =>
    window.dispatchEvent(
      new PointerEvent("pointerup", { clientX: x, clientY: y, pointerId: 7, pointerType })
    ),
})

describe("a number field's scrub area", () => {
  it("changes the number as it is dragged, and says so on every part", () => {
    const { area, input, up, made, done, heard } = scrubbed()
    const finger = drag("touch")
    expect(area.getAttribute("role")).toBe("presentation")
    expect(area.style.touchAction).toBe("none")
    finger.down(area, 100, 50)
    expect(made.scrubbing.peek()).toBe(true)
    for (const each of [area, input, up]) expect(each.hasAttribute("data-scrubbing")).toBe(true)
    // Off the area at once: the page hears the drag.
    finger.move(101, 50)
    expect(made.value.peek()).toBe(10)
    // Two pixels gone: the number moves by the move that crossed them.
    finger.move(102, 50)
    expect(made.value.peek()).toBe(11)
    finger.move(107, 50)
    expect(made.value.peek()).toBe(16)
    finger.move(97, 50)
    expect(made.value.peek()).toBe(6)
    expect(input.value).toBe("6")
    // Up and down are not its way.
    finger.move(97, 90)
    expect(made.value.peek()).toBe(6)
    expect(done).toEqual([])
    finger.up(97, 90)
    expect(made.scrubbing.peek()).toBe(false)
    expect(area.hasAttribute("data-scrubbing")).toBe(false)
    expect(done).toEqual(["6 scrub"])
    expect(heard).toEqual([11, 16, 6])
    // Let go: the page's moves are no longer its own.
    finger.move(140, 50)
    expect(made.value.peek()).toBe(6)
  })

  it("is dragged up for more when it is vertical, and waits for as many pixels as asked", () => {
    const { area, made } = scrubbed({}, { direction: "vertical", pixelSensitivity: 5 })
    const finger = drag("touch")
    finger.down(area, 100, 100)
    finger.move(100, 97)
    expect(made.value.peek()).toBe(10)
    finger.move(120, 97)
    expect(made.value.peek()).toBe(10)
    finger.move(120, 94)
    expect(made.value.peek()).toBe(13)
    finger.move(120, 104)
    expect(made.value.peek()).toBe(3)
    finger.up(120, 104)
  })

  it("steps by the field's step, by more with Shift, and stays in its range", () => {
    const { area, made, props } = scrubbed({ step: 0.5, max: 12, min: 0 })
    const finger = drag("touch")
    finger.down(area, 100, 50)
    finger.move(103, 50)
    expect(made.value.peek()).toBe(11.5)
    finger.move(113, 50)
    expect(made.value.peek()).toBe(12)
    finger.move(111, 50, { shiftKey: true })
    expect(made.value.peek()).toBe(0)
    finger.up(111, 50)
    // What the area is told later is what the next drag goes by.
    props.set({ ...props.peek(), step: 1 })
    made.scrub.set({ pixelSensitivity: 1 })
    finger.down(area, 100, 50)
    finger.move(101, 50)
    expect(made.value.peek()).toBe(1)
    finger.up(101, 50)
  })

  it("follows one pointer, and a press that is not the main button starts nothing", () => {
    const { area, made } = scrubbed()
    area.dispatchEvent(
      new PointerEvent("pointerdown", { button: 2, pointerType: "mouse", bubbles: true })
    )
    expect(made.scrubbing.peek()).toBe(false)
    const finger = drag("touch")
    finger.down(area, 100, 50)
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 150, pointerId: 9 }))
    expect(made.value.peek()).toBe(10)
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 9 }))
    expect(made.scrubbing.peek()).toBe(true)
    finger.up(100, 50)
  })

  it("does not scrub a field that is read only or disabled", () => {
    for (const given of [{ readOnly: true }, { disabled: true }]) {
      const { area, made, done } = scrubbed(given)
      const finger = drag("touch")
      finger.down(area, 100, 50)
      expect(made.scrubbing.peek()).toBe(false)
      finger.move(130, 50)
      finger.up(130, 50)
      expect(made.value.peek()).toBe(10)
      expect(done).toEqual([])
    }
  })

  it("puts focus in the input for a mouse, and keeps a finger's touch from scrolling", () => {
    // Refused, as a browser refuses a press that was not the reader's own: no lock a real
    // browser might give is left to arrive in another test.
    const lock = lockStandIn(true)
    const { area, input, made } = scrubbed()
    const touch = new Event("touchstart", { cancelable: true }) as Event & { touches: unknown[] }
    touch.touches = [{}]
    area.dispatchEvent(touch)
    expect(touch.defaultPrevented).toBe(true)
    const mouse = drag("mouse")
    mouse.down(area, 100, 50)
    expect(document.activeElement).toBe(input)
    expect(lock.asked).toEqual(webkit ? [] : ["lock"])
    // Not given the pointer: the drag goes on with the pointer as it is, and no cursor is drawn.
    expect(made.scrubAreaCursor.mounted.peek()).toBe(false)
    mouse.move(104, 50)
    expect(made.value.peek()).toBe(14)
    mouse.up(104, 50)
    expect(made.scrubbing.peek()).toBe(false)
  })

  it("is a click when the press goes nowhere, and none when it was dragged", async () => {
    const { area } = scrubbed()
    let clicks = 0
    area.addEventListener("click", () => clicks++)
    const finger = drag("touch")
    finger.down(area, 100, 50)
    finger.up(100, 50)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(clicks).toBe(1)
    finger.down(area, 100, 50)
    finger.move(110, 50)
    finger.up(110, 50)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(clicks).toBe(1)
  })

  it("lets go when it is taken out in the middle of a drag", () => {
    const made = field({ defaultValue: 10 })
    const area = document.createElement("span")
    made.root.append(area)
    const unbind = bind(area, made.made.scrubArea)
    const finger = drag("touch")
    finger.down(area, 100, 50)
    unbind()
    expect(made.made.scrubbing.peek()).toBe(false)
    finger.move(130, 50)
    expect(made.made.value.peek()).toBe(10)
    expect(made.done).toEqual([])
  })
})

describe("a scrub area whose pointer is locked", () => {
  it.skipIf(webkit)("draws its cursor while the lock is held, and moves it", () => {
    const lock = lockStandIn()
    const { area, made, root } = scrubbed({}, { teleportDistance: 40 })
    area.style.cssText = "position:fixed;left:100px;top:100px;width:60px;height:20px"
    const cursor = document.createElement("span")
    cursor.style.cssText = "width:10px;height:10px"
    const shown = made.scrubAreaCursor.mounted
    const mouse = drag("mouse")
    mouse.down(area, 110, 110)
    expect(lock.asked).toEqual(["lock"])
    // Asked, not given yet: nothing is drawn for a lock that may be refused.
    expect(shown.peek()).toBe(false)
    lock.give()
    expect(shown.peek()).toBe(true)
    root.append(cursor)
    const unbind = bind(cursor, made.scrubAreaCursor.part)
    onTestFinished(unbind)
    expect(cursor.style.position).toBe("fixed")
    expect(cursor.style.pointerEvents).toBe("none")
    expect(cursor.hasAttribute("data-scrubbing")).toBe(true)
    // Its middle where the pointer was pressed.
    expect(cursor.style.transform).toBe("translate3d(105px, 105px, 0px) scale(1)")
    // A locked pointer stays where it is: how far it would have gone is what is read.
    mouse.move(110, 110, { movementX: 6 })
    expect(made.value.peek()).toBe(16)
    expect(cursor.style.transform).toBe("translate3d(111px, 105px, 0px) scale(1)")
    // Past the area's right edge and half the distance asked for, it comes in at the left.
    mouse.move(110, 110, { movementX: 70 })
    expect(cursor.style.transform).toBe("translate3d(75px, 105px, 0px) scale(1)")
    mouse.up(110, 110)
    expect(shown.peek()).toBe(false)
    expect(lock.asked).toEqual(["lock", "exit"])
  })

  it.skipIf(webkit)("gives back a lock that comes after the pointer was let go", () => {
    const lock = lockStandIn()
    const { area, made } = scrubbed()
    const mouse = drag("mouse")
    mouse.down(area, 110, 110)
    mouse.up(110, 110)
    lock.give()
    expect(lock.asked).toEqual(["lock", "exit"])
    expect(made.scrubAreaCursor.mounted.peek()).toBe(false)
  })

  it.skipIf(webkit)("gives back a lock that comes after the area was taken out", () => {
    const lock = lockStandIn()
    const made = field({ defaultValue: 10 })
    const area = document.createElement("span")
    made.root.append(area)
    const unbind = bind(area, made.made.scrubArea)
    drag("mouse").down(area, 110, 110)
    unbind()
    lock.give()
    expect(lock.asked).toEqual(["lock", "exit"])
  })

  it.skipIf(webkit)("goes on with the pointer as it is when the reader takes the lock back", () => {
    const lock = lockStandIn()
    const { area, made } = scrubbed()
    const mouse = drag("mouse")
    mouse.down(area, 110, 110)
    lock.give()
    // Escape: the browser lets the pointer go and says so.
    document.exitPointerLock()
    expect(made.scrubAreaCursor.mounted.peek()).toBe(false)
    expect(made.scrubbing.peek()).toBe(true)
    mouse.move(115, 110)
    expect(made.value.peek()).toBe(15)
    mouse.up(115, 110)
  })

  it("asks for no lock for a finger", () => {
    const lock = lockStandIn()
    const { area } = scrubbed()
    const finger = drag("touch")
    finger.down(area, 110, 110)
    finger.up(110, 110)
    expect(lock.asked).toEqual([])
  })
})
