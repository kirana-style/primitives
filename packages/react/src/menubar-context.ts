import type { Menubar } from "@kirana-ui/core/menubar"
import { createContext } from "react"

/** The bar a menu is one of the menus of, if it is in one. */
export const MenubarContext = createContext<Menubar | null>(null)
