import type { TooltipProps } from "@kirana-ui/core/tooltip"
import type { Snippet } from "svelte"

import type { PartAttributes, Placement, Renderless, StateFor } from "../types.ts"

/** It draws nothing: `bind:open` is whether the tooltip shows. */
export type RootProps = Renderless<TooltipProps>

export type TriggerProps = PartAttributes<
  "button",
  StateFor<"tooltip", "trigger">,
  {
    /** How long the pointer rests on it before the tooltip shows: before the root's. */
    delay?: number | undefined
    /** How long after the pointer leaves the tooltip goes: before the root's. */
    closeDelay?: number | undefined
  }
>

/** Draws nothing itself: its content at the end of `<body>`, or where a `<PortalProvider>` says. */
export type PortalProps = { children?: Snippet | undefined }

export type PositionerProps = PartAttributes<"div", StateFor<"tooltip", "positioner">, Placement>

export type PopupProps = PartAttributes<"div", StateFor<"tooltip", "popup">>

export type ArrowProps = PartAttributes<"div", StateFor<"tooltip", "arrow">>
