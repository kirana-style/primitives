import type {
  CalendarDay,
  CalendarMode,
  CalendarMonth,
  CalendarProps,
  CalendarWeekday,
} from "@kirana-ui/core/calendar"
import type { Snippet } from "svelte"

import type { Controlled, HeldText, PartAttributes, StateFor } from "../types.ts"

/**
 * `bind:value`, and `bind:month` (the first day of the month shown). `value` and
 * `onValueChange` are typed by `mode`: a day, a range, or a list of days.
 */
export type RootProps<Mode extends CalendarMode = "single"> = PartAttributes<
  "div",
  StateFor<"calendar", "root">,
  Controlled<CalendarProps<Mode>>
>

/** Names the month shown, unless it is given something else to say. */
export type HeadingProps = PartAttributes<"div", StateFor<"calendar", "heading">, unknown, HeldText>

export type PreviousProps = PartAttributes<"button", StateFor<"calendar", "previous">>

export type NextProps = PartAttributes<"button", StateFor<"calendar", "next">>

export type GridProps = PartAttributes<"table", StateFor<"calendar", "grid">>

/** Draws nothing itself: its snippet once for each day of the week, in the locale's order. */
export type WeekdaysProps = { children: Snippet<[CalendarWeekday]> }

export type HeadCellProps = PartAttributes<
  "th",
  StateFor<"calendar", "headCell">,
  {
    /** The day of the week it names, as `<Calendar.Weekdays>` gave it. */
    weekday: CalendarWeekday
  }
>

/**
 * Draws nothing itself: its snippet once for each month shown, side by side. The parts inside
 * each are that month's. Left out for one month.
 */
export type MonthsProps = { children: Snippet<[CalendarMonth]> }

/** Draws nothing itself: its snippet once for each week of the month shown. */
export type WeeksProps = { children: Snippet<[readonly CalendarDay[]]> }

export type CellProps = PartAttributes<
  "td",
  StateFor<"calendar", "cell">,
  {
    /** The day, as its week gave it (`day.date`). */
    date: string
  }
>

export type DayProps = PartAttributes<
  "button",
  StateFor<"calendar", "day">,
  {
    /** The day, as its week gave it (`day.date`). Left out, its `<Calendar.Cell>`'s. */
    date?: string | undefined
  }
>

/** The hidden input the value is submitted by, when the root has a `name`. */
export type InputProps = PartAttributes<"input", StateFor<"calendar", "input">>
