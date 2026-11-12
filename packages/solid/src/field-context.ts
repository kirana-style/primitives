import type { Field } from "@kirana-ui/core/field"
import { createContext } from "solid-js"

/** The field a part or a control is in, if it is in one. */
export const FieldContext = createContext<Field>()
