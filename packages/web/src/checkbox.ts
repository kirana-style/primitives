import { createCheckbox } from "@kirana-ui/core/checkbox"

import { fieldAround } from "./around.ts"
import { defineElement } from "./runtime.ts"

/**
 * `<kui-checkbox>` around a `kui-part="root"` button with an `indicator` inside, which is in
 * the page while the box is checked or indeterminate. The root draws the hidden native input a
 * form and a label reach. `checked`, `default-checked`, `indeterminate`, `disabled`,
 * `read-only`, `required`, `name`, `form`, `value`; it tells `checked-change`.
 */
export const tag = defineElement({
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
  create: (props, host) => createCheckbox(props, { field: fieldAround(host) }),
  changes: { onCheckedChange: { event: "checked-change", prop: "checked" } },
  parts: {
    root: (controller) => ({ part: controller.root, inner: controller.input }),
    indicator: (controller) => ({
      mounted: controller.indicatorMounted,
      part: controller.indicator,
    }),
  },
})
