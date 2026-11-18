import type { CollapsibleProps } from "@kirana-ui/core/collapsible"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<
  "div",
  StateFor<"collapsible", "root">,
  Controlled<CollapsibleProps>
>

export type TriggerProps = PartAttributes<"button", StateFor<"collapsible", "trigger">>

export type PanelProps = PartAttributes<
  "div",
  StateFor<"collapsible", "panel">,
  {
    /** Keeps the closed panel in the page, `hidden`. */
    keepMounted?: boolean | undefined
  }
>
