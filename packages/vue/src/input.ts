import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createInput } from "@kirana-ui/core/input"
import { defineComponent, h } from "vue"

import { useFieldAround } from "./field-context.ts"
import { controller, partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

export interface InputProps extends PartComponentProps {
  /** The text: `v-model`. */
  modelValue?: string | undefined
  disabled?: boolean | undefined
}

export type InputEmits = {
  "update:modelValue": (value: string) => void
  valueChange: (value: string, details: ChangeDetails) => void
}

/**
 * An `<input>`; `as="textarea"` for a text area. It takes what an `<input>` takes, and
 * `v-model`. Inside a `<Field.Root>` it is the field's control.
 */
export const Input = defineComponent({
  name: "Input",
  inheritAttrs: false,
  props: { modelValue: String, disabled: Boolean },
  emits: ["update:modelValue", "valueChange"],
  setup(props, { attrs, slots, emit }) {
    const made = controller(within(createInput, { field: useFieldAround() }), () => ({
      disabled: props.disabled,
      onValueChange(value: string, details: ChangeDetails) {
        emit("valueChange", value, details)
        emit("update:modelValue", value)
      },
    }))
    const Element = partComponent("InputElement", "input", () => made.input)
    return () =>
      h(
        Element,
        { ...attrs, ...(props.modelValue === undefined ? {} : { value: props.modelValue }) },
        slots
      )
  },
}) as unknown as PartComponent<"input", StatesOf<"input">["input"], InputProps, InputEmits>
