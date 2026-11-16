import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createInput } from "@kirana-ui/core/input"
import { splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { FieldContext } from "./field-context.ts"
import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type InputProps = PartComponentProps & {
  disabled?: boolean
  onValueChange?: (value: string, details: ChangeDetails) => void
}

/**
 * An `<input>`; `as="textarea"` for a text area. It takes what an `<input>` takes, and inside
 * a `<Field.Root>` it is the field's control.
 */
export function Input(props: InputProps): JSX.Element {
  const [local, rest] = splitProps(props, ["disabled", "onValueChange"])
  const made = controller(within(createInput, { field: useContext(FieldContext) }), () => ({
    disabled: local.disabled,
    onValueChange: (value: string, details: ChangeDetails) => local.onValueChange?.(value, details),
  }))
  return <Part part={made.input} tag="input" {...rest} />
}
