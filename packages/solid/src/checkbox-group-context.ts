import type { CheckboxGroup } from "@kirana-ui/core/checkbox-group"
import { createContext } from "solid-js"

/** The group a checkbox is one of the boxes of, if it is in one. */
export const CheckboxGroupContext = createContext<CheckboxGroup | null>(null)
