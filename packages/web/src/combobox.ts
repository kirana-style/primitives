import { computed } from "@kirana-ui/core"
import type {
  Combobox,
  ComboboxEntry,
  ComboboxGroup,
  ComboboxProps,
} from "@kirana-ui/core/combobox"
import { createCombobox } from "@kirana-ui/core/combobox"

import { fieldAround, itemOptions, list, MARK, once, positioner, valueOf } from "./around.ts"
import type { Placed } from "./around.ts"
import { defineElement, entryAround, partAround } from "./runtime.ts"
import type { Drawn, Each, ElementOf } from "./runtime.ts"

type Props = Omit<ComboboxProps<string>, "values" | "defaultValues"> & {
  values?: string | readonly string[]
  defaultValues?: string | readonly string[]
}

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
  // It says the chosen value's label, or its `kui-placeholder`, unless the page wrote there.
  value: (controller, element) => ({
    part: PLAIN,
    text: computed(
      () => controller.shown.get().label ?? element.getAttribute("kui-placeholder") ?? undefined
    ),
  }),
  status: (controller) => controller.status,
  clear: (controller) => ({ part: controller.clear, mounted: controller.clearable }),
  positioner,
  popup: (controller) => controller.popup,
  list: (controller) => controller.list,
  empty: (controller) => ({ part: controller.emptyPart, mounted: controller.empty }),
  group: (controller, element) => groupOf(controller, element)?.root,
  // Outside a group it is plain text, and names nothing.
  "group-label": (controller, element) =>
    groups.get(partAround(element, "group")!)?.label ?? controller.groupLabel,
  separator: (controller) => controller.separator,
  item(controller, element) {
    const id = element.getAttribute("kui-id") ?? `kui-combobox-item-${++made}`
    // Drawn from data, its entry says whether it can be chosen.
    const off = () => {
      const entry = entryAround<ComboboxEntry<string>>(element)
      return entry?.type === "item" && entry.disabled ? { disabled: true } : {}
    }
    return controller.item(
      valueOf(element),
      () => ({ ...itemOptions(element)(), ...off(), id }),
      groupOf(controller, element.parentElement && partAround(element.parentElement, "group"))
    )
  },
  chips: (controller) => controller.chips,
  chip(controller, element) {
    const value = entryAround<{ value: string }>(element)?.value
    return value === undefined ? undefined : controller.chip(value)
  },
  "chip-remove"(controller, element) {
    const value = entryAround<{ value: string }>(element)?.value
    return value === undefined ? undefined : controller.chipRemove(value)
  },
  "item-indicator": (controller, element) => ({
    part: MARK,
    mounted: controller.selected(valueOf(partAround(element, "item"))),
  }),
}

/** A part that draws no element of its own in a framework: here, the page's element as it is. */
const PLAIN = { props: computed(() => ({})), attach: () => () => {} }

/**
 * With `multiple`: a chip for each chosen value, from a `<template kui-each="chips">`. With
 * `items` as data: what is left of them, from a `<template kui-each="collection">`; one
 * written in a group's copy is that group's items left.
 */
export const LISTS = {
  chips: (controller: Combobox<string>): Each<{ value: string }> => ({
    entries: computed(() => controller.values.get().map((value) => ({ value }))),
    key: (chip) => chip.value,
  }),
  collection: (controller: Combobox<string>, around: unknown): Each<ComboboxEntry<string>> => {
    const group = around as ComboboxEntry<string> | undefined
    return {
      entries: controller.entries(group?.type === "group" ? group : undefined),
      key: (entry) => entry.key,
      type: (entry) => entry.type,
    }
  },
}

/**
 * `<kui-combobox>` around an `input`, with a `trigger` and a `clear` button if it has them,
 * and a `portal` with a `positioner` (`kui-side` … and `kui-anchor`, an element's id) around
 * the `popup`, which holds an `item` for each
 * `kui-value` (`kui-disabled`, `kui-label`, `kui-id`) with an `item-indicator`, in `group`s
 * with a `group-label` and `separator`s if it has them, and an `empty` part drawn while
 * nothing matches. The `input` may be inside the `popup`, the items then in a `list` part: the
 * popup is placed against the `trigger`, and the input has focus while it is open. With `multiple`, the input is in a `chips` part with a
 * `<template kui-each="chips">` holding a `chip` (`{value}`) and its `chip-remove` button.
 * With the input in the popup, the `trigger` may hold a `value` part: it says the chosen
 * value's label, or its `kui-placeholder`. A `status` part says how the list stands to
 * software that reads the page, as the page changes its text. With `items` given as data, the
 * list is a `<template kui-each="collection">` holding an `item` (`kui-value="{value}"`,
 * `{label}`; `kui-when="item"` where groups are given too) or a `group`
 * (`kui-when="group"`, `{value}` its name) with a `<template kui-each="collection">` of its
 * own for its items: the element filters, and draws what is left.
 * With a name it draws the hidden input a form reads. `value`,
 * `default-value`, `input-value`, `default-input-value`, `open`, `default-open`, `disabled`,
 * `read-only`, `required`, `inline`, `auto-highlight`, `multiple`, `values` and `default-values` (with
 * commas between),
 * `name`, `form`; `items` and `filter` as properties; it tells `value-change`,
 * `values-change`, `input-value-change` and `open-change`.
 */
export const tag = defineElement<Props, Combobox<string>>({
  tag: "kui-combobox",
  props: {
    value: "string",
    "default-value": "string",
    "input-value": "string",
    "default-input-value": "string",
    open: "boolean",
    "default-open": "boolean",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    inline: "boolean",
    "auto-highlight": "boolean",
    multiple: "boolean",
    values: "string",
    "default-values": "string",
    name: "string",
    form: "string",
  },
  properties: ["items", "filter"],
  create: (props, host) =>
    createCombobox<string>(
      computed(() => {
        const own = props.get()
        return { ...own, values: list(own.values), defaultValues: list(own.defaultValues) }
      }),
      { field: fieldAround(host) }
    ),
  lists: LISTS,
  inner: (controller) => ({ part: controller.hidden, mounted: controller.named }),
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onValuesChange: { event: "values-change", prop: "values" },
    onInputValueChange: { event: "input-value-change", prop: "inputValue" },
    onOpenChange: { event: "open-change", prop: "open" },
  },
  parts: PARTS,
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-combobox": ElementOf<
      typeof tag,
      {
        "value-change": ["onValueChange", "value"]
        "values-change": ["onValuesChange", "values"]
        "input-value-change": ["onInputValueChange", "inputValue"]
        "open-change": ["onOpenChange", "open"]
      }
    > &
      Placed
  }
}
