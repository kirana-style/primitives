import type { ToggleGroup } from "@kirana-ui/core/toggle-group"
import type { Toolbar } from "@kirana-ui/core/toolbar"
import type { InjectionKey } from "vue"

/** The toolbar a control is an item of, if it is in one. */
export const TOOLBAR: InjectionKey<Toolbar | null> = Symbol("Toolbar")
/** The group a toggle is one of the toggles of, if it is in one. */
export const TOGGLE_GROUP: InjectionKey<ToggleGroup | null> = Symbol("ToggleGroup")
