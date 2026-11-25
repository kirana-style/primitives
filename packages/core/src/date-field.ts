import { bindable } from "./bindable.ts"
import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { batch, computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"

// Only the type: a calendar system is the caller's own instance, and the field calls its
// methods. A page that gives none carries nothing of the date library for it.
import type { Calendar as CalendarSystem } from "@internationalized/date"

/** A day as `YYYY-MM-DD` (ISO 8601). */
export type IsoDate = string
/** A part of a date that is typed on its own; the era only in a calendar that has several. */
export type DateUnit = "era" | "day" | "month" | "year"

export interface DateFieldProps {
  id: string
  /** The day typed, once all of it is; `null` until then. */
  value?: IsoDate | null | undefined
  /** The value it starts with, when the caller does not hold `value`. Read once. */
  defaultValue?: IsoDate | null | undefined
  /**
   * Heard as the day is about to change, once all of it is typed or as it is cleared:
   * `details.cancel()` keeps the value as it was.
   */
  onValueChange?: ((value: IsoDate | null, details: ChangeDetails) => void) | undefined
  /**
   * The language and region that order the day, the month and the year and put what stands
   * between them (`"en-US"`: month/day/year). Give it: a server does not know the reader's.
   */
  locale?: string | undefined
  /** The first and the last day it takes: outside them it says it is invalid. */
  min?: IsoDate | undefined
  /** The last day it takes. */
  max?: IsoDate | undefined
  /**
   * The calendar its parts are typed in, when it is not the Gregorian one: an instance from
   * `@internationalized/date` (`new PersianCalendar()`), as a calendar takes it. Its days,
   * months, years and eras are the parts' ranges; the value is still an ISO day. In a calendar
   * with several eras (Japanese, Minguo, Ethiopic), the era is a part of its own.
   */
  calendarSystem?: CalendarSystem | undefined
  /** What an empty part shows. Default: `dd`, `mm`, `yyyy`, `era`. */
  placeholders?: Partial<Record<DateUnit, string>> | undefined
  /** Disabled: it cannot be changed. */
  disabled?: boolean | undefined
  /** Shown as it is, focusable, not changeable. */
  readOnly?: boolean | undefined
  /** Needed: in a `Field`, leaving it empty is then invalid. */
  required?: boolean | undefined
  /** The name it is submitted under, by its hidden input. */
  name?: string | undefined
  /** The id of the form it belongs to, when it is not inside it. */
  form?: string | undefined
}

/** One piece of the field, in the locale's order: a part that is typed, or what stands between. */
export interface DateFieldSegment {
  readonly type: DateUnit | "literal"
  /** What stands between two parts (`"/"`); empty for a part that is typed. */
  readonly literal: string
  /** Its place among the pieces. */
  readonly index: number
}

export interface DateField {
  readonly value: ReadonlySignal<IsoDate | null>
  /** The pieces of the field, in the locale's order. */
  readonly segments: ReadonlySignal<readonly DateFieldSegment[]>
  /** Empties it. */
  clear(details?: ChangeDetails): void
  /** Moves focus to its first part. */
  focus(): void
  mount(): () => void
  readonly root: Part
  /** One piece's element, and what it shows now. */
  segment(segment: DateFieldSegment): { readonly part: Part; readonly text: ReadonlySignal<string> }
  /** The `<input type="hidden">` it is submitted by. */
  readonly input: Part
}

const NOTHING = () => {}
const NONE = () => NOTHING
const UNITS: readonly DateUnit[] = ["era", "day", "month", "year"]
const DIGITS: Record<DateUnit, number> = { era: 1, day: 2, month: 2, year: 4 }
const PLACEHOLDER: Record<DateUnit, string> = { era: "era", day: "dd", month: "mm", year: "yyyy" }
const NO_ERAS: readonly string[] = []
const pad = (value: number, length: number) => String(value).padStart(length, "0")
/** The days a month has; a month that is not known yet may have thirty-one. */
const daysIn = (year: number | undefined, month: number | undefined) =>
  month === undefined ? 31 : new Date(Date.UTC(year ?? 2000, month, 0)).getUTCDate()

type Fields = Partial<Record<DateUnit, number>>

function parse(iso: IsoDate | null | undefined): Fields | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "")
  if (!match) return undefined
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  if (month < 1 || month > 12 || day < 1 || day > daysIn(year, month)) return undefined
  return { year, month, day }
}

// A day as the number a calendar system counts it by (its Julian day), and back.
const DAY = 864e5
const EPOCH = 2440588
function julian(iso: IsoDate): number {
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number]
  const at = new Date(0)
  at.setUTCFullYear(year, month - 1, day)
  return at.getTime() / DAY + EPOCH
}
const fromJulian = (count: number): IsoDate =>
  new Date((count - EPOCH) * DAY).toISOString().slice(0, 10)
/** Any day: what a calendar system makes a date of, before the parts are set on it. */
const SOME_DAY = julian("2000-01-01")

/**
 * A date that is typed: a part for the day, one for the month, one for the year, in the order
 * the locale writes them. Each part is a spin button: digits fill it and go on to the next,
 * the arrows turn it, Backspace empties it. Its value is an ISO date once every part is in,
 * and nothing until then; a day a month does not have becomes that month's last.
 *
 * No text is parsed: what is typed can only be a date.
 */
export function createDateField(
  props: ReadonlySignal<DateFieldProps>,
  around: DirectionAround = {}
): DateField {
  const id = props.peek().id
  const locale = computed(() => props.get().locale ?? "en-US")
  const value = bindable<IsoDate | null>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? null,
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  // The same calendar however often a caller makes it again (`new PersianCalendar()` in a render).
  const system = computed(
    () => props.get().calendarSystem,
    (a, b) => a?.identifier === b?.identifier
  )
  // The eras a part chooses between: only in a calendar with several, and never the Gregorian.
  const eras = computed(() => {
    const given = system.get()
    const all = given?.identifier === "gregory" ? NO_ERAS : (given?.getEras() ?? NO_ERAS)
    return all.length > 1 ? all : NO_ERAS
  })

  /** The parts a day is, in the calendar the field is typed in. */
  function fieldsOf(iso: IsoDate | null | undefined): Fields | undefined {
    const gregorian = parse(iso)
    const given = system.peek()
    if (!gregorian || !given) return gregorian
    const at = given.fromJulianDay(julian(iso!))
    return { era: given.getEras().indexOf(at.era) + 1, year: at.year, month: at.month, day: at.day }
  }
  /**
   * The date some parts make in the calendar given, kept inside what it has (a day past the
   * month's last is its last). The parts not given are the first of their kind.
   */
  function dateOf(given: CalendarSystem, fields: Omit<Fields, "era">) {
    const all = given.getEras()
    const era = parts.era.get()
    return given.fromJulianDay(SOME_DAY).set({
      era: era === undefined ? all[all.length - 1] : all[era - 1],
      year: 1,
      month: 1,
      day: 1,
      ...fields,
    })
  }

  const began = fieldsOf(value.peek())
  const parts: Record<DateUnit, Signal<number | undefined>> = {
    era: signal(began?.era),
    day: signal(began?.day),
    month: signal(began?.month),
    year: signal(began?.year),
  }
  // The digits typed into the part that has focus, before they are a number.
  const typed = signal("")
  const elements = new Map<DateUnit, HTMLElement>()
  let group: HTMLElement | undefined

  const segments = computed(() => {
    const written = new Intl.DateTimeFormat(locale.get(), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      calendar: system.get()?.identifier,
      timeZone: "UTC",
    })
      .formatToParts(new Date(Date.UTC(2000, 0, 1)))
      .filter((each) => each.type === "literal" || (UNITS as readonly string[]).includes(each.type))
    // A calendar of one era writes it too: it is left out, with what stood beside it.
    const era = written.findIndex((each) => each.type === "era")
    if (era >= 0 && eras.get().length === 0) {
      const before = written[era - 1]?.type === "literal"
      written.splice(before ? era - 1 : era, before || written[era + 1]?.type === "literal" ? 2 : 1)
    }
    return written.map((each, index): DateFieldSegment => ({
      type: each.type as DateUnit | "literal",
      literal: each.type === "literal" ? each.value : "",
      index,
    }))
  })
  const order = computed(() =>
    segments
      .get()
      .map((each) => each.type)
      .filter((each): each is DateUnit => each !== "literal")
  )

  /** The date the parts make, when every one is in. */
  const whole = () => {
    const [year, month, day] = [parts.year.peek(), parts.month.peek(), parts.day.peek()]
    if (year === undefined || month === undefined || day === undefined) return null
    const given = system.peek()
    if (!given)
      return `${pad(year, 4)}-${pad(month, 2)}-${pad(Math.min(day, daysIn(year, month)), 2)}`
    if (eras.peek().length > 0 && parts.era.peek() === undefined) return null
    return fromJulian(given.toJulianDay(dateOf(given, { year, month, day })))
  }

  /**
   * The most a part can be: what the calendar has for the parts known so far. While typed, a day
   * may be any month's most, as it is held to its month once the date is whole.
   */
  function most(unit: DateUnit, typing = false): number {
    const given = system.get()
    const [year, month] = [parts.year.get(), parts.month.get()]
    if (!given) {
      if (unit === "day") return typing ? 31 : daysIn(year, month)
      return unit === "month" ? 12 : 9999
    }
    if (unit === "era") return eras.get().length
    if (unit === "year") return given.getYearsInEra(dateOf(given, {}))
    if (unit === "month")
      return year === undefined
        ? given.getMaximumMonthsInYear()
        : given.getMonthsInYear(dateOf(given, { year }))
    return typing || year === undefined || month === undefined
      ? given.getMaximumDaysInMonth()
      : given.getDaysInMonth(dateOf(given, { year, month }))
  }
  const invalid = computed(() => {
    const now = value.get()
    const { min, max, required } = props.get()
    if (now === null)
      return Boolean(required) && UNITS.some((unit) => parts[unit].get() !== undefined)
    return (min !== undefined && now < min) || (max !== undefined && now > max)
  })

  function load(from: IsoDate | null) {
    const read = fieldsOf(from)
    batch(() => {
      for (const unit of UNITS) parts[unit].set(read?.[unit])
      typed.set("")
    })
  }

  /** Says what the parts now make, and takes them back if a caller refuses. */
  function settle(by: ChangeDetails) {
    const next = whole()
    // A day the month does not have is that month's last; in a calendar given, any part the
    // calendar keeps inside what it has (an era's last year) is what it kept.
    const read = fieldsOf(next)
    if (read)
      batch(() => {
        for (const unit of UNITS) if (read[unit] !== parts[unit].peek()) parts[unit].set(read[unit])
      })
    if (next === value.peek()) return
    value.set(next, by)
    if (by.canceled) load(value.peek())
  }

  function focusBy(unit: DateUnit, step: 1 | -1) {
    const all = order.peek()
    const next = all[all.indexOf(unit) + step]
    if (next) elements.get(next)?.focus()
    return next !== undefined
  }

  function turn(unit: DateUnit, by: number, event: Event) {
    const now = parts[unit].peek()
    const top = most(unit)
    let next: number
    // From nothing, the arrows begin at this year (and era), and at the first or the last of
    // the rest.
    if (now === undefined) {
      const today = new Date()
      const at = `${pad(today.getFullYear(), 4)}-${pad(today.getMonth() + 1, 2)}-${pad(today.getDate(), 2)}`
      next = unit === "year" || unit === "era" ? fieldsOf(at)![unit]! : by > 0 ? 1 : top
    } else if (unit === "year") next = Math.min(top, Math.max(1, now + by))
    else next = ((((now - 1 + by) % top) + top) % top) + 1
    batch(() => {
      typed.set("")
      parts[unit].set(next)
    })
    settle(details("step", event))
  }

  function type(unit: DateUnit, digit: string, event: Event) {
    // An era is turned, not typed.
    if (unit === "era") return
    const top = most(unit, true)
    let digits = (typed.peek() + digit).slice(-DIGITS[unit])
    // A digit that would take the part past its most begins it again: 3 then 9 is the 9th.
    if (Number(digits) > top) digits = digit
    const number = Number(digits)
    // Nothing more can follow: the part is full, or another digit would be past its most.
    const full = digits.length >= DIGITS[unit] || number * 10 > top
    batch(() => {
      typed.set(full ? "" : digits)
      // A lone zero waits for the digit after it.
      if (number > 0) parts[unit].set(Math.min(number, top))
    })
    // Said once the part is whole, not for each digit of it: a year is not 2, then 20.
    if (!full || number === 0) return
    settle(details("typed", event))
    focusBy(unit, 1)
  }

  function erase(unit: DateUnit, event: Event) {
    if (typed.peek() !== "") {
      const left = typed.peek().slice(0, -1)
      batch(() => {
        typed.set(left)
        parts[unit].set(left === "" || Number(left) === 0 ? undefined : Number(left))
      })
    } else if (parts[unit].peek() !== undefined) {
      parts[unit].set(undefined)
    } else {
      // Already empty: Backspace goes back to the part before, as in a line of text.
      focusBy(unit, -1)
      return
    }
    settle(details("cleared", event))
  }

  const off = () => Boolean(props.peek().disabled) || Boolean(props.peek().readOnly)
  const made = new Map<number, { part: Part; text: ReadonlySignal<string> }>()

  function editable(unit: DateUnit): { part: Part; text: ReadonlySignal<string> } {
    const name = computed(() => {
      try {
        return new Intl.DisplayNames(locale.get(), { type: "dateTimeField" }).of(unit)
      } catch {
        return unit
      }
    })
    const text = computed(() => {
      const now = parts[unit].get()
      const given = system.get()
      if (now === undefined) return props.get().placeholders?.[unit] ?? PLACEHOLDER[unit]
      if (unit === "era" && given) {
        // Its name as the locale writes it, read from a day of that era.
        const day = new Date(
          `${fromJulian(given.toJulianDay(dateOf(given, { year: 2, month: 6 })))}T00:00Z`
        )
        return (
          new Intl.DateTimeFormat(locale.get(), {
            era: "short",
            year: "numeric",
            calendar: given.identifier,
            timeZone: "UTC",
          })
            .formatToParts(day)
            .find((each) => each.type === "era")?.value ?? String(now)
        )
      }
      // A year of another calendar is written as it is counted (an era's sixth year is 6).
      if (unit === "year" && given && given.identifier !== "gregory") return String(now)
      return pad(now, DIGITS[unit])
    })
    return {
      text,
      part: {
        props: computed(() => {
          const now = parts[unit].get()
          const disabled = Boolean(props.get().disabled)
          return {
            role: "spinbutton",
            tabindex: disabled ? undefined : "0",
            // Typed in, so a phone shows its digits: nothing the browser writes is kept.
            contenteditable: disabled || props.get().readOnly ? undefined : "true",
            inputmode: "numeric",
            spellcheck: "false",
            autocapitalize: "off",
            enterkeyhint: "next",
            "aria-label": name.get(),
            "aria-valuenow": now === undefined ? undefined : String(now),
            "aria-valuetext": text.get(),
            "aria-valuemin": "1",
            "aria-valuemax": String(most(unit)),
            "aria-disabled": disabled ? "true" : undefined,
            "aria-readonly": props.get().readOnly ? "true" : undefined,
            "aria-invalid": invalid.get() ? "true" : undefined,
            "data-segment": unit,
            "data-placeholder": flag(now === undefined),
            "data-disabled": flag(disabled),
            "data-invalid": flag(invalid.get()),
            onFocus: () => typed.set(""),
            // Left half typed, a part is what was typed of it.
            onBlur(event: FocusEvent) {
              if (typed.peek() === "") return
              typed.set("")
              settle(details("typed", event))
            },
            onKeyDown(event: KeyboardEvent) {
              const rtl = group ? directionOf(group, around.direction) === "rtl" : false
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault()
                focusBy(unit, (event.key === "ArrowRight") === rtl ? -1 : 1)
                return
              }
              if (off()) return
              if (event.key === "ArrowUp") turn(unit, 1, event)
              else if (event.key === "ArrowDown") turn(unit, -1, event)
              else if (event.key === "PageUp" || event.key === "PageDown")
                turn(
                  unit,
                  (event.key === "PageUp" ? 1 : -1) *
                    (unit === "year" ? 10 : unit === "month" ? 3 : unit === "day" ? 7 : 1),
                  event
                )
              else if (event.key === "Backspace" || event.key === "Delete") erase(unit, event)
              else return
              event.preventDefault()
            },
          }
        }),
        attach(element) {
          elements.set(unit, element)
          // Heard from the browser itself, not through a framework: one of them (React) makes
          // a `beforeinput` of its own that says neither what kind of input it is nor a deletion.
          const input = (event: InputEvent) => {
            // Every write is the field's own: the browser's is never let in.
            event.preventDefault()
            if (off()) return
            if (event.inputType.startsWith("delete")) return erase(unit, event)
            for (const each of event.data ?? "")
              if (each >= "0" && each <= "9") type(unit, each, event)
          }
          element.addEventListener("beforeinput", input)
          return () => {
            element.removeEventListener("beforeinput", input)
            if (elements.get(unit) === element) elements.delete(unit)
          }
        },
      },
    }
  }

  return {
    value,
    segments,
    clear(by = details("clear")) {
      load(null)
      settle(by)
    },
    focus() {
      const first = order.peek()[0]
      if (first) elements.get(first)?.focus()
    },
    mount() {
      let first = true
      // A caller who holds the value, or sets it, is shown it: the parts follow, as they do a
      // calendar system that changes.
      return effect(() => {
        system.get()
        const now = value.get()
        if (first) {
          first = false
          return
        }
        // But not while a date is half typed: nothing is no reason to empty what is there.
        if (now !== whole() && (now !== null || whole() !== null)) load(now)
      })
    },
    root: {
      props: computed(() => ({
        id,
        role: "group",
        "data-disabled": flag(props.get().disabled),
        "data-readonly": flag(props.get().readOnly),
        "data-invalid": flag(invalid.get()),
        // A press on what stands between the parts goes to the first that is empty.
        onPointerDown(event: PointerEvent) {
          const target = event.target as Element | null
          if (target?.closest('[role="spinbutton"]') || props.peek().disabled) return
          event.preventDefault()
          const all = order.peek()
          const to = all.find((unit) => parts[unit].peek() === undefined) ?? all[0]
          if (to) elements.get(to)?.focus()
        },
      })),
      attach(element) {
        group = element
        return () => {
          if (group === element) group = undefined
        }
      },
    },
    segment(segment) {
      // By its place: the same piece however often it is asked for, until the locale changes.
      const key = segment.index * 5 + ["literal", ...UNITS].indexOf(segment.type)
      let kept = made.get(key)
      if (!kept) {
        kept =
          segment.type === "literal"
            ? {
                text: computed(() => segment.literal),
                part: {
                  props: computed(() => ({ "aria-hidden": "true", "data-segment": "literal" })),
                  attach: NONE,
                },
              }
            : editable(segment.type)
        made.set(key, kept)
      }
      return kept
    },
    input: {
      props: computed(() => ({
        type: "hidden",
        name: props.get().name,
        form: props.get().form,
        value: value.get() ?? "",
        disabled: props.get().disabled ? "" : undefined,
      })),
      attach(element) {
        // A form's reset puts the first value back.
        const form = (element as HTMLInputElement).form
        const first = props.peek().defaultValue ?? null
        const reset = () => {
          load(first)
          settle(details("reset"))
        }
        form?.addEventListener("reset", reset)
        return () => form?.removeEventListener("reset", reset)
      },
    },
  }
}
