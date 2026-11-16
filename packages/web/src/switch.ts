import { createSwitch } from "@kirana-ui/core/switch"

import { fieldAround } from "./around.ts"
import { defineElement } from "./runtime.ts"

/**
 * `<kui-switch>` around a `kui-part="root"` button with a `thumb` inside. The root draws the
 * hidden native input a form and a label reach. `checked`, `default-checked`, `disabled`,
 * `read-only`, `required`, `name`, `form`, `value`; it tells `checked-change`.
 */
export const tag = defineElement({
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
  create: (props, host) => createSwitch(props, { field: fieldAround(host) }),
  changes: { onCheckedChange: { event: "checked-change", prop: "checked" } },
  parts: {
    root: (controller) => ({ part: controller.root, inner: controller.input }),
    thumb: (controller) => controller.thumb,
  },
})
