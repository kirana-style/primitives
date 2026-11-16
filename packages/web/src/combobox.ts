import type { Combobox, ComboboxGroup, ComboboxProps } from "@kirana-ui/core/combobox"
import { createCombobox } from "@kirana-ui/core/combobox"

import { fieldAround, itemOptions, MARK, once, place, valueOf } from "./around.ts"
import { partAround, defineElement } from "./runtime.ts"
import type { Drawn } from "./runtime.ts"

const groups = new WeakMap<HTMLElement, ComboboxGroup>()
let made = 0

const groupOf = (controller: Combobox<string>, element: HTMLElement | null) =>
  once(groups, element, (group) =>
    controller.group(group.getAttribute("kui-id") ?? `kui-combobox-group-${++made}`)
  )

type Parts = Record<
  string,
  (controller: Combobox<string>, element: HTMLElement) => Drawn["part"] | Drawn | undefined
>

/** A combobox's parts: an autocomplete has them too. */
export const PARTS: Parts = {
  input: (controller) => controller.input,
  trigger: (controller) => controller.trigger,
  clear: (controller) => ({ part: controller.clear, mounted: controller.clearable }),
  positioner(controller, element) {
    place(controller.positioning, element)
    return { mounted: controller.mounted, part: controller.positioner }
  },
  popup: (controller) => controller.popup,
  empty: (controller) => ({ part: controller.emptyPart, mounted: controller.empty }),
  group: (controller, element) => groupOf(controller, element)?.root,
  // Outside a group it is plain text, and names nothing.
  "group-label": (controller, element) =>
    groups.get(partAround(element, "group")!)?.label ?? controller.groupLabel,
  separator: (controller) => controller.separator,
  item(controller, element) {
    const id = element.getAttribute("kui-id") ?? `kui-combobox-item-${++made}`
    return controller.item(
      valueOf(element),
      () => ({ ...itemOptions(element)(), id }),
      groupOf(controller, element.parentElement && partAround(element.parentElement, "group"))
    )
  },
  "item-indicator": (controller, element) => ({
    part: MARK,
    mounted: controller.selected(valueOf(partAround(element, "item"))),
  }),
}

/**
 * `<kui-combobox>` around an `input`, with a `trigger` and a `clear` button if it has them,
 * and a `portal` with a `positioner` around the `popup`, which holds an `item` for each
 * `kui-value` (`kui-disabled`, `kui-label`, `kui-id`) with an `item-indicator`, in `group`s
 * with a `group-label` and `separator`s if it has them, and an `empty` part drawn while
 * nothing matches. With a name it draws the hidden input a form reads. `value`,
 * `default-value`, `input-value`, `default-input-value`, `open`, `default-open`, `disabled`,
 * `required`, `inline`, `name`, `form`; `items` and `filter` as properties; it tells
 * `value-change`, `input-value-change` and `open-change`.
 */
export const tag = defineElement<ComboboxProps<string>, Combobox<string>>({
  tag: "kui-combobox",
  props: {
    value: "string",
    "default-value": "string",
    "input-value": "string",
    "default-input-value": "string",
    open: "boolean",
    "default-open": "boolean",
    disabled: "boolean",
    required: "boolean",
    inline: "boolean",
    name: "string",
    form: "string",
  },
  properties: ["items", "filter"],
  create: (props, host) => createCombobox<string>(props, { field: fieldAround(host) }),
  inner: (controller) => ({ part: controller.hidden, mounted: controller.named }),
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onInputValueChange: { event: "input-value-change", prop: "inputValue" },
    onOpenChange: { event: "open-change", prop: "open" },
  },
  parts: PARTS,
})
