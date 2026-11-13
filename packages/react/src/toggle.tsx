import { within } from "@kirana-ui/core"
import { createToggle } from "@kirana-ui/core/toggle"
import type { Toggle as Controller, ToggleProps as CoreProps } from "@kirana-ui/core/toggle"
import { useContext } from "react"
import type { ReactElement } from "react"

import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"
import { ToggleGroupContext, ToolbarContext } from "./toolbar-context.ts"

export type ToggleProps = CoreProps & PartComponentProps

/** Inside a `<ToggleGroup>`, `value` makes it one of the group's toggles. */
export function Toggle({
  pressed,
  defaultPressed,
  onPressedChange,
  disabled,
  value,
  ...rest
}: ToggleProps): ReactElement {
  const group = useContext(ToggleGroupContext) ?? undefined
  const toolbar = useContext(ToolbarContext) ?? undefined
  const controller = useController<CoreProps, Controller>(
    within(createToggle, { group, toolbar }),
    {
      pressed,
      defaultPressed,
      onPressedChange,
      disabled,
      value,
    }
  )
  return usePart(controller.root, "button", rest)
}
