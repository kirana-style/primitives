import type { Select } from "@kirana-ui/core/select"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Select")

export const provide = (controller: Select): Select => setContext(KEY, controller)

export function useSelect(): Select {
  const controller = getContext<Select | undefined>(KEY)
  if (!controller) throw new Error("A Select part must be inside <Select.Root>")
  return controller
}

export const ITEM = Symbol("SelectItem")
