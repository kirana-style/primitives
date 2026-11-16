import { createInput } from "@kirana-ui/core/input"

import { fieldAround } from "./around.ts"
import { defineElement } from "./runtime.ts"

/**
 * `<kui-input>` around a `kui-part="root"` input or textarea: it says its state, and inside a
 * `<kui-field>` it is the field's control. `disabled`; it tells `value-change`.
 */
export const tag = defineElement({
  tag: "kui-input",
  props: { disabled: "boolean" },
  create: (props, host) => createInput(props as never, { field: fieldAround(host) }),
  changes: { onValueChange: { event: "value-change", prop: "value", hold: false } },
  parts: { root: (controller) => controller.input },
})
