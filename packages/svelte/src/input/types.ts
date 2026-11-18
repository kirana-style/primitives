import type { InputProps as Props } from "@kirana-ui/core/input"

import type { PartAttributes, StateFor } from "../types.ts"

/**
 * An `<input>`; `as="textarea"` for a text area, with that element's attributes. Inside a
 * `<Field.Root>` it is the field's control.
 */
export type InputProps<As extends "input" | "textarea" = "input"> = PartAttributes<
  As,
  StateFor<"input", "input">,
  Props & {
    /** The element it is: an `<input>` (the default) or a `<textarea>`. */
    as?: As | undefined
    /** What is typed: `bind:value`. */
    value?: string | undefined
  }
>
