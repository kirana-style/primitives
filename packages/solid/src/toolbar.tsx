import { defined, within } from "@kirana-ui/core"
import type { Orientation, StateOf } from "@kirana-ui/core"
import { createToolbar } from "@kirana-ui/core/toolbar"
import type { Toolbar as Controller } from "@kirana-ui/core/toolbar"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, toSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"
import { ToggleGroupContext, ToolbarContext } from "./toolbar-context.ts"

type Parts = Vocabulary["toolbar"]

function useToolbar(): Controller {
  const made = useContext(ToolbarContext)
  if (!made) throw new Error("A Toolbar part must be inside <Toolbar.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  {
    orientation?: Orientation
    loopFocus?: boolean
    /**
     * Whether the arrows wrap from the last item to the first.
     * @deprecated Base UI's name is `loopFocus`, which wins when both are given.
     */
    loop?: boolean
    disabled?: boolean
  }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, ["orientation", "loop", "loopFocus", "disabled"])
  const direction = useContext(DirectionContext) ?? undefined
  const made = controller(within(createToolbar, { direction }), () => ({
    orientation: local.orientation,
    loop: local.loop,
    loopFocus: local.loopFocus,
    disabled: local.disabled,
  }))
  return (
    <ToolbarContext value={made}>
      {/* A toggle group around the toolbar is not the group of the toolbar's toggles. */}
      <ToggleGroupContext value={null}>
        <Part of={made.root} tag="div" {...rest} />
      </ToggleGroupContext>
    </ToolbarContext>
  )
}

type ItemOptions = { disabled?: boolean }
/**
 * `focusableWhenDisabled` keeps a button or an input focusable while disabled, as Base UI's:
 * the arrows still reach it, and a press does nothing. Default `true`.
 */
type ControlOptions = ItemOptions & { focusableWhenDisabled?: boolean }

export type ButtonProps = PartComponentProps<"button", StateOf<Parts["button"]>, ControlOptions>
export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>, ControlOptions>
export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>, ItemOptions>
export type LinkProps = PartComponentProps<"a", StateOf<Parts["link"]>>
export type SeparatorProps = PartComponentProps<"div", StateOf<Parts["separator"]>>

const item =
  <Props extends ItemOptions>(name: "button" | "input" | "group", tag: string) =>
  (props: Props): JSX.Element => {
    const [local, rest] = split(props as ControlOptions, ["disabled", "focusableWhenDisabled"])
    const options = toSignal(() => ({
      disabled: local.disabled,
      focusableWhenDisabled: local.focusableWhenDisabled,
    }))
    const part = useToolbar()[name](() => defined(options.get()))
    return <Part of={part} tag={tag} {...rest} />
  }

const Link = (props: LinkProps) => <Part of={useToolbar().link()} tag="a" {...props} />
const Separator = (props: SeparatorProps) => (
  <Part of={useToolbar().separator} tag="div" {...props} />
)

export const Toolbar = {
  Root,
  Button: item<ButtonProps>("button", "button"),
  Link,
  Input: item<InputProps>("input", "input"),
  Group: item<GroupProps>("group", "div"),
  Separator,
}
