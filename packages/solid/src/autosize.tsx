import { createAutosize } from "@kirana-ui/core/autosize"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** A `<textarea>` as tall as its text. It takes what a `<textarea>` takes. */
function Textarea(props: PartComponentProps): JSX.Element {
  const made = controller(createAutosize, () => ({ value: props.value }))
  return <Part part={made.textarea} tag="textarea" {...props} />
}

export const Autosize = { Textarea }
