import type { Combobox } from "@kirana-ui/core/combobox"
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
