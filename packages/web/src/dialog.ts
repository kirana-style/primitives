import { createDialog } from "@kirana-ui/core/dialog"
import type { DialogProps } from "@kirana-ui/core/dialog"

import { ownDisabled } from "./around.ts"
import { defineElement } from "./runtime.ts"
import type { As, ElementOf } from "./runtime.ts"

/**
 * `<kui-dialog>` around a `kui-part="trigger"` button and a `portal`, which is drawn at the
 * end of the page while the dialog is open and holds its `backdrop` and its `popup`, with a
 * `title`, a `description` and a `close` button. The trigger and the close take `kui-disabled`. A long dialog's popup is in a `viewport`,
 * which scrolls. `open`, `default-open`, `modal`, `disable-pointer-dismissal`; it tells `open-change`.
 */
export const tag = defineElement({
  tag: "kui-dialog",
  props: {
    open: "boolean",
    "default-open": "boolean",
    modal: "boolean",
    "disable-pointer-dismissal": "boolean",
    "close-on-outside-press": "boolean",
    dismissible: "boolean",
  },
  create: (props) => createDialog(props),
  changes: { onOpenChange: { event: "open-change", prop: "open" } },
  parts: {
    trigger: (controller, element) => ownDisabled(element, controller.triggerPart),
    backdrop: (controller) => ({ mounted: controller.mounted, part: controller.backdrop }),
    viewport: (controller) => ({ mounted: controller.mounted, part: controller.viewport }),
    popup: (controller) => ({ mounted: controller.mounted, part: controller.popup }),
    title: (controller) => controller.title,
    description: (controller) => controller.description,
    close: (controller, element) => ownDisabled(element, controller.closePart),
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
