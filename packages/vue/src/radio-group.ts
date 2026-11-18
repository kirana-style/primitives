import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createRadioGroup } from "@kirana-ui/core/radio-group"
import type {
  RadioGroup as Controller,
  RadioGroupProps,
  RadioItemOptions,
} from "@kirana-ui/core/radio-group"
import { defineComponent, h, inject, onBeforeUnmount, onMounted, provide, useId } from "vue"
import type { InjectionKey, PropType, PublicProps } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { useFieldAround } from "./field-context.ts"
import { context, controller, fromSignal, optional, partComponent, toSignal } from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PartGiven,
  PartInstance,
  StatesOf,
} from "./runtime.ts"

type State = StatesOf<"radioGroup">

const scope = context<Controller>("RadioGroup")
const ITEM: InjectionKey<unknown> = Symbol("RadioGroupItem")

const RootElement = partComponent("RadioGroupRootElement", "div", () => scope.use().root)

export type RootProps<Value = unknown> = Omit<RadioGroupProps<Value>, "id" | "onValueChange"> & {
  id?: string | undefined
} & PartComponentProps

/** The value is `null` when the group is put back to none chosen. */
export type RootEmits<Value = unknown> = Changes<"value", Value | null>

/** `v-model:value`, or `value` with `@value-change="(value, details) => …"`. */
const Root = defineComponent({
  name: "RadioGroupRoot",
  inheritAttrs: false,
  props: {
    value: { type: null as unknown as PropType<unknown>, default: undefined as unknown },
    defaultValue: { type: null as unknown as PropType<unknown>, default: null as unknown },
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    name: String,
    form: String,
    id: String,
  },
  emits: ["update:value", "valueChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const field = useFieldAround()
    scope.provide(
      controller(within(createRadioGroup, { field, direction: useDirectionAround() }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        name: props.name,
        form: props.form,
        onValueChange(value: unknown, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as new <Value = unknown, As extends string = "div">(
  props: PartGiven<As, RootProps<Value>, RootEmits<Value>> & PublicProps
) => PartInstance<As, RootProps<Value>, RootEmits<Value>, { state: State["root"] }>

export interface ItemProps extends RadioItemOptions, PartComponentProps {
  /** What the group's value is while this item is the chosen one. */
  value: unknown
}

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
    const Input = partComponent("RadioGroupItemInput", "input", () => input)
    // Its native input is the element's last child, whatever element the caller asked for.
    const Element = partComponent(
      "RadioGroupItemElement",
      "span",
      () => item,
      (content) => [content, h(Input)]
    )
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"span", State["item"], ItemProps>

export interface IndicatorProps extends PartComponentProps {
  /** Keeps the mark in the page while its item is not the chosen one. */
  keepMounted?: boolean | undefined
}

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
}) as unknown as PartComponent<"span", State["indicator"], IndicatorProps>

export const RadioGroup = { Root, Item, Indicator }
