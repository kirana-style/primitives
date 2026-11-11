import type { RadioGroup } from "@kirana-ui/core/radio-group"
import { getContext, setContext } from "svelte"

const KEY = Symbol("RadioGroup")

export const provide = (controller: RadioGroup): RadioGroup => setContext(KEY, controller)

export function useRadioGroup(): RadioGroup {
  const controller = getContext<RadioGroup | undefined>(KEY)
  if (!controller) throw new Error("A RadioGroup part must be inside <RadioGroup.Root>")
  return controller
}

export const ITEM = Symbol("RadioGroupItem")
