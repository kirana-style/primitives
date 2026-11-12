import type { ValueBar } from "@kirana-ui/core/meter"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Meter")

export const provide = (controller: ValueBar): ValueBar => setContext(KEY, controller)

export function useMeter(): ValueBar {
  const controller = getContext<ValueBar | undefined>(KEY)
  if (!controller) throw new Error("A Meter part must be inside <Meter.Root>")
  return controller
}
