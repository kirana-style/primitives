import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createToggle } from "@kirana-ui/core/toggle"
import type { Toggle as Controller, ToggleProps as CoreProps } from "@kirana-ui/core/toggle"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { useContext } from "react"
import type { ReactElement } from "react"

import { component, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"
import { ToggleGroupContext, ToolbarContext } from "./toolbar-context.ts"

export type ToggleProps = PartComponentProps<
  "button",
  StateOf<Vocabulary["toggle"]["root"]>,
  CoreProps
>

/** Inside a `<ToggleGroup>`, `value` makes it one of the group's toggles. */
export const Toggle = /* @__PURE__ */ component(
  "Toggle",
  function Toggle({
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
)
