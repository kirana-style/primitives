import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createDatePicker } from "@kirana-ui/core/date-picker"
import type { DatePicker as Controller, DatePickerProps } from "@kirana-ui/core/date-picker"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { Calendar, CalendarContext } from "./calendar.tsx"
import { DateField, DateFieldContext } from "./date-field.tsx"
import { DirectionContext } from "./direction-context.ts"
import { Popover, PopoverContext } from "./popover.tsx"
import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["datePicker"]

// The parts it takes from the components it is made of.
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
} from "./calendar.tsx"
export type { InputProps, SegmentProps, SegmentsProps } from "./date-field.tsx"
export type { PopupProps, PortalProps, PositionerProps, TriggerProps } from "./popover.tsx"

const Context = createContext<Controller | null>(null)

function useDatePicker(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A DatePicker part must be inside <DatePicker.Root>")
  return made
}

export type RootProps = Omit<DatePickerProps, "id"> & { id?: string; children?: JSX.Element }

/** A date field, and a calendar in a popover, with one value between them. It draws nothing. */
function Root(props: RootProps): JSX.Element {
  const generated = createUniqueId()
  const made = controller(
    within(createDatePicker, { direction: useContext(DirectionContext) ?? undefined }),
    () => ({
      id: props.id ?? generated,
      value: props.value,
      defaultValue: props.defaultValue,
      open: props.open,
      defaultOpen: props.defaultOpen,
      locale: props.locale,
      min: props.min,
      max: props.max,
      isDateUnavailable: props.isDateUnavailable,
      calendarSystem: props.calendarSystem,
      fixedWeeks: props.fixedWeeks,
      months: props.months,
      pagedNavigation: props.pagedNavigation,
      month: props.month,
      defaultMonth: props.defaultMonth,
      placeholders: props.placeholders,
      disabled: props.disabled,
      readOnly: props.readOnly,
      required: props.required,
      name: props.name,
      form: props.form,
      onValueChange: (value: string | null, details: ChangeDetails) =>
        props.onValueChange?.(value, details),
      onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
      onMonthChange: (month: string, details: ChangeDetails) =>
        props.onMonthChange?.(month, details),
    })
  )
  return (
    <Context value={made}>
      <DateFieldContext value={made.field}>
        <PopoverContext value={made.popover}>
          <CalendarContext value={made.calendar}>{props.children}</CalendarContext>
        </PopoverContext>
      </DateFieldContext>
    </Context>
  )
}

export type FieldProps = PartComponentProps<"div", StateOf<Parts["field"]>>
export type CalendarProps = PartComponentProps<"div", StateOf<Parts["calendar"]>>

export const DatePicker = {
  Root,
  /** The typed date: what holds its segments and its hidden input. */
  Field: (props: FieldProps) => <Part of={useDatePicker().field.root} tag="div" {...props} />,
  Segments: DateField.Segments,
  Segment: DateField.Segment,
  Input: DateField.Input,
  Trigger: Popover.Trigger,
  Portal: Popover.Portal,
  Positioner: Popover.Positioner,
  Popup: Popover.Popup,
  /** The calendar: what holds its heading, its buttons and its grid. */
  Calendar: (props: CalendarProps) => (
    <Part of={useDatePicker().calendar.root} tag="div" {...props} />
  ),
  Heading: Calendar.Heading,
  Previous: Calendar.Previous,
  Next: Calendar.Next,
  Months: Calendar.Months,
  Grid: Calendar.Grid,
  Weekdays: Calendar.Weekdays,
  HeadCell: Calendar.HeadCell,
  Weeks: Calendar.Weeks,
  Cell: Calendar.Cell,
  Day: Calendar.Day,
}
