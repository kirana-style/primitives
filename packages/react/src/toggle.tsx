import { createToggle } from "@kirana-ui/core/toggle"
import type { ToggleProps as CoreProps } from "@kirana-ui/core/toggle"
import type { ReactElement } from "react"

import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type ToggleProps = CoreProps & PartComponentProps

export function Toggle({
  pressed,
  defaultPressed,
  onPressedChange,
  disabled,
  ...rest
}: ToggleProps): ReactElement {
  const controller = useController(createToggle, {
    pressed,
    defaultPressed,
    onPressedChange,
    disabled,
  })
  return usePart(controller.root, "button", rest)
}
