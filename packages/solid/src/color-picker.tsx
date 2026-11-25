import { within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation, StateOf } from "@kirana-ui/core"
import { createColorPicker } from "@kirana-ui/core/color-picker"
import type {
  ColorFormat,
  ColorPicker as Controller,
  ColorPickerInputChannel,
  ColorPickerProps,
  ColorPickerSliderChannel,
} from "@kirana-ui/core/color-picker"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, untrack, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { FieldContext } from "./field-context.ts"
import { Part, controller, fromSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["colorPicker"]

const Context = createContext<Controller | null>(null)

/** The channel a slider moves and the way it runs, for its track and its thumb. */
interface SliderOf {
  channel: ColorPickerSliderChannel
  orientation: Orientation
}
const SliderContext = createContext<SliderOf | null>(null)

function useColorPicker(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A ColorPicker part must be inside <ColorPicker.Root>")
  return made
}

function useSliderOf(): SliderOf {
  const slider = useContext(SliderContext)
  if (!slider)
    throw new Error("A ColorPicker slider part must be inside <ColorPicker.ChannelSlider>")
  return slider
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<ColorPickerProps, "id"> & { id?: string }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "onValueCommitted",
    "format",
    "defaultFormat",
    "onFormatChange",
    "alpha",
    "thumbAlignment",
    "disabled",
    "readOnly",
    "required",
    "name",
    "form",
    "getAriaValueText",
    "id",
    "children",
  ])
  const generated = createUniqueId()
  const made = controller(
    within(createColorPicker, {
      field: useContext(FieldContext) ?? undefined,
      direction: useContext(DirectionContext) ?? undefined,
    }),
    () => ({
      id: local.id ?? generated,
      value: local.value,
      defaultValue: local.defaultValue,
      format: local.format,
      defaultFormat: local.defaultFormat,
      alpha: local.alpha,
      thumbAlignment: local.thumbAlignment,
      disabled: local.disabled,
      readOnly: local.readOnly,
      required: local.required,
      name: local.name,
      form: local.form,
      getAriaValueText: local.getAriaValueText,
      onValueChange: (value: string, details: ChangeDetails) =>
        local.onValueChange?.(value, details),
      onValueCommitted: (value: string, details: ChangeDetails) =>
        local.onValueCommitted?.(value, details),
      onFormatChange: (format: ColorFormat, details: ChangeDetails) =>
        local.onFormatChange?.(format, details),
    })
  )
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest}>
        {local.children}
        {/* The input a form reads is the element's last child. */}
        <Part of={made.input} tag="input" />
      </Part>
    </Context>
  )
}

export type AreaProps = PartComponentProps<"div", StateOf<Parts["area"]>>
export type AreaThumbProps = PartComponentProps<"div", StateOf<Parts["areaThumb"]>>

const Area = (props: AreaProps) => <Part of={useColorPicker().area} tag="div" {...props} />
const AreaThumb = (props: AreaThumbProps) => (
  <Part of={useColorPicker().areaThumb} tag="div" {...props} />
)

export type ChannelSliderProps = PartComponentProps<
  "div",
  StateOf<Parts["channelSlider"]>,
  {
    /** The channel it moves: the hue, or the alpha. */
    channel: ColorPickerSliderChannel
    /** The way its track runs. Default `horizontal`. */
    orientation?: Orientation
  }
>

function ChannelSlider(props: ChannelSliderProps): JSX.Element {
  const [local, rest] = split(props, ["channel", "orientation"])
  // A slider is its channel and its way for as long as it is in the page.
  const of: SliderOf = untrack(() => ({
    channel: local.channel,
    orientation: local.orientation ?? "horizontal",
  }))
  const made = useColorPicker()
  return (
    <SliderContext value={of}>
      <Part of={made.channelSlider(of.channel, of.orientation)} tag="div" {...rest} />
    </SliderContext>
  )
}

export type ChannelSliderTrackProps = PartComponentProps<
  "div",
  StateOf<Parts["channelSliderTrack"]>
>
export type ChannelSliderThumbProps = PartComponentProps<
  "div",
  StateOf<Parts["channelSliderThumb"]>
>

function ChannelSliderTrack(props: ChannelSliderTrackProps): JSX.Element {
  const { channel, orientation } = useSliderOf()
  const part = useColorPicker().channelSliderTrack(channel, orientation)
  return <Part of={part} tag="div" {...props} />
}

function ChannelSliderThumb(props: ChannelSliderThumbProps): JSX.Element {
  const { channel, orientation } = useSliderOf()
  const part = useColorPicker().channelSliderThumb(channel, orientation)
  return <Part of={part} tag="div" {...props} />
}

export type ChannelInputProps = PartComponentProps<
  "input",
  StateOf<Parts["channelInput"]>,
  {
    /** The channel it is typed in, or `hex` for the whole colour. */
    channel: ColorPickerInputChannel
  }
>

// Its text is the core's own, written as the colour changes: the part's `value` holds it.
function ChannelInput(props: ChannelInputProps): JSX.Element {
  const [local, rest] = split(props, ["channel"])
  const part = useColorPicker().channelInput(untrack(() => local.channel))
  return <Part of={part} tag="input" {...rest} />
}

export type SwatchProps = PartComponentProps<"div", StateOf<Parts["swatch"]>>

const Swatch = (props: SwatchProps) => <Part of={useColorPicker().swatch} tag="div" {...props} />

export type SwatchTriggerProps = PartComponentProps<
  "button",
  StateOf<Parts["swatchTrigger"]>,
  {
    /** The preset's colour, in any format: pressed, the colour is this one. */
    value: string
  }
>

function SwatchTrigger(props: SwatchTriggerProps): JSX.Element {
  const [local, rest] = split(props, ["value"])
  const part = useColorPicker().swatchTrigger(untrack(() => local.value))
  return <Part of={part} tag="button" {...rest} />
}

export type EyeDropperTriggerProps = PartComponentProps<
  "button",
  StateOf<Parts["eyeDropperTrigger"]>
>

const EyeDropperTrigger = (props: EyeDropperTriggerProps) => (
  <Part of={useColorPicker().eyeDropperTrigger} tag="button" {...props} />
)

export type ValueTextProps = PartComponentProps<"span", StateOf<Parts["valueText"]>>

/** Says the colour in its format unless it is given children. */
function ValueText(props: ValueTextProps): JSX.Element {
  const [local, rest] = split(props, ["children"])
  const made = useColorPicker()
  const text = fromSignal(made.text)
  return (
    <Part of={made.valueText} tag="span" {...rest}>
      {local.children ?? text()}
    </Part>
  )
}

export type FormatTriggerProps = PartComponentProps<"button", StateOf<Parts["formatTrigger"]>>

/** Says the format the colour is written in unless it is given children. */
function FormatTrigger(props: FormatTriggerProps): JSX.Element {
  const [local, rest] = split(props, ["children"])
  const made = useColorPicker()
  const format = fromSignal(made.format)
  return (
    <Part of={made.formatTrigger} tag="button" {...rest}>
      {local.children ?? format()}
    </Part>
  )
}

export const ColorPicker = {
  Root,
  Area,
  AreaThumb,
  ChannelSlider,
  ChannelSliderTrack,
  ChannelSliderThumb,
  ChannelInput,
  Swatch,
  SwatchTrigger,
  EyeDropperTrigger,
  ValueText,
  FormatTrigger,
}
