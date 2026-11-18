import type { PartAttributes, StateFor } from "../types.ts"

/** A `<textarea>` as tall as its text. It takes what a `<textarea>` takes, and `bind:value`. */
export type TextareaProps = PartAttributes<
  "textarea",
  StateFor<"autosize", "textarea">,
  {
    /** The text: `bind:value`. */
    value?: string | undefined
  }
>
