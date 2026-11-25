import { defined, within } from "@kirana-ui/core"
import type { Part, StateOf } from "@kirana-ui/core"
import { createToolbar } from "@kirana-ui/core/toolbar"
import type { Toolbar as Controller, ToolbarProps } from "@kirana-ui/core/toolbar"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { useContext, useMemo } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { parts, useController, useOptions, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"
import { ToggleGroupContext, ToolbarContext } from "./toolbar-context.ts"

type Parts = Vocabulary["toolbar"]

function useToolbar(part: string): Controller {
  const controller = useContext(ToolbarContext)
  if (!controller) throw new Error(`<Toolbar.${part}> must be inside <Toolbar.Root>`)
  return controller
}

export type RootProps = PartComponentProps<"div", StateOf<Parts["root"]>, ToolbarProps>

function Root({ orientation, loop, loopFocus, disabled, ...rest }: RootProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller = useController<ToolbarProps, Controller>(within(createToolbar, { direction }), {
    orientation,
    loop,
    loopFocus,
    disabled,
  })
  return (
    <ToolbarContext.Provider value={controller}>
      {/* A toggle group around the toolbar is not the group of the toolbar's toggles. */}
      <ToggleGroupContext.Provider value={null}>
        {usePart(controller.root, "div", rest)}
      </ToggleGroupContext.Provider>
    </ToolbarContext.Provider>
  )
}

/** What an item of the toolbar takes of its own. */
export interface ItemOptions {
  /** Disables this control. */
  disabled?: boolean
}

/** What a button or an input of the toolbar takes of its own. */
export interface ControlOptions extends ItemOptions {
  /**
   * Keeps it focusable while disabled, as Base UI's: the arrows still reach it, and a press does
   * nothing. Default `true`; with `false` it is disabled the element's own way.
   */
  focusableWhenDisabled?: boolean
}

export type ButtonProps = PartComponentProps<"button", StateOf<Parts["button"]>, ControlOptions>
export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>, ControlOptions>
export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>, ItemOptions>
/** @deprecated The item's own: `ButtonProps`, `InputProps` or `GroupProps`. */
export type ItemProps = PartComponentProps<"div", StateOf<Parts["group"]>, ItemOptions>

function useItem(
  name: "button" | "input" | "group",
  { disabled, focusableWhenDisabled }: ControlOptions
): Part {
  const controller = useToolbar(name)
  const options = useOptions({ disabled, focusableWhenDisabled })
  return useMemo(() => controller[name](() => defined(options.get())), [controller, name, options])
}

function Button({ disabled, focusableWhenDisabled, ...props }: ButtonProps): ReactElement {
  return usePart(useItem("button", { disabled, focusableWhenDisabled }), "button", props)
}

function Input({ disabled, focusableWhenDisabled, ...props }: InputProps): ReactElement {
  return usePart(useItem("input", { disabled, focusableWhenDisabled }), "input", props)
}

function Group({ disabled, ...props }: GroupProps): ReactElement {
  return usePart(useItem("group", { disabled }), "div", props)
}

export type LinkProps = PartComponentProps<"a", StateOf<Parts["link"]>>

function Link(props: LinkProps): ReactElement {
  const controller = useToolbar("Link")
  const part = useMemo(() => controller.link(), [controller])
  return usePart(part, "a", props)
}

export type SeparatorProps = PartComponentProps<"div", StateOf<Parts["separator"]>>

const Separator = (props: SeparatorProps) =>
  usePart(useToolbar("Separator").separator, "div", props)

export const Toolbar = /* @__PURE__ */ parts("Toolbar", {
  Root,
  Button,
  Link,
  Input,
  Group,
  Separator,
})
