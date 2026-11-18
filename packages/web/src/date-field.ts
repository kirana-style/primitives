import { createDateField } from "@kirana-ui/core/date-field"
import type { DateField, DateFieldProps } from "@kirana-ui/core/date-field"

import { fieldParts } from "./dates.ts"
import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

const { parts, lists } = fieldParts<DateField>((controller) => controller)

/**
 * `<kui-date-field>` around `kui-part="root"`, which holds a `<template kui-each="segments">`
 * with the `segment` each part of the date is typed in (`{type}` and `{index}` say which),
 * and the hidden `input` a form reads. `value`, `default-value`, `locale`, `min`, `max`,
 * `disabled`, `read-only`, `required`, `name`, `form`; `placeholders` as a property; it
 * tells `value-change`.
 */
export const tag = defineElement<DateFieldProps, DateField>({
  tag: "kui-date-field",
  props: {
    value: "string",
    "default-value": "string",
    locale: "string",
    min: "string",
    max: "string",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    name: "string",
    form: "string",
  },
  properties: ["placeholders"],
  create: (props) => createDateField(props),
  changes: { onValueChange: { event: "value-change", prop: "value" } },
  lists,
  parts: { root: (controller) => controller.root, ...parts },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-date-field": ElementOf<typeof tag, { "value-change": ["onValueChange", "value"] }>
  }
}
