import { createFieldset } from "@kirana-ui/core/fieldset"
import type { FieldsetProps } from "@kirana-ui/core/fieldset"

import { defineElement } from "./runtime.ts"
import type { As, ElementOf } from "./runtime.ts"

/** `<kui-fieldset>` around a `kui-part="root"` fieldset and its `legend`. `disabled`. */
export const tag = defineElement({
  tag: "kui-fieldset",
  props: { disabled: "boolean" },
  create: (props) => createFieldset(props),
  changes: {},
  parts: {
    root: (controller) => controller.root,
    legend: (controller) => controller.legend,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-fieldset": ElementOf<As<typeof tag, FieldsetProps>>
  }
}
