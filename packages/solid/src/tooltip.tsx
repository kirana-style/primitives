import type { StateOf } from "@kirana-ui/core"
import { createTooltip } from "@kirana-ui/core/tooltip"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"

import { hoverPopup } from "./hover-popup.tsx"
import type { TriggerOptions } from "./hover-popup.tsx"
import type { PositionerOptions } from "./popover.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["tooltip"]

export type { PortalProps, RootProps } from "./hover-popup.tsx"
export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>, TriggerOptions>
export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions
>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type ArrowProps = PartComponentProps<"div", StateOf<Parts["arrow"]>>

export const Tooltip = hoverPopup<{
  Trigger: TriggerProps
  Positioner: PositionerProps
  Popup: PopupProps
  Arrow: ArrowProps
}>("Tooltip", createTooltip, "button")
