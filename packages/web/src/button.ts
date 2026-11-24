import { createButton } from "@kirana-ui/core/button"
import type { ButtonProps } from "@kirana-ui/core/button"

import { defineElement } from "./runtime.ts"
import type { As, ElementOf } from "./runtime.ts"

/**
 * `<kui-button>` around a `kui-part="root"` button, or with `native-button="false"` another
 * element that acts as one; on a link that navigates (`<a href>`), it stays a link. `disabled`,
 * `focusable-when-disabled`, `native-button`.
 */
export const tag = defineElement({
  tag: "kui-button",
  props: { disabled: "boolean", "focusable-when-disabled": "boolean", "native-button": "boolean" },
  create: (props) => createButton(props as never),
  changes: {},
  parts: { root: (controller) => controller.root },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-button": ElementOf<As<typeof tag, ButtonProps>>
  }
}
