import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createNumberField } from "@kirana-ui/core/number-field"
import type { NumberField as Controller } from "@kirana-ui/core/number-field"
import { defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { useFieldAround } from "./field-context.ts"
import { context, controller, fromSignal, partComponent } from "./runtime.ts"

const scope = context<Controller>("NumberField")

const RootElement = partComponent("NumberFieldRootElement", "div", () => scope.use().root)
const HiddenInput = partComponent("NumberFieldHiddenInput", "input", () => scope.use().hidden)

/** `v-model` is the number, `null` for none; `@value-committed` hears a change that is done. */
const Root = defineComponent({
  name: "NumberFieldRoot",
  inheritAttrs: false,
  props: {
    modelValue: { type: null as unknown as PropType<number | null>, default: undefined },
    defaultValue: { type: null as unknown as PropType<number | null>, default: undefined },
    min: Number,
    max: Number,
    step: Number,
    smallStep: Number,
    largeStep: Number,
    snapOnStep: Boolean,
    allowWheelScrub: Boolean,
    format: Object as PropType<Intl.NumberFormatOptions>,
    locale: String,
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    name: String,
    form: String,
    id: String,
  },
  emits: ["update:modelValue", "valueChange", "valueCommitted"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const made = scope.provide(
      controller(within(createNumberField, { field: useFieldAround() }), () => ({
        id: props.id ?? generated,
        value: props.modelValue,
        defaultValue: props.defaultValue,
        min: props.min,
        max: props.max,
        step: props.step,
        smallStep: props.smallStep,
        largeStep: props.largeStep,
        snapOnStep: props.snapOnStep,
        allowWheelScrub: props.allowWheelScrub,
        format: props.format,
        locale: props.locale,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        name: props.name,
        form: props.form,
        onValueChange(value: number | null, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:modelValue", value)
        },
        onValueCommitted: (value: number | null, details: ChangeDetails) =>
          emit("valueCommitted", value, details),
      }))
    )
    const named = fromSignal(made.named)
    return () =>
      h(RootElement, attrs, () => [slots.default?.(), named.value ? h(HiddenInput) : null])
  },
})

export const NumberField = {
  Root,
  Group: partComponent("NumberFieldGroup", "div", () => scope.use().group),
  Input: partComponent("NumberFieldInput", "input", () => scope.use().input),
  Increment: partComponent("NumberFieldIncrement", "button", () => scope.use().increment),
  Decrement: partComponent("NumberFieldDecrement", "button", () => scope.use().decrement),
}
