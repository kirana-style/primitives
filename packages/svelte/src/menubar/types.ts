import type { MenubarProps as Props } from "@kirana-ui/core/menubar"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

/** A row of menus that work as one. Each `<Menu.Root>` inside it is one of its items. */
export type MenubarProps = PartAttributes<"div", StateFor<"menubar", "root">, Controlled<Props>>
