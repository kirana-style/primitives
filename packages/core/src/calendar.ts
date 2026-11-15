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

/** A day as `YYYY-MM-DD`, in the calendar the world's data is kept in (ISO 8601). */
export type IsoDate = string
export interface DateRange {
  start: IsoDate
  end: IsoDate
}
export type CalendarValue = IsoDate | DateRange | null

export interface CalendarProps {
  id: string
  /** One day, or with `mode: "range"` a first and a last day; `null` for none. */
  value?: CalendarValue | undefined
  defaultValue?: CalendarValue | undefined
  onValueChange?: ((value: CalendarValue, details: ChangeDetails) => void) | undefined
  /** Whether one day is chosen (the default) or a first and a last. */
  mode?: "single" | "range" | undefined
  /** The day it opens on, when it has no value: its month is the one shown. */
  defaultFocusedValue?: IsoDate | undefined
  /** Heard when another month is shown: its first day. */
  onMonthChange?: ((month: IsoDate) => void) | undefined
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
  max?: IsoDate | undefined
  /** Days that cannot be chosen, though they can be reached: a day off, a day taken. */
  isDateUnavailable?: ((date: IsoDate) => boolean) | undefined
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  /** Always six rows, so the calendar is one height in every month. */
  fixedWeeks?: boolean | undefined
}

export interface CalendarWeekday {
  /** Its place in the week as the locale orders it, from 0. */
  readonly index: number
  /** Its name as a column's heading (`"M"`, `"Mo"`), and in full (`"Monday"`). */
  readonly narrow: string
  readonly short: string
  readonly long: string
}

export interface CalendarDay {
  readonly date: IsoDate
  /** The day of the month as the locale writes it. */
  readonly label: string
  /** Not of the month shown: the days that fill its first and last weeks. */
  readonly outside: boolean
}

export interface Calendar {
  readonly value: ReadonlySignal<CalendarValue>
  /** The day focus is on, or would be: the month shown is its month. */
  readonly focused: ReadonlySignal<IsoDate>
  /** The month shown, as the locale names it (`"March 2026"`). */
  readonly title: ReadonlySignal<string>
  readonly weekdays: ReadonlySignal<readonly CalendarWeekday[]>
  readonly weeks: ReadonlySignal<readonly (readonly CalendarDay[])[]>
  /** Shows the month a day is in, and puts the focusable day there. */
  goTo(date: IsoDate): void
  mount(): () => void
  readonly root: Part
  /** Names the month shown; read out when it changes. */
  readonly heading: Part
  readonly previous: Part
  readonly next: Part
  /** The `<table>` of days. */
  readonly grid: Part
  /** A column's heading, a `<th>`. */
  headCell(weekday: CalendarWeekday): Part
  /** A day's `<td>`, and the button in it. */
  cell(date: IsoDate): Part
  day(date: IsoDate): Part
}

const NOTHING = () => {}
const NONE = () => NOTHING
const GREGORIAN = new GregorianCalendar()

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

/**
 * A month of days to choose one from, or a first and a last. It is laid out with the locale's
 * names, numerals and first day of the week, in the Gregorian calendar or the one it is given
 * (Persian, Buddhist …), and every value in and out is an ISO date, so nothing a caller stores
 * depends on any of that.
 *
 * It is a grid in the ARIA sense: one day is the stop for Tab, the arrows move by a day and a
 * week, Home and End to the week's ends, Page Up and Down by a month, with Shift by a year.
 */
export function createCalendar(
  props: ReadonlySignal<CalendarProps>,
  around: DirectionAround = {}
): Calendar {
  const id = props.peek().id
  const locale = computed(() => props.get().locale ?? "en-US")
  const system = computed(() => props.get().calendarSystem ?? GREGORIAN)
  const range = computed(() => props.get().mode === "range")
  const value = bindable<CalendarValue>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? null,
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
    equals: (a, b) =>
      a === b ||
      (typeof a === "object" &&
        typeof b === "object" &&
        a !== null &&
        b !== null &&
        a.start === b.start &&
        a.end === b.end),
  })
  const first = (of: CalendarValue) => (typeof of === "string" ? of : (of?.start ?? undefined))
  const now = todayIn(getLocalTimeZone())
  const focused = signal<IsoDate>(
    iso(read(props.peek().defaultFocusedValue) ?? read(first(value.peek())) ?? now)
  )
  // A range being chosen: its first press, and where the pointer is since.
  const anchor = signal<IsoDate | undefined>(undefined)
  const hovered = signal<IsoDate | undefined>(undefined)
  const elements = new Map<IsoDate, HTMLElement>()
  // The day the keys asked for, when its month is not in the page yet.
  let wanted: IsoDate | undefined
  let table: HTMLElement | undefined

  /** A day in the calendar the locale lays its months out in. */
  const local = (date: IsoDate) => toCalendar(read(date) ?? now, system.get())
  // The same month while focus moves inside it: its weeks are not laid out again for a day.
  const month = computed(
    () => startOfMonth(local(focused.get())),
    (a, b) => a.calendar.identifier === b.calendar.identifier && a.compare(b) === 0
  )
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

  const title = computed(() =>
    new DateFormatter(locale.get(), {
      month: "long",
      year: "numeric",
      calendar: system.get().identifier,
      timeZone: "UTC",
    }).format(month.get().toDate("UTC"))
  )

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

  const weeks = computed(() => {
    const shown = month.get()
    const numeral = new DateFormatter(locale.get(), {
      day: "numeric",
      calendar: system.get().identifier,
      timeZone: "UTC",
    })
    const rows = props.get().fixedWeeks ? 6 : getWeeksInMonth(shown, locale.get())
    const begin = startOfWeek(shown, locale.get())
    return Array.from({ length: rows }, (_, week) =>
      Array.from({ length: 7 }, (__, day): CalendarDay => {
        const date = begin.add({ days: week * 7 + day })
        return {
          date: iso(date),
          label: numeral.format(date.toDate("UTC")),
          outside: !isSameMonth(date, shown),
        }
      })
    )
  })

  /** What is chosen, with a range that is being chosen shown as far as the pointer. */
  const span = computed((): DateRange | undefined => {
    const from = anchor.get()
    if (from) {
      const to = hovered.get() ?? from
      return from <= to ? { start: from, end: to } : { start: to, end: from }
    }
    const chosen = value.get()
    if (chosen === null) return undefined
    return typeof chosen === "string" ? { start: chosen, end: chosen } : chosen
  })

  function show(date: IsoDate, focus: boolean) {
    const before = iso(month.peek())
    focused.set(date)
    const after = iso(month.peek())
    if (after !== before) props.peek().onMonthChange?.(after)
    if (!focus) return
    const element = elements.get(date)
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
    if (iso(target) !== from) show(iso(target), true)
  }

  function choose(date: IsoDate, event: Event) {
    const day = read(date)
    if (!day || off(day) || props.peek().readOnly) return
    if (props.peek().isDateUnavailable?.(date)) return
    if (!range.peek()) {
      value.set(date, details("day-press", event))
      return show(date, false)
    }
    const from = anchor.peek()
    if (from === undefined) {
      // The first of the two: nothing is chosen until the second.
      anchor.set(date)
      hovered.set(date)
      return show(date, false)
    }
    anchor.set(undefined)
    hovered.set(undefined)
    value.set(
      from <= date ? { start: from, end: date } : { start: date, end: from },
      details("day-press", event)
    )
    show(date, false)
  }

  const cells = new Map<IsoDate, Part>()
  const days = new Map<IsoDate, Part>()
  /** One part for a day however often it is asked for, and none kept for months gone by. */
  function kept(parts: Map<IsoDate, Part>, date: IsoDate, make: () => Part): Part {
    let part = parts.get(date)
    if (!part) {
      if (parts.size > 400) {
        const drawn = new Set(weeks.peek().flatMap((week) => week.map((each) => each.date)))
        for (const key of parts.keys()) if (!drawn.has(key) && !elements.has(key)) parts.delete(key)
      }
      parts.set(date, (part = make()))
    }
    return part
  }

  /** What a day's cell and its button both say of it. */
  function state(date: IsoDate) {
    const day = read(date)
    const chosen = span.get()
    const inside = chosen !== undefined && date >= chosen.start && date <= chosen.end
    const unavailable = Boolean(props.get().isDateUnavailable?.(date))
    return {
      selected: inside,
      disabled: day ? off(day) : true,
      unavailable,
      attributes: {
        "data-selected": flag(inside),
        "data-today": flag(day !== undefined && isSameDay(day, now)),
        "data-outside-month": flag(day !== undefined && !isSameMonth(local(date), month.get())),
        "data-disabled": flag(day ? off(day) : true),
        "data-unavailable": flag(unavailable),
        "data-range-start": flag(range.get() && chosen?.start === date),
        "data-range-end": flag(range.get() && chosen?.end === date),
      },
    }
  }

  const step = (delta: 1 | -1): Part => ({
    props: computed(() => {
      const shown = month.get()
      const least = min.get()
      const most = max.get()
      // Nothing to show that way: every day of the month before, or after, is out of reach.
      const none =
        Boolean(props.get().disabled) ||
        (delta === -1
          ? least !== undefined && shown.subtract({ days: 1 }).compare(least) < 0
          : most !== undefined && endOfMonth(shown).add({ days: 1 }).compare(most) > 0)
      return {
        type: "button",
        "aria-controls": `${id}-grid`,
        disabled: none ? "" : undefined,
        "data-disabled": flag(none),
        onClick() {
          const to = local(focused.peek()).add({ months: delta })
          show(iso(to), false)
        },
      }
    }),
    attach: NONE,
  })

  return {
    value,
    focused,
    title,
    weekdays,
    weeks,
    goTo: (date) => show(date, false),
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        id,
        "data-disabled": flag(props.get().disabled),
        "data-readonly": flag(props.get().readOnly),
      })),
      attach: NONE,
    },
    heading: {
      // Read out when it changes: the keys that turn the month say where they came to.
      props: computed(() => ({ id: `${id}-heading`, "aria-live": "polite" })),
      attach: NONE,
    },
    previous: step(-1),
    next: step(1),
    grid: {
      props: computed(() => ({
        id: `${id}-grid`,
        role: "grid",
        "aria-labelledby": `${id}-heading`,
        "aria-multiselectable": range.get() ? "true" : undefined,
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
        table = element
        return () => {
          if (table === element) table = undefined
        }
      },
    },
    headCell(weekday) {
      return {
        props: computed(() => ({ scope: "col", abbr: weekday.long })),
        attach: NONE,
      }
    },
    cell(date) {
      return kept(cells, date, () => ({
        props: computed(() => {
          const day = state(date)
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
    day(date) {
      return kept(days, date, () => ({
        props: computed(() => {
          const day = state(date)
          const full = new DateFormatter(locale.get(), {
            dateStyle: "full",
            calendar: system.get().identifier,
            timeZone: "UTC",
          })
          const at = read(date)
          return {
            type: "button",
            // One day is the stop for Tab; the arrows go from there.
            tabindex: focused.get() === date ? "0" : "-1",
            "aria-label": at ? full.format(at.toDate("UTC")) : undefined,
            // Reached by the keys, and said to be out of reach: a day that could not be
            // focused would be a hole the arrows fall into.
            "aria-disabled": day.disabled || day.unavailable ? "true" : undefined,
            ...day.attributes,
            onClick: (event: Event) => choose(date, event),
            onFocus() {
              if (focused.peek() !== date) show(date, false)
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
              if (anchor.peek() !== undefined) hovered.set(focused.peek())
            },
          }
        }),
        attach(element) {
          elements.set(date, element)
          if (wanted === date) {
            wanted = undefined
            element.focus({ preventScroll: true })
          }
          return () => {
            if (elements.get(date) === element) elements.delete(date)
          }
        },
      }))
    },
  }
}
