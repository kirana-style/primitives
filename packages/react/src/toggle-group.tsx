import { within } from "@kirana-ui/core"
import { createToggleGroup } from "@kirana-ui/core/toggle-group"
import type {
  ToggleGroup as Controller,
  ToggleGroupProps as CoreProps,
} from "@kirana-ui/core/toggle-group"
import { useContext } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"
import { ToggleGroupContext, ToolbarContext } from "./toolbar-context.ts"

export type ToggleGroupProps<Value> = CoreProps<Value> & PartComponentProps

/** Toggles that are one control. Each `<Toggle value>` inside it is one of its toggles. */
export function ToggleGroup<Value>({
  value,
  defaultValue,
  onValueChange,
  multiple,
  disabled,
  orientation,
  loop,
  ...rest
}: ToggleGroupProps<Value>): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const toolbar = useContext(ToolbarContext) ?? undefined
  const controller = useController<CoreProps<Value>, Controller<Value>>(
    within(createToggleGroup<Value>, { direction, toolbar }),
    {
      value: value as readonly Value[] | undefined,
      defaultValue: defaultValue as readonly Value[] | undefined,
      onValueChange,
      multiple,
      disabled,
      orientation,
      loop,
    }
  ) as unknown as Controller
  return (
    <ToggleGroupContext.Provider value={controller}>
      {usePart(controller.root, "div", rest)}
    </ToggleGroupContext.Provider>
  )
}
