import { within } from "@kirana-ui/core"
import { createInput } from "@kirana-ui/core/input"
import type { Input as Controller, InputProps as CoreProps } from "@kirana-ui/core/input"
import { useContext } from "react"
import type { ReactElement } from "react"

import { FieldContext } from "./field-context.ts"
import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type InputProps = CoreProps & PartComponentProps

/**
 * An `<input>`; a `<textarea>` through `render`. It takes what an `<input>` takes (`value`,
 * `defaultValue`), and inside a `<Field.Root>` it is the field's control.
 */
export function Input({ disabled, onValueChange, ...rest }: InputProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const controller = useController<CoreProps, Controller>(within(createInput, { field }), {
    disabled,
    onValueChange,
  })
  return usePart(controller.input, "input", rest)
}
