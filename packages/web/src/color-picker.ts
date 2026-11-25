import type { Orientation } from "@kirana-ui/core"
import { createColorPicker } from "@kirana-ui/core/color-picker"
import type {
  ColorPicker,
  ColorPickerInputChannel,
  ColorPickerProps,
  ColorPickerSliderChannel,
} from "@kirana-ui/core/color-picker"

import { fieldAround, valueOf } from "./around.ts"
import { defineElement, partAround } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

/** The channel a slider moves and the way it runs: its own, or the slider's around it. */
function sliderOf(element: HTMLElement): [ColorPickerSliderChannel, Orientation | undefined] {
  const slider = partAround(element, "channel-slider")
  const channel = (slider?.getAttribute("kui-channel") ?? "hue") as ColorPickerSliderChannel
  const orientation = slider?.getAttribute("kui-orientation") as Orientation | null | undefined
  return [channel, orientation ?? undefined]
}

/**
 * `<kui-color-picker>` around `kui-part="root"`, which holds an `area` with its `area-thumb`,
 * a `channel-slider` for each channel it moves (`kui-channel`: `hue` or `alpha`, and
 * `kui-orientation`) holding its `channel-slider-track` and `channel-slider-thumb`, a
 * `channel-input` for each channel typed in (`kui-channel`: `hex`, `red`, `green`, `blue`,
 * `hue`, `saturation`, `lightness`, `alpha`), `swatch`es, `swatch-trigger` buttons for presets
 * (`kui-value`), an `eye-dropper-trigger`, a `value-text` that says the colour and a
 * `format-trigger` that says its format, each unless the page wrote something. The root draws
 * the hidden input a form reads, as its last child. `value`, `default-value`, `format`,
 * `default-format`, `alpha`, `thumb-alignment`, `disabled`, `read-only`, `required`, `name`,
 * `form`; `getAriaValueText` as a property. It tells `value-change`, `value-committed` and
 * `format-change`.
 */
export const tag = defineElement<ColorPickerProps & { id: string }, ColorPicker>({
  tag: "kui-color-picker",
  props: {
    value: "string",
    "default-value": "string",
    format: "string",
    "default-format": "string",
    alpha: "boolean",
    "thumb-alignment": "string",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    name: "string",
    form: "string",
  },
  properties: ["getAriaValueText"],
  create: (props, host) => createColorPicker(props, { field: fieldAround(host) }),
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onValueCommitted: { event: "value-committed", prop: "value", hold: false },
    onFormatChange: { event: "format-change", prop: "format" },
  },
  parts: {
    root: (controller) => ({ part: controller.root, inner: controller.input }),
    area: (controller) => controller.area,
    "area-thumb": (controller) => controller.areaThumb,
    "channel-slider": (controller, element) => controller.channelSlider(...sliderOf(element)),
    "channel-slider-track": (controller, element) =>
      controller.channelSliderTrack(...sliderOf(element)),
    "channel-slider-thumb": (controller, element) =>
      controller.channelSliderThumb(...sliderOf(element)),
    // Its text is the core's, written as the colour changes.
    "channel-input": (controller, element) =>
      controller.channelInput(
        (element.getAttribute("kui-channel") ?? "hex") as ColorPickerInputChannel
      ),
    swatch: (controller) => controller.swatch,
    "swatch-trigger": (controller, element) => controller.swatchTrigger(valueOf(element)),
    "eye-dropper-trigger": (controller) => controller.eyeDropperTrigger,
    "value-text": (controller) => ({ part: controller.valueText, text: controller.text }),
    "format-trigger": (controller) => ({ part: controller.formatTrigger, text: controller.format }),
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-color-picker": ElementOf<
      typeof tag,
      {
        "value-change": ["onValueChange", "value"]
        "value-committed": ["onValueCommitted", "value"]
        "format-change": ["onFormatChange", "format"]
      }
    >
  }
}
