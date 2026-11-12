import type { Field } from "@kirana-ui/core/field"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Field")

export const provide = (controller: Field): Field => setContext(KEY, controller)

/** The field a control is in, if it is in one. */
export const useFieldAround = (): Field | undefined => getContext<Field | undefined>(KEY)

export function useField(): Field {
  const controller = useFieldAround()
  if (!controller) throw new Error("A Field part must be inside <Field.Root>")
  return controller
}
