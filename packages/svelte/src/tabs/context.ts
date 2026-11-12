import type { Tabs } from "@kirana-ui/core/tabs"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Tabs")

export const provide = (controller: Tabs): Tabs => setContext(KEY, controller)

export function useTabs(): Tabs {
  const controller = getContext<Tabs | undefined>(KEY)
  if (!controller) throw new Error("A Tabs part must be inside <Tabs.Root>")
  return controller
}
