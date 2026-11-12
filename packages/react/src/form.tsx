import { createForm } from "@kirana-ui/core/form"
import type { Form as Controller, FormProps } from "@kirana-ui/core/form"
import { createContext } from "react"
import type { ReactElement } from "react"

import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** The form a field is in, if it is in one. */
export const FormContext = createContext<Controller | null>(null)

/** A `<form>` whose fields say what is wrong; `onFormSubmit` takes the values once all are valid. */
export function Form({
  errors,
  onClearErrors,
  onFormSubmit,
  validationMode,
  ...rest
}: FormProps & PartComponentProps): ReactElement {
  const controller = useController(createForm, {
    errors,
    onClearErrors,
    onFormSubmit,
    validationMode,
  })
  return (
    <FormContext.Provider value={controller}>
      <Element part={controller} {...rest} />
    </FormContext.Provider>
  )
}

const Element = ({ part, ...props }: PartComponentProps & { part: Controller }) =>
  usePart(part.root, "form", props)
