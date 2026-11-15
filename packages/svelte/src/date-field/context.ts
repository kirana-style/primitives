import type { DateField } from "@kirana-ui/core/date-field"
import { getContext, setContext } from "svelte"

const KEY = Symbol("DateField")

export const provide = (controller: DateField): DateField => setContext(KEY, controller)

export function useDateField(): DateField {
  const controller = getContext<DateField | undefined>(KEY)
  if (!controller) throw new Error("A DateField part must be inside <DateField.Root>")
  return controller
}
