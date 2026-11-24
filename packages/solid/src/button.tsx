import type { StateOf } from "@kirana-ui/core"
import { createButton } from "@kirana-ui/core/button"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { splitProps } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type ButtonProps = PartComponentProps<
  "button",
  StateOf<Vocabulary["button"]["root"]>,
  {
    disabled?: boolean
    focusableWhenDisabled?: boolean
    nativeButton?: boolean
  }
>

/**
 * A `<button>`, or with `as` and `nativeButton={false}` another element that acts as one; a link
 * that navigates (`<a href>`, drawn by `render`) stays a link.
 */
export function Button(props: ButtonProps): JSX.Element {
  const [local, rest] = splitProps(props, ["disabled", "focusableWhenDisabled", "nativeButton"])
  const made = controller(createButton, () => ({ ...local }))
  return <Part of={made.root} tag="button" {...rest} />
}
