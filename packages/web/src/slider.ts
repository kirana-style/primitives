import { computed } from "@kirana-ui/core"
import { createSlider } from "@kirana-ui/core/slider"
import type { Slider, SliderProps } from "@kirana-ui/core/slider"

import { fieldAround, ownValue } from "./around.ts"
import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

/** A value as an attribute writes it: `"40"`, or for a range `"20,80"`. */
const read = (given: unknown): number | number[] | undefined =>
  typeof given === "string"
    ? given.includes(",")
      ? given.split(",").map(Number)
      : Number(given)
    : (given as number | number[] | undefined)

// A thumb with no `kui-index` takes its place among the slider's thumbs, in the page's order.
const at = (element: HTMLElement) =>
  element.hasAttribute("kui-index") ? Number(element.getAttribute("kui-index")) : ownValue(element)

type Props = Omit<SliderProps, "value" | "defaultValue"> & {
  value?: string | number | number[]
  defaultValue?: string | number | number[]
}

/**
 * `<kui-slider>` around `kui-part="root"`, a `value` (which says the value as it is written),
 * a `control` with its `track`, `indicator` and a `thumb` for each value, in the values'
 * order (or each with its `kui-index`). A thumb draws the hidden input a form reads. `value` and
 * `default-value` (a range with a comma), `min`, `max`, `step`, `large-step`,
 * `min-steps-between-values`, `thumb-alignment`, `orientation`, `disabled`, `name`, `form`,
 * `locale`; it tells `value-change` and `value-committed`.
 */
export const tag = defineElement<Props, Slider>({
  tag: "kui-slider",
  props: {
    value: "string",
    "default-value": "string",
    min: "number",
    max: "number",
    step: "number",
    "large-step": "number",
    "min-steps-between-values": "number",
    "thumb-alignment": "string",
    orientation: "string",
    disabled: "boolean",
    name: "string",
    form: "string",
    locale: "string",
  },
  properties: ["format", "getAriaValueText"],
  create: (props, host) =>
    createSlider(
      computed(() => {
        const own = props.get()
        return { ...own, value: read(own.value), defaultValue: read(own.defaultValue) }
      }),
      { field: fieldAround(host) }
    ),
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onValueCommitted: { event: "value-committed", prop: "value", hold: false },
  },
  parts: {
    root: (controller) => controller.root,
    value: (controller) => ({ part: controller.value, text: controller.text }),
    control: (controller) => controller.control,
    track: (controller) => controller.track,
    indicator: (controller) => controller.indicator,
    thumb: (controller, element) => ({
      part: controller.thumb(at(element)),
      inner: controller.thumbInput(at(element)),
    }),
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-slider": ElementOf<
      typeof tag,
      {
        "value-change": ["onValueChange", "value"]
        "value-committed": ["onValueCommitted", "value"]
      }
    >
  }
}
