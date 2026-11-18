// An autocomplete is a combobox whose text is the value: its parts are a combobox's.
export { Autocomplete } from "./combobox.ts"
export type * from "./combobox.ts"
// Its root is its own: the text is the value.
export type {
  AutocompleteRootEmits as RootEmits,
  AutocompleteRootProps as RootProps,
} from "./combobox.ts"
