import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createInput } from "@kirana-ui/core/input"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { FieldContext } from "./field-context.ts"
import { Part, controller, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type InputProps = PartComponentProps<
  "input",
  StateOf<Vocabulary["input"]["input"]>,
  {
    disabled?: boolean
    onValueChange?: (value: string, details: ChangeDetails) => void
  }
>

/**
 * An `<input>`; `as="textarea"` for a text area. It takes what an `<input>` takes, and inside
 * a `<Field.Root>` it is the field's control.
 */
export function Input(props: InputProps): JSX.Element {
  const [local, rest] = split(props, ["disabled", "onValueChange"])
  const made = controller(
    within(createInput, { field: useContext(FieldContext) ?? undefined }),
    () => ({
      disabled: local.disabled,
      onValueChange: (value: string, details: ChangeDetails) =>
        local.onValueChange?.(value, details),
    })
  )
  return <Part of={made.input} tag="input" {...rest} />
}
