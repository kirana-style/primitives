import type { Field } from "@kirana-ui/core/field"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Field")

export const provide = (controller: Field): Field => setContext(KEY, controller)

export function useField(): Field {
  const controller = getContext<Field | undefined>(KEY)
  if (!controller) throw new Error("A Field part must be inside <Field.Root>")
  return controller
}
