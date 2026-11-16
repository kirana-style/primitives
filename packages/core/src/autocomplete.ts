import { createCombobox } from "./combobox.ts"
import type { Combobox, ComboboxProps } from "./combobox.ts"
import type { Field } from "./field.ts"
import type { ChangeDetails } from "./part.ts"
import { computed } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import type { ListCollection } from "./services/list.ts"

export interface AutocompleteProps {
  id: string
  /** What the input says: the text is the value. */
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string, details: ChangeDetails) => void) | undefined
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  /**
   * `"list"` (the default): the suggestions are filtered by what is typed. `"none"`: they
   * are as the caller draws them.
   */
  mode?: "list" | "none" | undefined
  /** Whether a suggestion is shown for what was typed; `null` shows every one. */
  filter?: ((label: string, query: string) => boolean) | null | undefined
  /** Whether a press on the input opens the list. Default: it opens when something is typed. */
  openOnInputClick?: boolean | undefined
  disabled?: boolean | undefined
  required?: boolean | undefined
  /** The input's name in the form around it. */
  name?: string | undefined
  /** The id of the form the control belongs to, when it is not inside it. */
  form?: string | undefined
  /** Every row, when only some are in the page: each item is then given its `index`. */
  virtualized?: ListCollection | undefined
}

/** An autocomplete's parts are a combobox's: its input, its list, its items. */
export type Autocomplete = Combobox

/**
 * A text input with suggestions under it. The text is the value: an item chosen is written
 * into the input, nothing stays chosen, and what was typed is kept when the list closes.
 * Until an arrow goes to a suggestion, Enter is the form's, with the text as typed.
 */
export function createAutocomplete(
  props: ReadonlySignal<AutocompleteProps>,
  around: { field?: Field | undefined } = {}
): Autocomplete {
  const { field } = around
  const given = computed<ComboboxProps>(() => {
    const own = props.get()
    return {
      id: own.id,
      // Nothing is ever chosen: the text is all there is.
      value: null,
      inputValue: own.value,
      defaultInputValue: own.defaultValue,
      onInputValueChange: (text, by) => props.peek().onValueChange?.(text, by),
      open: own.open,
      defaultOpen: own.defaultOpen,
      onOpenChange: (open, by) => props.peek().onOpenChange?.(open, by),
      filter: own.mode === "none" ? null : own.filter,
      disabled: own.disabled,
      required: own.required,
      form: own.form,
      virtualized: own.virtualized,
    }
  })
  const combobox = createCombobox(given, {
    field,
    free: () => Boolean(props.peek().openOnInputClick),
  })
  return {
    ...combobox,
    input: {
      // The input is the form's own control: it carries the name itself.
      props: computed(() => ({
        ...combobox.input.props.get(),
        name: props.get().name ?? field?.name.get(),
        required: props.get().required ? "" : undefined,
      })),
      attach: (element) => combobox.input.attach(element),
    },
  }
}
