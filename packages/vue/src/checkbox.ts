import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCheckbox } from "@kirana-ui/core/checkbox"
import type { Checkbox as Controller } from "@kirana-ui/core/checkbox"
import { defineComponent, h, useId } from "vue"

import { useFieldAround } from "./field-context.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"

const scope = context<Controller>("Checkbox")

const RootElement = partComponent("CheckboxRootElement", "span", () => scope.use().root)
const Input = partComponent("CheckboxInput", "input", () => scope.use().input)

/** `v-model:checked`, or `checked` with `@checked-change="(checked, details) => …"`. */
const Root = defineComponent({
  name: "CheckboxRoot",
  inheritAttrs: false,
  props: {
    checked: optional(Boolean),
    defaultChecked: Boolean,
    indeterminate: Boolean,
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
    const field = useFieldAround()
    scope.provide(
      controller(within(createCheckbox, { field }), () => ({
        id: props.id ?? generated,
        checked: props.checked,
        defaultChecked: props.defaultChecked,
        indeterminate: props.indeterminate,
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

const IndicatorElement = partComponent(
  "CheckboxIndicatorElement",
  "span",
  () => scope.use().indicator
)

/** `keep-mounted` keeps the mark in the page while the box is unchecked. */
const Indicator = defineComponent({
  name: "CheckboxIndicator",
  inheritAttrs: false,
  props: { keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const mounted = fromSignal(scope.use().indicatorMounted)
    return () => (mounted.value || props.keepMounted ? h(IndicatorElement, attrs, slots) : null)
  },
})

export const Checkbox = { Root, Indicator }
