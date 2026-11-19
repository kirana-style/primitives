import { createRadioGroup } from "@kirana-ui/core/radio-group"
import type { RadioGroupProps } from "@kirana-ui/core/radio-group"

import { fieldAround } from "./around.ts"
import { defineElement, partAround } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

const valueOf = (element: HTMLElement) =>
  partAround(element, "item")?.getAttribute("kui-value") ?? ""
const options = (element: HTMLElement) => () => {
  const item = partAround(element, "item")
  return {
    disabled: item?.hasAttribute("kui-disabled") || undefined,
    // The id of the item's native radio: a `<label for>` names it.
    id: item?.getAttribute("kui-id") ?? undefined,
  }
}

/**
 * `<kui-radio-group>` around `kui-part="root"` and an `item` button for each `value`, with an
 * `indicator` inside that is in the page while its item is the chosen one. An item draws the
 * hidden native radio a form and a label reach; an item's `kui-id` is that radio's id, which a
 * `<label for>` names. `value`, `default-value`, `disabled`,
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
  create: (props, host) => createRadioGroup<string>(props, { field: fieldAround(host) }),
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

declare global {
  interface HTMLElementTagNameMap {
    "kui-radio-group": ElementOf<typeof tag, { "value-change": ["onValueChange", "value"] }>
  }
}
