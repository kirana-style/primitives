import { createDialog } from "@kirana-ui/core/dialog"
import type { DialogProps } from "@kirana-ui/core/dialog"

import { defineElement } from "./runtime.ts"
import type { As, ElementOf } from "./runtime.ts"

/**
 * `<kui-dialog>` around a `kui-part="trigger"` button and a `portal`, which is drawn at the
 * end of the page while the dialog is open and holds its `backdrop` and its `popup`, with a
 * `title`, a `description` and a `close` button. `open`, `default-open`, `modal`,
 * `dismissible`; it tells `open-change`.
 */
export const tag = defineElement({
  tag: "kui-dialog",
  props: {
    open: "boolean",
    "default-open": "boolean",
    modal: "boolean",
    dismissible: "boolean",
  },
  create: (props) => createDialog(props),
  changes: { onOpenChange: { event: "open-change", prop: "open" } },
  parts: {
    trigger: (controller) => controller.trigger,
    backdrop: (controller) => ({ mounted: controller.mounted, part: controller.backdrop }),
    popup: (controller) => ({ mounted: controller.mounted, part: controller.popup }),
    title: (controller) => controller.title,
    description: (controller) => controller.description,
    close: (controller) => controller.close,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-dialog": ElementOf<
      As<typeof tag, DialogProps>,
      { "open-change": ["onOpenChange", "open"] }
    >
  }
}
