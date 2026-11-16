import { createTabs } from "@kirana-ui/core/tabs"
import type { TabsProps } from "@kirana-ui/core/tabs"

import { defineElement } from "./runtime.ts"

/**
 * `<kui-tabs>` around `kui-part="root"`, a `list` with a `tab` for each `value` and an
 * `indicator`, and a `panel` for each `value`, in the page while its tab is the active one.
 * `value`, `default-value`, `orientation`; it tells `value-change`.
 */
export const tag = defineElement<TabsProps<string>, ReturnType<typeof createTabs<string>>>({
  tag: "kui-tabs",
  props: { value: "string", "default-value": "string", orientation: "string" },
  create: (props) => createTabs<string>(props),
  changes: { onValueChange: { event: "value-change", prop: "value" } },
  parts: {
    root: (controller) => controller.root,
    list: (controller) => controller.list,
    indicator: (controller) => controller.indicator,
    tab: (controller, element) =>
      controller.tab(element.getAttribute("kui-value") ?? "", () => ({
        disabled: element.hasAttribute("kui-disabled"),
      })),
    panel: (controller, element) => controller.panel(element.getAttribute("kui-value") ?? ""),
  },
})
