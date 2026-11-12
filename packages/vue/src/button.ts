import { createButton } from "@kirana-ui/core/button"
import { defineComponent, h } from "vue"

import { controller, optional, partComponent } from "./runtime.ts"

/** A `<button>`, or with `as` and `:native-button="false"` another element that acts as one. */
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
})
