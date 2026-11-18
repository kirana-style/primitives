import type { StateOf } from "@kirana-ui/core"
import { createForm } from "@kirana-ui/core/form"
import type { Form as Controller, FormProps as CoreProps } from "@kirana-ui/core/form"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext } from "react"
import type { ReactElement } from "react"

import { PartElement, component, useController } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** The form a field is in, if it is in one. */
export const FormContext = createContext<Controller | null>(null)

export type FormProps = PartComponentProps<"form", StateOf<Vocabulary["form"]["root"]>, CoreProps>

/** A `<form>` whose fields say what is wrong; `onFormSubmit` takes the values once all are valid. */
export const Form = /* @__PURE__ */ component(
  "Form",
  function Form({
    errors,
    onClearErrors,
    onFormSubmit,
    validationMode,
    ...rest
  }: FormProps): ReactElement {
    const controller = useController(createForm, {
      errors,
      onClearErrors,
      onFormSubmit,
      validationMode,
    })
    return (
      <FormContext.Provider value={controller}>
        <PartElement of={controller.root} tag="form" {...rest} />
      </FormContext.Provider>
    )
  }
)
