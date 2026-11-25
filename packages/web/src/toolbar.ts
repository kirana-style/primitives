import { createToolbar } from "@kirana-ui/core/toolbar"
import type { ToolbarProps } from "@kirana-ui/core/toolbar"

import { options } from "./around.ts"
import { defineElement } from "./runtime.ts"
import type { As, ElementOf } from "./runtime.ts"

/**
 * `<kui-toolbar>` around `kui-part="root"` and its items: a `button`, a `link`, an `input`, a
 * `group`, a `separator` (`kui-disabled` on one that is off), and `<kui-toggle>`s and
 * `<kui-toggle-group>`s, which are the toolbar's items too. One stop for Tab; the arrows move
 * between them. `orientation`, `loop-focus`, `disabled`. A disabled
 * button or input stays focusable, as Base UI's; `kui-focusable-when-disabled="false"` on one
 * disables it the element's own way, and the arrows pass it.
 */
/** A button's or an input's options: its part's own, and whether it keeps focus while disabled. */
const control = (element: HTMLElement) => {
  const own = options(element)
  return () => ({
    ...own(),
    ...(element.getAttribute("kui-focusable-when-disabled") === "false"
      ? { focusableWhenDisabled: false }
      : {}),
  })
}

export const tag = defineElement({
  tag: "kui-toolbar",
  props: { orientation: "string", "loop-focus": "boolean", loop: "boolean", disabled: "boolean" },
  create: (props) => createToolbar(props as never),
  changes: {},
  parts: {
    root: (controller) => controller.root,
    button: (controller, element) => controller.button(control(element)),
    input: (controller, element) => controller.input(control(element)),
    group: (controller, element) => controller.group(options(element)),
    link: (controller) => controller.link(),
    separator: (controller) => controller.separator,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-toolbar": ElementOf<As<typeof tag, ToolbarProps>>
  }
}
