import { createPopover } from "@kirana-ui/core/popover"
import type { PopoverProps } from "@kirana-ui/core/popover"

import { positioner } from "./around.ts"
import { defineElement } from "./runtime.ts"
import type { As, ElementOf } from "./runtime.ts"

/**
 * `<kui-popover>` around a `kui-part="trigger"` button and a `portal`, drawn at the end of the
 * page while it is open, with a `positioner` (`kui-side`, `kui-align`, `kui-side-offset`,
 * `kui-align-offset`, `kui-collision-padding`, and `kui-anchor`: the id of the element it is
 * placed against, when that is not the trigger) around the `popup`, which may hold a `title`,
 * a `description` and a `close` button. `open`, `default-open`; it tells `open-change`.
 */
export const tag = defineElement({
  tag: "kui-popover",
  props: { open: "boolean", "default-open": "boolean" },
  create: (props) => createPopover(props),
  changes: { onOpenChange: { event: "open-change", prop: "open" } },
  parts: {
    trigger: (controller) => controller.trigger,
    positioner,
    popup: (controller) => controller.popup,
    title: (controller) => controller.title,
    description: (controller) => controller.description,
    close: (controller) => controller.close,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-popover": ElementOf<
      As<typeof tag, PopoverProps>,
      { "open-change": ["onOpenChange", "open"] }
    >
  }
}
