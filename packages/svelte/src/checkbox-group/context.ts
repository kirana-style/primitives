import type { CheckboxGroup } from "@kirana-ui/core/checkbox-group"
import { getContext, setContext } from "svelte"

const KEY = Symbol("CheckboxGroup")

export const provide = (group: CheckboxGroup): CheckboxGroup => setContext(KEY, group)

/** The group a checkbox is one of the boxes of, if it is in one. */
export const useCheckboxGroupAround = (): CheckboxGroup | undefined =>
  getContext<CheckboxGroup | undefined>(KEY)
