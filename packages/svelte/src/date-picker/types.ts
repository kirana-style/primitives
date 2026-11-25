import type { DatePickerMode, DatePickerProps, DatePickerRange } from "@kirana-ui/core/date-picker"

import type { PartAttributes, Renderless, StateFor } from "../types.ts"

// Its parts are a date field's, a popover's and a calendar's.
export type {
  CellProps,
  DayProps,
  GridProps,
  HeadCellProps,
  HeadingProps,
  MonthsProps,
  NextProps,
  PreviousProps,
  WeekdaysProps,
  WeeksProps,
} from "../calendar/types.ts"
export type { InputProps, SegmentProps, SegmentsProps } from "../date-field/types.ts"
export type { PopupProps, PortalProps, PositionerProps, TriggerProps } from "../popover/types.ts"

/**
 * A date field, and a calendar in a popover, with one value between them. It draws nothing.
 * `bind:value` is the day (or the range, with `mode="range"`), `bind:open` whether the calendar
 * shows, `bind:month` the first day of the month it shows. `value` and `onValueChange` are typed
 * by `mode`.
 */
export type RootProps<Mode extends DatePickerMode = "single"> = Renderless<DatePickerProps<Mode>>

/**
 * The typed date: what holds its segments and its hidden input. With `mode="range"` there are
 * two, `range="start"` and `range="end"`.
 */
export type FieldProps = PartAttributes<
  "div",
  StateFor<"datePicker", "field">,
  {
    /**
     * With `mode="range"`: which day of the range it is typed in, the first (`"start"`, the
     * default) or the last (`"end"`).
     */
    range?: "start" | "end" | undefined
  }
>

/** Empties the value, and gives focus to the field. Disabled while there is none. */
export type ClearProps = PartAttributes<"button", StateFor<"datePicker", "clear">>

/** Makes the value the one it is given: pressed while it is. */
export type PresetProps = PartAttributes<
  "button",
  StateFor<"datePicker", "preset">,
  {
    /** The value its press gives: a day, or with `mode="range"` a range. */
    value: string | DatePickerRange
  }
>

/** The calendar: what holds its heading, its buttons and its grid. */
export type CalendarProps = PartAttributes<"div", StateFor<"datePicker", "calendar">>
