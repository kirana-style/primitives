import { defined, within } from "@kirana-ui/core"
import { createToolbar } from "@kirana-ui/core/toolbar"
import type { Toolbar as Controller, ToolbarProps } from "@kirana-ui/core/toolbar"
import { useContext, useMemo } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { useController, useOptions, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"
import { ToggleGroupContext, ToolbarContext } from "./toolbar-context.ts"

function useToolbar(part: string): Controller {
  const controller = useContext(ToolbarContext)
  if (!controller) throw new Error(`<Toolbar.${part}> must be inside <Toolbar.Root>`)
  return controller
}

export type RootProps = ToolbarProps & PartComponentProps

function Root({ orientation, loop, disabled, ...rest }: RootProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller = useController<ToolbarProps, Controller>(within(createToolbar, { direction }), {
    orientation,
    loop,
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

export type ItemProps = PartComponentProps & { disabled?: boolean }

function item(name: "button" | "input" | "group", tag: string) {
  return function Item({ disabled, ...props }: ItemProps): ReactElement {
    const controller = useToolbar(name)
    const options = useOptions({ disabled })
    const part = useMemo(
      () => controller[name](() => defined(options.get())),
      [controller, options]
    )
    return usePart(part, tag, props)
  }
}

function Link(props: PartComponentProps): ReactElement {
  const controller = useToolbar("Link")
  const part = useMemo(() => controller.link(), [controller])
  return usePart(part, "a", props)
}

const Separator = (props: PartComponentProps) =>
  usePart(useToolbar("Separator").separator, "div", props)

export const Toolbar = {
  Root,
  Button: item("button", "button"),
  Link,
  Input: item("input", "input"),
  Group: item("group", "div"),
  Separator,
}
