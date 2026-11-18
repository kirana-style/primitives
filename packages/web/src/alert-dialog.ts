import { createAlertDialog } from "@kirana-ui/core/alert-dialog"
import type { AlertDialogProps } from "@kirana-ui/core/alert-dialog"

import { defineElement } from "./runtime.ts"
import type { As, ElementOf } from "./runtime.ts"

/**
 * `<kui-alert-dialog>`: a dialog that asks, with the dialog's parts. A press outside does not
 * close it. `open`, `default-open`; it tells `open-change`.
 */
export const tag = defineElement({
  tag: "kui-alert-dialog",
  props: { open: "boolean", "default-open": "boolean" },
  create: (props) => createAlertDialog(props),
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
    "kui-alert-dialog": ElementOf<
      As<typeof tag, AlertDialogProps>,
      { "open-change": ["onOpenChange", "open"] }
    >
  }
}
