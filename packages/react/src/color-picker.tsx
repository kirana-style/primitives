import { within } from "@kirana-ui/core"
import type { Orientation, StateOf } from "@kirana-ui/core"
import { createColorPicker } from "@kirana-ui/core/color-picker"
import type {
  ColorPicker as Controller,
  ColorPickerInputChannel,
  ColorPickerProps,
  ColorPickerSliderChannel,
} from "@kirana-ui/core/color-picker"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { FieldContext } from "./field-context.ts"
import { PartElement, parts, useController, useOwnText, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["colorPicker"]

const Context = createContext<Controller | null>(null)

/** The channel a slider moves and the way it runs, for its track and its thumb. */
interface SliderOf {
  channel: ColorPickerSliderChannel
  orientation: Orientation
}
const SliderContext = createContext<SliderOf | null>(null)

function useColorPicker(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<ColorPicker.${part}> must be inside <ColorPicker.Root>`)
  return controller
}

function useSliderOf(part: string): SliderOf {
  const slider = useContext(SliderContext)
  if (!slider) throw new Error(`<ColorPicker.${part}> must be inside <ColorPicker.ChannelSlider>`)
  return slider
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<ColorPickerProps, "id"> & { id?: string }
>

function Root({
  value,
  defaultValue,
  onValueChange,
  onValueCommitted,
  format,
  defaultFormat,
  onFormatChange,
  alpha,
  thumbAlignment,
  disabled,
  readOnly,
  required,
  name,
  form,
  getAriaValueText,
  id,
  ...rest
}: RootProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const direction = useContext(DirectionContext) ?? undefined
  const create = within(createColorPicker, { field, direction })
  const controller: Controller = useController(create, {
    value,
    defaultValue,
    onValueChange,
    onValueCommitted,
    format,
    defaultFormat,
    onFormatChange,
    alpha,
    thumbAlignment,
    disabled,
    readOnly,
    required,
    name,
    form,
    getAriaValueText,
    id,
  })
  return (
    <Context.Provider value={controller}>
      {usePart(controller.root, "div", rest, undefined, (content) => (
        // The input a form reads is the element's last child, whatever element the caller asked for.
        <>
          {content}
          <PartElement of={controller.input} tag="input" />
        </>
      ))}
    </Context.Provider>
  )
}

export type AreaProps = PartComponentProps<"div", StateOf<Parts["area"]>>
export type AreaThumbProps = PartComponentProps<"div", StateOf<Parts["areaThumb"]>>

const Area = (props: AreaProps) => usePart(useColorPicker("Area").area, "div", props)
const AreaThumb = (props: AreaThumbProps) =>
  usePart(useColorPicker("AreaThumb").areaThumb, "div", props)

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

function ChannelSlider({
  channel,
  orientation = "horizontal",
  ...props
}: ChannelSliderProps): ReactElement {
  const controller = useColorPicker("ChannelSlider")
  return (
    <SliderContext.Provider value={{ channel, orientation }}>
      {usePart(controller.channelSlider(channel, orientation), "div", props)}
    </SliderContext.Provider>
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

function ChannelSliderTrack(props: ChannelSliderTrackProps): ReactElement {
  const { channel, orientation } = useSliderOf("ChannelSliderTrack")
  const controller = useColorPicker("ChannelSliderTrack")
  return usePart(controller.channelSliderTrack(channel, orientation), "div", props)
}

function ChannelSliderThumb(props: ChannelSliderThumbProps): ReactElement {
  const { channel, orientation } = useSliderOf("ChannelSliderThumb")
  const controller = useColorPicker("ChannelSliderThumb")
  return usePart(controller.channelSliderThumb(channel, orientation), "div", props)
}

export type ChannelInputProps = PartComponentProps<
  "input",
  StateOf<Parts["channelInput"]>,
  {
    /** The channel it is typed in, or `hex` for the whole colour. */
    channel: ColorPickerInputChannel
  }
>

// Its text is the core's own, written as the colour changes: given to React as a default.
function ChannelInput({ channel, ...props }: ChannelInputProps): ReactElement {
  const controller = useColorPicker("ChannelInput")
  return usePart(useOwnText(controller.channelInput(channel)), "input", props)
}

export type SwatchProps = PartComponentProps<"div", StateOf<Parts["swatch"]>>

const Swatch = (props: SwatchProps) => usePart(useColorPicker("Swatch").swatch, "div", props)

export type SwatchTriggerProps = PartComponentProps<
  "button",
  StateOf<Parts["swatchTrigger"]>,
  {
    /** The preset's colour, in any format: pressed, the colour is this one. */
    value: string
  }
>

function SwatchTrigger({ value, ...props }: SwatchTriggerProps): ReactElement {
  return usePart(useColorPicker("SwatchTrigger").swatchTrigger(value), "button", props)
}

export type EyeDropperTriggerProps = PartComponentProps<
  "button",
  StateOf<Parts["eyeDropperTrigger"]>
>

const EyeDropperTrigger = (props: EyeDropperTriggerProps) =>
  usePart(useColorPicker("EyeDropperTrigger").eyeDropperTrigger, "button", props)

export type ValueTextProps = PartComponentProps<"span", StateOf<Parts["valueText"]>>

/** Says the colour in its format unless it is given children. */
function ValueText(props: ValueTextProps): ReactElement {
  const controller = useColorPicker("ValueText")
  const text = useSignal(controller.text)
  return usePart(controller.valueText, "span", { ...props, children: props.children ?? text })
}

export type FormatTriggerProps = PartComponentProps<"button", StateOf<Parts["formatTrigger"]>>

/** Says the format the colour is written in unless it is given children. */
function FormatTrigger(props: FormatTriggerProps): ReactElement {
  const controller = useColorPicker("FormatTrigger")
  const format = useSignal(controller.format)
  return usePart(controller.formatTrigger, "button", {
    ...props,
    children: props.children ?? format,
  })
}

export const ColorPicker = /* @__PURE__ */ parts("ColorPicker", {
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
})
