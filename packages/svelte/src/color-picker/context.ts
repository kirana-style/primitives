import type { Orientation } from "@kirana-ui/core"
import type { ColorPicker, ColorPickerSliderChannel } from "@kirana-ui/core/color-picker"
import { getContext, setContext } from "svelte"

const KEY = Symbol("ColorPicker")

export const provide = (controller: ColorPicker): ColorPicker => setContext(KEY, controller)

export function useColorPicker(): ColorPicker {
  const controller = getContext<ColorPicker | undefined>(KEY)
  if (!controller) throw new Error("A ColorPicker part must be inside <ColorPicker.Root>")
  return controller
}

/** The channel a slider moves and the way it runs, for its track and its thumb. */
export interface SliderOf {
  channel: ColorPickerSliderChannel
  orientation: Orientation
}

const SLIDER = Symbol("ColorPickerSlider")

export const provideSlider = (slider: SliderOf): SliderOf => setContext(SLIDER, slider)

export function useSliderOf(): SliderOf {
  const slider = getContext<SliderOf | undefined>(SLIDER)
  if (!slider) throw new Error("A ColorPicker part must be inside <ColorPicker.ChannelSlider>")
  return slider
}
