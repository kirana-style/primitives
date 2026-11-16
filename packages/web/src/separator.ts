import { createSeparator } from "@kirana-ui/core/separator"

import { defineElement } from "./runtime.ts"

/** `<kui-separator>` around `kui-part="root"`. `orientation`. */
export const tag = defineElement({
  tag: "kui-separator",
  props: { orientation: "string" },
  create: (props) => createSeparator(props as never),
  changes: {},
  parts: { root: (controller) => controller.root },
})
