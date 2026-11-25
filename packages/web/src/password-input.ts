import { createPasswordInput } from "@kirana-ui/core/password-input"
import type { PasswordInput, PasswordInputProps } from "@kirana-ui/core/password-input"

import { fieldAround } from "./around.ts"
import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

/**
 * `<kui-password-input>` around `kui-part="root"`, an `input`, and a `toggle` button that shows
 * the password and hides it again, with an `indicator` inside that says which it is. Inside a
 * `<kui-field>` the input is the field's control. `visible`, `default-visible`, `disabled`; it
 * tells `visible-change` and `value-change`.
 */
export const tag = defineElement<PasswordInputProps & { id: string }, PasswordInput>({
  tag: "kui-password-input",
  props: { visible: "boolean", "default-visible": "boolean", disabled: "boolean" },
  create: (props, host) => createPasswordInput(props, { field: fieldAround(host) }),
  changes: {
    onVisibleChange: { event: "visible-change", prop: "visible" },
    onValueChange: { event: "value-change", prop: "value", hold: false },
  },
  parts: {
    root: (controller) => controller.root,
    input: (controller) => controller.input,
    toggle: (controller) => controller.toggle,
    indicator: (controller) => controller.indicator,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-password-input": ElementOf<
      typeof tag,
      {
        "visible-change": ["onVisibleChange", "visible"]
        "value-change": ["onValueChange", "value"]
      }
    >
  }
}
