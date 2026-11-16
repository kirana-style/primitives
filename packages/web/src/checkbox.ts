import { createCheckbox } from "@kirana-ui/core/checkbox"

import { defineElement, innerInput } from "./runtime.ts"

/**
 * `<kui-checkbox>`: the box itself, with `kui-part="indicator"` inside, in the page while it
 * is checked. It draws the hidden native input a form and a label reach. `checked`,
 * `default-checked`, `indeterminate`, `disabled`, `read-only`, `required`, `name`, `form`,
 * `value`; it tells `checked-change`.
 */
defineElement({
  tag: "kui-checkbox",
  props: {
    checked: "boolean",
    "default-checked": "boolean",
    indeterminate: "boolean",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    name: "string",
    form: "string",
    value: "string",
  },
  create: createCheckbox,
  root: (controller) => controller.root,
  changes: { onCheckedChange: { event: "checked-change", prop: "checked" } },
  parts: {
    indicator: (controller) => ({
      mounted: controller.indicatorMounted,
      part: controller.indicator,
    }),
  },
  setup: (controller, host) => innerInput(host, controller.input),
})
