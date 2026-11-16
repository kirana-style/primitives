import { createCollapsible } from "@kirana-ui/core/collapsible"

import { defineElement } from "./runtime.ts"

/**
 * `<kui-collapsible>` with `kui-part="trigger"` on a button and `kui-part="panel"` on what it
 * shows. `open`, `default-open`, `disabled`; it tells `open-change`.
 */
defineElement({
  tag: "kui-collapsible",
  props: { open: "boolean", "default-open": "boolean", disabled: "boolean" },
  create: createCollapsible,
  root: (controller) => controller.root,
  changes: { onOpenChange: { event: "open-change", prop: "open" } },
  parts: {
    trigger: (controller) => controller.trigger,
    panel: (controller) => ({ mounted: controller.mounted, part: controller.panel }),
  },
})
