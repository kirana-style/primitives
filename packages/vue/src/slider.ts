import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createSlider } from "@kirana-ui/core/slider"
import type { Slider as Controller, SliderProps, SliderValue } from "@kirana-ui/core/slider"
import { defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { useFieldAround } from "./field-context.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"

const scope = context<Controller>("Slider")

const RootElement = partComponent("SliderRootElement", "div", () => scope.use().root)

/** `v-model:value`, or `value` with `@value-change="(value, details) => …"`. */
const Root = defineComponent({
  name: "SliderRoot",
  inheritAttrs: false,
  props: {
    value: optional([Number, Array] as PropType<SliderValue>),
    defaultValue: optional([Number, Array] as PropType<SliderValue>),
    min: Number,
    max: Number,
    step: Number,
    largeStep: Number,
    minStepsBetweenValues: Number,
    orientation: String as PropType<"horizontal" | "vertical">,
    disabled: Boolean,
    name: String,
    format: Object as PropType<Intl.NumberFormatOptions>,
    locale: String,
    getAriaValueText: Function as PropType<SliderProps["getAriaValueText"]>,
    id: String,
  },
  emits: ["update:value", "valueChange", "valueCommitted"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const field = useFieldAround()
    scope.provide(
      controller(within(createSlider, { field }), () => ({
        ...props,
        id: props.id ?? generated,
        onValueChange(value: number | number[], details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
        onValueCommitted: (value: number | number[], details: ChangeDetails) =>
          emit("valueCommitted", value, details),
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
})

/** `index` is which value of a range the thumb is, from 0. */
const Thumb = defineComponent({
  name: "SliderThumb",
  inheritAttrs: false,
  props: { index: { type: Number, default: 0 } },
  setup(props, { attrs, slots }) {
    const slider = scope.use()
    // A thumb is its index for as long as it is in the page.
    const index = props.index
    const Element = partComponent("SliderThumbElement", "div", () => slider.thumb(index))
    const Input = partComponent("SliderThumbInput", "input", () => slider.thumbInput(index))
    return () => h(Element, attrs, () => [slots.default?.(), h(Input)])
  },
})

const ValueElement = partComponent("SliderValueElement", "output", () => scope.use().value)

/** The written value, or what its slot makes of it (`v-slot="{ text, values }"`). */
const Value = defineComponent({
  name: "SliderValue",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const slider = scope.use()
    const text = fromSignal(slider.text)
    const values = fromSignal(slider.values)
    return () =>
      h(
        ValueElement,
        attrs,
        () => slots.default?.({ text: text.value, values: values.value }) ?? text.value
      )
  },
})

export const Slider = {
  Root,
  Value,
  Control: partComponent("SliderControl", "div", () => scope.use().control),
  Track: partComponent("SliderTrack", "div", () => scope.use().track),
  Indicator: partComponent("SliderIndicator", "div", () => scope.use().indicator),
  Thumb,
}
