import type { Field } from "@kirana-ui/core/field"
import { inject, provide } from "vue"
import type { InjectionKey } from "vue"

const KEY: InjectionKey<Field> = Symbol("Field")

export const provideField = (field: Field): Field => {
  provide(KEY, field)
  return field
}

/** The field a control is in, if it is in one. */
export const useFieldAround = (): Field | undefined => inject(KEY, undefined)

export function useField(): Field {
  const field = useFieldAround()
  if (!field) throw new Error("A Field part must be inside <Field.Root>")
  return field
}
