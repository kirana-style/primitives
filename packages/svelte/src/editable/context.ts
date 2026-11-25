import type { Editable } from "@kirana-ui/core/editable"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Editable")

export const provide = (controller: Editable): Editable => setContext(KEY, controller)

export function useEditable(): Editable {
  const controller = getContext<Editable | undefined>(KEY)
  if (!controller) throw new Error("A Editable part must be inside <Editable.Root>")
  return controller
}
