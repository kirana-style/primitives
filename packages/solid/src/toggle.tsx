import type { ChangeDetails } from "@kirana-ui/core"
import { createToggle } from "@kirana-ui/core/toggle"
import { splitProps } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type ToggleProps = PartComponentProps & {
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean, details: ChangeDetails) => void
  disabled?: boolean
}

export function Toggle(props: ToggleProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "pressed",
    "defaultPressed",
    "onPressedChange",
    "disabled",
  ])
  const made = controller(createToggle, () => ({
    pressed: local.pressed,
    defaultPressed: local.defaultPressed,
    disabled: local.disabled,
    onPressedChange: (pressed: boolean, details: ChangeDetails) =>
      local.onPressedChange?.(pressed, details),
  }))
  return <Part part={made.root} tag="button" {...rest} />
}
