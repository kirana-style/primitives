import { within } from "@kirana-ui/core"
import { createMenubar } from "@kirana-ui/core/menubar"
import type { Menubar as Controller, MenubarProps as CoreProps } from "@kirana-ui/core/menubar"
import { useContext } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { MenubarContext } from "./menubar-context.ts"
import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type MenubarProps = Omit<CoreProps, "id"> & { id?: string } & PartComponentProps

/** A row of menus that work as one. Each `<Menu.Root>` inside it is one of its items. */
export function Menubar({ loop, disabled, orientation, id, ...rest }: MenubarProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller = useController<CoreProps, Controller>(within(createMenubar, { direction }), {
    loop,
    orientation,
    disabled,
    id,
  })
  return (
    <MenubarContext.Provider value={controller}>
      {usePart(controller.root, "div", rest)}
    </MenubarContext.Provider>
  )
}
