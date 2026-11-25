import { PersianCalendar } from "@internationalized/date"
import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createDatePicker } from "../../packages/core/src/date-picker.ts"
import type { DatePickerProps, DatePickerValue } from "../../packages/core/src/date-picker.ts"
import type { DateField } from "../../packages/core/src/date-field.ts"
import { details } from "../../packages/core/src/part.ts"
import { effect, signal } from "../../packages/core/src/reactivity.ts"
import { mount } from "./page.ts"

function picker(given: Partial<DatePickerProps> = {}) {
  const root = mount(
    `<form class="form"><div class="field"></div><input class="hidden" /><div class="end"></div><input class="end-hidden" /><button class="trigger" type="button">Pick</button><button class="clear" type="button">Clear</button></form><div class="positioner"><div class="popup"><div class="days"></div></div></div>`
  )
  const heard: DatePickerValue[] = []
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
  const end = root.querySelector<HTMLElement>(".end")!
  onTestFinished(made.mount())
  const draw = (into: HTMLElement, of: DateField, input: HTMLElement) => {
    for (const segment of of.segments.peek()) {
      const element = document.createElement("span")
      into.append(element)
      const { part, text } = of.segment(segment)
      onTestFinished(bind(element, part))
      onTestFinished(effect(() => void (element.textContent = text.get())))
    }
    onTestFinished(bind(into, of.root))
    onTestFinished(bind(input, of.input))
  }
  draw(field, made.field, hidden)
  if (made.endField) draw(end, made.endField, root.querySelector<HTMLElement>(".end-hidden")!)
  const clear = root.querySelector<HTMLButtonElement>(".clear")!
  onTestFinished(bind(clear, made.clear))
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
  const sent = () => new FormData(root.querySelector("form")!).getAll("due")
  /** A button for a preset, in the page. */
  const preset = (value: Parameters<typeof made.preset>[0]) => {
    const button = document.createElement("button")
    root.append(button)
    onTestFinished(bind(button, made.preset(value)))
    return button
  }
  return {
    made,
    props,
    field,
    end,
    trigger,
    hidden,
    clear,
    heard,
    reasons,
    shown,
    day,
    sent,
    preset,
  }
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

  it("empties its field when the day picked is pressed again, unless it is required", () => {
    const { made, trigger, shown, day, heard, hidden, reasons } = picker({
      defaultValue: "2026-03-14",
    })
    trigger.click()
    day("2026-03-14").click()
    expect(made.value.peek()).toBe(null)
    expect(heard.at(-1)).toBe(null)
    expect(shown()).toBe("mm/dd/yyyy")
    expect(hidden.value).toBe("")
    expect(made.open.peek()).toBe(false)
    expect(reasons.at(-1)).toBe("close: day-press")
    const required = picker({ defaultValue: "2026-03-14", required: true })
    required.trigger.click()
    required.day("2026-03-14").click()
    expect(required.made.value.peek()).toBe("2026-03-14")
    expect(required.shown()).toBe("03/14/2026")
    // Nothing changed, so nothing closes it: as before, for a day pressed that is already chosen.
    expect(required.made.open.peek()).toBe(true)
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
  it("shows several months, and the month its caller holds", async () => {
    const turned: string[] = []
    const { made, props, trigger, field, heard } = picker({
      months: 2,
      month: "2026-03-01",
      onMonthChange: (month) => void turned.push(month),
    })
    expect(made.calendar.months.peek().map((each) => each.title)).toEqual([
      "March 2026",
      "April 2026",
    ])
    trigger.click()
    // A day of the second month is picked where it is shown, and the field has it.
    const april = made.calendar.day("2026-04-09", 1)
    const button = document.createElement("button")
    document.body.append(button)
    const stop = bind(button, april)
    button.click()
    stop()
    button.remove()
    expect(heard.at(-1)).toBe("2026-04-09")
    expect(made.open.peek()).toBe(false)
    // Shown already: the months stay where they are.
    expect(turned).toEqual([])
    // A day typed in another month asks the caller for it: the least turn that shows it, so
    // July is the second month.
    field.querySelector<HTMLElement>('[role="spinbutton"]')!.focus()
    await userEvent.keyboard("07042026")
    expect(turned.at(-1)).toBe("2026-06-01")
    props.set({ ...props.peek(), month: "2026-06-01" })
    expect(made.calendar.months.peek().map((each) => each.title)).toEqual([
      "June 2026",
      "July 2026",
    ])
  })
})

describe("a date picker of a range", () => {
  it("takes its first day from the first press and closes on the second", () => {
    const { made, trigger, day, shown, end, heard, reasons, sent } = picker({
      mode: "range",
      defaultMonth: "2026-03-01",
    })
    expect(made.endField).toBeDefined()
    trigger.click()
    day("2026-03-10").click()
    expect(made.value.peek()).toEqual({ start: "2026-03-10", end: null })
    expect(heard.at(-1)).toEqual({ start: "2026-03-10", end: null })
    // Half a range: the calendar stays open, and shows where it begins.
    expect(made.open.peek()).toBe(true)
    expect(shown()).toBe("03/10/2026")
    expect(end.textContent).toBe("mm/dd/yyyy")
    expect(day("2026-03-10").hasAttribute("data-range-start")).toBe(true)
    day("2026-03-14").click()
    expect(made.value.peek()).toEqual({ start: "2026-03-10", end: "2026-03-14" })
    expect(end.textContent).toBe("03/14/2026")
    expect(made.open.peek()).toBe(false)
    expect(reasons.at(-1)).toBe("close: day-press")
    // Its first and its last day, as two entries under its name.
    expect(sent()).toEqual(["2026-03-10", "2026-03-14"])
    // A press begins it again, and a day before the first is the first.
    trigger.click()
    day("2026-03-20").click()
    expect(made.value.peek()).toEqual({ start: "2026-03-20", end: null })
    expect(end.textContent).toBe("mm/dd/yyyy")
    day("2026-03-05").click()
    expect(made.value.peek()).toEqual({ start: "2026-03-05", end: "2026-03-20" })
  })

  it("is one value with its two fields: an end typed is the calendar's", async () => {
    const { made, field, end, day } = picker({ mode: "range" })
    field.querySelector<HTMLElement>('[role="spinbutton"]')!.focus()
    await userEvent.keyboard("03102026")
    expect(made.value.peek()).toEqual({ start: "2026-03-10", end: null })
    // One end typed is a range begun: the next press in the calendar is its other end.
    expect(made.calendar.value.peek()).toBe(null)
    expect(day("2026-03-10").hasAttribute("data-range-start")).toBe(true)
    end.querySelector<HTMLElement>('[role="spinbutton"]')!.focus()
    await userEvent.keyboard("03142026")
    expect(made.value.peek()).toEqual({ start: "2026-03-10", end: "2026-03-14" })
    expect(made.calendar.value.peek()).toEqual({ start: "2026-03-10", end: "2026-03-14" })
    expect(day("2026-03-12").hasAttribute("data-selected")).toBe(true)
    // An end before the start is invalid, and no range the calendar shows.
    end.querySelector<HTMLElement>('[role="spinbutton"]')!.focus()
    await userEvent.keyboard("02")
    expect(end.hasAttribute("data-invalid")).toBe(true)
    expect(made.calendar.value.peek()).toBe(null)
  })

  it("takes a range begun from its end, and gives its own Escape to the popover", async () => {
    const { made, trigger, day } = picker({
      mode: "range",
      defaultValue: { start: null, end: "2026-03-20" },
    })
    trigger.click()
    day("2026-03-12").click()
    expect(made.value.peek()).toEqual({ start: "2026-03-12", end: "2026-03-20" })
    trigger.click()
    day("2026-03-15").click()
    day("2026-03-15").focus()
    await userEvent.keyboard("{Escape}")
    expect(made.open.peek()).toBe(false)
    expect(made.value.peek()).toEqual({ start: "2026-03-15", end: null })
  })
})

describe("a date picker's clear button and presets", () => {
  it("empties the value with its clear button, and gives focus to the field", () => {
    const { made, clear, shown, heard } = picker({ defaultValue: "2026-03-14" })
    expect(clear.disabled).toBe(false)
    clear.click()
    expect(made.value.peek()).toBe(null)
    expect(heard.at(-1)).toBe(null)
    expect(shown()).toBe("mm/dd/yyyy")
    expect(document.activeElement?.getAttribute("role")).toBe("spinbutton")
    expect(clear.disabled).toBe(true)
    expect(clear.hasAttribute("data-disabled")).toBe(true)
    const range = picker({
      mode: "range",
      defaultValue: { start: "2026-03-10", end: "2026-03-14" },
    })
    range.clear.click()
    expect(range.made.value.peek()).toBe(null)
    expect(range.end.textContent).toBe("mm/dd/yyyy")
  })

  it("makes the value a preset's, and says which preset it is", () => {
    const { made, preset, shown, heard } = picker({ defaultValue: "2026-03-14" })
    const first = preset("2026-03-14")
    const other = preset("2026-04-01")
    expect(first.getAttribute("aria-pressed")).toBe("true")
    expect(first.hasAttribute("data-pressed")).toBe(true)
    expect(other.getAttribute("aria-pressed")).toBe("false")
    other.click()
    expect(heard.at(-1)).toBe("2026-04-01")
    expect(shown()).toBe("04/01/2026")
    expect(made.calendar.month.peek()).toBe("2026-04-01")
    expect(other.hasAttribute("data-pressed")).toBe(true)
    expect(first.hasAttribute("data-pressed")).toBe(false)
    const range = picker({ mode: "range" })
    const week = range.preset({ start: "2026-03-09", end: "2026-03-15" })
    week.click()
    expect(range.made.value.peek()).toEqual({ start: "2026-03-09", end: "2026-03-15" })
    expect(range.end.textContent).toBe("03/15/2026")
    expect(week.getAttribute("aria-pressed")).toBe("true")
  })

  it("types its field in the calendar its calendar is laid out in", () => {
    const { shown, made } = picker({
      calendarSystem: new PersianCalendar(),
      defaultValue: "2026-03-21",
    })
    expect(shown()).toBe("01/01/1405")
    expect(made.value.peek()).toBe("2026-03-21")
  })
})
