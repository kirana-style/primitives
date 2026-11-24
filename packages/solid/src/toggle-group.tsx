import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createToggleGroup } from "@kirana-ui/core/toggle-group"
import type { ToggleGroupProps as CoreProps } from "@kirana-ui/core/toggle-group"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"
import { ToggleGroupContext, ToolbarContext } from "./toolbar-context.ts"

/** `Value` is what a toggle's `value` is: the group's `value` holds the pressed ones. */
export type ToggleGroupProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Vocabulary["toggleGroup"]["root"]>,
  CoreProps<Value>
>

/** Toggles that are one control. Each `<Toggle value>` inside it is one of its toggles. */
export function ToggleGroup<Value = unknown>(props: ToggleGroupProps<Value>): JSX.Element {
  const [local, rest] = split(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "multiple",
    "disabled",
    "orientation",
    "loop",
  ])
  const direction = useContext(DirectionContext) ?? undefined
  const toolbar = useContext(ToolbarContext) ?? undefined
  const made = controller(within(createToggleGroup<Value>, { direction, toolbar }), () => ({
    value: local.value,
    defaultValue: local.defaultValue,
    multiple: local.multiple,
    disabled: local.disabled,
    orientation: local.orientation,
    loop: local.loop,
    onValueChange: (value: Value[], details: ChangeDetails) =>
      local.onValueChange?.(value, details),
  }))
  return (
    <ToggleGroupContext value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </ToggleGroupContext>
  )
}
