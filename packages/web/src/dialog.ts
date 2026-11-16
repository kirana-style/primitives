import { createDialog } from "@kirana-ui/core/dialog"

import { defineElement } from "./runtime.ts"

/**
 * `<kui-dialog>` with `kui-part="trigger"`, and inside `kui-part="portal"` (drawn at the end
 * of the page while it is open) `backdrop`, `popup`, `title`, `description` and `close`.
 * `open`, `default-open`, `modal`, `dismissible`; it tells `open-change`.
 */
defineElement({
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
