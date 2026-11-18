import { createHoverCard } from "@kirana-ui/core/hover-card"

import { hoverPopup } from "./hover-popup.ts"
import type { StatesOf } from "./runtime.ts"

export type * from "./hover-popup.ts"

export const HoverCard = hoverPopup<StatesOf<"hoverCard">, "a">("HoverCard", createHoverCard, "a")
