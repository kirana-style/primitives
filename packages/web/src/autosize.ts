import { createAutosize } from "@kirana-ui/core/autosize"

import { defineElement } from "./runtime.ts"

/**
 * `<kui-autosize>` around a `kui-part="root"` textarea, which is as tall as what is written
 * in it. `value` as a property, for a caller that holds the text: set, it is measured again.
 */
export const tag = defineElement({
  tag: "kui-autosize",
  props: {},
  properties: ["value"],
  create: (props) => createAutosize(props as never),
  changes: {},
  parts: { root: (controller) => controller.textarea },
})
