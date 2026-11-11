import { defined } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createRadioGroup } from "@kirana-ui/core/radio-group"
import type { RadioGroup as Controller } from "@kirana-ui/core/radio-group"
import { defineComponent, h, inject, onBeforeUnmount, onMounted, provide, useId } from "vue"
import type { InjectionKey, PropType } from "vue"

import { context, controller, fromSignal, optional, partComponent, toSignal } from "./runtime.ts"

const scope = context<Controller>("RadioGroup")
const ITEM: InjectionKey<unknown> = Symbol("RadioGroupItem")

const RootElement = partComponent("RadioGroupRootElement", "div", () => scope.use().root)

/** `v-model:value`, or `value` with `@value-change="(value, details) => …"`. */
const Root = defineComponent({
  name: "RadioGroupRoot",
  inheritAttrs: false,
  props: {
    value: optional(null as unknown as PropType<unknown>),
    defaultValue: { type: null as unknown as PropType<unknown>, default: null },
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    name: String,
    id: String,
  },
  emits: ["update:value", "valueChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(createRadioGroup, () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        name: props.name,
        onValueChange(value: unknown, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
})

const Item = defineComponent({
  name: "RadioGroupItem",
  inheritAttrs: false,
  props: {
    value: { type: null as unknown as PropType<unknown>, required: true },
    disabled: optional(Boolean),
  },
  setup(props, { attrs, slots }) {
    // An item is its value for as long as it is in the page.
    const value = props.value
    const options = toSignal(() => ({ disabled: props.disabled }))
    const read = () => defined(options.get())
    const group = scope.use()
    const item = group.item(value, read)
    const input = group.itemInput(value, read)
    provide(ITEM, value)
    const Element = partComponent("RadioGroupItemElement", "span", () => item)
    const Input = partComponent("RadioGroupItemInput", "input", () => input)
    return () => h(Element, attrs, () => [slots.default?.(), h(Input)])
  },
})

/** `keep-mounted` keeps the mark in the page while its item is not the chosen one. */
const Indicator = defineComponent({
  name: "RadioGroupIndicator",
  inheritAttrs: false,
  props: { keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const indicator = scope.use().indicator(inject(ITEM))
    let stop: (() => void) | undefined
    onMounted(() => {
      stop = indicator.mount()
    })
    onBeforeUnmount(() => stop?.())
    const mounted = fromSignal(indicator.mounted)
    const Element = partComponent("RadioGroupIndicatorElement", "span", () => indicator.part)
    return () => (mounted.value || props.keepMounted ? h(Element, attrs, slots) : null)
  },
})

export const RadioGroup = { Root, Item, Indicator }
