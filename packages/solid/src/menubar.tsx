import { within } from "@kirana-ui/core"
import type { Orientation, StateOf } from "@kirana-ui/core"
import { createMenubar } from "@kirana-ui/core/menubar"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { MenubarContext } from "./menubar-context.ts"
import { Part, controller, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type MenubarProps = PartComponentProps<
  "div",
  StateOf<Vocabulary["menubar"]["root"]>,
  {
    loopFocus?: boolean
    /**
     * Whether the arrows wrap from the last item to the first.
     * @deprecated Base UI's name is `loopFocus`, which wins when both are given.
     */
    loop?: boolean
    disabled?: boolean
    orientation?: Orientation
    /** Holds the page while one of its menus is open. Default `false`. */
    modal?: boolean
    id?: string
  }
>

/** A row of menus that work as one. Each `<Menu.Root>` inside it is one of its items. */
export function Menubar(props: MenubarProps): JSX.Element {
  const [local, rest] = split(props, [
    "loop",
    "loopFocus",
    "disabled",
    "orientation",
    "modal",
    "id",
  ])
  const generated = createUniqueId()
  const direction = useContext(DirectionContext) ?? undefined
  const made = controller(within(createMenubar, { direction }), () => ({
    id: local.id ?? generated,
    loop: local.loop,
    loopFocus: local.loopFocus,
    disabled: local.disabled,
    orientation: local.orientation,
    modal: local.modal,
  }))
  return (
    <MenubarContext value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </MenubarContext>
  )
}
