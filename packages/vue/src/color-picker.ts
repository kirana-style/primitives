import { within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createColorPicker } from "@kirana-ui/core/color-picker"
import type {
  ColorFormat,
  ColorPicker as Controller,
  ColorPickerInputChannel,
  ColorPickerProps,
  ColorPickerSliderChannel,
} from "@kirana-ui/core/color-picker"
import { defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { written } from "./element.ts"
import { useFieldAround } from "./field-context.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"
import type { Changes, PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"colorPicker">

const scope = context<Controller>("ColorPicker")

/** The channel a slider moves and the way it runs, for its track and its thumb. */
interface SliderOf {
  channel: ColorPickerSliderChannel
  orientation: Orientation
}
const SLIDER: InjectionKey<SliderOf> = Symbol("ColorPickerSlider")

function useSliderOf(): SliderOf {
  const slider = inject(SLIDER, undefined)
  if (!slider) throw new Error("A ColorPicker part must be inside <ColorPicker.ChannelSlider>")
  return slider
}

const Input = partComponent("ColorPickerInput", "input", () => scope.use().input)

// The input a form reads is the element's last child, whatever element was asked for.
const RootElement = partComponent(
  "ColorPickerRootElement",
  "div",
  () => scope.use().root,
  (content) => [content, h(Input)]
)

export type RootProps = Omit<
  ColorPickerProps,
  "id" | "onValueChange" | "onValueCommitted" | "onFormatChange"
> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = Changes<"value", string> &
  Changes<"format", ColorFormat> & {
    /** The pointer let go, a key moved a thumb, a typed channel was left: the value to save. */
    valueCommitted: (value: string, details: ChangeDetails) => void
  }

/** `v-model:value` and `v-model:format`, or each with its `@…-change="(value, details) => …"`. */
const Root = defineComponent({
  name: "ColorPickerRoot",
  inheritAttrs: false,
  props: {
    value: optional(String),
    defaultValue: String,
    format: optional(String as PropType<ColorFormat>),
    defaultFormat: String as PropType<ColorFormat>,
    alpha: Boolean,
    thumbAlignment: String as PropType<ColorPickerProps["thumbAlignment"]>,
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    name: String,
    form: String,
    getAriaValueText: Function as PropType<ColorPickerProps["getAriaValueText"]>,
    id: String,
  },
  emits: ["update:value", "valueChange", "valueCommitted", "update:format", "formatChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const field = useFieldAround()
    scope.provide(
      controller(within(createColorPicker, { field, direction: useDirectionAround() }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        format: props.format,
        defaultFormat: props.defaultFormat,
        alpha: props.alpha,
        thumbAlignment: props.thumbAlignment,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        name: props.name,
        form: props.form,
        getAriaValueText: props.getAriaValueText,
        onValueChange(value: string, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
        onValueCommitted: (value: string, details: ChangeDetails) =>
          emit("valueCommitted", value, details),
        onFormatChange(format: ColorFormat, details: ChangeDetails) {
          emit("formatChange", format, details)
          if (!details.canceled) emit("update:format", format)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

export interface ChannelSliderProps extends PartComponentProps {
  /** The channel it moves: the hue, or the alpha. */
  channel: ColorPickerSliderChannel
  /** The way its track runs. Default `horizontal`. */
  orientation?: Orientation | undefined
}

/** `channel` is what it moves, `hue` or `alpha`; its track and thumb are inside it. */
const ChannelSlider = defineComponent({
  name: "ColorPickerChannelSlider",
  inheritAttrs: false,
  props: {
    channel: { type: String as PropType<ColorPickerSliderChannel>, required: true },
    orientation: { type: String as PropType<Orientation>, default: "horizontal" },
  },
  setup(props, { attrs, slots }) {
    const made = scope.use()
    // A slider is its channel and its way for as long as it is in the page.
    const { channel, orientation } = props
    provide(SLIDER, { channel, orientation })
    const Element = partComponent("ColorPickerChannelSliderElement", "div", () =>
      made.channelSlider(channel, orientation)
    )
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["channelSlider"], ChannelSliderProps>

export interface ChannelInputProps extends PartComponentProps {
  /** The channel it is typed in, or `hex` for the whole colour. */
  channel: ColorPickerInputChannel
}

// Its text is the core's own, written as the colour changes, as a number field's input is.
const ChannelInput = defineComponent({
  name: "ColorPickerChannelInput",
  inheritAttrs: false,
  props: {
    channel: { type: String as PropType<ColorPickerInputChannel>, required: true },
  },
  setup(props, { attrs, slots }) {
    const made = scope.use()
    const { channel } = props
    const Element = partComponent("ColorPickerChannelInputElement", "input", () =>
      made.channelInput(channel)
    )
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"input", State["channelInput"], ChannelInputProps>

export interface SwatchTriggerProps extends PartComponentProps {
  /** The preset's colour, in any format: pressed, the colour is this one. */
  value: string
}

const SwatchTrigger = defineComponent({
  name: "ColorPickerSwatchTrigger",
  inheritAttrs: false,
  props: { value: { type: String, required: true } },
  setup(props, { attrs, slots }) {
    const made = scope.use()
    const { value } = props
    const Element = partComponent("ColorPickerSwatchTriggerElement", "button", () =>
      made.swatchTrigger(value)
    )
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"button", State["swatchTrigger"], SwatchTriggerProps>

/** Says the colour in its format unless its slot says something else. */
const ValueText = defineComponent({
  name: "ColorPickerValueText",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const made = scope.use()
    const text = fromSignal(made.text)
    // With `as-child` the caller's element holds the text, unless it writes its own.
    const Element = partComponent(
      "ColorPickerValueTextElement",
      "span",
      () => made.valueText,
      written(() => text.value)
    )
    return () =>
      h(Element, attrs, {
        default: (given: object) => slots.default?.(given) ?? text.value,
      })
  },
}) as unknown as PartComponent<"span", State["valueText"]>

/** Says the format the colour is written in unless its slot says something else. */
const FormatTrigger = defineComponent({
  name: "ColorPickerFormatTrigger",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const made = scope.use()
    const format = fromSignal(made.format)
    const Element = partComponent(
      "ColorPickerFormatTriggerElement",
      "button",
      () => made.formatTrigger,
      written(() => format.value)
    )
    return () =>
      h(Element, attrs, {
        default: (given: object) => slots.default?.(given) ?? format.value,
      })
  },
}) as unknown as PartComponent<"button", State["formatTrigger"]>

export type AreaProps = PartComponentProps
export type AreaThumbProps = PartComponentProps
export type ChannelSliderTrackProps = PartComponentProps
export type ChannelSliderThumbProps = PartComponentProps
export type SwatchProps = PartComponentProps
export type EyeDropperTriggerProps = PartComponentProps
export type ValueTextProps = PartComponentProps
export type FormatTriggerProps = PartComponentProps
export const ColorPicker = {
  Root,
  Area: partComponent<"div", State["area"]>("ColorPickerArea", "div", () => scope.use().area),
  AreaThumb: partComponent<"div", State["areaThumb"]>(
    "ColorPickerAreaThumb",
    "div",
    () => scope.use().areaThumb
  ),
  ChannelSlider,
  ChannelSliderTrack: partComponent<"div", State["channelSliderTrack"]>(
    "ColorPickerChannelSliderTrack",
    "div",
    () => {
      const { channel, orientation } = useSliderOf()
      return scope.use().channelSliderTrack(channel, orientation)
    }
  ),
  ChannelSliderThumb: partComponent<"div", State["channelSliderThumb"]>(
    "ColorPickerChannelSliderThumb",
    "div",
    () => {
      const { channel, orientation } = useSliderOf()
      return scope.use().channelSliderThumb(channel, orientation)
    }
  ),
  ChannelInput,
  Swatch: partComponent<"div", State["swatch"]>(
    "ColorPickerSwatch",
    "div",
    () => scope.use().swatch
  ),
  SwatchTrigger,
  EyeDropperTrigger: partComponent<"button", State["eyeDropperTrigger"]>(
    "ColorPickerEyeDropperTrigger",
    "button",
    () => scope.use().eyeDropperTrigger
  ),
  ValueText,
  FormatTrigger,
}
