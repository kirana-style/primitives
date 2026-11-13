import type { Menu, MenuCheckboxItem, MenuGroup, MenuRadioGroup } from "@kirana-ui/core/menu"
import type { Menubar } from "@kirana-ui/core/menubar"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Menu")
const GROUP = Symbol("MenuGroup")
const CHECKBOX = Symbol("MenuCheckboxItem")
const RADIO_GROUP = Symbol("MenuRadioGroup")

export const RADIO_ITEM = Symbol("MenuRadioItem")

const MENUBAR = Symbol("Menubar")

export const provideMenubar = (bar: Menubar): Menubar => setContext(MENUBAR, bar)
/** The bar a menu is one of the menus of, if it is in one. */
export const useMenubar = (): Menubar | undefined =>
  getContext<Menubar | null | undefined>(MENUBAR) ?? undefined

export function provide(controller: Menu): Menu {
  // A group around a submenu is not a group of the submenu's own items; nor is a menu written
  // inside a bar's menu one of the bar's.
  setContext(GROUP, null)
  setContext(MENUBAR, null)
  return setContext(KEY, controller)
}

export function useMenu(): Menu {
  const controller = getContext<Menu | undefined>(KEY)
  if (!controller) throw new Error("A Menu part must be inside <Menu.Root>")
  return controller
}

function inside<T>(key: symbol, parent: string): T {
  const found = getContext<T | undefined>(key)
  if (!found) throw new Error(`A Menu part must be inside <Menu.${parent}>`)
  return found
}

export const provideGroup = (group: MenuGroup): MenuGroup => setContext(GROUP, group)
export const useGroup = (): MenuGroup | null => getContext<MenuGroup | null>(GROUP) ?? null

export const provideCheckbox = (item: MenuCheckboxItem): MenuCheckboxItem =>
  setContext(CHECKBOX, item)
export const useCheckbox = (): MenuCheckboxItem => inside(CHECKBOX, "CheckboxItem")

export const provideRadioGroup = (group: MenuRadioGroup): MenuRadioGroup =>
  setContext(RADIO_GROUP, group)
export const useRadioGroup = (): MenuRadioGroup => inside(RADIO_GROUP, "RadioGroup")
