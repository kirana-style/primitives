import type { ChangeDetails } from "@kirana-ui/core"
import { createForm } from "@kirana-ui/core/form"
import type { Form as Controller, FormErrors, FormProps, FormValues } from "@kirana-ui/core/form"
import { createContext, splitProps } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** The form a field is in, if it is in one. */
export const FormContext = createContext<Controller>()

/** A `<form>` whose fields say what is wrong; `onFormSubmit` takes the values once all are valid. */
export function Form(props: PartComponentProps & FormProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "errors",
    "onClearErrors",
    "onFormSubmit",
    "validationMode",
  ])
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
    <FormContext.Provider value={made}>
      <Part part={made.root} tag="form" {...rest} />
    </FormContext.Provider>
  )
}
