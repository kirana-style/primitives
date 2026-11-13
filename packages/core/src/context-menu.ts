import { createMenu } from "./menu.ts"
import type { Menu, MenuProps } from "./menu.ts"
import type { DirectionAround } from "./direction.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export type ContextMenuProps = MenuProps
export type ContextMenu = Menu

/**
 * A menu for an area of the page: a secondary press in the area, or a long press on a touch
 * screen, opens it at the pointer in place of the browser's own. Its trigger is the menu's
 * `area`; its other parts are a menu's.
 */
export const createContextMenu = (
  props: ReadonlySignal<ContextMenuProps>,
  around: DirectionAround = {}
): ContextMenu => createMenu(props, { ...around, context: true })
