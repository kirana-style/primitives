import type { CheckboxGroup } from "@kirana-ui/core/checkbox-group"
import type { InjectionKey } from "vue"

/** The group a checkbox is one of the boxes of, if it is in one. */
export const CHECKBOX_GROUP: InjectionKey<CheckboxGroup | null> = Symbol("CheckboxGroup")
