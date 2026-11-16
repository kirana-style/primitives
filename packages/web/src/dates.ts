import type { Calendar, CalendarDay, CalendarWeekday } from "@kirana-ui/core/calendar"
import type { DateField, DateFieldSegment } from "@kirana-ui/core/date-field"

import { entryAround } from "./runtime.ts"
import type { Drawn, Each } from "./runtime.ts"

type Parts<Controller> = Record<
  string,
  (controller: Controller, element: HTMLElement) => Drawn["part"] | Drawn | undefined
>
type Lists<Controller> = Record<string, (controller: Controller, around: unknown) => Each>

/** A date field's parts and its list, for a component that is one or holds one. */
export function fieldParts<Controller>(of: (controller: Controller) => DateField) {
  const parts: Parts<Controller> = {
    segment(controller, element) {
      const segment = entryAround<DateFieldSegment>(element)
      if (!segment) return undefined
      const { part, text } = of(controller).segment(segment)
      return { part, text }
    },
    input: (controller) => of(controller).input,
  }
  const lists: Lists<Controller> = {
    segments: (controller) => ({
      entries: of(controller).segments,
      key: (segment: DateFieldSegment) => `${segment.index}-${segment.type}`,
    }),
  }
  return { parts, lists }
}

/** A calendar's parts and its lists, for a component that is one or holds one. */
export function calendarParts<Controller>(of: (controller: Controller) => Calendar) {
  const date = (element: HTMLElement) => entryAround<CalendarDay>(element)?.date
  const parts: Parts<Controller> = {
    heading: (controller) => ({ part: of(controller).heading, text: of(controller).title }),
    previous: (controller) => of(controller).previous,
    next: (controller) => of(controller).next,
    grid: (controller) => of(controller).grid,
    "head-cell"(controller, element) {
      const weekday = entryAround<CalendarWeekday>(element)
      return weekday && of(controller).headCell(weekday)
    },
    cell(controller, element) {
      const day = date(element)
      return day === undefined ? undefined : of(controller).cell(day)
    },
    day(controller, element) {
      const day = date(element)
      return day === undefined ? undefined : of(controller).day(day)
    },
  }
  const lists: Lists<Controller> = {
    weekdays: (controller) => ({
      entries: of(controller).weekdays,
      key: (weekday: CalendarWeekday) => weekday.index,
    }),
    weeks: (controller) => ({
      entries: of(controller).weeks,
      key: (week: readonly CalendarDay[]) => week[0]!.date,
      values: () => ({}),
    }),
    // Written in a week's row: that week's days.
    days: (_controller, week) => ({
      entries: (week as readonly CalendarDay[] | undefined) ?? [],
      key: (day: CalendarDay) => day.date,
    }),
  }
  return { parts, lists }
}

/** A calendar's value as an attribute writes it: a day, or several with commas between. */
export const days = (given: unknown): unknown =>
  typeof given === "string" && given.includes(",") ? given.split(",") : given
