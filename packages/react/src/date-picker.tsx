import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createDatePicker } from "@kirana-ui/core/date-picker"
import type { DatePicker as Controller, DatePickerProps } from "@kirana-ui/core/date-picker"
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

export type RootProps = Omit<DatePickerProps, "id"> & { id?: string; children?: ReactNode }

/** A date field, and a calendar in a popover, with one value between them. It draws nothing. */
function Root({ children, ...props }: RootProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller = useController<DatePickerProps, Controller>(
    within(createDatePicker, { direction }),
    props
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

export type FieldProps = PartComponentProps<"div", StateOf<Parts["field"]>>
export type CalendarProps = PartComponentProps<"div", StateOf<Parts["calendar"]>>

/** The typed date: what holds its segments and its hidden input. */
const Field = (props: FieldProps) => usePart(useDatePicker("Field").field.root, "div", props)
/** The calendar: what holds its heading, its buttons and its grid. */
const CalendarRoot = (props: CalendarProps) =>
  usePart(useDatePicker("Calendar").calendar.root, "div", props)

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
})
