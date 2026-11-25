import type { TimeField } from "@kirana-ui/core/time-field"
import { getContext, setContext } from "svelte"

const KEY = Symbol("TimeField")

export const provide = (controller: TimeField): TimeField => setContext(KEY, controller)

export function useTimeField(): TimeField {
  const controller = getContext<TimeField | undefined>(KEY)
  if (!controller) throw new Error("A TimeField part must be inside <TimeField.Root>")
  return controller
}
