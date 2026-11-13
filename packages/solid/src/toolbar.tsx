import { defined, within } from "@kirana-ui/core"
import type { Orientation } from "@kirana-ui/core"
import { createToolbar } from "@kirana-ui/core/toolbar"
import type { Toolbar as Controller } from "@kirana-ui/core/toolbar"
import { splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"
import { ToggleGroupContext, ToolbarContext } from "./toolbar-context.ts"

function useToolbar(): Controller {
  const made = useContext(ToolbarContext)
  if (!made) throw new Error("A Toolbar part must be inside <Toolbar.Root>")
  return made
}

function Root(
  props: PartComponentProps & { orientation?: Orientation; loop?: boolean; disabled?: boolean }
): JSX.Element {
  const [local, rest] = splitProps(props, ["orientation", "loop", "disabled"])
  const direction = useContext(DirectionContext)
  const made = controller(within(createToolbar, { direction }), () => ({
    orientation: local.orientation,
    loop: local.loop,
    disabled: local.disabled,
  }))
  return (
    <ToolbarContext.Provider value={made}>
      {/* A toggle group around the toolbar is not the group of the toolbar's toggles. */}
      <ToggleGroupContext.Provider value={null}>
        <Part part={made.root} tag="div" {...rest} />
      </ToggleGroupContext.Provider>
    </ToolbarContext.Provider>
  )
}

const item =
  (name: "button" | "input" | "group", tag: string) =>
  (props: PartComponentProps & { disabled?: boolean }): JSX.Element => {
    const [local, rest] = splitProps(props, ["disabled"])
    const options = toSignal(() => ({ disabled: local.disabled }))
    const part = useToolbar()[name](() => defined(options.get()))
    return <Part part={part} tag={tag} {...rest} />
  }

const Link = (props: PartComponentProps) => <Part part={useToolbar().link()} tag="a" {...props} />
const Separator = (props: PartComponentProps) => (
  <Part part={useToolbar().separator} tag="div" {...props} />
)

export const Toolbar = {
  Root,
  Button: item("button", "button"),
  Link,
  Input: item("input", "input"),
  Group: item("group", "div"),
  Separator,
}
