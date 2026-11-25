import { computed } from "@kirana-ui/core"
import { createDatePicker } from "@kirana-ui/core/date-picker"
import type {
  DatePicker,
  DatePickerProps,
  DatePickerRange,
  DatePickerValue,
} from "@kirana-ui/core/date-picker"

import { positioner } from "./around.ts"
import type { Placed } from "./around.ts"
import { calendarParts, fieldParts } from "./dates.ts"
import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

/** The field an element is written in: the last day's in a `kui-range="end"` field. */
const fieldOf = (controller: DatePicker, element: HTMLElement) =>
  (element.closest('[kui-part="field"]')?.getAttribute("kui-range") === "end" &&
    controller.endField) ||
  controller.field
/** A value as an attribute writes it: a day, or a range's first and last with a comma between. */
function valueOf(given: unknown, range: boolean): DatePickerValue | undefined {
  if (typeof given !== "string" || !range) return given as DatePickerValue | undefined
  if (given === "") return null
  const [start, end] = given.split(",")
  return { start: start || null, end: end || null } satisfies DatePickerRange
}
const field = fieldParts<DatePicker>(fieldOf)
const calendar = calendarParts<DatePicker>((controller) => controller.calendar)

/**
 * `<kui-date-picker>`: a date field and a calendar in a popover that are one value. A
 * `kui-part="field"` with a date field's `segments` template and `input` (with `mode="range"`,
 * two: `kui-range="start"` and `kui-range="end"`); a `trigger` button; a `clear` button and
 * `preset` buttons (`kui-value`: a day, or a range's first and last with a comma between);
 * and a `portal` with a `positioner` around the `popup`, which holds the `calendar` with a
 * calendar's parts and templates. `value` (a range as a preset's), `default-value`, `mode`,
 * `open`, `default-open`,
 * `locale`, `min`, `max`, `calendar-system`, `fixed-weeks`, `months` (each drawn in a
 * `<template kui-each="months">`), `paged-navigation`, `month`, `default-month`, `disabled`,
 * `read-only`, `required`, `name`, `form`; `isDateUnavailable` and `placeholders` as
 * properties; it tells `value-change`, `open-change` and `month-change`.
 */
export const tag = defineElement<DatePickerProps, DatePicker & { mounted: unknown }>({
  tag: "kui-date-picker",
  props: {
    value: "string",
    "default-value": "string",
    mode: "string",
    open: "boolean",
    "default-open": "boolean",
    locale: "string",
    min: "string",
    max: "string",
    "calendar-system": "string",
    "fixed-weeks": "boolean",
    months: "number",
    "paged-navigation": "boolean",
    month: "string",
    "default-month": "string",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    name: "string",
    form: "string",
  },
  properties: ["isDateUnavailable", "placeholders"],
  create(props) {
    const range = props.peek().mode === "range"
    const picker = createDatePicker(
      computed(() => {
        const own = props.get()
        return {
          ...own,
          value: valueOf(own.value, range),
          defaultValue: valueOf(own.defaultValue, range),
        }
      })
    )
    // What a portal waits for: the popover's.
    return { ...picker, mounted: picker.popover.mounted }
  },
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onOpenChange: { event: "open-change", prop: "open" },
    onMonthChange: { event: "month-change", prop: "month" },
  },
  lists: { ...field.lists, ...calendar.lists },
  parts: {
    field: (controller, element) => fieldOf(controller, element).root,
    ...field.parts,
    trigger: (controller) => controller.popover.trigger,
    positioner: (controller, element) => positioner(controller.popover, element),
    popup: (controller) => controller.popover.popup,
    calendar: (controller) => controller.calendar.root,
    ...calendar.parts,
    clear: (controller) => controller.clear,
    preset(controller, element) {
      const given = element.getAttribute("kui-value") ?? ""
      // A range is written as its first and its last day with a comma between.
      return controller.preset(
        given.includes(",") ? (valueOf(given, true) as DatePickerRange) : given
      )
    },
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-date-picker": ElementOf<
      typeof tag,
      {
        "value-change": ["onValueChange", "value"]
        "open-change": ["onOpenChange", "open"]
        "month-change": ["onMonthChange", "month"]
      }
    > &
      Placed
  }
}
