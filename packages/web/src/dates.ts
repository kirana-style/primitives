import type {
  Calendar,
  CalendarDay,
  CalendarMonth,
  CalendarWeekday,
} from "@kirana-ui/core/calendar"
import type { DateField, DateFieldSegment } from "@kirana-ui/core/date-field"

import { entryAround } from "./runtime.ts"
import type { Drawn, Each } from "./runtime.ts"

type Parts<Controller> = Record<
  string,
  (controller: Controller, element: HTMLElement) => Drawn["part"] | Drawn | undefined
>
type Lists<Controller> = Record<
  string,
  (controller: Controller, around: unknown, template: HTMLElement) => Each
>

/**
 * A date field's parts and its list, for a component that is one or holds one. `of` is given
 * the element a part is written on, for a component of several fields.
 */
export function fieldParts<Controller>(
  of: (controller: Controller, element: HTMLElement) => DateField
) {
  const parts: Parts<Controller> = {
    segment(controller, element) {
      const segment = entryAround<DateFieldSegment>(element)
      if (!segment) return undefined
      const { part, text } = of(controller, element).segment(segment)
      return { part, text }
    },
    input: (controller, element) => of(controller, element).input,
  }
  const lists: Lists<Controller> = {
    segments: (controller, _around, template) => ({
      entries: of(controller, template).segments,
      key: (segment: DateFieldSegment) => `${segment.index}-${segment.type}`,
    }),
  }
  return { parts, lists }
}

const isMonth = (entry: unknown) =>
  typeof entry === "object" && entry !== null && "weeks" in entry && "title" in entry

/** The month a part is written in, in a `months` template: its place among those shown. */
const monthAround = (element: Node) => entryAround<CalendarMonth>(element, isMonth)?.index

/** A calendar's parts and its lists, for a component that is one or holds one. */
export function calendarParts<Controller>(of: (controller: Controller) => Calendar) {
  const date = (element: HTMLElement) => entryAround<CalendarDay>(element)?.date
  const month = (controller: Controller, element: HTMLElement) =>
    of(controller).monthAt(monthAround(element) ?? 0)
  const parts: Parts<Controller> = {
    heading(controller, element) {
      const shown = month(controller, element)
      return { part: shown.heading, text: shown.title }
    },
    previous: (controller) => of(controller).previous,
    next: (controller) => of(controller).next,
    grid: (controller, element) => month(controller, element).grid,
    "head-cell"(controller, element) {
      const weekday = entryAround<CalendarWeekday>(element)
      return weekday && of(controller).headCell(weekday)
    },
    cell(controller, element) {
      const day = date(element)
      return day === undefined ? undefined : of(controller).cell(day, monthAround(element))
    },
    day(controller, element) {
      const day = date(element)
      return day === undefined ? undefined : of(controller).day(day, monthAround(element))
    },
  }
  const lists: Lists<Controller> = {
    weekdays: (controller) => ({
      entries: of(controller).weekdays,
      key: (weekday: CalendarWeekday) => weekday.index,
    }),
    months: (controller) => ({
      entries: of(controller).months,
      key: (shown: CalendarMonth) => shown.index,
      values: (shown: CalendarMonth) => ({
        index: shown.index,
        month: shown.month,
        title: shown.title,
      }),
    }),
    // Written in a month's copy: that month's weeks; else the first month's.
    weeks: (controller, around) => ({
      entries: isMonth(around)
        ? of(controller).monthAt((around as CalendarMonth).index).weeks
        : of(controller).weeks,
      key: (week: readonly CalendarDay[]) => week[0]!.date,
      values: () => ({}),
    }),
    // Written in a week's row: that week's days, each with the place of its month
    // (`{monthIndex}`), for a page that names a day where it is drawn twice.
    days(controller, week) {
      const row = (week as readonly CalendarDay[] | undefined) ?? []
      const shown = of(controller)
        .months.peek()
        .find((each) => each.weeks.includes(row))
      return {
        entries: row,
        key: (day: CalendarDay) => day.date,
        values: (day: CalendarDay) => ({ ...day, monthIndex: shown?.index ?? 0 }),
      }
    },
  }
  return { parts, lists }
}

/**
 * A calendar's value as an attribute writes it: a day, or several with commas between (a
 * range's first and last, or a list's days).
 */
export function days(given: unknown, mode?: unknown): unknown {
  const list = typeof given === "string" && given.includes(",") ? given.split(",") : given
  if (mode === "range" && Array.isArray(list)) return { start: list[0], end: list[1] ?? list[0] }
  if (mode === "multiple" && typeof list === "string") return list === "" ? [] : [list]
  return list
}
