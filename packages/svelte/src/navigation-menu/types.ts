import type {
  NavigationMenuLinkOptions,
  NavigationMenuProps,
} from "@kirana-ui/core/navigation-menu"
import type { Snippet } from "svelte"

import type { Controlled, PartAttributes, Placement, StateFor } from "../types.ts"

/** `Value` is what an item's `value` is: read from `value`, `defaultValue` or `onValueChange`. */
export type RootProps<Value = unknown> = PartAttributes<
  "nav",
  StateFor<"navigationMenu", "root">,
  Controlled<NavigationMenuProps<Value>>
>

export type ListProps = PartAttributes<"ul", StateFor<"navigationMenu", "list">>

export type ItemProps = PartAttributes<
  "li",
  StateFor<"navigationMenu", "item">,
  {
    /** What tells this item from the others; an item that is given none makes its own. */
    value?: unknown
  }
>

export type TriggerProps = PartAttributes<"button", StateFor<"navigationMenu", "trigger">>

export type IconProps = PartAttributes<"span", StateFor<"navigationMenu", "icon">>

/** An item's content: drawn in `<NavigationMenu.Viewport>`, while it is shown. */
export type ContentProps = PartAttributes<"div", StateFor<"navigationMenu", "content">>

export type LinkProps = PartAttributes<
  "a",
  StateFor<"navigationMenu", "link">,
  NavigationMenuLinkOptions
>

/** Draws nothing itself: its content at the end of `<body>`, or where a `<PortalProvider>` says. */
export type PortalProps = { children?: Snippet | undefined }

export type BackdropProps = PartAttributes<"div", StateFor<"navigationMenu", "backdrop">>

export type PositionerProps = PartAttributes<
  "div",
  StateFor<"navigationMenu", "positioner">,
  Placement
>

export type PopupProps = PartAttributes<"div", StateFor<"navigationMenu", "popup">>

export type ArrowProps = PartAttributes<"div", StateFor<"navigationMenu", "arrow">>

export type ViewportProps = PartAttributes<"div", StateFor<"navigationMenu", "viewport">>
