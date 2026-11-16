import { createTabs } from "@kirana-ui/core/tabs"
import type { TabsProps } from "@kirana-ui/core/tabs"

import { defineElement } from "./runtime.ts"

/**
 * `<kui-tabs>` with `kui-part="list"`, a `kui-part="tab"` and a `kui-part="panel"` for each
 * `value`, and `kui-part="indicator"`. `value`, `default-value`, `orientation`; it tells
 * `value-change`.
 */
defineElement({
  tag: "kui-tabs",
  props: { value: "string", "default-value": "string", orientation: "string" },
  create: (props) => createTabs<string>(props as never as Parameters<typeof createTabs<string>>[0]),
  root: (controller) => controller.root,
  changes: { onValueChange: { event: "value-change", prop: "value" } },
  parts: {
    list: (controller) => controller.list,
    indicator: (controller) => controller.indicator,
    tab: (controller, element) =>
      controller.tab(element.getAttribute("value") ?? "", () => ({
        disabled: element.hasAttribute("disabled"),
      })),
    panel: (controller, element) => controller.panel(element.getAttribute("value") ?? ""),
  },
})

export type { TabsProps }
