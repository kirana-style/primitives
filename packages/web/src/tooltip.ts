import { createTooltip } from "@kirana-ui/core/tooltip"

import { hoverPopup } from "./hover-popup.ts"
import type { ElementOf } from "./runtime.ts"

/**
 * `<kui-tooltip>` around a `kui-part="trigger"` and a `portal` with a `positioner` (its
 * `kui-side` and the like) around the `popup`, which may hold an `arrow`. `open`,
 * `default-open`, `delay`, `close-delay`, `disabled`; it tells `open-change`.
 */
export const tag = hoverPopup("kui-tooltip", createTooltip)

declare global {
  interface HTMLElementTagNameMap {
    "kui-tooltip": ElementOf<typeof tag, { "open-change": ["onOpenChange", "open"] }>
  }
}
