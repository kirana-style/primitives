import type { ToggleGroup } from "@kirana-ui/core/toggle-group"
import type { Toolbar } from "@kirana-ui/core/toolbar"
import { getContext, setContext } from "svelte"

const TOOLBAR = Symbol("Toolbar")
const TOGGLE_GROUP = Symbol("ToggleGroup")

export function provide(controller: Toolbar): Toolbar {
  // A toggle group around the toolbar is not the group of the toolbar's toggles.
  setContext(TOGGLE_GROUP, null)
  return setContext(TOOLBAR, controller)
}

/** The toolbar a control is an item of, if it is in one. */
export const useToolbarAround = (): Toolbar | undefined =>
  getContext<Toolbar | null | undefined>(TOOLBAR) ?? undefined

export function useToolbar(): Toolbar {
  const controller = useToolbarAround()
  if (!controller) throw new Error("A Toolbar part must be inside <Toolbar.Root>")
  return controller
}

export const provideToggleGroup = (group: ToggleGroup): ToggleGroup =>
  setContext(TOGGLE_GROUP, group)
/** The group a toggle is one of the toggles of, if it is in one. */
export const useToggleGroupAround = (): ToggleGroup | undefined =>
  getContext<ToggleGroup | null | undefined>(TOGGLE_GROUP) ?? undefined
