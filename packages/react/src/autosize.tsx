import { createAutosize } from "@kirana-ui/core/autosize"
import type { Autosize as Controller, AutosizeProps } from "@kirana-ui/core/autosize"
import type { ReactElement } from "react"

import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** A `<textarea>` as tall as its text. It takes what a `<textarea>` takes. */
function Textarea(props: PartComponentProps): ReactElement {
  const controller = useController<AutosizeProps, Controller>(createAutosize, {
    value: props.value,
  })
  return usePart(controller.textarea, "textarea", props)
}

export const Autosize = { Textarea }
