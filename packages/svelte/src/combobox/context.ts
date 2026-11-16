import type { Combobox, ComboboxGroup } from "@kirana-ui/core/combobox"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Combobox")

export const ITEM = Symbol("ComboboxItem")
export const CHIP = Symbol("ComboboxChip")

export const provide = (controller: Combobox): Combobox => setContext(KEY, controller)

export function useCombobox(): Combobox {
  const controller = getContext<Combobox | undefined>(KEY)
  if (!controller) throw new Error("A Combobox part must be inside <Combobox.Root>")
  return controller
}

const GROUP = Symbol("ComboboxGroup")

export const provideGroup = (group: ComboboxGroup): ComboboxGroup => setContext(GROUP, group)
/** The group an item or a label is in, if it is in one. */
export const useGroup = (): ComboboxGroup | undefined =>
  getContext<ComboboxGroup | undefined>(GROUP)
