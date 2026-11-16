import type { Select, SelectGroup } from "@kirana-ui/core/select"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Select")

export const provide = (controller: Select): Select => setContext(KEY, controller)

export function useSelect(): Select {
  const controller = getContext<Select | undefined>(KEY)
  if (!controller) throw new Error("A Select part must be inside <Select.Root>")
  return controller
}

export const ITEM = Symbol("SelectItem")

const GROUP = Symbol("SelectGroup")

export const provideGroup = (group: SelectGroup): SelectGroup => setContext(GROUP, group)
/** The group a label is in, if it is in one. */
export const useGroup = (): SelectGroup | undefined => getContext<SelectGroup | undefined>(GROUP)
