import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createDatePicker } from "../../packages/core/src/date-picker.ts"
import type { DatePickerProps } from "../../packages/core/src/date-picker.ts"
import { details } from "../../packages/core/src/part.ts"
import { effect, signal } from "../../packages/core/src/reactivity.ts"
import { mount } from "./page.ts"

function picker(given: Partial<DatePickerProps> = {}) {
  const root = mount(
    `<form class="form"><div class="field"></div><input class="hidden" /><button class="trigger" type="button">Pick</button></form><div class="positioner"><div class="popup"><div class="days"></div></div></div>`
  )
  const heard: (string | null)[] = []
  const reasons: string[] = []
  const props = signal<DatePickerProps>({
    id: "dp",
    locale: "en-US",
    name: "due",
    onValueChange: (value) => void heard.push(value),
    onOpenChange: (open, by) => void reasons.push(`${open ? "open" : "close"}: ${by.reason}`),
    ...given,
  })
  const made = createDatePicker(props)
  const field = root.querySelector<HTMLElement>(".field")!
  const trigger = root.querySelector<HTMLElement>(".trigger")!
  const hidden = root.querySelector<HTMLInputElement>(".hidden")!
  const days = root.querySelector<HTMLElement>(".days")!
  onTestFinished(made.mount())
  for (const segment of made.field.segments.peek()) {
    const element = document.createElement("span")
    field.append(element)
    const { part, text } = made.field.segment(segment)
    onTestFinished(bind(element, part))
    onTestFinished(effect(() => void (element.textContent = text.get())))
  }
  onTestFinished(bind(field, made.field.root))
  onTestFinished(bind(hidden, made.field.input))
  onTestFinished(bind(trigger, made.popover.trigger))
  onTestFinished(bind(root.querySelector<HTMLElement>(".positioner")!, made.popover.positioner))
  onTestFinished(bind(root.querySelector<HTMLElement>(".popup")!, made.popover.popup))
  // The days of the month shown, drawn again when it changes.
  const drawn: (() => void)[] = []
  onTestFinished(
    effect(() => {
      const weeks = made.calendar.weeks.get()
      for (const stop of drawn.splice(0)) stop()
      days.replaceChildren()
      for (const day of weeks.flat()) {
        const button = document.createElement("button")
        button.dataset.date = day.date
        days.append(button)
        drawn.push(bind(button, made.calendar.day(day.date)))
      }
    })
  )
  onTestFinished(() => made.popover.setOpen(false, details("test")))
  const shown = () => field.textContent
  const day = (date: string) => days.querySelector<HTMLElement>(`[data-date="${date}"]`)!
  return { made, props, field, trigger, hidden, heard, reasons, shown, day }
}

describe("a date picker", () => {
  it("is one value: a day typed is the calendar's", async () => {
    const { made, field, heard, hidden, day } = picker()
    field.querySelector<HTMLElement>('[role="spinbutton"]')!.focus()
    await userEvent.keyboard("03142026")
    expect(made.value.peek()).toBe("2026-03-14")
    expect(heard.at(-1)).toBe("2026-03-14")
    expect(hidden.value).toBe("2026-03-14")
    expect(made.calendar.value.peek()).toBe("2026-03-14")
    expect(day("2026-03-14").hasAttribute("data-selected")).toBe(true)
  })

  it("writes a day picked into the field, and closes its calendar", async () => {
    const { made, trigger, shown, day, reasons, hidden } = picker({ defaultValue: "2026-03-14" })
    expect(shown()).toBe("03/14/2026")
    trigger.click()
    expect(made.open.peek()).toBe(true)
    day("2026-03-20").click()
    expect(made.value.peek()).toBe("2026-03-20")
    expect(shown()).toBe("03/20/2026")
    expect(hidden.value).toBe("2026-03-20")
    expect(made.open.peek()).toBe(false)
    expect(reasons.at(-1)).toBe("close: day-press")
  })

  it("keeps its calendar open when a caller refuses the day", () => {
    const { made, trigger, day } = picker({
      defaultValue: "2026-03-14",
      onValueChange: (_value, by) => by.cancel(),
    })
    trigger.click()
    day("2026-03-20").click()
    expect(made.value.peek()).toBe("2026-03-14")
    expect(made.open.peek()).toBe(true)
  })

  it("holds both to the same first and last day", () => {
    const { field, day } = picker({ defaultValue: "2026-03-14", min: "2026-03-10" })
    expect(
      day("2026-03-05").getAttribute("aria-disabled") ?? day("2026-03-05").hasAttribute("disabled")
    ).toBeTruthy()
    expect(field.hasAttribute("data-invalid")).toBe(false)
  })

  it("does not open while it cannot be changed", () => {
    const { made, trigger } = picker({ disabled: true })
    trigger.click()
    expect(made.open.peek()).toBe(false)
  })
})
