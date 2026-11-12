import type { HoverPopup } from "@kirana-ui/core/hover-card"
import { getContext, setContext } from "svelte"

const KEY = Symbol("HoverCard")

export const provide = (controller: HoverPopup): HoverPopup => setContext(KEY, controller)

export function useHoverCard(): HoverPopup {
  const controller = getContext<HoverPopup | undefined>(KEY)
  if (!controller) throw new Error("A HoverCard part must be inside <HoverCard.Root>")
  return controller
}
