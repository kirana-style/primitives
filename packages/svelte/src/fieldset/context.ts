import type { Fieldset } from "@kirana-ui/core/fieldset"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Fieldset")

export const provide = (controller: Fieldset): Fieldset => setContext(KEY, controller)

/** The fieldset a field is in, if it is in one. */
export const useFieldset = (): Fieldset | undefined => getContext<Fieldset | undefined>(KEY)
