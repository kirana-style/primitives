import { createToolbar } from "@kirana-ui/core/toolbar"

import { options } from "./around.ts"
import { defineElement } from "./runtime.ts"

/**
 * `<kui-toolbar>` around `kui-part="root"` and its items: a `button`, a `link`, an `input`, a
 * `group`, a `separator` (`kui-disabled` on one that is off), and `<kui-toggle>`s and
 * `<kui-toggle-group>`s, which are the toolbar's items too. One stop for Tab; the arrows move
 * between them. `orientation`, `loop`, `disabled`.
 */
export const tag = defineElement({
  tag: "kui-toolbar",
  props: { orientation: "string", loop: "boolean", disabled: "boolean" },
  create: (props) => createToolbar(props as never),
  changes: {},
  parts: {
    root: (controller) => controller.root,
    button: (controller, element) => controller.button(options(element)),
    input: (controller, element) => controller.input(options(element)),
    group: (controller, element) => controller.group(options(element)),
    link: (controller) => controller.link(),
    separator: (controller) => controller.separator,
  },
})
