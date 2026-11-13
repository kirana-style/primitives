import type { ChangeDetails } from "@kirana-ui/core"
import { createCombobox } from "@kirana-ui/core/combobox"
import type { Combobox as Controller } from "@kirana-ui/core/combobox"
import { defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType } from "vue"

import { positionerComponent } from "./popover.ts"
import {
  context,
  controller,
  fromSignal,
  optional,
  partComponent,
  portalComponent,
  toSignal,
} from "./runtime.ts"

const scope = context<Controller>("Combobox")
const ITEM: InjectionKey<unknown> = Symbol("ComboboxItem")
const ANY = null as unknown as PropType<unknown>

const HiddenInput = partComponent("ComboboxHiddenInput", "input", () => scope.use().hidden)

/** `v-model:value`, `v-model:inputValue`, `v-model:open`; the `-change` events carry the details. */
const Root = defineComponent({
  name: "ComboboxRoot",
  props: {
    value: { type: ANY, default: undefined as unknown },
    defaultValue: { type: ANY, default: null as unknown },
    inputValue: String,
    defaultInputValue: String,
    open: optional(Boolean),
    defaultOpen: Boolean,
    disabled: Boolean,
    name: String,
    form: String,
    items: Array as PropType<readonly { value: unknown; label: string }[]>,
    filter: {
      type: null as unknown as PropType<((label: string, query: string) => boolean) | null>,
      default: undefined,
    },
    id: String,
  },
  emits: [
    "update:value",
    "valueChange",
    "update:inputValue",
    "inputValueChange",
    "update:open",
    "openChange",
  ],
  setup(props, { slots, emit }) {
    const generated = useId()
    const made = scope.provide(
      controller(createCombobox, () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        inputValue: props.inputValue,
        defaultInputValue: props.defaultInputValue,
        open: props.open,
        defaultOpen: props.defaultOpen,
        disabled: props.disabled,
        name: props.name,
        form: props.form,
        items: props.items,
        filter: props.filter,
        onValueChange(value: unknown, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
        onInputValueChange(value: string, details: ChangeDetails) {
          emit("inputValueChange", value, details)
          if (!details.canceled) emit("update:inputValue", value)
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

/** `label` is what is filtered and what the input shows; the item's text when left out. */
const Item = defineComponent({
  name: "ComboboxItem",
  inheritAttrs: false,
  props: {
    value: { type: ANY, required: true },
    disabled: optional(Boolean),
    label: String,
    id: String,
  },
  setup(props, { attrs, slots }) {
    // An item is its value for as long as it is in the page.
    const value = props.value
    const generated = useId()
    const options = toSignal(() => ({
      disabled: props.disabled,
      label: props.label,
      id: props.id ?? generated,
    }))
    const part = scope.use().item(value, () => options.get())
    provide(ITEM, value)
    const Element = partComponent("ComboboxItemElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
})

const ItemIndicator = defineComponent({
  name: "ComboboxItemIndicator",
  inheritAttrs: false,
  props: { keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const value = inject(ITEM)
    const made = scope.use()
    const selected = fromSignal(made.selected(value))
    const Element = partComponent("ComboboxItemIndicatorElement", "span", () =>
      made.itemIndicator(value)
    )
    return () => (selected.value || props.keepMounted ? h(Element, attrs, slots) : null)
  },
})

/** Drawn while no item is shown for what was typed. */
const Empty = defineComponent({
  name: "ComboboxEmpty",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const made = scope.use()
    const empty = fromSignal(made.empty)
    const Element = partComponent("ComboboxEmptyElement", "div", () => made.emptyPart)
    return () => (empty.value ? h(Element, attrs, slots) : null)
  },
})

export const Combobox = {
  Root,
  Input: partComponent("ComboboxInput", "input", () => scope.use().input),
  Trigger: partComponent("ComboboxTrigger", "button", () => scope.use().trigger),
  Portal: portalComponent("ComboboxPortal", () => scope.use().mounted),
  Positioner: positionerComponent(
    "ComboboxPositioner",
    () => scope.use(),
    partComponent("ComboboxPositionerElement", "div", () => scope.use().positioner)
  ),
  Popup: partComponent("ComboboxPopup", "div", () => scope.use().popup),
  Item,
  ItemIndicator,
  Empty,
}
