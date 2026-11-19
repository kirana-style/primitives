import {
  DateFormatter,
  GregorianCalendar,
  endOfMonth,
  getLocalTimeZone,
  getWeeksInMonth,
  isSameDay,
  isSameMonth,
  parseDate,
  startOfMonth,
  startOfWeek,
  toCalendar,
  today as todayIn,
} from "@internationalized/date"
import type { CalendarDate, Calendar as CalendarSystem } from "@internationalized/date"

import { bindable } from "./bindable.ts"
import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { onFormReset } from "./services/form-control.ts"
import { restInputs } from "./services/hidden-inputs.ts"

/** A day as `YYYY-MM-DD`, in the calendar the world's data is kept in (ISO 8601). */
export type IsoDate = string
/** A range of days, its first and its last, both in it. */
export interface DateRange {
  start: IsoDate
  end: IsoDate
}
/** How many days it chooses: one, a first and a last, or any number. */
export type CalendarMode = "single" | "range" | "multiple"
/**
 * What a calendar holds: a day, a range of days in `mode: "range"`, a list of days in
 * `mode: "multiple"`, or `null` for none.
 */
export type CalendarValue = IsoDate | DateRange | readonly IsoDate[] | null
/**
 * The value of one mode: a day or `null`, a range or `null`, or a list (empty for none). What
 * `value` and `onValueChange` are typed by, from the `mode` a root is given.
 */
export type CalendarValueOf<Mode extends CalendarMode | undefined> = Mode extends "range"
  ? DateRange | null
  : Mode extends "multiple"
    ? readonly IsoDate[]
    : IsoDate | null

export interface CalendarProps<Mode extends CalendarMode = CalendarMode> {
  id: string
  /**
   * One day; with `mode: "range"` a first and a last day; with `mode: "multiple"` a list of
   * days, in the order they were chosen. `null` (or an empty list) for none.
   */
  value?: CalendarValueOf<Mode> | undefined
  /** The value it starts with, when the caller does not hold `value`. Read once. */
  defaultValue?: CalendarValueOf<Mode> | undefined
  /** Heard as a day is about to be chosen: `details.cancel()` keeps the value as it was. */
  onValueChange?: ((value: CalendarValueOf<Mode>, details: ChangeDetails) => void) | undefined
  /**
   * Whether one day is chosen (the default), a first and a last (`"range"`), or any number
   * (`"multiple"`: a day pressed is added, and pressed again is taken away).
   */
  mode?: Mode | undefined
  /** With `mode: "multiple"`: the fewest days that can be left chosen. A press that would leave fewer does nothing. */
  minDays?: number | undefined
  /**
   * With `mode: "multiple"`: the most days that can be chosen. Once they are, the other days
   * are disabled until one is taken away.
   */
  maxDays?: number | undefined
  /**
   * How many months are shown side by side (1 by default): one selection and one grid for the
   * keys, which go from a month into the next. Each is drawn in `Calendar.Months`.
   */
  months?: number | undefined
  /**
   * With several `months`: whether Previous and Next turn them all (a page) rather than one
   * month. Off by default, as in react-day-picker.
   */
  pagedNavigation?: boolean | undefined
  /**
   * The month shown (the first of them, with several `months`), when the caller holds it: any
   * day of it. A caption's month and year menus, or a "today" button, set it.
   */
  month?: IsoDate | undefined
  /**
   * The month it starts on, when the caller does not hold `month`. Read once. Without it, the
   * month of `defaultFocusedValue`, of the value, or of today.
   */
  defaultMonth?: IsoDate | undefined
  /**
   * Heard as another month is about to be shown (the keys, the buttons, a day of another month
   * pressed): its first day. `details.cancel()` keeps the month as it was.
   */
  onMonthChange?: ((month: IsoDate, details: ChangeDetails) => void) | undefined
  /**
   * The day it opens on, focusable when Tab reaches the grid. It is also the month it opens on,
   * unless `month` or `defaultMonth` says another: then the stop for Tab is a chosen day of the
   * months shown, today, or their first day.
   */
  defaultFocusedValue?: IsoDate | undefined
  /**
   * The language and region its names, numbers, first day of the week and calendar follow
   * (`"en-US"`, `"fa-IR"`). Give it: a server does not know the reader's.
   */
  locale?: string | undefined
  /**
   * The calendar its months are laid out in, when it is not the Gregorian one: an instance
   * from `@internationalized/date` (`new PersianCalendar()`). Given, not found from the
   * locale: a page then carries only the calendars it uses.
   */
  calendarSystem?: CalendarSystem | undefined
  /** The first and the last day that can be chosen. */
  min?: IsoDate | undefined
  /** The last day that can be chosen. */
  max?: IsoDate | undefined
  /** Days that cannot be chosen, though they can be reached: a day off, a day taken. */
  isDateUnavailable?: ((date: IsoDate) => boolean) | undefined
  /** Disabled: no day can be chosen. */
  disabled?: boolean | undefined
  /** Shown as it is: the days can be moved through, and none can be chosen. */
  readOnly?: boolean | undefined
  /** Always six rows, so the calendar is one height in every month. */
  fixedWeeks?: boolean | undefined
  /**
   * The name its hidden input submits the value under: a day; the first and the last of a range,
   * as two entries; each day of a list.
   */
  name?: string | undefined
  /** The id of the form it belongs to, when it is not inside it. */
  form?: string | undefined
}

/** A day of the week, as a column's heading names it. */
export interface CalendarWeekday {
  /** Its place in the week as the locale orders it, from 0. */
  readonly index: number
  /** Its name as a column's heading (`"M"`, `"Mo"`), and in full (`"Monday"`). */
  readonly narrow: string
  readonly short: string
  readonly long: string
}

/** A day in the grid of a month shown. */
export interface CalendarDay {
  readonly date: IsoDate
  /** The day of the month as the locale writes it. */
  readonly label: string
  /** Not of the month it is drawn in: the days that fill its first and last weeks. */
  readonly outside: boolean
}

/** One of the months shown, as `Calendar.Months` gives it. */
export interface CalendarMonth {
  /** Its place among the months shown, from 0. */
  readonly index: number
  /** Its first day. */
  readonly month: IsoDate
  /** Its name as the locale writes it (`"March 2026"`). */
  readonly title: string
  readonly weekdays: readonly CalendarWeekday[]
  readonly weeks: readonly (readonly CalendarDay[])[]
}

/** What one of the months shown is drawn with: its own heading and grid. */
export interface CalendarMonthParts {
  readonly title: ReadonlySignal<string>
  readonly weeks: ReadonlySignal<readonly (readonly CalendarDay[])[]>
  /** Names the month; read out when it changes. */
  readonly heading: Part
  /** The `<table>` of its days. */
  readonly grid: Part
}

export interface Calendar {
  readonly value: ReadonlySignal<CalendarValue>
  readonly mode: ReadonlySignal<CalendarMode>
  /** The stop for Tab: the day focus is on, or goes to when Tab reaches the grid. */
  readonly focused: ReadonlySignal<IsoDate>
  /** The first day of the month shown (the first of them, with several). */
  readonly month: ReadonlySignal<IsoDate>
  /** The months shown, side by side. */
  readonly months: ReadonlySignal<readonly CalendarMonth[]>
  /** The month shown, as the locale names it (`"March 2026"`): the first, with several. */
  readonly title: ReadonlySignal<string>
  readonly weekdays: ReadonlySignal<readonly CalendarWeekday[]>
  /** The weeks of the month shown: the first, with several. */
  readonly weeks: ReadonlySignal<readonly (readonly CalendarDay[])[]>
  /** Shows the month a day is in, and puts the focusable day there. */
  goTo(date: IsoDate): void
  mount(): () => void
  readonly root: Part
  /** Names the month shown; read out when it changes. The first month's, with several. */
  readonly heading: Part
  readonly previous: Part
  readonly next: Part
  /** The `<table>` of days. The first month's, with several. */
  readonly grid: Part
  /** The heading and grid of one of the months shown, by its place: `monthAt(0).grid` is `grid`. */
  monthAt(index: number): CalendarMonthParts
  /** A column's heading, a `<th>`. */
  headCell(weekday: CalendarWeekday): Part
  /**
   * A day's `<td>`, and the button in it. `index` is the month it is drawn in, with several:
   * a day of the month before or after that is shown in its own month too is a copy there,
   * never the stop for Tab nor said to be chosen.
   */
  cell(date: IsoDate, index?: number): Part
  day(date: IsoDate, index?: number): Part
  /** The hidden input the value is submitted by, when it has a `name`. */
  readonly input: Part
}

const NOTHING = () => {}
const NONE = () => NOTHING
const GREGORIAN = new GregorianCalendar()
const NO_DAYS: readonly IsoDate[] = []

/** A day from what a caller wrote; nothing from what is no date. */
function read(iso: IsoDate | undefined | null): CalendarDate | undefined {
  if (!iso) return undefined
  try {
    return parseDate(iso)
  } catch {
    return undefined
  }
}

const iso = (date: CalendarDate): IsoDate => toCalendar(date, GREGORIAN).toString()

/** The days a value holds, in its order. */
function daysOf(of: CalendarValue | undefined): readonly IsoDate[] {
  if (!of) return NO_DAYS
  if (typeof of === "string") return [of]
  if (Array.isArray(of)) return of as readonly IsoDate[]
  const range = of as DateRange
  return [range.start, range.end]
}

const same = (a: CalendarValue, b: CalendarValue): boolean => {
  if (a === b) return true
  if (a === null || b === null || typeof a === "string" || typeof b === "string") return false
  if (Array.isArray(a) || Array.isArray(b)) {
    const one = daysOf(a)
    const other = daysOf(b)
    return (
      Array.isArray(a) === Array.isArray(b) &&
      one.length === other.length &&
      one.every((day, at) => day === other[at])
    )
  }
  const x = a as DateRange
  const y = b as DateRange
  return x.start === y.start && x.end === y.end
}

/**
 * A month of days to choose one from, a first and a last, or several; or a few months side by
 * side. It is laid out with the locale's names, numerals and first day of the week, in the
 * Gregorian calendar or the one it is given (Persian, Buddhist …), and every value in and out is
 * an ISO date, so nothing a caller stores depends on any of that.
 *
 * It is a grid in the ARIA sense: one day is the stop for Tab, the arrows move by a day and a
 * week (from one month shown into the next), Home and End to the week's ends, Page Up and Down
 * by a month, with Shift by a year.
 */
export function createCalendar(
  props: ReadonlySignal<CalendarProps>,
  around: DirectionAround = {}
): Calendar {
  const id = props.peek().id
  const locale = computed(() => props.get().locale ?? "en-US")
  const system = computed(() => props.get().calendarSystem ?? GREGORIAN)
  const mode = computed((): CalendarMode => props.get().mode ?? "single")
  const range = computed(() => mode.get() === "range")
  const multiple = computed(() => mode.get() === "multiple")
  const count = computed(() => Math.max(1, Math.floor(props.get().months ?? 1) || 1))
  // Read once: what it starts with, and what a form's reset puts back.
  const initial: CalendarValue =
    props.peek().defaultValue ?? (props.peek().mode === "multiple" ? NO_DAYS : null)
  const value = bindable<CalendarValue>({
    value: () => props.get().value,
    defaultValue: initial,
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
    equals: same,
  })
  const chosenDays = computed(() => daysOf(value.get()))
  const now = todayIn(getLocalTimeZone())

  /** A day in the calendar the locale lays its months out in. */
  const local = (date: IsoDate) => toCalendar(read(date) ?? now, system.get())
  /** The first day of a day's month, as an ISO date. */
  const monthOf = (date: IsoDate) => iso(startOfMonth(local(date)))

  const opening = iso(
    read(props.peek().defaultFocusedValue) ?? read(daysOf(value.peek())[0]) ?? now
  )
  // The day asked for last, by the keys, a press or a focus: the stop for Tab while it is shown.
  const asked = signal<IsoDate>(opening)
  const month = bindable<IsoDate>({
    value: () => {
      const given = props.get().month
      return given === undefined ? undefined : monthOf(given)
    },
    defaultValue: monthOf(props.peek().defaultMonth ?? opening),
    onChange: (next, by) => props.peek().onMonthChange?.(next, by),
  })
  // The same month while focus moves inside it: its weeks are not laid out again for a day.
  const shown = computed(
    () => startOfMonth(local(month.get())),
    (a, b) => a.calendar.identifier === b.calendar.identifier && a.compare(b) === 0
  )
  // A range being chosen: its first press, and where the pointer is since.
  const anchor = signal<IsoDate | undefined>(undefined)
  const hovered = signal<IsoDate | undefined>(undefined)
  // Each day's elements, by the month they are drawn in (-1 when no month is said).
  const elements = new Map<IsoDate, Map<number, HTMLElement>>()
  // The day the keys asked for, when its month is not in the page yet.
  let wanted: IsoDate | undefined
  let table: HTMLElement | undefined

  const min = computed(() => read(props.get().min))
  const max = computed(() => read(props.get().max))

  const off = (date: CalendarDate) => {
    const least = min.get()
    const most = max.get()
    return (
      Boolean(props.get().disabled) ||
      (least !== undefined && date.compare(least) < 0) ||
      (most !== undefined && date.compare(most) > 0)
    )
  }

  /** Which of the months shown a day is of, from `first`; -1 for none. */
  function placeOf(date: IsoDate, first: CalendarDate, many: number): number {
    const at = local(date)
    for (let index = 0; index < many; index++) {
      if (isSameMonth(at, first.add({ months: index }))) return index
    }
    return -1
  }

  /**
   * Whether a day drawn in the month at `index` is a copy: of another month that is shown too,
   * where it is the day itself.
   */
  function copyAt(date: IsoDate, index: number, first: CalendarDate = shown.get()): boolean {
    const place = placeOf(date, first, count.get())
    return place !== -1 && place !== index
  }

  const weekdays = computed(() => {
    // Any week names them: not the month's, so they are the same seven as the months turn.
    const begin = startOfWeek(now, locale.get())
    const name = (width: "narrow" | "short" | "long") =>
      new DateFormatter(locale.get(), { weekday: width, timeZone: "UTC" })
    return Array.from({ length: 7 }, (_, index): CalendarWeekday => {
      const date = begin.add({ days: index }).toDate("UTC")
      return {
        index,
        narrow: name("narrow").format(date),
        short: name("short").format(date),
        long: name("long").format(date),
      }
    })
  })

  const months = computed((): readonly CalendarMonth[] => {
    const first = shown.get()
    const named = new DateFormatter(locale.get(), {
      month: "long",
      year: "numeric",
      calendar: system.get().identifier,
      timeZone: "UTC",
    })
    const numeral = new DateFormatter(locale.get(), {
      day: "numeric",
      calendar: system.get().identifier,
      timeZone: "UTC",
    })
    const fixed = Boolean(props.get().fixedWeeks)
    const names = weekdays.get()
    return Array.from({ length: count.get() }, (_, index): CalendarMonth => {
      const each = first.add({ months: index })
      const rows = fixed ? 6 : getWeeksInMonth(each, locale.get())
      const begin = startOfWeek(each, locale.get())
      return {
        index,
        month: iso(each),
        title: named.format(each.toDate("UTC")),
        weekdays: names,
        weeks: Array.from({ length: rows }, (__, week) =>
          Array.from({ length: 7 }, (___, day): CalendarDay => {
            const date = begin.add({ days: week * 7 + day })
            return {
              date: iso(date),
              label: numeral.format(date.toDate("UTC")),
              outside: !isSameMonth(date, each),
            }
          })
        ),
      }
    })
  })

  /** What is chosen, with a range that is being chosen shown as far as the pointer. */
  const span = computed((): DateRange | undefined => {
    const from = anchor.get()
    if (from) {
      const to = hovered.get() ?? from
      return from <= to ? { start: from, end: to } : { start: to, end: from }
    }
    const chosen = value.get()
    if (chosen === null || Array.isArray(chosen)) return undefined
    return typeof chosen === "string" ? { start: chosen, end: chosen } : (chosen as DateRange)
  })

  // The stop for Tab: the day asked for while it is shown; else a chosen day shown, today, or
  // the first day of the months shown.
  const focused = computed(() => {
    const first = shown.get()
    const many = count.get()
    const want = asked.get()
    if (placeOf(want, first, many) !== -1) return want
    const chosen = chosenDays.get().find((day) => placeOf(day, first, many) !== -1)
    if (chosen) return chosen
    if (placeOf(iso(now), first, many) !== -1) return iso(now)
    return iso(first)
  })

  /** The first month to show for a day to be among the months shown, moving them least. */
  function firstFor(date: IsoDate): CalendarDate {
    const at = startOfMonth(local(date))
    const first = shown.peek()
    const last = count.peek() - 1
    if (at.compare(first) < 0) return at
    if (at.compare(first.add({ months: last })) > 0) return at.subtract({ months: last })
    return first
  }

  /** The element a day is focused on: where it is the day itself, not a copy. */
  function elementOf(date: IsoDate, first: CalendarDate): HTMLElement | undefined {
    for (const [index, element] of elements.get(date) ?? []) {
      if (index === -1 || !copyAt(date, index, first)) return element
    }
    return undefined
  }

  function show(date: IsoDate, focus: boolean, reason: string, event?: Event) {
    asked.set(date)
    const first = firstFor(date)
    if (iso(first) !== month.peek()) month.set(iso(first), details(reason, event))
    if (!focus) return
    // Decided by the month asked for: a caller who holds it answers in their own time.
    const element = elementOf(date, first)
    // In the page already, or once its month is drawn.
    if (element) element.focus({ preventScroll: true })
    else wanted = date
  }

  function move(from: IsoDate, to: CalendarDate, event: Event) {
    const least = min.peek()
    const most = max.peek()
    let target = to
    // No further than the first and the last day that can be chosen.
    if (least && target.compare(least) < 0) target = toCalendar(least, system.peek())
    if (most && target.compare(most) > 0) target = toCalendar(most, system.peek())
    event.preventDefault()
    if (iso(target) !== from) show(iso(target), true, "keyboard", event)
  }

  /** With `mode: "multiple"` and `maxDays` reached: a day not chosen cannot be. */
  const full = (date: IsoDate) => {
    const most = props.get().maxDays
    if (!multiple.get() || most === undefined) return false
    const chosen = chosenDays.get()
    return chosen.length >= most && !chosen.includes(date)
  }

  function choose(date: IsoDate, event: Event) {
    const day = read(date)
    if (!day || off(day) || props.peek().readOnly) return
    if (props.peek().isDateUnavailable?.(date)) return
    if (multiple.peek()) {
      const chosen = daysOf(value.peek())
      const { minDays, maxDays } = props.peek()
      if (chosen.includes(date)) {
        if (minDays !== undefined && chosen.length <= minDays) return
        value.set(
          chosen.filter((each) => each !== date),
          details("day-press", event)
        )
      } else {
        if (maxDays !== undefined && chosen.length >= maxDays) return
        value.set([...chosen, date], details("day-press", event))
      }
      return show(date, false, "day-press", event)
    }
    if (!range.peek()) {
      value.set(date, details("day-press", event))
      return show(date, false, "day-press", event)
    }
    const from = anchor.peek()
    if (from === undefined) {
      // The first of the two: nothing is chosen until the second.
      anchor.set(date)
      hovered.set(date)
      return show(date, false, "day-press", event)
    }
    anchor.set(undefined)
    hovered.set(undefined)
    value.set(
      from <= date ? { start: from, end: date } : { start: date, end: from },
      details("day-press", event)
    )
    show(date, false, "day-press", event)
  }

  const cells = new Map<string, Part>()
  const days = new Map<string, Part>()
  /** One part for a day however often it is asked for, and none kept for months gone by. */
  function kept(parts: Map<string, Part>, key: string, make: () => Part): Part {
    let part = parts.get(key)
    if (!part) {
      if (parts.size > 400) {
        const drawn = new Set(
          months.peek().flatMap((each) => each.weeks.flatMap((week) => week.map((d) => d.date)))
        )
        for (const name of parts.keys()) {
          const date = name.split("#")[0]!
          if (!drawn.has(date) && !elements.has(date)) parts.delete(name)
        }
      }
      parts.set(key, (part = make()))
    }
    return part
  }

  /** What a day's cell and its button both say of it, drawn in the month at `index`. */
  function state(date: IsoDate, index: number | undefined) {
    const day = read(date)
    const copy = index !== undefined && copyAt(date, index)
    const chosen = span.get()
    const inside = copy
      ? false
      : multiple.get()
        ? chosenDays.get().includes(date)
        : chosen !== undefined && date >= chosen.start && date <= chosen.end
    const unavailable = Boolean(props.get().isDateUnavailable?.(date))
    const disabled = day ? off(day) || full(date) : true
    const outside =
      day !== undefined && !isSameMonth(local(date), shown.get().add({ months: index ?? 0 }))
    return {
      copy,
      selected: inside,
      disabled,
      unavailable,
      attributes: {
        "data-selected": flag(inside),
        "data-today": flag(day !== undefined && isSameDay(day, now)),
        "data-outside-month": flag(outside),
        "data-disabled": flag(disabled),
        "data-unavailable": flag(unavailable),
        "data-range-start": flag(!copy && range.get() && chosen?.start === date),
        "data-range-end": flag(!copy && range.get() && chosen?.end === date),
      },
    }
  }

  const grids = computed(() =>
    Array.from({ length: count.get() }, (_, index) => gridId(index)).join(" ")
  )
  const gridId = (index: number) => (index === 0 ? `${id}-grid` : `${id}-grid-${index}`)
  const headingId = (index: number) => (index === 0 ? `${id}-heading` : `${id}-heading-${index}`)

  const step = (delta: 1 | -1): Part => ({
    props: computed(() => {
      const first = shown.get()
      const last = first.add({ months: count.get() - 1 })
      const least = min.get()
      const most = max.get()
      // Nothing to show that way: every day of the month before, or after, is out of reach.
      const none =
        Boolean(props.get().disabled) ||
        (delta === -1
          ? least !== undefined && first.subtract({ days: 1 }).compare(least) < 0
          : most !== undefined && endOfMonth(last).add({ days: 1 }).compare(most) > 0)
      return {
        type: "button",
        "aria-controls": grids.get(),
        disabled: none ? "" : undefined,
        "data-disabled": flag(none),
        onClick(event: Event) {
          const by = (props.peek().pagedNavigation ? count.peek() : 1) * delta
          const asking = details(delta === 1 ? "next" : "previous", event)
          month.set(iso(shown.peek().add({ months: by })), asking)
          // The day focus goes to turns with the months, so it is still among them.
          if (!asking.canceled) asked.set(iso(local(asked.peek()).add({ months: by })))
        },
      }
    }),
    attach: NONE,
  })

  const shownMonths = new Map<number, CalendarMonthParts>()
  function monthAt(index: number): CalendarMonthParts {
    let made = shownMonths.get(index)
    if (made) return made
    const entry = computed(() => months.get()[index])
    made = {
      title: computed(() => entry.get()?.title ?? ""),
      weeks: computed(() => entry.get()?.weeks ?? []),
      heading: {
        // Read out when it changes: the keys that turn the month say where they came to.
        props: computed(() => ({ id: headingId(index), "aria-live": "polite" })),
        attach: NONE,
      },
      grid: {
        props: computed(() => ({
          id: gridId(index),
          role: "grid",
          "aria-labelledby": headingId(index),
          "aria-multiselectable": range.get() || multiple.get() ? "true" : undefined,
          "aria-readonly": props.get().readOnly ? "true" : undefined,
          "aria-disabled": props.get().disabled ? "true" : undefined,
          // A range half chosen is given up when the pointer or Escape leaves it.
          onKeyDown(event: KeyboardEvent) {
            if (event.key !== "Escape" || anchor.peek() === undefined) return
            event.preventDefault()
            anchor.set(undefined)
            hovered.set(undefined)
          },
        })),
        attach(element) {
          table ??= element
          return () => {
            if (table === element) table = undefined
          }
        },
      },
    }
    shownMonths.set(index, made)
    return made
  }
  const firstMonth = monthAt(0)

  return {
    value,
    mode,
    focused,
    month,
    months,
    title: firstMonth.title,
    weekdays,
    weeks: firstMonth.weeks,
    goTo: (date) => show(date, false, "go-to"),
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        id,
        "data-disabled": flag(props.get().disabled),
        "data-readonly": flag(props.get().readOnly),
      })),
      attach: NONE,
    },
    heading: firstMonth.heading,
    previous: step(-1),
    next: step(1),
    grid: firstMonth.grid,
    monthAt,
    headCell(weekday) {
      return {
        props: computed(() => ({ scope: "col", abbr: weekday.long })),
        attach: NONE,
      }
    },
    cell(date, index) {
      return kept(cells, index === undefined ? date : `${date}#${index}`, () => ({
        props: computed(() => {
          const day = state(date, index)
          return {
            role: "gridcell",
            "aria-selected": day.selected ? "true" : undefined,
            "aria-disabled": day.disabled || day.unavailable ? "true" : undefined,
            ...day.attributes,
          }
        }),
        attach: NONE,
      }))
    },
    day(date, index) {
      return kept(days, index === undefined ? date : `${date}#${index}`, () => ({
        props: computed(() => {
          const day = state(date, index)
          const spoken = new DateFormatter(locale.get(), {
            dateStyle: "full",
            calendar: system.get().identifier,
            timeZone: "UTC",
          })
          const at = read(date)
          return {
            type: "button",
            // One day is the stop for Tab; the arrows go from there. A copy never is.
            tabindex: !day.copy && focused.get() === date ? "0" : "-1",
            "aria-label": at ? spoken.format(at.toDate("UTC")) : undefined,
            // Reached by the keys, and said to be out of reach: a day that could not be
            // focused would be a hole the arrows fall into.
            "aria-disabled": day.disabled || day.unavailable ? "true" : undefined,
            ...day.attributes,
            onClick(event: Event) {
              choose(date, event)
              // Pressed where it is a copy: focus goes to the day in its own month.
              if (index !== undefined && copyAt(date, index, shown.peek())) {
                show(date, true, "day-press", event)
              }
            },
            // The stop for Tab is where focus is. The month turns on the press that follows
            // (a day of another month pressed), not on the focus before it: the press then
            // lands on the day it was aimed at.
            onFocus() {
              asked.set(date)
            },
            onPointerEnter() {
              if (anchor.peek() !== undefined) hovered.set(date)
            },
            onKeyDown(event: KeyboardEvent) {
              const from = local(date)
              const rtl = table ? directionOf(table, around.direction) === "rtl" : false
              const along = rtl ? -1 : 1
              const by = event.shiftKey ? { years: 1 } : { months: 1 }
              if (event.key === "ArrowRight") move(date, from.add({ days: along }), event)
              else if (event.key === "ArrowLeft") move(date, from.subtract({ days: along }), event)
              else if (event.key === "ArrowDown") move(date, from.add({ weeks: 1 }), event)
              else if (event.key === "ArrowUp") move(date, from.subtract({ weeks: 1 }), event)
              else if (event.key === "Home") move(date, startOfWeek(from, locale.peek()), event)
              else if (event.key === "End")
                move(date, startOfWeek(from, locale.peek()).add({ days: 6 }), event)
              else if (event.key === "PageDown") move(date, from.add(by), event)
              else if (event.key === "PageUp") move(date, from.subtract(by), event)
              else return
              // A range being chosen follows the keys as it follows the pointer.
              if (anchor.peek() !== undefined) hovered.set(asked.peek())
            },
          }
        }),
        attach(element) {
          const place = index ?? -1
          let drawn = elements.get(date)
          if (!drawn) elements.set(date, (drawn = new Map()))
          drawn.set(place, element)
          if (wanted === date && (index === undefined || !copyAt(date, index, shown.peek()))) {
            wanted = undefined
            element.focus({ preventScroll: true })
          }
          return () => {
            if (drawn.get(place) !== element) return
            drawn.delete(place)
            if (drawn.size === 0 && elements.get(date) === drawn) elements.delete(date)
          }
        },
      }))
    },
    input: {
      props: computed(() => {
        const chosen = chosenDays.get()
        // A day, empty while there is none; a range or a list sends nothing while empty.
        const many = range.get() || multiple.get()
        return {
          type: "hidden",
          name: many && chosen.length === 0 ? undefined : props.get().name,
          form: props.get().form,
          value: chosen[0] ?? "",
          disabled: flag(props.get().disabled),
        }
      }),
      attach(element) {
        // A form's reset puts the first value back.
        const stopReset = onFormReset(element, (event) => {
          anchor.set(undefined)
          hovered.set(undefined)
          value.set(initial, details("form-reset", event))
        })
        // One input for each day after the first: the core's own to draw, after it.
        const stopRest = restInputs(element, () => ({
          rest: chosenDays.get().slice(1),
          name: props.get().name,
          form: props.get().form,
          disabled: Boolean(props.get().disabled),
        }))
        return () => {
          stopReset()
          stopRest()
        }
      },
    },
  }
}
