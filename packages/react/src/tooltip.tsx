import type { StateOf } from "@kirana-ui/core"
import { createTooltip } from "@kirana-ui/core/tooltip"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"

import { hoverPopup } from "./hover-popup.tsx"
import type { TriggerOptions } from "./hover-popup.tsx"
import type { PartComponentProps, PositionerOptions } from "./runtime.tsx"

export type { PortalProps, RootProps } from "./hover-popup.tsx"

type Parts = Vocabulary["tooltip"]

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>, TriggerOptions>
export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions
>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type ArrowProps = PartComponentProps<"div", StateOf<Parts["arrow"]>>

export const Tooltip = /* @__PURE__ */ hoverPopup<{
  Trigger: TriggerProps
  Positioner: PositionerProps
  Popup: PopupProps
  Arrow: ArrowProps
}>("Tooltip", createTooltip, "button")
