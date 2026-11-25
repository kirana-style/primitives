import type { Steps } from "@kirana-ui/core/steps"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Steps")

export const provide = (controller: Steps): Steps => setContext(KEY, controller)

export function useSteps(): Steps {
  const controller = getContext<Steps | undefined>(KEY)
  if (!controller) throw new Error("A Steps part must be inside <Steps.Root>")
  return controller
}

// The step an item is, for the parts inside it.
export const ITEM = Symbol("StepsItem")

export function useIndex(part: string): number {
  const index = getContext<number | undefined>(ITEM)
  if (index === undefined) throw new Error(`<Steps.${part}> must be inside <Steps.Item>`)
  return index
}
