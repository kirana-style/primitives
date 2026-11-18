import { bindable } from "./bindable.ts"
import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { batch, computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"

/** A day as `YYYY-MM-DD` (ISO 8601). */
export type IsoDate = string
/** A part of a date that is typed on its own. */
export type DateUnit = "day" | "month" | "year"

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
  /** What an empty part shows. Default: `dd`, `mm`, `yyyy`. */
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
  mount(): () => void
  readonly root: Part
  /** One piece's element, and what it shows now. */
  segment(segment: DateFieldSegment): { readonly part: Part; readonly text: ReadonlySignal<string> }
  /** The `<input type="hidden">` it is submitted by. */
  readonly input: Part
}

const NOTHING = () => {}
const NONE = () => NOTHING
const UNITS: readonly DateUnit[] = ["day", "month", "year"]
const DIGITS: Record<DateUnit, number> = { day: 2, month: 2, year: 4 }
const PLACEHOLDER: Record<DateUnit, string> = { day: "dd", month: "mm", year: "yyyy" }
const pad = (value: number, length: number) => String(value).padStart(length, "0")
/** The days a month has; a month that is not known yet may have thirty-one. */
const daysIn = (year: number | undefined, month: number | undefined) =>
  month === undefined ? 31 : new Date(Date.UTC(year ?? 2000, month, 0)).getUTCDate()

function parse(iso: IsoDate | null | undefined): Record<DateUnit, number> | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "")
  if (!match) return undefined
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  if (month < 1 || month > 12 || day < 1 || day > daysIn(year, month)) return undefined
  return { year, month, day }
}

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
  const began = parse(value.peek())
  const parts: Record<DateUnit, Signal<number | undefined>> = {
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
      timeZone: "UTC",
    }).formatToParts(new Date(Date.UTC(2000, 0, 1)))
    return written
      .filter((each) => each.type === "literal" || (UNITS as readonly string[]).includes(each.type))
      .map((each, index): DateFieldSegment => ({
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
    return `${pad(year, 4)}-${pad(month, 2)}-${pad(Math.min(day, daysIn(year, month)), 2)}`
  }
  const invalid = computed(() => {
    const now = value.get()
    const { min, max, required } = props.get()
    if (now === null)
      return Boolean(required) && UNITS.some((unit) => parts[unit].get() !== undefined)
    return (min !== undefined && now < min) || (max !== undefined && now > max)
  })

  function load(from: IsoDate | null) {
    const read = parse(from)
    batch(() => {
      for (const unit of UNITS) parts[unit].set(read?.[unit])
      typed.set("")
    })
  }

  /** Says what the parts now make, and takes them back if a caller refuses. */
  function settle(by: ChangeDetails) {
    const next = whole()
    // A day the month does not have is that month's last.
    const read = parse(next)
    if (read && read.day !== parts.day.peek()) parts.day.set(read.day)
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
    const most =
      unit === "day" ? daysIn(parts.year.peek(), parts.month.peek()) : unit === "month" ? 12 : 9999
    let next: number
    // From nothing, the arrows begin at this year, and at the first or the last of the rest.
    if (now === undefined) next = unit === "year" ? new Date().getFullYear() : by > 0 ? 1 : most
    else if (unit === "year") next = Math.min(9999, Math.max(1, now + by))
    else next = ((((now - 1 + by) % most) + most) % most) + 1
    batch(() => {
      typed.set("")
      parts[unit].set(next)
    })
    settle(details("step", event))
  }

  function type(unit: DateUnit, digit: string, event: Event) {
    const most = unit === "day" ? 31 : unit === "month" ? 12 : 9999
    let digits = (typed.peek() + digit).slice(-DIGITS[unit])
    // A digit that would take the part past its most begins it again: 3 then 9 is the 9th.
    if (Number(digits) > most) digits = digit
    const number = Number(digits)
    // Nothing more can follow: the part is full, or another digit would be past its most.
    const full = digits.length >= DIGITS[unit] || (unit !== "year" && number * 10 > most)
    batch(() => {
      typed.set(full ? "" : digits)
      // A lone zero waits for the digit after it.
      if (number > 0) parts[unit].set(Math.min(number, most))
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
      const shown = props.get().placeholders?.[unit] ?? PLACEHOLDER[unit]
      return now === undefined ? shown : pad(now, DIGITS[unit])
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
            "aria-valuemax":
              unit === "day"
                ? String(daysIn(parts.year.get(), parts.month.get()))
                : unit === "month"
                  ? "12"
                  : "9999",
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
              else if (event.key === "PageUp")
                turn(unit, unit === "year" ? 10 : unit === "month" ? 3 : 7, event)
              else if (event.key === "PageDown")
                turn(unit, unit === "year" ? -10 : unit === "month" ? -3 : -7, event)
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
    mount() {
      let first = true
      // A caller who holds the value, or sets it, is shown it: the parts follow.
      return effect(() => {
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
      const key = segment.index * 4 + ["literal", "day", "month", "year"].indexOf(segment.type)
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
