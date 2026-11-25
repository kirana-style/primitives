import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { effect, signal } from "../../packages/core/src/reactivity.ts"
import { createTimeField } from "../../packages/core/src/time-field.ts"
import type { TimeFieldProps } from "../../packages/core/src/time-field.ts"
import { find, mount } from "./page.ts"

/** Draws a field with no framework: a span for each piece, its text as it changes. */
function field(given: Partial<TimeFieldProps> = {}, dir?: "rtl") {
  const root = mount(
    `<form id="form"><div id="group"></div><input id="hidden" /><button id="after" type="button">After</button></form>`
  )
  if (dir) root.setAttribute("dir", dir)
  const heard: [string | null, string][] = []
  const props = signal<TimeFieldProps>({
    id: "tf",
    locale: "en-US",
    name: "at",
    onValueChange: (value, details) => void heard.push([value, details.reason]),
    ...given,
  })
  const made = createTimeField(props)
  const group = find(root, "group")
  onTestFinished(bind(group, made.root))
  onTestFinished(bind(find(root, "hidden"), made.input))
  onTestFinished(made.mount())
  for (const segment of made.segments.peek()) {
    const span = document.createElement("span")
    span.dataset.unit = segment.type
    group.append(span)
    const { part, text } = made.segment(segment)
    onTestFinished(bind(span, part))
    onTestFinished(effect(() => void (span.textContent = text.get())))
  }
  const part = (unit: string) => group.querySelector<HTMLElement>(`[data-unit="${unit}"]`)!
  // What stands between the minute and AM is a narrow space in some engines: read as a space.
  const shown = () => (group.textContent ?? "").replace(/\s/g, " ")
  const units = () =>
    [...group.children]
      .map((each) => (each as HTMLElement).dataset.unit)
      .filter((each) => each !== "literal")
  const at = () => (document.activeElement as HTMLElement | null)?.dataset.unit
  const hidden = find<HTMLInputElement>(root, "hidden")
  return { root, group, props, made, heard, part, shown, units, at, hidden }
}

const type = (keys: string) => userEvent.keyboard(keys)

describe("a time that is typed", () => {
  it("is a group of spin buttons in the order the locale writes a time", () => {
    const { group, part, shown, units } = field()
    expect(group.getAttribute("role")).toBe("group")
    expect(shown()).toBe("hh:mm --")
    expect(units()).toEqual(["hour", "minute", "dayPeriod"])
    expect(part("hour").getAttribute("role")).toBe("spinbutton")
    expect(part("hour").getAttribute("aria-label")).toBe("hour")
    expect(part("hour").getAttribute("inputmode")).toBe("numeric")
    expect(part("hour").getAttribute("aria-valuemin")).toBe("1")
    expect(part("hour").getAttribute("aria-valuemax")).toBe("12")
    expect(part("hour").hasAttribute("data-placeholder")).toBe(true)
    // Typed by a letter: a numeric keypad would have none.
    expect(part("dayPeriod").getAttribute("inputmode")).toBe("text")
    expect(part("literal").getAttribute("aria-hidden")).toBe("true")
    const german = field({ locale: "de-DE" })
    expect(german.shown()).toBe("hh:mm")
    expect(german.part("hour").getAttribute("aria-valuemin")).toBe("0")
    expect(german.part("hour").getAttribute("aria-valuemax")).toBe("23")
    expect(field({ locale: "de-DE", granularity: "second" }).shown()).toBe("hh:mm:ss")
    expect(field({ locale: "ko-KR" }).units()).toEqual(["dayPeriod", "hour", "minute"])
    expect(field({ locale: "fr-FR" }).part("hour").getAttribute("aria-label")).toBe("heure")
  })

  it("takes its clock of 12 or 24 hours from `hourCycle` over the locale's", () => {
    expect(field({ hourCycle: 24 }).units()).toEqual(["hour", "minute"])
    expect(field({ locale: "de-DE", hourCycle: 12 }).units()).toContain("dayPeriod")
    expect(field({ hourCycle: 24, defaultValue: "21:05" }).shown()).toBe("21:05")
    expect(field({ defaultValue: "21:05" }).shown()).toBe("09:05 PM")
    expect(field({ defaultValue: "00:15" }).shown()).toBe("12:15 AM")
  })

  it("fills each part from its digits and goes on, on a clock of 12 hours", async () => {
    const { part, shown, at, heard, made, hidden } = field()
    part("hour").focus()
    await type("1")
    // One that could be the first of two waits; it shows as it stands.
    expect(shown()).toBe("01:mm --")
    expect(at()).toBe("hour")
    await type("2")
    expect(at()).toBe("minute")
    part("hour").focus()
    // An hour of 3 to 9 cannot be the first digit of one of 12: it is whole at once.
    await type("9")
    expect(at()).toBe("minute")
    await type("3")
    expect(at()).toBe("minute")
    await type("0")
    expect(at()).toBe("dayPeriod")
    expect(heard).toEqual([])
    await type("p")
    expect(shown()).toBe("09:30 PM")
    expect(made.value.peek()).toBe("21:30")
    // Said once, when the last part is whole.
    expect(heard).toEqual([["21:30", "typed"]])
    expect(hidden.value).toBe("21:30")
    expect(hidden.name).toBe("at")
    part("dayPeriod").focus()
    await type("a")
    expect(made.value.peek()).toBe("09:30")
  })

  it("fills each part on a clock of 24 hours, a zero included", async () => {
    const { part, shown, at, made } = field({ locale: "de-DE" })
    part("hour").focus()
    await type("0")
    expect(shown()).toBe("00:mm")
    expect(at()).toBe("hour")
    await type("7")
    expect(at()).toBe("minute")
    part("hour").focus()
    await type("2")
    expect(at()).toBe("hour")
    await type("3")
    expect(at()).toBe("minute")
    await type("45")
    expect(made.value.peek()).toBe("23:45")
    part("hour").focus()
    // Three to nine cannot begin an hour of 24: whole at once.
    await type("4")
    expect(at()).toBe("minute")
    expect(made.value.peek()).toBe("04:45")
    part("hour").focus()
    // Past the most, the digit begins it again: 2 then 5 is the fifth hour.
    await type("25")
    expect(part("hour").textContent).toBe("05")
    part("minute").focus()
    await type("7")
    // No minute begins with a seven.
    expect(part("minute").textContent).toBe("07")
  })

  it("is typed to the second", async () => {
    const { part, made, heard } = field({ locale: "de-DE", granularity: "second" })
    part("hour").focus()
    await type("1015")
    expect(made.value.peek()).toBe(null)
    await type("20")
    expect(made.value.peek()).toBe("10:15:20")
    expect(heard).toEqual([["10:15:20", "typed"]])
  })

  it("turns a part with the arrows, round its ends", async () => {
    const { part, shown, made, heard } = field({ defaultValue: "23:59" })
    expect(shown()).toBe("11:59 PM")
    part("minute").focus()
    await type("{ArrowUp}")
    // Round its own end, the hour left as it was.
    expect(shown()).toBe("11:00 PM")
    await type("{ArrowDown}")
    expect(shown()).toBe("11:59 PM")
    await type("{PageUp}")
    expect(part("minute").textContent).toBe("14")
    await type("{PageDown}{PageDown}")
    expect(part("minute").textContent).toBe("44")
    await type("{Home}")
    expect(part("minute").textContent).toBe("00")
    await type("{End}")
    expect(part("minute").textContent).toBe("59")
    part("hour").focus()
    await type("{ArrowUp}")
    expect(made.value.peek()).toBe("12:59")
    await type("{ArrowUp}")
    expect(made.value.peek()).toBe("13:59")
    part("dayPeriod").focus()
    await type("{ArrowUp}")
    expect(made.value.peek()).toBe("01:59")
    expect(heard.at(-1)).toEqual(["01:59", "step"])
    expect(part("dayPeriod").getAttribute("aria-valuetext")).toBe("AM")
    const german = field({ locale: "de-DE", defaultValue: "00:00" })
    german.part("hour").focus()
    await type("{ArrowDown}")
    expect(german.made.value.peek()).toBe("23:00")
  })

  it("starts from a part's least or most when it is empty", async () => {
    const { part } = field()
    part("hour").focus()
    await type("{ArrowUp}")
    expect(part("hour").textContent).toBe("01")
    part("dayPeriod").focus()
    await type("{ArrowDown}")
    expect(part("dayPeriod").textContent).toBe("PM")
    const german = field({ locale: "de-DE" })
    german.part("hour").focus()
    await type("{ArrowUp}")
    expect(german.part("hour").textContent).toBe("00")
    german.part("minute").focus()
    await type("{ArrowDown}")
    expect(german.part("minute").textContent).toBe("59")
  })

  it("names the day period in the locale's words", async () => {
    const { part } = field({ locale: "ko-KR" })
    part("dayPeriod").focus()
    await type("{ArrowUp}")
    // What this engine's own `Intl` calls the morning there: an engine built with fewer
    // languages says it in English, and the field says what the engine says.
    const morning = new Intl.DateTimeFormat("ko-KR", { hour: "numeric", hour12: true })
      .formatToParts(new Date(2020, 0, 1, 9))
      .find((each) => each.type === "dayPeriod")!.value
    expect(part("dayPeriod").textContent).toBe(morning)
  })

  it("moves between its parts the way the text reads, and is left by Tab", async () => {
    const { part, at } = field()
    part("hour").focus()
    await type("{ArrowRight}")
    expect(at()).toBe("minute")
    await type("{ArrowRight}{ArrowRight}")
    expect(at()).toBe("dayPeriod")
    await type("{ArrowLeft}")
    expect(at()).toBe("minute")
    await type("{Tab}{Tab}")
    expect(document.activeElement?.id).toBe("after")
    const hebrew = field({ locale: "he-IL" }, "rtl")
    hebrew.part("hour").focus()
    await type("{ArrowLeft}")
    expect(hebrew.at()).toBe("minute")
  })

  it("empties a part with Backspace, a digit at a time, then goes back a part", async () => {
    const { part, shown, at, made, heard } = field({ locale: "de-DE", defaultValue: "10:30" })
    part("minute").focus()
    await type("{Backspace}")
    expect(shown()).toBe("10:mm")
    expect(made.value.peek()).toBe(null)
    expect(heard).toEqual([[null, "cleared"]])
    await type("{Backspace}")
    expect(at()).toBe("hour")
    await type("0")
    expect(part("hour").textContent).toBe("00")
    await type("{Backspace}")
    expect(part("hour").textContent).toBe("hh")
  })

  it("keeps what is half typed when focus leaves, and says a part left half typed", async () => {
    const { part, shown, heard, root } = field({ locale: "de-DE", defaultValue: "10:30" })
    part("hour").focus()
    await type("1")
    find(root, "after").focus()
    expect(shown()).toBe("01:30")
    expect(heard).toEqual([["01:30", "typed"]])
  })

  it("follows a caller who holds its value, and asks before it changes", async () => {
    const held = field({ locale: "de-DE", value: "10:30" })
    held.part("minute").focus()
    await type("{ArrowUp}")
    expect(held.heard).toEqual([["10:31", "step"]])
    expect(held.made.value.peek()).toBe("10:30")
    held.props.set({ ...held.props.peek(), value: "18:05" })
    expect(held.shown()).toBe("18:05")
    const refused = field({
      locale: "de-DE",
      defaultValue: "10:30",
      onValueChange: (_, details) => details.cancel(),
    })
    refused.part("minute").focus()
    await type("{ArrowUp}")
    expect(refused.shown()).toBe("10:30")
    expect(refused.made.value.peek()).toBe("10:30")
  })

  it("reads the value again when its clock changes", () => {
    const { props, shown } = field({ defaultValue: "21:05" })
    expect(shown()).toBe("09:05 PM")
    props.set({ ...props.peek(), hourCycle: 24 })
    expect(shown()).not.toContain("PM")
  })

  it("says when its time is outside what it takes", async () => {
    const { group, part } = field({
      locale: "de-DE",
      defaultValue: "10:30",
      min: "09:00",
      max: "17:00:00",
    })
    expect(group.hasAttribute("data-invalid")).toBe(false)
    part("hour").focus()
    await type("18")
    expect(group.hasAttribute("data-invalid")).toBe(true)
    expect(part("hour").getAttribute("aria-invalid")).toBe("true")
    part("hour").focus()
    await type("17")
    // The last it takes is in: `17:00:00` and `17:00` are the same time.
    part("minute").focus()
    await type("00")
    expect(group.hasAttribute("data-invalid")).toBe(false)
  })

  it("says it is invalid when it is asked for and half typed", async () => {
    const { group, part } = field({ locale: "de-DE", required: true })
    expect(group.hasAttribute("data-invalid")).toBe(false)
    part("hour").focus()
    await type("10")
    expect(group.hasAttribute("data-invalid")).toBe(true)
  })

  it("takes nothing while it is read-only or disabled, and no stop when disabled", async () => {
    const readOnly = field({ locale: "de-DE", defaultValue: "10:30", readOnly: true })
    readOnly.part("minute").focus()
    await type("{ArrowUp}{Home}9")
    expect(readOnly.shown()).toBe("10:30")
    expect(readOnly.part("minute").hasAttribute("contenteditable")).toBe(false)
    expect(readOnly.part("minute").getAttribute("tabindex")).toBe("0")
    expect(readOnly.group.hasAttribute("data-readonly")).toBe(true)
    const disabled = field({ locale: "de-DE", defaultValue: "10:30", disabled: true })
    expect(disabled.part("minute").hasAttribute("tabindex")).toBe(false)
    expect(disabled.part("minute").hasAttribute("data-disabled")).toBe(true)
    expect(disabled.hidden.disabled).toBe(true)
  })

  it("is submitted with its form, goes back on reset, and is emptied by `clear`", async () => {
    const { root, part, made, hidden, shown, heard } = field({
      locale: "de-DE",
      defaultValue: "10:30",
    })
    const form = find<HTMLFormElement>(root, "form")
    expect(new FormData(form).get("at")).toBe("10:30")
    part("minute").focus()
    await type("{ArrowUp}")
    expect(hidden.value).toBe("10:31")
    form.reset()
    expect(made.value.peek()).toBe("10:30")
    expect(shown()).toBe("10:30")
    expect(heard.at(-1)).toEqual(["10:30", "form-reset"])
    made.clear()
    expect(shown()).toBe("hh:mm")
    expect(made.value.peek()).toBe(null)
  })

  it("puts back on reset the parts of a caller who holds its value and keeps it", async () => {
    const { root, part, shown, heard } = field({ locale: "de-DE", value: "10:30" })
    part("minute").focus()
    await type("{Home}")
    // The caller did not take the change: the parts show it all the same, as typed.
    expect(shown()).toBe("10:00")
    // Nothing to ask the caller: the value they hold is already the first.
    find<HTMLFormElement>(root, "form").reset()
    expect(heard).toEqual([["10:00", "step"]])
    expect(shown()).toBe("10:30")
  })

  it("lets nothing the browser would write into a part stay there", async () => {
    const { part, shown } = field()
    part("hour").focus()
    await type("ab1c2")
    expect(shown()).toBe("12:mm --")
    expect(part("hour").childNodes.length).toBe(1)
    part("dayPeriod").focus()
    await type("7x")
    expect(part("dayPeriod").textContent).toBe("--")
  })
})
