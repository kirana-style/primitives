import { createHoverCard } from "@kirana-ui/core/hover-card"

import { hoverPopup } from "./hover-popup.ts"
import type { ElementOf } from "./runtime.ts"

/**
 * `<kui-hover-card>` around a `kui-part="trigger"` link and a `portal` with a `positioner`
 * around the `popup`, which the pointer may enter. `open`, `default-open`, `delay`,
 * `close-delay`, `disabled`; it tells `open-change`.
 */
export const tag = hoverPopup("kui-hover-card", createHoverCard)

declare global {
  interface HTMLElementTagNameMap {
    "kui-hover-card": ElementOf<typeof tag, { "open-change": ["onOpenChange", "open"] }>
  }
}
