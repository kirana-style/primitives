import { bindable } from "./bindable.ts"
import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { batch, computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { createFormControl } from "./services/form-control.ts"

/** A time of day as `HH:MM` or `HH:MM:SS`, in 24 hours (ISO 8601). */
export type IsoTime = string
/** A part of a time that is typed on its own. */
export type TimeUnit = "hour" | "minute" | "second" | "dayPeriod"
/** The smallest part it is typed to. */
export type TimeGranularity = "minute" | "second"
/** A clock of twelve hours and a day period, or of twenty-four. */
export type HourCycle = 12 | 24

export interface TimeFieldProps {
  id: string
  /** The time typed, once all of it is; `null` until then. */
  value?: IsoTime | null | undefined
  /** The value it starts with, when the caller does not hold `value`. Read once. */
  defaultValue?: IsoTime | null | undefined
  /**
   * Heard as the time is about to change, once all of it is typed or as it is cleared:
   * `details.cancel()` keeps the value as it was.
   */
  onValueChange?: ((value: IsoTime | null, details: ChangeDetails) => void) | undefined
  /** To the minute (`HH:MM`, the default) or to the second (`HH:MM:SS`). */
  granularity?: TimeGranularity | undefined
  /**
   * The language and region that order the parts, put what stands between them and say
   * whether the clock has twelve hours or twenty-four (`"en-US"`: 12, with AM and PM). Give
   * it: a server does not know the reader's.
   */
  locale?: string | undefined
  /** A clock of 12 or 24 hours, whatever the locale's is. */
  hourCycle?: HourCycle | undefined
  /** The first time it takes: before it, it says it is invalid. */
  min?: IsoTime | undefined
  /** The last time it takes. */
  max?: IsoTime | undefined
  /** What an empty part shows. Default: `hh`, `mm`, `ss`, and `--` for the day period. */
  placeholders?: Partial<Record<TimeUnit, string>> | undefined
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
export interface TimeFieldSegment {
  readonly type: TimeUnit | "literal"
  /** What stands between two parts (`":"`); empty for a part that is typed. */
  readonly literal: string
  /** Its place among the pieces. */
  readonly index: number
}

export interface TimeField {
  readonly value: ReadonlySignal<IsoTime | null>
  /** The pieces of the field, in the locale's order. */
  readonly segments: ReadonlySignal<readonly TimeFieldSegment[]>
  /** Empties it. */
  clear(details?: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  /** One piece's element, and what it shows now. */
  segment(segment: TimeFieldSegment): { readonly part: Part; readonly text: ReadonlySignal<string> }
  /** The `<input type="hidden">` it is submitted by. */
  readonly input: Part
}

const NOTHING = () => {}
const NONE = () => NOTHING
const UNITS: readonly TimeUnit[] = ["hour", "minute", "second", "dayPeriod"]
const KINDS = ["literal", ...UNITS]
const PLACEHOLDER: Record<TimeUnit, string> = {
  hour: "hh",
  minute: "mm",
  second: "ss",
  dayPeriod: "--",
}
/** How far PageUp and PageDown turn a part. */
const LEAP: Record<TimeUnit, number> = { hour: 2, minute: 15, second: 15, dayPeriod: 1 }
const pad = (value: number) => String(value).padStart(2, "0")

function parse(iso: IsoTime | null | undefined): [number, number, number] | undefined {
  const match = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(iso ?? "")
  if (!match) return undefined
  const [hour, minute, second] = [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)]
  if (hour > 23 || minute > 59 || second > 59) return undefined
  return [hour, minute, second]
}

/** A time as seconds since midnight, to compare `10:30` with `10:30:00`. */
const secondsOf = (iso: IsoTime | null | undefined) => {
  const read = parse(iso)
  return read ? read[0] * 3600 + read[1] * 60 + read[2] : undefined
}

/**
 * A time of day that is typed: a part for the hour, one for the minute, one for the second when
 * it is asked for, and a day period (AM, PM) on a clock of twelve hours, in the order the locale
 * writes them. Each part is a spin button: digits fill it and go on to the next, the arrows turn
 * it, Backspace empties it; the day period is turned by the arrows or typed by its first letter.
 * Its value is an ISO time in 24 hours once every part is in, and nothing until then.
 *
 * No text is parsed: what is typed can only be a time.
 */
export function createTimeField(
  props: ReadonlySignal<TimeFieldProps>,
  around: DirectionAround = {}
): TimeField {
  const id = props.peek().id
  const locale = computed(() => props.get().locale ?? "en-US")
  const seconds = computed(() => props.get().granularity === "second")
  const cycle = computed((): HourCycle => {
    const given = props.get().hourCycle
    if (given) return given
    const read = new Intl.DateTimeFormat(locale.get(), { hour: "numeric" }).resolvedOptions()
    return read.hourCycle === "h11" || read.hourCycle === "h12" ? 12 : 24
  })
  const value = bindable<IsoTime | null>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? null,
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  const initial = value.peek()
  // The hour is held as it is shown: 1 to 12 beside a day period (0 for AM, 1 for PM) on a
  // clock of twelve hours, 0 to 23 on one of twenty-four.
  const parts: Record<TimeUnit, Signal<number | undefined>> = {
    hour: signal<number | undefined>(undefined),
    minute: signal<number | undefined>(undefined),
    second: signal<number | undefined>(undefined),
    dayPeriod: signal<number | undefined>(undefined),
  }
  // The digits typed into the part that has focus, before they are a number.
  const typed = signal("")
  const elements = new Map<TimeUnit, HTMLElement>()
  let group: HTMLElement | undefined

  const least = (unit: TimeUnit) => (unit === "hour" && cycle.peek() === 12 ? 1 : 0)
  const most = (unit: TimeUnit) =>
    unit === "hour" ? (cycle.peek() === 12 ? 12 : 23) : unit === "dayPeriod" ? 1 : 59

  const segments = computed(() => {
    const written = new Intl.DateTimeFormat(locale.get(), {
      hour: "2-digit",
      minute: "2-digit",
      second: seconds.get() ? "2-digit" : undefined,
      hourCycle: cycle.get() === 12 ? "h12" : "h23",
      timeZone: "UTC",
    }).formatToParts(new Date(Date.UTC(2000, 0, 1)))
    return written
      .filter((each) => each.type === "literal" || (UNITS as readonly string[]).includes(each.type))
      .map((each, index): TimeFieldSegment => ({
        type: each.type as TimeUnit | "literal",
        literal: each.type === "literal" ? each.value : "",
        index,
      }))
  })
  const order = computed(() =>
    segments
      .get()
      .map((each) => each.type)
      .filter((each): each is TimeUnit => each !== "literal")
  )
  /** The locale's words for the morning and the afternoon. */
  const periods = computed(() => {
    const format = new Intl.DateTimeFormat(locale.get(), {
      hour: "numeric",
      hourCycle: "h12",
      timeZone: "UTC",
    })
    const word = (hour: number) =>
      format
        .formatToParts(new Date(Date.UTC(2000, 0, 1, hour)))
        .find((each) => each.type === "dayPeriod")?.value ?? (hour < 12 ? "AM" : "PM")
    return [word(0), word(12)] as const
  })

  /** The time the parts make, when every one is in. */
  const whole = () => {
    const [hour, minute, second] = [parts.hour.peek(), parts.minute.peek(), parts.second.peek()]
    if (hour === undefined || minute === undefined) return null
    if (seconds.peek() && second === undefined) return null
    let hours = hour
    if (cycle.peek() === 12) {
      const period = parts.dayPeriod.peek()
      if (period === undefined) return null
      hours = (hour % 12) + period * 12
    }
    return `${pad(hours)}:${pad(minute)}${seconds.peek() ? `:${pad(second ?? 0)}` : ""}`
  }
  const invalid = computed(() => {
    const now = value.get()
    const { min, max, required } = props.get()
    if (now === null)
      return Boolean(required) && order.get().some((unit) => parts[unit].get() !== undefined)
    const at = secondsOf(now)
    const [from, to] = [secondsOf(min), secondsOf(max)]
    if (at === undefined) return false
    return (from !== undefined && at < from) || (to !== undefined && at > to)
  })

  function load(from: IsoTime | null) {
    const read = parse(from)
    const twelve = cycle.peek() === 12
    batch(() => {
      parts.hour.set(read && (twelve ? read[0] % 12 || 12 : read[0]))
      parts.minute.set(read?.[1])
      parts.second.set(read?.[2])
      parts.dayPeriod.set(read && (twelve ? (read[0] >= 12 ? 1 : 0) : undefined))
      typed.set("")
    })
  }
  load(initial)

  /** Says what the parts now make, and takes them back if a caller refuses. */
  function settle(by: ChangeDetails) {
    const next = whole()
    if (next === value.peek()) return
    value.set(next, by)
    if (by.canceled) load(value.peek())
  }

  const inForm = createFormControl((event) => {
    const by = details("form-reset", event)
    value.set(initial, by)
    // The value asked for, not the value read back: a caller who holds it answers later.
    load(by.canceled ? value.peek() : initial)
  })
  const disabled = computed(() => Boolean(props.get().disabled) || inForm.disabled.get())
  const off = () => disabled.peek() || Boolean(props.peek().readOnly)

  function focusBy(unit: TimeUnit, step: 1 | -1) {
    const all = order.peek()
    const next = all[all.indexOf(unit) + step]
    if (next) elements.get(next)?.focus()
    return next !== undefined
  }

  function put(unit: TimeUnit, next: number, by: ChangeDetails) {
    batch(() => {
      typed.set("")
      parts[unit].set(next)
    })
    settle(by)
  }

  function turn(unit: TimeUnit, by: number, event: Event) {
    const now = parts[unit].peek()
    const [low, high] = [least(unit), most(unit)]
    const span = high - low + 1
    // From nothing, the arrows begin at a part's least or its most.
    const next =
      now === undefined ? (by > 0 ? low : high) : ((((now - low + by) % span) + span) % span) + low
    put(unit, next, details("step", event))
  }

  function type(unit: TimeUnit, digit: string, event: Event) {
    const [low, high] = [least(unit), most(unit)]
    let digits = (typed.peek() + digit).slice(-2)
    // A digit that would take the part past its most begins it again: 6 then 7 is the 7th minute.
    if (Number(digits) > high) digits = digit
    const number = Number(digits)
    // Nothing more can follow: the part is full, or another digit would be past its most.
    const full = digits.length >= 2 || number * 10 > high
    batch(() => {
      typed.set(full ? "" : digits)
      // A zero waits for the digit after it where a part cannot be zero (an hour of 12).
      if (number >= low) parts[unit].set(number)
    })
    // Said once the part is whole, not for each digit of it: a minute is not 3, then 30.
    if (!full || number < low) return
    settle(details("typed", event))
    focusBy(unit, 1)
  }

  /** The day period from a letter: the first of the locale's word, or `a` and `p`. */
  function choose(letter: string, event: Event) {
    const key = letter.toLocaleLowerCase(locale.peek())
    const words = periods.peek().map((word) => word.toLocaleLowerCase(locale.peek()))
    let period = words.findIndex((word) => word.startsWith(key))
    if (period < 0) period = key === "a" ? 0 : key === "p" ? 1 : -1
    if (period < 0) return
    put("dayPeriod", period, details("typed", event))
    focusBy("dayPeriod", 1)
  }

  function erase(unit: TimeUnit, event: Event) {
    if (typed.peek() !== "") {
      const left = typed.peek().slice(0, -1)
      batch(() => {
        typed.set(left)
        parts[unit].set(left === "" || Number(left) < least(unit) ? undefined : Number(left))
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

  const made = new Map<number, { part: Part; text: ReadonlySignal<string> }>()

  function editable(unit: TimeUnit): { part: Part; text: ReadonlySignal<string> } {
    const period = unit === "dayPeriod"
    const name = computed(() => {
      try {
        return new Intl.DisplayNames(locale.get(), { type: "dateTimeField" }).of(unit)
      } catch {
        return unit
      }
    })
    const text = computed(() => {
      const now = parts[unit].get()
      if (now === undefined) return props.get().placeholders?.[unit] ?? PLACEHOLDER[unit]
      return period ? (periods.get()[now] ?? "") : pad(now)
    })
    return {
      text,
      part: {
        props: computed(() => {
          const now = parts[unit].get()
          const locked = disabled.get()
          const twelve = cycle.get() === 12
          return {
            role: "spinbutton",
            tabindex: locked ? undefined : "0",
            // Typed in, so a phone shows its keys: nothing the browser writes is kept.
            contenteditable: locked || props.get().readOnly ? undefined : "true",
            // The day period is typed by a letter, which a numeric keypad does not have.
            inputmode: period ? "text" : "numeric",
            spellcheck: "false",
            autocapitalize: "off",
            enterkeyhint: "next",
            "aria-label": name.get(),
            "aria-valuenow": now === undefined ? undefined : String(now),
            "aria-valuetext": text.get(),
            "aria-valuemin": unit === "hour" && twelve ? "1" : "0",
            "aria-valuemax": unit === "hour" ? (twelve ? "12" : "23") : period ? "1" : "59",
            "aria-disabled": locked ? "true" : undefined,
            "aria-readonly": props.get().readOnly ? "true" : undefined,
            "aria-invalid": invalid.get() ? "true" : undefined,
            "data-segment": unit,
            "data-placeholder": flag(now === undefined),
            "data-disabled": flag(locked),
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
              else if (event.key === "PageUp") turn(unit, LEAP[unit], event)
              else if (event.key === "PageDown") turn(unit, -LEAP[unit], event)
              else if (event.key === "Home") put(unit, least(unit), details("step", event))
              else if (event.key === "End") put(unit, most(unit), details("step", event))
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
            const data = event.data ?? ""
            if (period) {
              if (data !== "") choose(data[0]!, event)
              return
            }
            for (const each of data) if (each >= "0" && each <= "9") type(unit, each, event)
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
      let was = cycle.peek()
      // A caller who holds the value, or sets it, is shown it: the parts follow.
      return effect(() => {
        const now = value.get()
        const clock = cycle.get()
        if (first) {
          first = false
          return
        }
        // The hour is held as it is shown: another clock reads the value again.
        if (clock !== was) {
          was = clock
          load(now)
          return
        }
        // But not while a time is half typed: nothing is no reason to empty what is there.
        const there = whole()
        if (now !== there && (now !== null || there !== null)) load(now)
      })
    },
    root: {
      props: computed(() => ({
        id,
        role: "group",
        "data-disabled": flag(disabled.get()),
        "data-readonly": flag(props.get().readOnly),
        "data-invalid": flag(invalid.get()),
        // A press on what stands between the parts goes to the first that is empty.
        onPointerDown(event: PointerEvent) {
          const target = event.target as Element | null
          if (target?.closest('[role="spinbutton"]') || disabled.peek()) return
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
      const key = segment.index * KINDS.length + KINDS.indexOf(segment.type)
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
      // A form's reset puts the first value back, and a `<fieldset disabled>` disables it.
      attach: (element) => inForm.attach(element),
    },
  }
}
