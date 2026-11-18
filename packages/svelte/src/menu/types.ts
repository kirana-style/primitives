import type {
  MenuCheckboxItemProps,
  MenuItemOptions,
  MenuProps,
  MenuRadioGroupProps,
} from "@kirana-ui/core/menu"
import type { Snippet } from "svelte"

import type { PartAttributes, Placement, Renderless, StateFor } from "../types.ts"

/** It draws nothing: `bind:open` is whether the menu shows. */
export type RootProps = Renderless<MenuProps>

export type TriggerProps = PartAttributes<"button", StateFor<"menu", "trigger">>

/** Draws nothing itself: its content at the end of `<body>`, or where a `<PortalProvider>` says. */
export type PortalProps = { children?: Snippet | undefined }

export type PositionerProps = PartAttributes<"div", StateFor<"menu", "positioner">, Placement>

export type PopupProps = PartAttributes<"div", StateFor<"menu", "popup">>

export type ArrowProps = PartAttributes<"div", StateFor<"menu", "arrow">>

export type ItemProps = PartAttributes<"div", StateFor<"menu", "item">, MenuItemOptions>

/** An item that is a link: `href` and the rest go to its `<a>`. */
export type LinkItemProps = PartAttributes<"a", StateFor<"menu", "linkItem">, MenuItemOptions>

export type GroupProps = PartAttributes<
  "div",
  StateFor<"menu", "group">,
  { id?: string | undefined }
>

/** Names the group it is in. With no group around it, it is plain text. */
export type GroupLabelProps = PartAttributes<"div", StateFor<"menu", "groupLabel">>

export type SeparatorProps = PartAttributes<"div", StateFor<"menu", "separator">>

export type CheckboxItemProps = PartAttributes<
  "div",
  StateFor<"menu", "checkboxItem">,
  MenuCheckboxItemProps
>

export type CheckboxItemIndicatorProps = PartAttributes<
  "span",
  StateFor<"menu", "checkboxItemIndicator">,
  {
    /** Keeps the mark in the page while its item is unchecked. */
    keepMounted?: boolean | undefined
  }
>

/** `Value` is what a radio item's `value` is: read from `value`, `defaultValue` or `onValueChange`. */
export type RadioGroupProps<Value = unknown> = PartAttributes<
  "div",
  StateFor<"menu", "radioGroup">,
  MenuRadioGroupProps<Value>
>

export type RadioItemProps = PartAttributes<
  "div",
  StateFor<"menu", "radioItem">,
  MenuItemOptions & { value: unknown }
>

export type RadioItemIndicatorProps = PartAttributes<
  "span",
  StateFor<"menu", "radioItemIndicator">,
  {
    /** Keeps the mark in the page while its item is not the chosen one. */
    keepMounted?: boolean | undefined
  }
>

/** A menu that one of this menu's items opens. Its trigger is `<Menu.SubmenuTrigger>`. */
export type SubmenuRootProps = Renderless<MenuProps>

export type SubmenuTriggerProps = PartAttributes<"div", StateFor<"menu", "submenuTrigger">>
