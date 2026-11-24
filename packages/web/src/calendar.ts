import { computed } from "@kirana-ui/core"
import { createCalendar } from "@kirana-ui/core/calendar"
import type { Calendar, CalendarProps } from "@kirana-ui/core/calendar"

import { calendarParts, days } from "./dates.ts"
import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

const { parts, lists } = calendarParts<Calendar>((controller) => controller)

/**
 * `<kui-calendar>` around `kui-part="root"`, with `previous` and `next` buttons, a `heading`
 * (it says the month) and a `grid` table. The table's head row holds a
 * `<template kui-each="weekdays">` with a `head-cell` (`{short}`, `{narrow}`, `{long}`); its
 * body a `<template kui-each="weeks">` with a row, which holds a `<template kui-each="days">`
 * with a `cell` and its `day` button (`{date}`, `{label}`). With several `months`, a
 * `<template kui-each="months">` (`{index}`, `{month}`, `{title}`) holds each month's
 * `heading` and `grid`. An `<input kui-part="input">` submits the value under `name`.
 * `value` and `default-value` (a day as `2026-03-14`; a range's first and last, or a list's
 * days, with commas between), `mode`, `required`, `min-days`, `max-days`, `months`, `paged-navigation`,
 * `month`, `default-month`, `default-focused-value`, `locale`, `calendar-system`, `min`,
 * `max`, `disabled`, `read-only`, `fixed-weeks`, `name`, `form`; `isDateUnavailable` as a
 * property; it tells `value-change` and `month-change`.
 */
export const tag = defineElement<CalendarProps, Calendar>({
  tag: "kui-calendar",
  props: {
    value: "string",
    "default-value": "string",
    mode: "string",
    required: "boolean",
    "min-days": "number",
    "max-days": "number",
    months: "number",
    "paged-navigation": "boolean",
    month: "string",
    "default-month": "string",
    "default-focused-value": "string",
    locale: "string",
    "calendar-system": "string",
    min: "string",
    max: "string",
    disabled: "boolean",
    "read-only": "boolean",
    "fixed-weeks": "boolean",
    name: "string",
    form: "string",
  },
  properties: ["isDateUnavailable"],
  create: (props) =>
    createCalendar(
      computed(() => {
        const own = props.get()
        return {
          ...own,
          value: days(own.value, own.mode),
          defaultValue: days(own.defaultValue, own.mode),
        } as CalendarProps
      })
    ),
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onMonthChange: { event: "month-change", prop: "month" },
  },
  lists,
  parts: {
    root: (controller) => controller.root,
    input: (controller) => controller.input,
    ...parts,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-calendar": ElementOf<
      typeof tag,
      { "value-change": ["onValueChange", "value"]; "month-change": ["onMonthChange", "month"] }
    >
  }
}
