import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createDatePicker } from "@kirana-ui/core/date-picker"
import type {
  DatePicker as Controller,
  DatePickerMode,
  DatePickerProps,
  DatePickerRange,
  DatePickerValue,
  DatePickerValueOf,
} from "@kirana-ui/core/date-picker"
import { defineComponent, h, useId } from "vue"
import type { PropType, PublicProps } from "vue"

import { Calendar, calendarScope } from "./calendar.ts"
import { DateField, dateFieldScope } from "./date-field.ts"
import { useDirectionAround } from "./direction-context.ts"
import { Popover, popoverScope } from "./popover.ts"
import { context, controller, optional, partComponent } from "./runtime.ts"
import type {
  Changes,
  Listeners,
  PartComponent,
  PartComponentProps,
  PlainInstance,
  StatesOf,
} from "./runtime.ts"

type State = StatesOf<"datePicker">

const scope = context<Controller>("DatePicker")

/** `value` and its events are typed by `mode`: a day, or a range. */
export type RootProps<Mode extends DatePickerMode = "single"> = Omit<
  DatePickerProps<Mode>,
  "id" | "onValueChange" | "onOpenChange" | "onMonthChange"
> & {
  id?: string | undefined
}

/** The value is `null` while the date is not whole. */
export type RootEmits<Mode extends DatePickerMode = "single"> = Changes<
  "value",
  DatePickerValueOf<Mode>
> &
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
    value: optional([String, Object, null] as unknown as PropType<DatePickerValue>),
    defaultValue: [String, Object] as PropType<DatePickerValue>,
    mode: String as PropType<DatePickerMode>,
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
        onValueChange(value: DatePickerValue, details: ChangeDetails) {
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
}) as unknown as new <Mode extends DatePickerMode = "single">(
  props: RootProps<Mode> & Listeners<RootEmits<Mode>> & PublicProps
) => PlainInstance<RootProps<Mode>, RootEmits<Mode>, {}>

export interface FieldProps extends PartComponentProps {
  /**
   * With `mode="range"`: which day of the range it is typed in, the first (`"start"`, the
   * default) or the last (`"end"`).
   */
  range?: "start" | "end" | undefined
}
export type CalendarProps = PartComponentProps
export type ClearProps = PartComponentProps
export interface PresetProps extends PartComponentProps {
  /** The value its press gives: a day, or with `mode="range"` a range. */
  value: string | DatePickerRange
}

const FieldElement = partComponent<"div", State["field"]>(
  "DatePickerFieldElement",
  "div",
  () => dateFieldScope.use().root
)

/**
 * The typed date: what holds its segments and its hidden input. With `mode="range"` there are
 * two, `range="start"` and `range="end"`, each giving its own parts their field.
 */
const Field = defineComponent({
  name: "DatePickerField",
  inheritAttrs: false,
  props: { range: String as PropType<"start" | "end"> },
  setup(props, { attrs, slots }) {
    const picker = scope.use()
    dateFieldScope.provide((props.range === "end" && picker.endField) || picker.field)
    return () => h(FieldElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["field"], FieldProps>

/** Makes the value the one it is given: pressed while it is. */
const Preset = defineComponent({
  name: "DatePickerPreset",
  inheritAttrs: false,
  props: {
    value: { type: [String, Object] as PropType<string | DatePickerRange>, required: true },
  },
  setup(props, { attrs, slots }) {
    const part = scope.use().preset(props.value)
    const Element = partComponent("DatePickerPresetElement", "button", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"button", State["preset"], PresetProps>
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
  Field,
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
  /** Empties the value, and gives focus to the field. Disabled while there is none. */
  Clear: partComponent<"button", State["clear"]>(
    "DatePickerClear",
    "button",
    () => scope.use().clear
  ),
  Preset,
}
