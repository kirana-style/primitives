import type { ChangeDetails } from "@kirana-ui/core"
import { createSwitch } from "@kirana-ui/core/switch"
import type { Switch as Controller } from "@kirana-ui/core/switch"
import { defineComponent, h, useId } from "vue"

import { context, controller, optional, partComponent } from "./runtime.ts"

const scope = context<Controller>("Switch")

const RootElement = partComponent("SwitchRootElement", "span", () => scope.use().root)
const Input = partComponent("SwitchInput", "input", () => scope.use().input)

/** `v-model:checked`, or `checked` with `@checked-change="(checked, details) => …"`. */
const Root = defineComponent({
  name: "SwitchRoot",
  inheritAttrs: false,
  props: {
    checked: optional(Boolean),
    defaultChecked: Boolean,
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    name: String,
    value: String,
    id: String,
  },
  emits: ["update:checked", "checkedChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(createSwitch, () => ({
        id: props.id ?? generated,
        checked: props.checked,
        defaultChecked: props.defaultChecked,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        name: props.name,
        value: props.value,
        onCheckedChange(checked: boolean, details: ChangeDetails) {
          emit("checkedChange", checked, details)
          if (!details.canceled) emit("update:checked", checked)
        },
      }))
    )
    return () => h(RootElement, attrs, () => [slots.default?.(), h(Input)])
  },
})

export const Switch = {
  Root,
  Thumb: partComponent("SwitchThumb", "span", () => scope.use().thumb),
}
