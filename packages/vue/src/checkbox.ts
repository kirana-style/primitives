import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCheckbox } from "@kirana-ui/core/checkbox"
import type { CheckboxProps, Checkbox as Controller } from "@kirana-ui/core/checkbox"
import { defineComponent, h, inject, useId } from "vue"

import { CHECKBOX_GROUP } from "./checkbox-group-context.ts"
import { useFieldAround } from "./field-context.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"
import type { Changes, PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"checkbox">

const scope = context<Controller>("Checkbox")

const Input = partComponent("CheckboxInput", "input", () => scope.use().input)
// Its native input is the element's last child, whatever element the caller asked for.
const RootElement = partComponent(
  "CheckboxRootElement",
  "span",
  () => scope.use().root,
  (content) => [content, h(Input)]
)

export type RootProps = Omit<CheckboxProps, "id" | "onCheckedChange"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = Changes<"checked", boolean>

/** `v-model:checked`, or `checked` with `@checked-change="(checked, details) => …"`. */
const Root = defineComponent({
  name: "CheckboxRoot",
  inheritAttrs: false,
  props: {
    checked: optional(Boolean),
    defaultChecked: Boolean,
    indeterminate: Boolean,
    parent: Boolean,
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
    const group = inject(CHECKBOX_GROUP, null) ?? undefined
    scope.provide(
      controller(within(createCheckbox, { field, group }), () => ({
        id: props.id ?? generated,
        checked: props.checked,
        defaultChecked: props.defaultChecked,
        indeterminate: props.indeterminate,
        parent: props.parent,
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

const IndicatorElement = partComponent(
  "CheckboxIndicatorElement",
  "span",
  () => scope.use().indicator
)

/**
 * A dash while mixed and a tick while checked, from the slot's state: `<Checkbox.Indicator
 * v-slot="{ state }">{{ state.indeterminate ? "–" : "✓" }}</Checkbox.Indicator>`.
 */
export interface IndicatorProps extends PartComponentProps {
  /** Keeps the mark in the page while the box is unchecked. */
  keepMounted?: boolean | undefined
}

/** `keep-mounted` keeps the mark in the page while the box is unchecked. */
const Indicator = defineComponent({
  name: "CheckboxIndicator",
  inheritAttrs: false,
  props: { keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const mounted = fromSignal(scope.use().indicatorMounted)
    return () => (mounted.value || props.keepMounted ? h(IndicatorElement, attrs, slots) : null)
  },
}) as unknown as PartComponent<"span", State["indicator"], IndicatorProps>

export const Checkbox = { Root, Indicator }
