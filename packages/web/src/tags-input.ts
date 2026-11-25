import { computed } from "@kirana-ui/core"
import { createTagsInput } from "@kirana-ui/core/tags-input"
import type { TagsInput, TagsInputEntry, TagsInputProps } from "@kirana-ui/core/tags-input"

import { fieldAround, list } from "./around.ts"
import { defineElement, entryAround } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

type Props = Omit<TagsInputProps, "value" | "defaultValue"> & {
  value?: string | readonly string[]
  defaultValue?: string | readonly string[]
}

/** Why a text was not made a tag. */
type Refusal = "duplicate" | "max" | "invalid"

/** The tag a part is in: the entry its item was stamped for. */
const keyOf = (element: HTMLElement) => entryAround<TagsInputEntry>(element)?.key

/**
 * `<kui-tags-input>` around `kui-part="root"`, which holds a `list` with a
 * `<template kui-each="items">` for a tag (`{value}` is its text, `{index}` its place): an
 * `item` holding its `item-text`, which says the tag unless the page wrote something, and
 * optionally an `item-input` to edit it in place and an `item-remove` button. Beside the list,
 * the `input` a new tag is typed in and a `clear` button. The root draws the hidden inputs a
 * form reads, as its last children. `value` and `default-value` (with commas between), `max`,
 * `allow-duplicates`, `delimiter`, `add-on-blur`, `add-on-paste`, `editable`, `disabled`,
 * `read-only`, `required`, `name`, `form`; `validate`, and `delimiter` when it is a pattern, as
 * properties. It tells `value-change`, and `value-invalid` (`detail.text`, `detail.reason`)
 * for a text that was not made a tag.
 */
export const tag = defineElement<Props, TagsInput>({
  tag: "kui-tags-input",
  props: {
    value: "string",
    "default-value": "string",
    max: "number",
    "allow-duplicates": "boolean",
    delimiter: "string",
    "add-on-blur": "boolean",
    "add-on-paste": "boolean",
    editable: "boolean",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    name: "string",
    form: "string",
  },
  properties: ["validate"],
  create: (props, host) =>
    createTagsInput(
      computed(() => {
        const own = props.get()
        return {
          ...own,
          value: list(own.value),
          defaultValue: list(own.defaultValue),
          // Told as an event of its own: its second value is a reason, not a change's details.
          onValueInvalid(text: string, reason: Refusal) {
            host.dispatchEvent(
              new CustomEvent("value-invalid", { detail: { text, reason }, bubbles: true })
            )
          },
        }
      }),
      { field: fieldAround(host) }
    ),
  changes: { onValueChange: { event: "value-change", prop: "value" } },
  lists: {
    items: (controller) => ({
      entries: controller.entries,
      key: (entry: TagsInputEntry) => entry.key,
    }),
  },
  parts: {
    root: (controller) => ({ part: controller.root, inner: controller.hiddenInput }),
    list: (controller) => controller.list,
    item(controller, element) {
      const key = keyOf(element)
      return key === undefined ? undefined : controller.item(key)
    },
    "item-text"(controller, element) {
      const entry = entryAround<TagsInputEntry>(element)
      if (!entry) return undefined
      // A tag's key holds its text: a tag whose text changes is another tag.
      const { value } = entry
      return { part: controller.itemText(entry.key), text: computed(() => value) }
    },
    "item-input"(controller, element) {
      const key = keyOf(element)
      return key === undefined ? undefined : controller.itemInput(key)
    },
    "item-remove"(controller, element) {
      const key = keyOf(element)
      return key === undefined ? undefined : controller.itemRemove(key)
    },
    input: (controller) => controller.input,
    clear: (controller) => controller.clear,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-tags-input": ElementOf<
      typeof tag,
      { "value-change": ["onValueChange", "value"] },
      { "value-invalid": CustomEvent<{ readonly text: string; readonly reason: Refusal }> }
    >
  }
}
