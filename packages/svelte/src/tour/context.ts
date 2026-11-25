import type { Tour } from "@kirana-ui/core/tour"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Tour")

export const provide = (controller: Tour): Tour => setContext(KEY, controller)

export function useTour(): Tour {
  const controller = getContext<Tour | undefined>(KEY)
  if (!controller) throw new Error("A Tour part must be inside <Tour.Root>")
  return controller
}
