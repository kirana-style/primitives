import type { Listbox, ListboxGroup } from "@kirana-ui/core/listbox"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Listbox")
const GROUP = Symbol("ListboxGroup")

export const ITEM = Symbol("ListboxItem")

export const provide = (controller: Listbox): Listbox => setContext(KEY, controller)

export function useListbox(): Listbox {
  const controller = getContext<Listbox | undefined>(KEY)
  if (!controller) throw new Error("A Listbox part must be inside <Listbox.Root>")
  return controller
}

export const provideGroup = (group: ListboxGroup): ListboxGroup => setContext(GROUP, group)

export function useGroup(): ListboxGroup {
  const group = getContext<ListboxGroup | undefined>(GROUP)
  if (!group) throw new Error("A Listbox.GroupLabel must be inside <Listbox.Group>")
  return group
}
