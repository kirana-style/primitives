import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createMenubar } from "@kirana-ui/core/menubar"
import type { Menubar as Controller, MenubarProps as CoreProps } from "@kirana-ui/core/menubar"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { useContext } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { MenubarContext } from "./menubar-context.ts"
import { component, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type MenubarProps = PartComponentProps<
  "div",
  StateOf<Vocabulary["menubar"]["root"]>,
  Omit<CoreProps, "id"> & { id?: string }
>

/** A row of menus that work as one. Each `<Menu.Root>` inside it is one of its items. */
export const Menubar = /* @__PURE__ */ component(
  "Menubar",
  function Menubar({
    loop,
    loopFocus,
    disabled,
    orientation,
    modal,
    id,
    ...rest
  }: MenubarProps): ReactElement {
    const direction = useContext(DirectionContext) ?? undefined
    const controller = useController<CoreProps, Controller>(within(createMenubar, { direction }), {
      loop,
      loopFocus,
      orientation,
      disabled,
      modal,
      id,
    })
    return (
      <MenubarContext.Provider value={controller}>
        {usePart(controller.root, "div", rest)}
      </MenubarContext.Provider>
    )
  }
)
