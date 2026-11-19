import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createDatePicker } from "@kirana-ui/core/date-picker"
import type { DatePicker as Controller, DatePickerProps } from "@kirana-ui/core/date-picker"
import { defineComponent, useId } from "vue"
import type { PropType } from "vue"

import { Calendar, calendarScope } from "./calendar.ts"
import { DateField, dateFieldScope } from "./date-field.ts"
import { useDirectionAround } from "./direction-context.ts"
import { Popover, popoverScope } from "./popover.ts"
import { context, controller, optional, partComponent } from "./runtime.ts"
import type { Changes, PartComponentProps, PlainComponent, StatesOf } from "./runtime.ts"

type State = StatesOf<"datePicker">

const scope = context<Controller>("DatePicker")

export type RootProps = Omit<
  DatePickerProps,
  "id" | "onValueChange" | "onOpenChange" | "onMonthChange"
> & {
  id?: string | undefined
}

/** The value is `null` while the date is not whole. */
export type RootEmits = Changes<"value", string | null> &
  Changes<"open", boolean> &
  Changes<"month", string>

/**
 * A date field, and a calendar in a popover, with one value between them. It draws nothing.
 * `v-model:value`, `v-model:open`, `v-model:month` (the first day of the month the calendar
 * shows); the `-change` events carry the details.
 */
const Root = defineComponent({
  name: "DatePickerRoot",
  props: {
    value: optional([String, null] as unknown as PropType<string | null>),
    defaultValue: String as PropType<string | null>,
    open: optional(Boolean),
    defaultOpen: Boolean,
    locale: String,
    min: String,
    max: String,
    isDateUnavailable: Function as PropType<DatePickerProps["isDateUnavailable"]>,
    calendarSystem: Object as PropType<DatePickerProps["calendarSystem"]>,
    fixedWeeks: Boolean,
    months: Number,
    pagedNavigation: Boolean,
    month: optional(String),
    defaultMonth: String,
    placeholders: Object as PropType<DatePickerProps["placeholders"]>,
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    name: String,
    form: String,
    id: String,
  },
  emits: [
    "update:value",
    "valueChange",
    "update:open",
    "openChange",
    "update:month",
    "monthChange",
  ],
  setup(props, { slots, emit }) {
    const generated = useId()
    const made = scope.provide(
      controller(within(createDatePicker, { direction: useDirectionAround() }), () => ({
        ...props,
        id: props.id ?? generated,
        onValueChange(value: string | null, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
        onOpenChange(open: boolean, details: ChangeDetails) {
          emit("openChange", open, details)
          if (!details.canceled) emit("update:open", open)
        },
        onMonthChange(month: string, details: ChangeDetails) {
          emit("monthChange", month, details)
          if (!details.canceled) emit("update:month", month)
        },
      }))
    )
    dateFieldScope.provide(made.field)
    popoverScope.provide(made.popover)
    calendarScope.provide(made.calendar)
    return () => slots.default?.()
  },
}) as unknown as PlainComponent<RootProps, RootEmits>

export type FieldProps = PartComponentProps
export type CalendarProps = PartComponentProps
export type { SegmentProps, SegmentsProps, InputProps } from "./date-field.ts"
export type { PopupProps, PortalProps, PositionerProps, TriggerProps } from "./popover.ts"
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
} from "./calendar.ts"
export const DatePicker = {
  Root,
  /** The typed date: what holds its segments and its hidden input. */
  Field: partComponent<"div", State["field"]>(
    "DatePickerField",
    "div",
    () => scope.use().field.root
  ),
  Segments: DateField.Segments,
  Segment: DateField.Segment,
  Input: DateField.Input,
  Trigger: Popover.Trigger,
  Portal: Popover.Portal,
  Positioner: Popover.Positioner,
  Popup: Popover.Popup,
  /** The calendar: what holds its heading, its buttons and its grid. */
  Calendar: partComponent<"div", State["calendar"]>(
    "DatePickerCalendar",
    "div",
    () => scope.use().calendar.root
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
