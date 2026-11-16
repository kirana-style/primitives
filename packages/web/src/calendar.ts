import { computed } from "@kirana-ui/core"
import { createCalendar } from "@kirana-ui/core/calendar"
import type { Calendar, CalendarProps } from "@kirana-ui/core/calendar"

import { calendarParts, days } from "./dates.ts"
import { defineElement } from "./runtime.ts"

const { parts, lists } = calendarParts<Calendar>((controller) => controller)

/**
 * `<kui-calendar>` around `kui-part="root"`, with `previous` and `next` buttons, a `heading`
 * (it says the month) and a `grid` table. The table's head row holds a
 * `<template kui-each="weekdays">` with a `head-cell` (`{short}`, `{narrow}`, `{long}`); its
 * body a `<template kui-each="weeks">` with a row, which holds a `<template kui-each="days">`
 * with a `cell` and its `day` button (`{date}`, `{label}`). `value` and `default-value` (a
 * day as `2026-03-14`; several with commas between), `mode`, `default-focused-value`,
 * `locale`, `calendar-system`, `min`, `max`, `disabled`, `read-only`, `fixed-weeks`;
 * `isDateUnavailable` as a property; it tells `value-change` and `month-change`.
 */
export const tag = defineElement<CalendarProps, Calendar>({
  tag: "kui-calendar",
  props: {
    value: "string",
    "default-value": "string",
    mode: "string",
    "default-focused-value": "string",
    locale: "string",
    "calendar-system": "string",
    min: "string",
    max: "string",
    disabled: "boolean",
    "read-only": "boolean",
    "fixed-weeks": "boolean",
  },
  properties: ["isDateUnavailable"],
  create: (props) =>
    createCalendar(
      computed(() => {
        const own = props.get()
        return {
          ...own,
          value: days(own.value),
          defaultValue: days(own.defaultValue),
        } as CalendarProps
      })
    ),
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onMonthChange: { event: "month-change", prop: "month", hold: false },
  },
  lists,
  parts: { root: (controller) => controller.root, ...parts },
})
