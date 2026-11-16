import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { NUMBER_HOLD, createNumberField } from "../../packages/core/src/number-field.ts"
import type { NumberFieldProps } from "../../packages/core/src/number-field.ts"
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
})
