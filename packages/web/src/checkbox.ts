import { createCheckbox } from "@kirana-ui/core/checkbox"
import type { CheckboxGroupLink, CheckboxProps } from "@kirana-ui/core/checkbox"

import { fieldAround } from "./around.ts"
import { controllerAround, defineElement } from "./runtime.ts"
import type { As, ElementOf } from "./runtime.ts"

type Group = { readonly link: CheckboxGroupLink }

/**
 * `<kui-checkbox>` around a `kui-part="root"` button with an `indicator` inside, which is in
 * the page while the box is checked or indeterminate. The root draws the hidden native input a
 * form and a label reach. Inside a `<kui-checkbox-group>` it is one of the group's boxes, by
 * its `value`, or with `parent` the one that stands for them all. `checked`, `default-checked`,
 * `indeterminate`, `parent`, `disabled`, `read-only`, `required`, `name`, `form`, `value`; it
 * tells `checked-change`.
 */
export const tag = defineElement({
  tag: "kui-checkbox",
  props: {
    checked: "boolean",
    "default-checked": "boolean",
    indeterminate: "boolean",
    parent: "boolean",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    name: "string",
    form: "string",
    value: "string",
  },
  create: (props, host) =>
    createCheckbox(props, {
      field: fieldAround(host),
      group: controllerAround<Group>(host, "kui-checkbox-group"),
    }),
  changes: { onCheckedChange: { event: "checked-change", prop: "checked" } },
  parts: {
    root: (controller) => ({ part: controller.root, inner: controller.input }),
    indicator: (controller) => ({
      mounted: controller.indicatorMounted,
      part: controller.indicator,
    }),
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-checkbox": ElementOf<
      As<typeof tag, CheckboxProps>,
      { "checked-change": ["onCheckedChange", "checked"] }
    >
  }
}
