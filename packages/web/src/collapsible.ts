import { createCollapsible } from "@kirana-ui/core/collapsible"

import { defineElement } from "./runtime.ts"

/**
 * `<kui-collapsible>` around `kui-part="root"`, a `trigger` button and a `panel`, which is in
 * the page while it is open (`kui-keep-mounted` keeps it). `open`, `default-open`, `disabled`; it
 * tells `open-change`.
 */
export const tag = defineElement({
  tag: "kui-collapsible",
  props: { open: "boolean", "default-open": "boolean", disabled: "boolean" },
  create: createCollapsible,
  changes: { onOpenChange: { event: "open-change", prop: "open" } },
  parts: {
    root: (controller) => controller.root,
    trigger: (controller) => controller.trigger,
    panel: (controller) => ({ mounted: controller.mounted, part: controller.panel }),
  },
})
