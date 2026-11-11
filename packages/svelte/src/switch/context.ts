import type { Switch } from "@kirana-ui/core/switch"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Switch")

export const provide = (controller: Switch): Switch => setContext(KEY, controller)

export function useSwitch(): Switch {
  const controller = getContext<Switch | undefined>(KEY)
  if (!controller) throw new Error("A Switch part must be inside <Switch.Root>")
  return controller
}
