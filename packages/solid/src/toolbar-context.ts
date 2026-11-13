import type { ToggleGroup } from "@kirana-ui/core/toggle-group"
import type { Toolbar } from "@kirana-ui/core/toolbar"
import { createContext } from "solid-js"

/** The toolbar a control is an item of, if it is in one. */
export const ToolbarContext = createContext<Toolbar | null>(null)
/** The group a toggle is one of the toggles of, if it is in one. */
export const ToggleGroupContext = createContext<ToggleGroup | null>(null)
