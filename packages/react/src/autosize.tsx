import type { StateOf } from "@kirana-ui/core"
import { createAutosize } from "@kirana-ui/core/autosize"
import type { Autosize as Controller, AutosizeProps } from "@kirana-ui/core/autosize"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import type { ReactElement } from "react"

import { parts, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type TextareaProps = PartComponentProps<
  "textarea",
  StateOf<Vocabulary["autosize"]["textarea"]>
>

/** A `<textarea>` as tall as its text. It takes what a `<textarea>` takes. */
function Textarea(props: TextareaProps): ReactElement {
  const controller = useController<AutosizeProps, Controller>(createAutosize, {
    value: props.value,
  })
  return usePart(controller.textarea, "textarea", props)
}

export const Autosize = /* @__PURE__ */ parts("Autosize", { Textarea })
