import type { FormProps as Props } from "@kirana-ui/core/form"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

/** A `<form>` whose fields say what is wrong; `onFormSubmit` takes the values once all are valid. */
export type FormProps = PartAttributes<"form", StateFor<"form", "root">, Controlled<Props>>
