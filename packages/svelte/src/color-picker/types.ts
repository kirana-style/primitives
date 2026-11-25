import type { Orientation } from "@kirana-ui/core"
import type {
  ColorPickerInputChannel,
  ColorPickerProps,
  ColorPickerSliderChannel,
} from "@kirana-ui/core/color-picker"

import type { Controlled, HeldInput, HeldText, PartAttributes, StateFor } from "../types.ts"

/**
 * `bind:value` is the colour as it is written, `bind:format` the format it is written in. With
 * `child`, the snippet is also given `input`: the hidden input a form reads the value from.
 */
export type RootProps = PartAttributes<
  "div",
  StateFor<"colorPicker", "root">,
  Controlled<ColorPickerProps>,
  HeldInput
>

export type AreaProps = PartAttributes<"div", StateFor<"colorPicker", "area">>

export type AreaThumbProps = PartAttributes<"div", StateFor<"colorPicker", "areaThumb">>

export type ChannelSliderProps = PartAttributes<
  "div",
  StateFor<"colorPicker", "channelSlider">,
  {
    /** The channel it moves: the hue, or the alpha. */
    channel: ColorPickerSliderChannel
    /** The way its track runs. Default `horizontal`. */
    orientation?: Orientation | undefined
  }
>

export type ChannelSliderTrackProps = PartAttributes<
  "div",
  StateFor<"colorPicker", "channelSliderTrack">
>

export type ChannelSliderThumbProps = PartAttributes<
  "div",
  StateFor<"colorPicker", "channelSliderThumb">
>

export type ChannelInputProps = PartAttributes<
  "input",
  StateFor<"colorPicker", "channelInput">,
  {
    /** The channel it is typed in, or `hex` for the whole colour. */
    channel: ColorPickerInputChannel
  }
>

export type SwatchProps = PartAttributes<"div", StateFor<"colorPicker", "swatch">>

export type SwatchTriggerProps = PartAttributes<
  "button",
  StateFor<"colorPicker", "swatchTrigger">,
  {
    /** The preset's colour, in any format: pressed, the colour is this one. */
    value: string
  }
>

export type EyeDropperTriggerProps = PartAttributes<
  "button",
  StateFor<"colorPicker", "eyeDropperTrigger">
>

/** Says the colour in its format unless it is given children. */
export type ValueTextProps = PartAttributes<
  "span",
  StateFor<"colorPicker", "valueText">,
  unknown,
  HeldText
>

/** Says the format the colour is written in unless it is given children. */
export type FormatTriggerProps = PartAttributes<
  "button",
  StateFor<"colorPicker", "formatTrigger">,
  unknown,
  HeldText
>
