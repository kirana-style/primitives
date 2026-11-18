import type { HoverCardProps } from "@kirana-ui/core/hover-card"
import type { Snippet } from "svelte"

import type { PartAttributes, Placement, Renderless, StateFor } from "../types.ts"

/** It draws nothing: `bind:open` is whether the card shows. */
export type RootProps = Renderless<HoverCardProps>

export type TriggerProps = PartAttributes<
  "a",
  StateFor<"hoverCard", "trigger">,
  {
    /** How long the pointer rests on it before the card shows: before the root's. */
    delay?: number | undefined
    /** How long after the pointer leaves the card goes: before the root's. */
    closeDelay?: number | undefined
  }
>

/** Draws nothing itself: its content at the end of `<body>`, or where a `<PortalProvider>` says. */
export type PortalProps = { children?: Snippet | undefined }

export type PositionerProps = PartAttributes<"div", StateFor<"hoverCard", "positioner">, Placement>

export type PopupProps = PartAttributes<"div", StateFor<"hoverCard", "popup">>

export type ArrowProps = PartAttributes<"div", StateFor<"hoverCard", "arrow">>
