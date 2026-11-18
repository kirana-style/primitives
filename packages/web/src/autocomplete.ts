import { createAutocomplete } from "@kirana-ui/core/autocomplete"
import type { AutocompleteProps } from "@kirana-ui/core/autocomplete"
import type { Combobox } from "@kirana-ui/core/combobox"

import { fieldAround } from "./around.ts"
import type { Placed } from "./around.ts"
import { LISTS, PARTS } from "./combobox.ts"
import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

/**
 * `<kui-autocomplete>`: a combobox whose text is the value, with a combobox's parts: the
 * list only suggests. `value`, `default-value`, `open`, `default-open`, `mode`,
 * `open-on-input-click`, `auto-highlight`, `disabled`, `read-only`, `required`, `name`, `form`;
 * `filter` and `items` as properties (with `items`, the suggestions are a
 * `<template kui-each="collection">`, as a combobox's); it tells `value-change` and
 * `open-change`.
 */
export const tag = defineElement<AutocompleteProps, Combobox<string>>({
  tag: "kui-autocomplete",
  props: {
    value: "string",
    "default-value": "string",
    open: "boolean",
    "default-open": "boolean",
    mode: "string",
    "open-on-input-click": "boolean",
    "auto-highlight": "boolean",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    name: "string",
    form: "string",
  },
  properties: ["filter", "items"],
  create: (props, host) =>
    createAutocomplete(props, { field: fieldAround(host) }) as Combobox<string>,
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onOpenChange: { event: "open-change", prop: "open" },
  },
  lists: { collection: LISTS.collection },
  parts: PARTS,
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-autocomplete": ElementOf<
      typeof tag,
      { "value-change": ["onValueChange", "value"]; "open-change": ["onOpenChange", "open"] }
    > &
      Placed
  }
}
