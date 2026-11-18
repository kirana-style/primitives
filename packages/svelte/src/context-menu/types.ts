import type { MenuProps } from "@kirana-ui/core/menu"

import type { PartAttributes, Renderless, StateFor } from "../types.ts"

// Its parts are a menu's, but for its root and its trigger: an area, not a button.
export type {
  ArrowProps,
  CheckboxItemIndicatorProps,
  CheckboxItemProps,
  GroupLabelProps,
  GroupProps,
  ItemProps,
  LinkItemProps,
  PopupProps,
  PortalProps,
  PositionerProps,
  RadioGroupProps,
  RadioItemIndicatorProps,
  RadioItemProps,
  SeparatorProps,
  SubmenuRootProps,
  SubmenuTriggerProps,
} from "../menu/types.ts"

/** A menu for an area of the page, opened at the pointer. It draws nothing. */
export type RootProps = Renderless<MenuProps>

/** The area a secondary press, or a long press on a touch screen, opens the menu in. */
export type TriggerProps = PartAttributes<"div", StateFor<"contextMenu", "trigger">>
