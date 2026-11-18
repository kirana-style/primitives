import type { PopoverProps, PopoverTriggerOptions } from "@kirana-ui/core/popover"
import type { Snippet } from "svelte"

import type { PartAttributes, Placement, Renderless, StateFor } from "../types.ts"

/** It draws nothing: `bind:open` is whether the popover shows. */
export type RootProps = Renderless<PopoverProps>

export type TriggerProps = PartAttributes<
  "button",
  StateFor<"popover", "trigger">,
  PopoverTriggerOptions
>

/** Draws nothing itself: its content at the end of `<body>`, or where a `<PortalProvider>` says. */
export type PortalProps = { children?: Snippet | undefined }

export type BackdropProps = PartAttributes<"div", StateFor<"popover", "backdrop">>

export type PositionerProps = PartAttributes<"div", StateFor<"popover", "positioner">, Placement>

export type PopupProps = PartAttributes<"div", StateFor<"popover", "popup">>

export type ArrowProps = PartAttributes<"div", StateFor<"popover", "arrow">>

export type TitleProps = PartAttributes<"h2", StateFor<"popover", "title">>

export type DescriptionProps = PartAttributes<"p", StateFor<"popover", "description">>

export type CloseProps = PartAttributes<"button", StateFor<"popover", "close">>
