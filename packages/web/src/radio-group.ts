import { createRadioGroup } from "@kirana-ui/core/radio-group"
import type { RadioGroupProps } from "@kirana-ui/core/radio-group"

import { defineElement, partAround } from "./runtime.ts"

const valueOf = (element: HTMLElement) =>
  partAround(element, "item")?.getAttribute("kui-value") ?? ""
const options = (element: HTMLElement) => () =>
  partAround(element, "item")?.hasAttribute("kui-disabled") ? { disabled: true } : {}

/**
 * `<kui-radio-group>` around `kui-part="root"` and an `item` button for each `value`, with an
 * `indicator` inside that is in the page while its item is the chosen one. An item draws the
 * hidden native radio a form and a label reach. `value`, `default-value`, `disabled`,
 * `read-only`, `required`, `name`, `form`; it tells `value-change`.
 */
export const tag = defineElement<
  RadioGroupProps<string>,
  ReturnType<typeof createRadioGroup<string>>
>({
  tag: "kui-radio-group",
  props: {
    value: "string",
    "default-value": "string",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    name: "string",
    form: "string",
  },
  create: (props) => createRadioGroup<string>(props),
  changes: { onValueChange: { event: "value-change", prop: "value" } },
  parts: {
    root: (controller) => controller.root,
    item: (controller, element) => ({
      part: controller.item(valueOf(element), options(element)),
      inner: controller.itemInput(valueOf(element), options(element)),
    }),
    indicator: (controller, element) => controller.indicator(valueOf(element)),
  },
})
