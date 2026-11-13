import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createToggle } from "@kirana-ui/core/toggle"
import { defineComponent, h, inject } from "vue"
import type { PropType } from "vue"

import { controller, optional, partComponent } from "./runtime.ts"
import { TOGGLE_GROUP, TOOLBAR } from "./toolbar-context.ts"

/**
 * `v-model:pressed`, or `pressed` with `@pressed-change="(pressed, details) => …"`. Inside a
 * `ToggleGroup`, `value` makes it one of the group's toggles.
 */
export const Toggle = defineComponent({
  name: "Toggle",
  inheritAttrs: false,
  props: {
    pressed: optional(Boolean),
    defaultPressed: Boolean,
    disabled: Boolean,
    value: { type: null as unknown as PropType<unknown>, default: undefined as unknown },
  },
  emits: ["update:pressed", "pressedChange"],
  setup(props, { attrs, slots, emit }) {
    const group = inject(TOGGLE_GROUP, null) ?? undefined
    const toolbar = inject(TOOLBAR, null) ?? undefined
    const made = controller(within(createToggle, { group, toolbar }), () => ({
      pressed: props.pressed,
      defaultPressed: props.defaultPressed,
      disabled: props.disabled,
      value: props.value,
      onPressedChange(pressed: boolean, details: ChangeDetails) {
        emit("pressedChange", pressed, details)
        if (!details.canceled) emit("update:pressed", pressed)
      },
    }))
    const Element = partComponent("ToggleElement", "button", () => made.root)
    return () => h(Element, attrs, slots)
  },
})
