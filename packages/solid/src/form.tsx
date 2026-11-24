import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createForm } from "@kirana-ui/core/form"
import type {
  Form as Controller,
  FormProps as CoreProps,
  FormErrors,
  FormValues,
} from "@kirana-ui/core/form"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { Part, controller, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** The form a field is in, if it is in one. */
export const FormContext = createContext<Controller | null>(null)

export type FormProps = PartComponentProps<"form", StateOf<Vocabulary["form"]["root"]>, CoreProps>

/** A `<form>` whose fields say what is wrong; `onFormSubmit` takes the values once all are valid. */
export function Form(props: FormProps): JSX.Element {
  const [local, rest] = split(props, ["errors", "onClearErrors", "onFormSubmit", "validationMode"])
  const made = controller(createForm, () => ({
    errors: local.errors,
    validationMode: local.validationMode,
    // Only when the caller takes the values: without it the form submits as a form does.
    onFormSubmit: local.onFormSubmit
      ? (values: FormValues, details: ChangeDetails) => local.onFormSubmit?.(values, details)
      : undefined,
    onClearErrors: (errors: FormErrors) => local.onClearErrors?.(errors),
  }))
  return (
    <FormContext value={made}>
      <Part of={made.root} tag="form" {...rest} />
    </FormContext>
  )
}
