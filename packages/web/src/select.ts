import { computed } from "@kirana-ui/core"
import { createSelect } from "@kirana-ui/core/select"
import type { Select, SelectGroup, SelectProps, SelectScrollArrow } from "@kirana-ui/core/select"

import { fieldAround, itemOptions, MARK, once, place, valueOf } from "./around.ts"
import { defineElement, partAround } from "./runtime.ts"
import type { Drawn } from "./runtime.ts"

const groups = new WeakMap<HTMLElement, SelectGroup>()
let made = 0

const arrow = (drawn: SelectScrollArrow): Drawn => ({
  part: drawn.part,
  mounted: drawn.mounted,
  mount: () => drawn.mount(),
})

/**
 * `<kui-select>` around a `kui-part="trigger"` button holding a `value` (it says the chosen
 * item's text, or its `kui-placeholder`), and a `portal` with a `positioner` (its `kui-side`
 * and the like, and `kui-align-item-with-trigger`) around the `popup`. The popup holds an
 * `item` for each `kui-value` (`kui-disabled`, `kui-label`), each with an `item-text` and an
 * `item-indicator`; items may be in a `group` with a `group-label`, with `separator`s
 * between, and in a `list` between a `scroll-up-arrow` and a `scroll-down-arrow`. With a name
 * it draws the hidden input a form reads. `value`, `default-value`, `open`, `default-open`,
 * `disabled`, `required`, `name`, `form`; `items` as a property; it tells `value-change` and
 * `open-change`.
 */
export const tag = defineElement<SelectProps<string>, Select<string>>({
  tag: "kui-select",
  props: {
    value: "string",
    "default-value": "string",
    open: "boolean",
    "default-open": "boolean",
    disabled: "boolean",
    required: "boolean",
    name: "string",
    form: "string",
  },
  properties: ["items"],
  create: (props, host) => createSelect<string>(props, { field: fieldAround(host) }),
  inner: (controller) => ({ part: controller.input, mounted: controller.named }),
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onOpenChange: { event: "open-change", prop: "open" },
  },
  parts: {
    trigger: (controller) => controller.trigger,
    value: (controller, element) => ({
      part: controller.valuePart,
      text: computed(
        () => controller.label.get() ?? element.getAttribute("kui-placeholder") ?? undefined
      ),
    }),
    positioner(controller, element) {
      controller.alignItemWithTrigger.set(element.hasAttribute("kui-align-item-with-trigger"))
      place(controller.positioning, element)
      return { mounted: controller.mounted, part: controller.positioner }
    },
    popup: (controller) => controller.popup,
    list: (controller) => controller.list,
    "scroll-up-arrow": (controller) => arrow(controller.scrollArrow("up")),
    "scroll-down-arrow": (controller) => arrow(controller.scrollArrow("down")),
    group: (controller, element) =>
      once(groups, element, (group) =>
        controller.group(group.getAttribute("kui-id") ?? `kui-select-group-${++made}`)
      )?.root,
    // Outside a group it is plain text, and names nothing.
    "group-label": (controller, element) =>
      groups.get(partAround(element, "group")!)?.label ?? controller.groupLabel,
    separator: (controller) => controller.separator,
    item: (controller, element) => controller.item(valueOf(element), itemOptions(element)),
    "item-text": (controller, element) => controller.itemText(valueOf(partAround(element, "item"))),
    "item-indicator": (controller, element) => ({
      part: MARK,
      mounted: controller.selected(valueOf(partAround(element, "item"))),
    }),
  },
})
