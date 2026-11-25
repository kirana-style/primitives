import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createDatePicker } from "@kirana-ui/core/date-picker"
import type {
  DatePicker as Controller,
  DatePickerMode,
  DatePickerProps,
  DatePickerRange,
  DatePickerValue,
  DatePickerValueOf,
} from "@kirana-ui/core/date-picker"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { Calendar, CalendarContext } from "./calendar.tsx"
import { DateField, DateFieldContext } from "./date-field.tsx"
import { DirectionContext } from "./direction-context.ts"
import { Popover, PopoverContext } from "./popover.tsx"
import { Part, controller, split } from "./runtime.tsx"
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

/** `value` and `onValueChange` are typed by `mode`: a day, or a range. */
export type RootProps<Mode extends DatePickerMode = "single"> = Omit<
  DatePickerProps<Mode>,
  "id"
> & { id?: string; children?: JSX.Element }

/** A date field, and a calendar in a popover, with one value between them. It draws nothing. */
function Root<Mode extends DatePickerMode = "single">(props: RootProps<Mode>): JSX.Element {
  const generated = createUniqueId()
  const made = controller(
    within(createDatePicker, { direction: useContext(DirectionContext) ?? undefined }),
    () => ({
      id: props.id ?? generated,
      // The core holds either mode's value; the caller's is its mode's.
      value: props.value as DatePickerValue | undefined,
      defaultValue: props.defaultValue as DatePickerValue | undefined,
      mode: props.mode,
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
      onValueChange: (value: DatePickerValue, details: ChangeDetails) =>
        props.onValueChange?.(value as DatePickerValueOf<Mode>, details),
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

export type FieldProps = PartComponentProps<
  "div",
  StateOf<Parts["field"]>,
  {
    /**
     * With `mode="range"`: which day of the range it is typed in, the first (`"start"`, the
     * default) or the last (`"end"`).
     */
    range?: "start" | "end" | undefined
  }
>
export type CalendarProps = PartComponentProps<"div", StateOf<Parts["calendar"]>>
export type ClearProps = PartComponentProps<"button", StateOf<Parts["clear"]>>
export type PresetProps = PartComponentProps<
  "button",
  StateOf<Parts["preset"]>,
  {
    /** The value its press gives: a day, or with `mode="range"` a range. */
    value: string | DatePickerRange
  }
>

/**
 * The typed date: what holds its segments and its hidden input. With `mode="range"` there are
 * two, `range="start"` and `range="end"`, each giving its own parts their field.
 */
function Field(props: FieldProps): JSX.Element {
  const [local, rest] = split(props, ["range"])
  const picker = useDatePicker()
  // Its end is the one it was drawn for.
  const field = (local.range === "end" && picker.endField) || picker.field
  return (
    <DateFieldContext value={field}>
      <Part of={field.root} tag="div" {...rest} />
    </DateFieldContext>
  )
}

/** Makes the value the one it is given: pressed while it is. */
function Preset(props: PresetProps): JSX.Element {
  const [local, rest] = split(props, ["value"])
  return <Part of={useDatePicker().preset(local.value)} tag="button" {...rest} />
}

export const DatePicker = {
  Root,
  Field,
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
  /** Empties the value, and gives focus to the field. Disabled while there is none. */
  Clear: (props: ClearProps) => <Part of={useDatePicker().clear} tag="button" {...props} />,
  Preset,
}
