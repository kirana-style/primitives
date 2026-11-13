import { defined } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createListbox } from "@kirana-ui/core/listbox"
import type { Listbox as Controller, ListboxGroup, ListboxProps } from "@kirana-ui/core/listbox"
import { defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType } from "vue"

import { context, controller, fromSignal, optional, partComponent, toSignal } from "./runtime.ts"

const scope = context<Controller>("Listbox")
const ITEM: InjectionKey<unknown> = Symbol("ListboxItem")
const GROUP: InjectionKey<ListboxGroup> = Symbol("ListboxGroup")
const ANY = null as unknown as PropType<unknown>

const RootElement = partComponent("ListboxRootElement", "div", () => scope.use().root)

/** `v-model:value` (a list); `@value-change` carries the details. */
const Root = defineComponent({
  name: "ListboxRoot",
  inheritAttrs: false,
  props: {
    value: optional(Array as PropType<readonly unknown[]>),
    defaultValue: Array as PropType<readonly unknown[]>,
    multiple: Boolean,
    disabled: Boolean,
    loop: optional(Boolean),
    name: String,
    form: String,
    virtualized: Object as PropType<ListboxProps["virtualized"]>,
    id: String,
  },
  emits: ["update:value", "valueChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(createListbox, () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        multiple: props.multiple,
        disabled: props.disabled,
        loop: props.loop,
        name: props.name,
        form: props.form,
        virtualized: props.virtualized,
        onValueChange(value: unknown[], details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
})

const Item = defineComponent({
  name: "ListboxItem",
  inheritAttrs: false,
  props: {
    value: { type: ANY, required: true },
    disabled: optional(Boolean),
    label: String,
    index: Number,
  },
  setup(props, { attrs, slots }) {
    // An item is its value for as long as it is in the page.
    const value = props.value
    const options = toSignal(() => ({
      disabled: props.disabled,
      label: props.label,
      index: props.index,
    }))
    const part = scope.use().item(value, () => defined(options.get()))
    provide(ITEM, value)
    const Element = partComponent("ListboxItemElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
})

const ItemIndicator = defineComponent({
  name: "ListboxItemIndicator",
  inheritAttrs: false,
  props: { keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const value = inject(ITEM)
    const made = scope.use()
    const selected = fromSignal(made.selected(value))
    const Element = partComponent("ListboxItemIndicatorElement", "span", () =>
      made.indicator(value)
    )
    return () => (selected.value || props.keepMounted ? h(Element, attrs, slots) : null)
  },
})

const Group = defineComponent({
  name: "ListboxGroup",
  inheritAttrs: false,
  props: { id: String },
  setup(props, { attrs, slots }) {
    const generated = useId()
    const group = scope.use().group(props.id ?? generated)
    provide(GROUP, group)
    const Element = partComponent("ListboxGroupElement", "div", () => group.root)
    return () => h(Element, attrs, slots)
  },
})

const GroupLabel = partComponent("ListboxGroupLabel", "div", () => {
  const group = inject(GROUP, undefined)
  if (!group) throw new Error("A Listbox.GroupLabel must be inside <Listbox.Group>")
  return group.label
})

export const Listbox = { Root, Item, ItemIndicator, Group, GroupLabel }
