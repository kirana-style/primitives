import type { NumberField } from "@kirana-ui/core/number-field"
import { getContext, setContext } from "svelte"

const KEY = Symbol("NumberField")

export const provide = (controller: NumberField): NumberField => setContext(KEY, controller)

export function useNumberField(): NumberField {
  const controller = getContext<NumberField | undefined>(KEY)
  if (!controller) throw new Error("A NumberField part must be inside <NumberField.Root>")
  return controller
}
