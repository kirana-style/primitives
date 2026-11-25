import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createDatePicker } from "@kirana-ui/core/date-picker"
import type {
  DatePicker as Controller,
  DatePickerMode,
  DatePickerProps,
  DatePickerRange,
} from "@kirana-ui/core/date-picker"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { Calendar, CalendarContext } from "./calendar.tsx"
import { DateField, DateFieldContext } from "./date-field.tsx"
import { DirectionContext } from "./direction-context.ts"
import { Popover, PopoverContext } from "./popover.tsx"
import { parts, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

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

type Parts = Vocabulary["datePicker"]

const Context = createContext<Controller | null>(null)

function useDatePicker(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<DatePicker.${part}> must be inside <DatePicker.Root>`)
  return controller
}

/** `value` and `onValueChange` are typed by `mode`: a day, or a range. */
export type RootProps<Mode extends DatePickerMode = "single"> = Omit<
  DatePickerProps<Mode>,
  "id"
> & { id?: string; children?: ReactNode }

/** A date field, and a calendar in a popover, with one value between them. It draws nothing. */
function Root<Mode extends DatePickerMode = "single">({
  children,
  ...props
}: RootProps<Mode>): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  // The core holds either mode's value; the caller's is its mode's.
  const controller = useController<DatePickerProps, Controller>(
    within(createDatePicker, { direction }),
    props as Omit<DatePickerProps, "id"> & { id?: string }
  )
  return (
    <Context.Provider value={controller}>
      <DateFieldContext.Provider value={controller.field}>
        <PopoverContext.Provider value={controller.popover}>
          <CalendarContext.Provider value={controller.calendar}>
            {children}
          </CalendarContext.Provider>
        </PopoverContext.Provider>
      </DateFieldContext.Provider>
    </Context.Provider>
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
function Field({ range, ...props }: FieldProps): ReactElement {
  const picker = useDatePicker("Field")
  const field = (range === "end" && picker.endField) || picker.field
  return (
    <DateFieldContext.Provider value={field}>
      {usePart(field.root, "div", props)}
    </DateFieldContext.Provider>
  )
}
/** The calendar: what holds its heading, its buttons and its grid. */
const CalendarRoot = (props: CalendarProps) =>
  usePart(useDatePicker("Calendar").calendar.root, "div", props)

/** Empties the value, and gives focus to the field. Disabled while there is none. */
const Clear = (props: ClearProps) => usePart(useDatePicker("Clear").clear, "button", props)
/** Makes the value the one it is given: pressed while it is. */
const Preset = ({ value, ...props }: PresetProps) =>
  usePart(useDatePicker("Preset").preset(value), "button", props)

export const DatePicker = /* @__PURE__ */ parts("DatePicker", {
  Root,
  Field,
  Segments: DateField.Segments,
  Segment: DateField.Segment,
  Input: DateField.Input,
  Trigger: Popover.Trigger,
  Portal: Popover.Portal,
  Positioner: Popover.Positioner,
  Popup: Popover.Popup,
  Calendar: CalendarRoot,
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
  Clear,
  Preset,
})
