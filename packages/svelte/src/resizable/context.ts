import type { Resizable } from "@kirana-ui/core/resizable"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Resizable")

export const provide = (controller: Resizable): Resizable => setContext(KEY, controller)

export function useResizable(): Resizable {
  const controller = getContext<Resizable | undefined>(KEY)
  if (!controller) throw new Error("A Resizable part must be inside <Resizable.Group>")
  return controller
}
