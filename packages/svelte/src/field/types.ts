import type { FieldProps, FieldValidity, ValidityKey } from "@kirana-ui/core/field"
import type { Snippet } from "svelte"

import type { Controlled, HeldText, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<"div", StateFor<"field", "root">, Controlled<FieldProps>>

export type LabelProps = PartAttributes<"label", StateFor<"field", "label">>

/** An `<input>`; `as="textarea"` or `as="select"` for another, with that element's attributes. */
export type ControlProps<As extends "input" | "textarea" | "select" = "input"> = PartAttributes<
  As,
  StateFor<"field", "control">,
  {
    /** The element it is: an `<input>` (the default), a `<textarea>` or a `<select>`. */
    as?: As | undefined
  }
>

export type DescriptionProps = PartAttributes<"p", StateFor<"field", "description">>

/** What is wrong, or `children` in its place. In the page while it applies. */
export type ErrorProps = PartAttributes<
  "div",
  StateFor<"field", "error">,
  {
    /**
     * One of the browser's findings (`"valueMissing"`) to show for only that, or `true` to
     * show always.
     */
    match?: boolean | ValidityKey | undefined
  },
  HeldText
>

/** Draws nothing itself: `children`, a snippet, is given the field's validity. */
export type ValidityProps = { children: Snippet<[FieldValidity]> }
