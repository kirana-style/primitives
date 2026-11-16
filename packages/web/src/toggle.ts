import { createToggle } from "@kirana-ui/core/toggle"
import type { ToggleAround } from "@kirana-ui/core/toggle"

import { defineElement, hostAround } from "./runtime.ts"

type Group = NonNullable<ToggleAround["group"]>
type Toolbar = NonNullable<ToggleAround["toolbar"]>

/**
 * `<kui-toggle>` around a `kui-part="root"` button. Inside a `<kui-toggle-group>` it is one of
 * the group's, by its `value`; inside a `<kui-toolbar>`, one of its items. `pressed`,
 * `default-pressed`, `disabled`, `value`; it tells `pressed-change`.
 */
export const tag = defineElement({
  tag: "kui-toggle",
  props: { pressed: "boolean", "default-pressed": "boolean", disabled: "boolean", value: "string" },
  create(props, host) {
    // The nearer of the two: a group around a toolbar is not the group of the toolbar's toggles.
    const around = hostAround(host, ["kui-toggle-group", "kui-toolbar"])
    return createToggle(props as never, {
      group: around?.tag === "kui-toggle-group" ? (around.controller as Group) : undefined,
      toolbar: around?.tag === "kui-toolbar" ? (around.controller as Toolbar) : undefined,
    })
  },
  changes: { onPressedChange: { event: "pressed-change", prop: "pressed" } },
  parts: { root: (controller) => controller.root },
})
