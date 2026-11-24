import { createButton } from "@kirana-ui/core/button"
import type { ButtonProps as CoreProps } from "@kirana-ui/core/button"
import { defineComponent, h } from "vue"

import { controller, optional, partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

export interface ButtonProps extends CoreProps, PartComponentProps {}

/**
 * A `<button>`, or with `as` and `:native-button="false"` another element that acts as one; a
 * link that navigates (`as="a" href="/x"`, `as-child` on an `<a href>`) stays a link.
 */
export const Button = defineComponent({
  name: "Button",
  inheritAttrs: false,
  props: {
    disabled: Boolean,
    focusableWhenDisabled: Boolean,
    nativeButton: optional(Boolean),
  },
  setup(props, { attrs, slots }) {
    const made = controller(createButton, () => ({ ...props }))
    const Element = partComponent("ButtonElement", "button", () => made.root)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"button", StatesOf<"button">["root"], ButtonProps>
