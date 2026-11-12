import type { Field } from "@kirana-ui/core/field"
import { createContext } from "react"

/** The field a part or a control is in, if it is in one. */
export const FieldContext = createContext<Field | null>(null)
