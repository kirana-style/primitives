import { createSwitch } from "@kirana-ui/core/switch"

import { defineElement, innerInput } from "./runtime.ts"

/**
 * `<kui-switch>`: the switch itself, with `kui-part="thumb"` inside. It draws the hidden
 * native input a form and a label reach. `checked`, `default-checked`, `disabled`,
 * `read-only`, `required`, `name`, `form`, `value`; it tells `checked-change`.
 */
defineElement({
  tag: "kui-switch",
  props: {
    checked: "boolean",
    "default-checked": "boolean",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    name: "string",
    form: "string",
    value: "string",
  },
  create: createSwitch,
  root: (controller) => controller.root,
  changes: { onCheckedChange: { event: "checked-change", prop: "checked" } },
  parts: { thumb: (controller) => controller.thumb },
  setup: (controller, host) => innerInput(host, controller.input),
})
