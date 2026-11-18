import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createSwitch } from "@kirana-ui/core/switch"
import type { Switch as Controller, SwitchProps } from "@kirana-ui/core/switch"
import { defineComponent, h, useId } from "vue"

import { useFieldAround } from "./field-context.ts"
import { context, controller, optional, partComponent } from "./runtime.ts"
import type { Changes, PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"switch">

const scope = context<Controller>("Switch")

const Input = partComponent("SwitchInput", "input", () => scope.use().input)
// Its native input is the element's last child, whatever element the caller asked for.
const RootElement = partComponent(
  "SwitchRootElement",
  "span",
  () => scope.use().root,
  (content) => [content, h(Input)]
)

export type RootProps = Omit<SwitchProps, "id" | "onCheckedChange"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = Changes<"checked", boolean>

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
    form: String,
    value: String,
    id: String,
  },
  emits: ["update:checked", "checkedChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const field = useFieldAround()
    scope.provide(
      controller(within(createSwitch, { field }), () => ({
        id: props.id ?? generated,
        checked: props.checked,
        defaultChecked: props.defaultChecked,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        name: props.name,
        form: props.form,
        value: props.value,
        onCheckedChange(checked: boolean, details: ChangeDetails) {
          emit("checkedChange", checked, details)
          if (!details.canceled) emit("update:checked", checked)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"span", State["root"], RootProps, RootEmits>

export type ThumbProps = PartComponentProps
export const Switch = {
  Root,
  Thumb: partComponent<"span", State["thumb"]>("SwitchThumb", "span", () => scope.use().thumb),
}
