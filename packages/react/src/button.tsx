import { createButton } from "@kirana-ui/core/button"
import type { ButtonProps as CoreProps } from "@kirana-ui/core/button"
import type { ReactElement } from "react"

import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type ButtonProps = CoreProps & PartComponentProps

/** A `<button>`, or with `render` and `nativeButton={false}` another element that acts as one. */
export function Button({
  disabled,
  focusableWhenDisabled,
  nativeButton,
  ...rest
}: ButtonProps): ReactElement {
  const controller = useController(createButton, { disabled, focusableWhenDisabled, nativeButton })
  return usePart(controller.root, "button", rest)
}
