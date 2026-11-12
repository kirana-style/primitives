import type { ChangeDetails } from "@kirana-ui/core"
import { createToggle } from "@kirana-ui/core/toggle"
import { defineComponent, h } from "vue"

import { controller, optional, partComponent } from "./runtime.ts"

/** `v-model:pressed`, or `pressed` with `@pressed-change="(pressed, details) => …"`. */
export const Toggle = defineComponent({
  name: "Toggle",
  inheritAttrs: false,
  props: { pressed: optional(Boolean), defaultPressed: Boolean, disabled: Boolean },
  emits: ["update:pressed", "pressedChange"],
  setup(props, { attrs, slots, emit }) {
    const made = controller(createToggle, () => ({
      pressed: props.pressed,
      defaultPressed: props.defaultPressed,
      disabled: props.disabled,
      onPressedChange(pressed: boolean, details: ChangeDetails) {
        emit("pressedChange", pressed, details)
        if (!details.canceled) emit("update:pressed", pressed)
      },
    }))
    const Element = partComponent("ToggleElement", "button", () => made.root)
    return () => h(Element, attrs, slots)
  },
})
