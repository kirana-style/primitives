import type { Menubar } from "@kirana-ui/core/menubar"
import type { InjectionKey } from "vue"

/** The bar a menu is one of the menus of, if it is in one. */
export const MENUBAR: InjectionKey<Menubar | null> = Symbol("Menubar")
