import type { Popover } from "@kirana-ui/core/popover"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Popover")

export const provide = (controller: Popover): Popover => setContext(KEY, controller)

export function usePopover(): Popover {
  const controller = getContext<Popover | undefined>(KEY)
  if (!controller) throw new Error("A Popover part must be inside <Popover.Root>")
  return controller
}
