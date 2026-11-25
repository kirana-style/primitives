import { computed } from "@kirana-ui/core"
import { createSelect } from "@kirana-ui/core/select"
import type { Select, SelectGroup, SelectProps, SelectScrollArrow } from "@kirana-ui/core/select"

import { fieldAround, itemOptions, list, MARK, once, positioner, valueOf } from "./around.ts"
import type { Placed } from "./around.ts"
import { defineElement, partAround } from "./runtime.ts"
import type { Drawn, Each, ElementOf } from "./runtime.ts"

type Props = Omit<SelectProps<string>, "values" | "defaultValues"> & {
  values?: string | readonly string[]
  defaultValues?: string | readonly string[]
}

const groups = new WeakMap<HTMLElement, SelectGroup>()
let made = 0

const arrow = (drawn: SelectScrollArrow): Drawn => ({
  part: drawn.part,
  mounted: drawn.mounted,
  mount: () => drawn.mount(),
})

/**
 * `<kui-select>` around a `kui-part="trigger"` button holding a `value` (it says the chosen
 * item's text, or its `kui-placeholder`; with `multiple`, the chosen items' texts with commas
 * between), and a `portal` with a `positioner` (its `kui-side`
 * and the like, and `kui-align-item-with-trigger`) around the `popup`. The popup holds an
 * `item` for each `kui-value` (`kui-disabled`, `kui-label`), each with an `item-text` and an
 * `item-indicator`; items may be in a `group` with a `group-label`, with `separator`s
 * between, and in a `list` between a `scroll-up-arrow` and a `scroll-down-arrow`. With a name
 * it draws the hidden input a form reads. A `value` part that holds something says what the
 * page wrote there: a `<template kui-each="values">` in it is drawn for each chosen value
 * (`{value}`, `{label}`), in the items' order. `value`, `default-value`, `open`,
 * `default-open`, `disabled`, `read-only`, `required`, `multiple`, `values` and `default-values` (with
 * commas between), `name`, `form`, `presentation` (`sheet` opens the list from the bottom edge,
 * modal, over a `backdrop` part in the portal; `auto` on a narrow touch screen) and
 * `sheet-below`; `items`, `itemToStringLabel` and `itemToStringValue` as
 * properties; it tells `value-change`,
 * `values-change` and `open-change`.
 */
export const tag = defineElement<Props, Select<string>>({
  tag: "kui-select",
  props: {
    value: "string",
    "default-value": "string",
    open: "boolean",
    "default-open": "boolean",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    multiple: "boolean",
    values: "string",
    "default-values": "string",
    name: "string",
    form: "string",
    presentation: "string",
    "sheet-below": "number",
  },
  properties: ["items", "itemToStringLabel", "itemToStringValue"],
  create: (props, host) =>
    createSelect<string>(
      computed(() => {
        const own = props.get()
        return { ...own, values: list(own.values), defaultValues: list(own.defaultValues) }
      }),
      { field: fieldAround(host) }
    ),
  lists: {
    values: (controller): Each<{ value: string; label: string }> => ({
      entries: computed(() => {
        const { values, labels } = controller.shown.get()
        return values.map((value, at) => ({ value, label: labels[at] ?? value }))
      }),
      key: (chosen) => chosen.value,
    }),
  },
  inner: (controller) => ({ part: controller.input, mounted: controller.named }),
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onValuesChange: { event: "values-change", prop: "values" },
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
      return positioner(controller, element)
    },
    popup: (controller) => controller.popup,
    backdrop: (controller) => controller.backdrop,
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

declare global {
  interface HTMLElementTagNameMap {
    "kui-select": ElementOf<
      typeof tag,
      {
        "value-change": ["onValueChange", "value"]
        "values-change": ["onValuesChange", "values"]
        "open-change": ["onOpenChange", "open"]
      }
    > &
      Placed
  }
}
