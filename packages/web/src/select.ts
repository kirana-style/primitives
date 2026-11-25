import { computed } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createSelect } from "@kirana-ui/core/select"
import type { Select, SelectGroup, SelectProps, SelectScrollArrow } from "@kirana-ui/core/select"

import { fieldAround, itemOptions, list, once, positioner, valueOf } from "./around.ts"
import type { Placed } from "./around.ts"
import { defineElement, partAround } from "./runtime.ts"
import type { Drawn, Each, ElementOf } from "./runtime.ts"

type Props = Omit<
  SelectProps<string, boolean>,
  "value" | "defaultValue" | "values" | "defaultValues"
> & {
  /** With `multiple`, the chosen values, with commas between. */
  value?: string | readonly string[] | null
  defaultValue?: string | readonly string[] | null
  /** @deprecated Use `value`, which holds the list with `multiple`. */
  values?: string | readonly string[]
  /** @deprecated Use `defaultValue`, which holds the list with `multiple`. */
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
 * `default-open`, `disabled`, `read-only`, `required`, `multiple` (with it, `value`
 * and `default-value` hold the chosen values with commas between), `name`, `form`, `presentation` (`sheet` opens the list from the bottom edge,
 * modal, over a `backdrop` part in the portal; `auto` on a narrow touch screen) and
 * `sheet-below`; `items`, `itemToStringLabel` and `itemToStringValue` as
 * properties; it tells `value-change`
 * and `open-change`.
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
    createSelect<string, boolean>(
      computed(() => {
        const own = props.get()
        // With `multiple`, Base UI's `value` holding the list; the older `values` still read.
        const many = <Given>(given: Given) => (own.multiple ? list(given) : given)
        return {
          ...own,
          value: many(own.value) as string | readonly string[] | null | undefined,
          defaultValue: many(own.defaultValue) as string | readonly string[] | null | undefined,
          values: list(own.values),
          defaultValues: list(own.defaultValues),
          onValueChange(value: string | string[] | null, details: ChangeDetails) {
            own.onValueChange?.(value, details)
            // The older event too: a listener cannot be told from none.
            if (own.multiple && Array.isArray(value)) own.onValuesChange?.(value, details)
          },
        }
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
    "item-indicator"(controller, element) {
      // In the page while chosen, and through its exit.
      const mark = controller.itemIndicator(valueOf(partAround(element, "item")))
      return { part: mark, mounted: mark.mounted, mount: mark.mount }
    },
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
