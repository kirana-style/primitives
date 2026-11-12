import { createButton } from "@kirana-ui/core/button"
import { splitProps } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type ButtonProps = PartComponentProps & {
  disabled?: boolean
  focusableWhenDisabled?: boolean
  nativeButton?: boolean
}

/** A `<button>`, or with `as` and `nativeButton={false}` another element that acts as one. */
export function Button(props: ButtonProps): JSX.Element {
  const [local, rest] = splitProps(props, ["disabled", "focusableWhenDisabled", "nativeButton"])
  const made = controller(createButton, () => ({ ...local }))
  return <Part part={made.root} tag="button" {...rest} />
}
