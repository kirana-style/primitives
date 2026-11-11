import type { Collapsible } from "@kirana-ui/core/collapsible"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Collapsible")

export const provide = (controller: Collapsible): Collapsible => setContext(KEY, controller)

export function useCollapsible(): Collapsible {
  const controller = getContext<Collapsible | undefined>(KEY)
  if (!controller) throw new Error("A Collapsible part must be inside <Collapsible.Root>")
  return controller
}
