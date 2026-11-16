import { createMenubar } from "@kirana-ui/core/menubar"

import { defineElement } from "./runtime.ts"

/**
 * `<kui-menubar>` around `kui-part="root"` and its `<kui-menu>`s, which work as one: the
 * arrows move between them, and with one open the pointer opens the next. `loop`, `disabled`,
 * `orientation`.
 */
export const tag = defineElement({
  tag: "kui-menubar",
  props: { loop: "boolean", disabled: "boolean", orientation: "string" },
  create: (props) => createMenubar(props),
  changes: {},
  parts: { root: (controller) => controller.root },
})
