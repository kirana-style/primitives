import { within } from "@kirana-ui/core"
import type { Orientation } from "@kirana-ui/core"
import { createMenubar } from "@kirana-ui/core/menubar"
import { createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { MenubarContext } from "./menubar-context.ts"
import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** A row of menus that work as one. Each `<Menu.Root>` inside it is one of its items. */
export function Menubar(
  props: PartComponentProps & {
    loop?: boolean
    disabled?: boolean
    orientation?: Orientation
    id?: string
  }
): JSX.Element {
  const [local, rest] = splitProps(props, ["loop", "disabled", "orientation", "id"])
  const generated = createUniqueId()
  const direction = useContext(DirectionContext)
  const made = controller(within(createMenubar, { direction }), () => ({
    id: local.id ?? generated,
    loop: local.loop,
    disabled: local.disabled,
    orientation: local.orientation,
  }))
  return (
    <MenubarContext.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </MenubarContext.Provider>
  )
}
