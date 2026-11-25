import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createToggleGroup } from "@kirana-ui/core/toggle-group"
import type {
  ToggleGroup as Controller,
  ToggleGroupProps as CoreProps,
} from "@kirana-ui/core/toggle-group"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { useContext } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { component, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"
import { ToggleGroupContext, ToolbarContext } from "./toolbar-context.ts"

/** `Value` is what tells a toggle from the others: the type of `value`'s entries. */
export type ToggleGroupProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Vocabulary["toggleGroup"]["root"]>,
  CoreProps<Value>
>

/** Toggles that are one control. Each `<Toggle value>` inside it is one of its toggles. */
export const ToggleGroup = /* @__PURE__ */ component("ToggleGroup", function ToggleGroup<
  Value = unknown,
>({ value, defaultValue, onValueChange, multiple, disabled, orientation, loop, loopFocus, ...rest }: ToggleGroupProps<Value>): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const toolbar = useContext(ToolbarContext) ?? undefined
  const controller: Controller = useController<CoreProps<Value>, Controller<Value>>(
    within(createToggleGroup<Value>, { direction, toolbar }),
    { value, defaultValue, onValueChange, multiple, disabled, orientation, loop, loopFocus }
  )
  return (
    <ToggleGroupContext.Provider value={controller}>
      {usePart(controller.root, "div", rest)}
    </ToggleGroupContext.Provider>
  )
})
