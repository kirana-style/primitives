import type { CalendarDay, CalendarProps, CalendarWeekday } from "@kirana-ui/core/calendar"
import type { Snippet } from "svelte"

import type { Controlled, HeldText, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<
  "div",
  StateFor<"calendar", "root">,
  Controlled<CalendarProps>
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
    /** The day, as its week gave it (`day.date`). */
    date: string
  }
>
