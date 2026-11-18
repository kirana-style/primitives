import { createMessageScroller } from "@kirana-ui/core/message-scroller"
import type { MessageScroller, MessageScrollerProps } from "@kirana-ui/core/message-scroller"

import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

/**
 * `<kui-message-scroller>` around `kui-part="root"`, a `viewport` with its `content`, and a
 * `button` that goes back to the newest. It stays at the bottom as content comes, unless the
 * reader has scrolled away. `initial`, `threshold`; it tells `at-bottom-change`.
 */
export const tag = defineElement<MessageScrollerProps, MessageScroller>({
  tag: "kui-message-scroller",
  props: { initial: "string", threshold: "number" },
  create: (props) => createMessageScroller(props),
  changes: { onAtBottomChange: { event: "at-bottom-change", prop: "atBottom", hold: false } },
  parts: {
    root: (controller) => controller.root,
    viewport: (controller) => controller.viewport,
    content: (controller) => controller.content,
    button: (controller) => controller.button,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-message-scroller": ElementOf<
      typeof tag,
      { "at-bottom-change": ["onAtBottomChange", "atBottom"] }
    >
  }
}
