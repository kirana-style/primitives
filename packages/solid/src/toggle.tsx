import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createToggle } from "@kirana-ui/core/toggle"
import { splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"
import { ToggleGroupContext, ToolbarContext } from "./toolbar-context.ts"

export type ToggleProps = PartComponentProps & {
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean, details: ChangeDetails) => void
  disabled?: boolean
  /** In a toggle group: what the group's value holds while this one is pressed. */
  value?: unknown
}

export function Toggle(props: ToggleProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "pressed",
    "defaultPressed",
    "onPressedChange",
    "disabled",
    "value",
  ])
  const group = useContext(ToggleGroupContext) ?? undefined
  const toolbar = useContext(ToolbarContext) ?? undefined
  const made = controller(within(createToggle, { group, toolbar }), () => ({
    pressed: local.pressed,
    defaultPressed: local.defaultPressed,
    disabled: local.disabled,
    value: local.value,
    onPressedChange: (pressed: boolean, details: ChangeDetails) =>
      local.onPressedChange?.(pressed, details),
  }))
  return <Part part={made.root} tag="button" {...rest} />
}
