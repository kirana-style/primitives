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

const scope = context<Controller>("DatePicker")

/**
 * A date field, and a calendar in a popover, with one value between them. It draws nothing.
 * `v-model:value`, `v-model:open`; the `-change` events carry the details.
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
    placeholders: Object as PropType<DatePickerProps["placeholders"]>,
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    name: String,
    form: String,
    id: String,
  },
  emits: ["update:value", "valueChange", "update:open", "openChange"],
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
      }))
    )
    dateFieldScope.provide(made.field)
    popoverScope.provide(made.popover)
    calendarScope.provide(made.calendar)
    return () => slots.default?.()
  },
})

export const DatePicker = {
  Root,
  /** The typed date: what holds its segments and its hidden input. */
  Field: partComponent("DatePickerField", "div", () => scope.use().field.root),
  Segments: DateField.Segments,
  Segment: DateField.Segment,
  Input: DateField.Input,
  Trigger: Popover.Trigger,
  Portal: Popover.Portal,
  Positioner: Popover.Positioner,
  Popup: Popover.Popup,
  /** The calendar: what holds its heading, its buttons and its grid. */
  Calendar: partComponent("DatePickerCalendar", "div", () => scope.use().calendar.root),
  Heading: Calendar.Heading,
  Previous: Calendar.Previous,
  Next: Calendar.Next,
  Grid: Calendar.Grid,
  Weekdays: Calendar.Weekdays,
  HeadCell: Calendar.HeadCell,
  Weeks: Calendar.Weeks,
  Cell: Calendar.Cell,
  Day: Calendar.Day,
}
