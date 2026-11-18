import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCheckboxGroup } from "@kirana-ui/core/checkbox-group"
import type { CheckboxGroupProps as CoreProps } from "@kirana-ui/core/checkbox-group"
import { defineComponent, h, provide, useId } from "vue"
import type { PropType } from "vue"

import { CHECKBOX_GROUP } from "./checkbox-group-context.ts"
import { useFieldAround } from "./field-context.ts"
import { controller, optional, partComponent } from "./runtime.ts"
import type { Changes, PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

export type CheckboxGroupProps = Omit<CoreProps, "id" | "onValueChange"> & {
  id?: string | undefined
} & PartComponentProps

export type CheckboxGroupEmits = Changes<"value", string[]>

/**
 * `v-model:value` (a list). Each `Checkbox.Root` with a `value` inside it is checked while the
 * list has its value; with `all-values`, a `Checkbox.Root` marked `parent` stands for them all.
 */
export const CheckboxGroup = defineComponent({
  name: "CheckboxGroup",
  inheritAttrs: false,
  props: {
    value: optional(Array as PropType<readonly string[]>),
    defaultValue: Array as PropType<readonly string[]>,
    allValues: Array as PropType<readonly string[]>,
    disabled: Boolean,
    id: String,
  },
  emits: ["update:value", "valueChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const field = useFieldAround()
    const made = controller(within(createCheckboxGroup, { field }), () => ({
      id: props.id ?? generated,
      value: props.value,
      defaultValue: props.defaultValue,
      allValues: props.allValues,
      disabled: props.disabled,
      onValueChange(value: string[], details: ChangeDetails) {
        emit("valueChange", value, details)
        if (!details.canceled) emit("update:value", value)
      },
    }))
    provide(CHECKBOX_GROUP, made)
    const Element = partComponent("CheckboxGroupElement", "div", () => made.root)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<
  "div",
  StatesOf<"checkboxGroup">["root"],
  CheckboxGroupProps,
  CheckboxGroupEmits
>
