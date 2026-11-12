import type { ValueBar } from "@kirana-ui/core/progress"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Progress")

export const provide = (controller: ValueBar): ValueBar => setContext(KEY, controller)

export function useProgress(): ValueBar {
  const controller = getContext<ValueBar | undefined>(KEY)
  if (!controller) throw new Error("A Progress part must be inside <Progress.Root>")
  return controller
}
