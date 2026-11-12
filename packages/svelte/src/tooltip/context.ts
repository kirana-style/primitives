import type { HoverPopup } from "@kirana-ui/core/tooltip"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Tooltip")

export const provide = (controller: HoverPopup): HoverPopup => setContext(KEY, controller)

export function useTooltip(): HoverPopup {
  const controller = getContext<HoverPopup | undefined>(KEY)
  if (!controller) throw new Error("A Tooltip part must be inside <Tooltip.Root>")
  return controller
}
