import { within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createToggleGroup } from "@kirana-ui/core/toggle-group"
import { splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"
import { ToggleGroupContext, ToolbarContext } from "./toolbar-context.ts"

export type ToggleGroupProps = PartComponentProps & {
  value?: readonly unknown[]
  defaultValue?: readonly unknown[]
  onValueChange?: (value: unknown[], details: ChangeDetails) => void
  multiple?: boolean
  disabled?: boolean
  orientation?: Orientation
  loop?: boolean
}

/** Toggles that are one control. Each `<Toggle value>` inside it is one of its toggles. */
export function ToggleGroup(props: ToggleGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "multiple",
    "disabled",
    "orientation",
    "loop",
  ])
  const direction = useContext(DirectionContext)
  const toolbar = useContext(ToolbarContext) ?? undefined
  const made = controller(within(createToggleGroup, { direction, toolbar }), () => ({
    value: local.value,
    defaultValue: local.defaultValue,
    multiple: local.multiple,
    disabled: local.disabled,
    orientation: local.orientation,
    loop: local.loop,
    onValueChange: (value: unknown[], details: ChangeDetails) =>
      local.onValueChange?.(value, details),
  }))
  return (
    <ToggleGroupContext.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </ToggleGroupContext.Provider>
  )
}
