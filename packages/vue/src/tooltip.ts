import { createTooltip } from "@kirana-ui/core/tooltip"

import { hoverPopup } from "./hover-popup.ts"
import type { StatesOf } from "./runtime.ts"

export type * from "./hover-popup.ts"

export const Tooltip = hoverPopup<StatesOf<"tooltip">, "button">("Tooltip", createTooltip, "button")
