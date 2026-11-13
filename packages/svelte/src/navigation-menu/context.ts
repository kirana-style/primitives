import type { NavigationMenu, NavigationMenuItem } from "@kirana-ui/core/navigation-menu"
import { getContext, setContext } from "svelte"

const KEY = Symbol("NavigationMenu")
const ITEM = Symbol("NavigationMenuItem")

export const provide = (controller: NavigationMenu): NavigationMenu => setContext(KEY, controller)

export function useNavigation(): NavigationMenu {
  const controller = getContext<NavigationMenu | undefined>(KEY)
  if (!controller) throw new Error("A NavigationMenu part must be inside <NavigationMenu.Root>")
  return controller
}

export const provideItem = (item: NavigationMenuItem): NavigationMenuItem => setContext(ITEM, item)

export function useItem(): NavigationMenuItem {
  const item = getContext<NavigationMenuItem | undefined>(ITEM)
  if (!item) throw new Error("A NavigationMenu part must be inside <NavigationMenu.Item>")
  return item
}
