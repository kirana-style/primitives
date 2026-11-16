import { createForm } from "@kirana-ui/core/form"

import { defineElement } from "./runtime.ts"

/**
 * `<kui-form>` around a `kui-part="root"` form. Its fields are checked when it is submitted;
 * valid, it tells `form-submit` with their values and the page is not left. `validation-mode`;
 * `errors` (from outside the page, by field name) as a property; it tells `clear-errors`.
 */
export const tag = defineElement({
  tag: "kui-form",
  props: { "validation-mode": "string" },
  properties: ["errors"],
  create: (props) => createForm(props as never),
  changes: {
    onFormSubmit: { event: "form-submit", prop: "values", hold: false },
    onClearErrors: { event: "clear-errors", prop: "errors", hold: false },
  },
  parts: { root: (controller) => controller.root },
})
