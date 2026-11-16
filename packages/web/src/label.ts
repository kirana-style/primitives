import { createLabel } from "@kirana-ui/core/label"

import { fieldAround } from "./around.ts"
import { defineElement } from "./runtime.ts"

/** `<kui-label>` around a `kui-part="root"` label. Inside a `<kui-field>` it is the field's. */
export const tag = defineElement({
  tag: "kui-label",
  props: {},
  create: (_props, host) => createLabel({ field: fieldAround(host) }),
  changes: {},
  parts: { root: (controller) => controller.label },
})
