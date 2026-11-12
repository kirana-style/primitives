import { createTooltip } from "@kirana-ui/core/tooltip"

import { hoverPopup } from "./hover-popup.ts"

export const Tooltip = hoverPopup("Tooltip", createTooltip, "button")
