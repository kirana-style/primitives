import { createAutocomplete } from "@kirana-ui/core/autocomplete"
import type { AutocompleteProps } from "@kirana-ui/core/autocomplete"
import type { Combobox } from "@kirana-ui/core/combobox"

import { fieldAround } from "./around.ts"
import { PARTS } from "./combobox.ts"
import { defineElement } from "./runtime.ts"

/**
 * `<kui-autocomplete>`: a combobox whose text is the value, with a combobox's parts: the
 * list only suggests. `value`, `default-value`, `open`, `default-open`, `mode`,
 * `open-on-input-click`, `disabled`, `required`, `name`, `form`; `filter` as a property; it
 * tells `value-change` and `open-change`.
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
    disabled: "boolean",
    required: "boolean",
    name: "string",
    form: "string",
  },
  properties: ["filter"],
  create: (props, host) =>
    createAutocomplete(props, { field: fieldAround(host) }) as Combobox<string>,
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onOpenChange: { event: "open-change", prop: "open" },
  },
  parts: PARTS,
})
