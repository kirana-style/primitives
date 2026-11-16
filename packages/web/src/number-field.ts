import { createNumberField } from "@kirana-ui/core/number-field"

import { fieldAround } from "./around.ts"
import { defineElement } from "./runtime.ts"

/**
 * `<kui-number-field>` around `kui-part="root"`, a `group`, an `input`, and `increment` and
 * `decrement` buttons. With a name, the root draws the hidden input a form reads. `value`,
 * `default-value`, `min`, `max`, `step`, `small-step`, `large-step`, `snap-on-step`,
 * `allow-wheel-scrub`, `locale`, `disabled`, `read-only`, `required`, `name`, `form`; `format`
 * as a property; it tells `value-change` and `value-committed`.
 */
export const tag = defineElement({
  tag: "kui-number-field",
  props: {
    value: "number",
    "default-value": "number",
    min: "number",
    max: "number",
    step: "number",
    "small-step": "number",
    "large-step": "number",
    "snap-on-step": "boolean",
    "allow-wheel-scrub": "boolean",
    locale: "string",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    name: "string",
    form: "string",
  },
  properties: ["format"],
  create: (props, host) => createNumberField(props, { field: fieldAround(host) }),
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onValueCommitted: { event: "value-committed", prop: "value", hold: false },
  },
  parts: {
    root: (controller) =>
      controller.named.peek()
        ? { part: controller.root, inner: controller.hidden }
        : controller.root,
    group: (controller) => controller.group,
    input: (controller) => controller.input,
    increment: (controller) => controller.increment,
    decrement: (controller) => controller.decrement,
  },
})
