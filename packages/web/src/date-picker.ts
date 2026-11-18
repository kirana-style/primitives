import { createDatePicker } from "@kirana-ui/core/date-picker"
import type { DatePicker, DatePickerProps } from "@kirana-ui/core/date-picker"

import { positioner } from "./around.ts"
import type { Placed } from "./around.ts"
import { calendarParts, fieldParts } from "./dates.ts"
import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

const field = fieldParts<DatePicker>((controller) => controller.field)
const calendar = calendarParts<DatePicker>((controller) => controller.calendar)

/**
 * `<kui-date-picker>`: a date field and a calendar in a popover that are one value. A
 * `kui-part="field"` with a date field's `segments` template and `input`; a `trigger`
 * button; and a `portal` with a `positioner` around the `popup`, which holds the `calendar`
 * with a calendar's parts and templates. `value`, `default-value`, `open`, `default-open`,
 * `locale`, `min`, `max`, `calendar-system`, `fixed-weeks`, `disabled`, `read-only`,
 * `required`, `name`, `form`; `isDateUnavailable` and `placeholders` as properties; it tells
 * `value-change` and `open-change`.
 */
export const tag = defineElement<DatePickerProps, DatePicker & { mounted: unknown }>({
  tag: "kui-date-picker",
  props: {
    value: "string",
    "default-value": "string",
    open: "boolean",
    "default-open": "boolean",
    locale: "string",
    min: "string",
    max: "string",
    "calendar-system": "string",
    "fixed-weeks": "boolean",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    name: "string",
    form: "string",
  },
  properties: ["isDateUnavailable", "placeholders"],
  create(props) {
    const picker = createDatePicker(props)
    // What a portal waits for: the popover's.
    return { ...picker, mounted: picker.popover.mounted }
  },
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onOpenChange: { event: "open-change", prop: "open" },
  },
  lists: { ...field.lists, ...calendar.lists },
  parts: {
    field: (controller) => controller.field.root,
    ...field.parts,
    trigger: (controller) => controller.popover.trigger,
    positioner: (controller, element) => positioner(controller.popover, element),
    popup: (controller) => controller.popover.popup,
    calendar: (controller) => controller.calendar.root,
    ...calendar.parts,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-date-picker": ElementOf<
      typeof tag,
      { "value-change": ["onValueChange", "value"]; "open-change": ["onOpenChange", "open"] }
    > &
      Placed
  }
}
