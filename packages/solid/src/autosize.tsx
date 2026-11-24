import type { StateOf } from "@kirana-ui/core"
import { createAutosize } from "@kirana-ui/core/autosize"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import type { JSX } from "@solidjs/web"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type TextareaProps = PartComponentProps<
  "textarea",
  StateOf<Vocabulary["autosize"]["textarea"]>
>

/** A `<textarea>` as tall as its text. It takes what a `<textarea>` takes. */
function Textarea(props: TextareaProps): JSX.Element {
  const made = controller(createAutosize, () => ({ value: props.value }))
  return <Part of={made.textarea} tag="textarea" {...props} />
}

export const Autosize = { Textarea }
