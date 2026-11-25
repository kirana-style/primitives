import { createTimeField } from "@kirana-ui/core/time-field"
import type { TimeField, TimeFieldProps, TimeFieldSegment } from "@kirana-ui/core/time-field"

import { defineElement, entryAround } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

/**
 * `<kui-time-field>` around `kui-part="root"`, which holds a `<template kui-each="segments">`
 * with the `segment` each part of the time is typed in (`{type}` and `{index}` say which),
 * and the hidden `input` a form reads. `value`, `default-value`, `granularity`, `hour-cycle`,
 * `locale`, `min`, `max`, `disabled`, `read-only`, `required`, `name`, `form`; `placeholders`
 * as a property; it tells `value-change`.
 */
export const tag = defineElement<TimeFieldProps, TimeField>({
  tag: "kui-time-field",
  props: {
    value: "string",
    "default-value": "string",
    granularity: "string",
    "hour-cycle": "number",
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
  create: (props) => createTimeField(props),
  changes: { onValueChange: { event: "value-change", prop: "value" } },
  lists: {
    segments: (controller) => ({
      entries: controller.segments,
      key: (segment: TimeFieldSegment) => `${segment.index}-${segment.type}`,
    }),
  },
  parts: {
    root: (controller) => controller.root,
    segment(controller, element) {
      const segment = entryAround<TimeFieldSegment>(element)
      if (!segment) return undefined
      const { part, text } = controller.segment(segment)
      return { part, text }
    },
    input: (controller) => controller.input,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-time-field": ElementOf<typeof tag, { "value-change": ["onValueChange", "value"] }>
  }
}
