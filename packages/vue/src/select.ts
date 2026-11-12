import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createSelect } from "@kirana-ui/core/select"
import type { Select as Controller } from "@kirana-ui/core/select"
import { defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType } from "vue"

import { positionerComponent } from "./popover.ts"
import { useFieldAround } from "./field-context.ts"
import {
  context,
  controller,
  fromSignal,
  optional,
  partComponent,
  portalComponent,
  toSignal,
} from "./runtime.ts"

const scope = context<Controller>("Select")
const ITEM: InjectionKey<unknown> = Symbol("SelectItem")

const HiddenInput = partComponent("SelectHiddenInput", "input", () => scope.use().input)

/** `v-model:value`, `v-model:open`; `@value-change` and `@open-change` carry the details. */
const Root = defineComponent({
  name: "SelectRoot",
  props: {
    value: { type: null as unknown as PropType<unknown>, default: undefined as unknown },
    defaultValue: { type: null as unknown as PropType<unknown>, default: null as unknown },
    open: optional(Boolean),
    defaultOpen: Boolean,
    disabled: Boolean,
    required: Boolean,
    name: String,
    items: Array as PropType<readonly { value: unknown; label: string }[]>,
    id: String,
  },
  emits: ["update:value", "valueChange", "update:open", "openChange"],
  setup(props, { slots, emit }) {
    const generated = useId()
    const field = useFieldAround()
    const made = scope.provide(
      controller(within(createSelect, { field }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        open: props.open,
        defaultOpen: props.defaultOpen,
        disabled: props.disabled,
        required: props.required,
        name: props.name,
        items: props.items,
        onValueChange(value: unknown, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
        onOpenChange(open: boolean, details: ChangeDetails) {
          emit("openChange", open, details)
          if (!details.canceled) emit("update:open", open)
        },
      }))
    )
    const named = fromSignal(made.named)
    return () => [slots.default?.(), named.value ? h(HiddenInput) : null]
  },
})

const ValueElement = partComponent("SelectValueElement", "span", () => scope.use().valuePart)

/** Shows the chosen value's label, or `placeholder` while nothing is chosen. */
const Value = defineComponent({
  name: "SelectValue",
  inheritAttrs: false,
  props: { placeholder: { type: String, default: "" } },
  setup(props, { attrs, slots }) {
    const label = fromSignal(scope.use().label)
    return () => h(ValueElement, attrs, slots.default ?? (() => label.value ?? props.placeholder))
  },
})

/** `label` is what typeahead matches and the trigger shows; the item's text when left out. */
const Item = defineComponent({
  name: "SelectItem",
  inheritAttrs: false,
  props: {
    value: { type: null as unknown as PropType<unknown>, required: true },
    disabled: optional(Boolean),
    label: String,
  },
  setup(props, { attrs, slots }) {
    // An item is its value for as long as it is in the page.
    const value = props.value
    const options = toSignal(() => ({ disabled: props.disabled, label: props.label }))
    const part = scope.use().item(value, () => defined(options.get()))
    provide(ITEM, value)
    const Element = partComponent("SelectItemElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
})

const ItemText = partComponent("SelectItemText", "span", () => scope.use().itemText(inject(ITEM)))

const ItemIndicator = defineComponent({
  name: "SelectItemIndicator",
  inheritAttrs: false,
  props: { keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const value = inject(ITEM)
    const made = scope.use()
    const selected = fromSignal(made.selected(value))
    const Element = partComponent("SelectItemIndicatorElement", "span", () =>
      made.itemIndicator(value)
    )
    return () => (selected.value || props.keepMounted ? h(Element, attrs, slots) : null)
  },
})

export const Select = {
  Root,
  Trigger: partComponent("SelectTrigger", "button", () => scope.use().trigger),
  Value,
  Portal: portalComponent("SelectPortal", () => scope.use().mounted),
  Positioner: positionerComponent(
    "SelectPositioner",
    () => scope.use(),
    partComponent("SelectPositionerElement", "div", () => scope.use().positioner)
  ),
  Popup: partComponent("SelectPopup", "div", () => scope.use().popup),
  Item,
  ItemText,
  ItemIndicator,
}
