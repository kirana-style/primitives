import type { Checkbox } from "@kirana-ui/core/checkbox"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Checkbox")

export const provide = (controller: Checkbox): Checkbox => setContext(KEY, controller)

export function useCheckbox(): Checkbox {
  const controller = getContext<Checkbox | undefined>(KEY)
  if (!controller) throw new Error("A Checkbox part must be inside <Checkbox.Root>")
  return controller
}
