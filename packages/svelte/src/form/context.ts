import type { Form } from "@kirana-ui/core/form"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Form")

export const provide = (controller: Form): Form => setContext(KEY, controller)

/** The form a field is in, if it is in one. */
export const useForm = (): Form | undefined => getContext<Form | undefined>(KEY)
