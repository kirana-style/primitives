import { within } from "@kirana-ui/core"
import { createSlider } from "@kirana-ui/core/slider"
import type {
  Slider as Controller,
  SliderChangeDetails,
  SliderProps,
  SliderTold,
  SliderValue,
} from "@kirana-ui/core/slider"
import { defineComponent, h, useId } from "vue"
import type { PropType, PublicProps } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { written } from "./element.ts"
import { useFieldAround } from "./field-context.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PartGiven,
  PartInstance,
  StatesOf,
} from "./runtime.ts"

type State = StatesOf<"slider">

const scope = context<Controller>("Slider")

const RootElement = partComponent("SliderRootElement", "div", () => scope.use().root)

export type RootProps<Value extends SliderValue = SliderValue> = Omit<
  SliderProps,
  "id" | "value" | "defaultValue" | "onValueChange" | "onValueCommitted"
> & {
  /** One number for a slider with one thumb, a list for a range. */
  value?: Value | undefined
  defaultValue?: Value | undefined
  id?: string | undefined
} & PartComponentProps

/** What comes back is what was given: a number for one thumb, a list for a range. */
export type RootValue<Value extends SliderValue = SliderValue> = SliderTold<Value>

export type RootEmits<Value extends SliderValue = SliderValue> = Changes<
  "value",
  RootValue<Value>,
  SliderChangeDetails
> & {
  /** The change is done: the pointer was let go, or a key moved a thumb. */
  valueCommitted: (value: RootValue<Value>, details: SliderChangeDetails) => void
}

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
    thumbAlignment: String as PropType<SliderProps["thumbAlignment"]>,
    orientation: String as PropType<"horizontal" | "vertical">,
    disabled: Boolean,
    readOnly: Boolean,
    name: String,
    form: String,
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
      controller(within(createSlider, { field, direction: useDirectionAround() }), () => ({
        ...props,
        id: props.id ?? generated,
        onValueChange(value: number | number[], details: SliderChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
        onValueCommitted: (value: number | number[], details: SliderChangeDetails) =>
          emit("valueCommitted", value, details),
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as new <Value extends SliderValue = SliderValue, As extends string = "div">(
  props: PartGiven<As, RootProps<Value>, RootEmits<Value>> & PublicProps
) => PartInstance<As, RootProps<Value>, RootEmits<Value>, { state: State["root"] }>

export interface ThumbProps extends PartComponentProps {
  /** Which value of a range the thumb is, from 0; its place among the thumbs when left out. */
  index?: number | undefined
}

/** `index` is which value of a range the thumb is, from 0. */
const Thumb = defineComponent({
  name: "SliderThumb",
  inheritAttrs: false,
  props: { index: optional(Number) },
  setup(props, { attrs, slots }) {
    const slider = scope.use()
    const generated = useId()
    // A thumb is its index for as long as it is in the page. Given none, it takes its place
    // among the slider's thumbs, in the order they are written.
    const index = props.index ?? generated
    const Input = partComponent("SliderThumbInput", "input", () => slider.thumbInput(index))
    // Its native input is the element's last child, whatever element the caller asked for.
    const Element = partComponent(
      "SliderThumbElement",
      "div",
      () => slider.thumb(index),
      (content) => [content, h(Input)]
    )
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["thumb"], ThumbProps>

export type ValueProps = PartComponentProps

/** What `Slider.Value` hands its slot beside its state. */
export interface ValueGiven {
  /** The value as it is written: formatted, a range's two with a dash between. */
  text: string
  /** The values, one for each thumb. */
  values: readonly number[]
}

/** The written value, or what its slot makes of it (`v-slot="{ text, values }"`). */
const Value = defineComponent({
  name: "SliderValue",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const slider = scope.use()
    const text = fromSignal(slider.text)
    const values = fromSignal(slider.values)
    // With `as-child` the caller's element holds the text, unless it writes its own.
    const ValueElement = partComponent(
      "SliderValueElement",
      "output",
      () => slider.value,
      written(() => text.value)
    )
    return () =>
      h(ValueElement, attrs, {
        default: (given: object) =>
          slots.default?.({ ...given, text: text.value, values: values.value }) ?? text.value,
      })
  },
}) as unknown as PartComponent<"output", State["value"], ValueProps, {}, ValueGiven>

export type ControlProps = PartComponentProps
export type TrackProps = PartComponentProps
export type IndicatorProps = PartComponentProps
export const Slider = {
  Root,
  Value,
  Control: partComponent<"div", State["control"]>(
    "SliderControl",
    "div",
    () => scope.use().control
  ),
  Track: partComponent<"div", State["track"]>("SliderTrack", "div", () => scope.use().track),
  Indicator: partComponent<"div", State["indicator"]>(
    "SliderIndicator",
    "div",
    () => scope.use().indicator
  ),
  Thumb,
}
