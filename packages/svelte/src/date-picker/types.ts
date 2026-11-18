import type { DatePickerProps } from "@kirana-ui/core/date-picker"

import type { PartAttributes, Renderless, StateFor } from "../types.ts"

// Its parts are a date field's, a popover's and a calendar's.
export type {
  CellProps,
  DayProps,
  GridProps,
  HeadCellProps,
  HeadingProps,
  NextProps,
  PreviousProps,
  WeekdaysProps,
  WeeksProps,
} from "../calendar/types.ts"
export type { InputProps, SegmentProps, SegmentsProps } from "../date-field/types.ts"
export type { PopupProps, PortalProps, PositionerProps, TriggerProps } from "../popover/types.ts"

/**
 * A date field, and a calendar in a popover, with one value between them. It draws nothing.
 * `bind:value` is the day, `bind:open` whether the calendar shows.
 */
export type RootProps = Renderless<DatePickerProps>

/** The typed date: what holds its segments and its hidden input. */
export type FieldProps = PartAttributes<"div", StateFor<"datePicker", "field">>

/** The calendar: what holds its heading, its buttons and its grid. */
export type CalendarProps = PartAttributes<"div", StateFor<"datePicker", "calendar">>
