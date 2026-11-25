import { createEditable } from "@kirana-ui/core/editable"
import type { Editable, EditableProps } from "@kirana-ui/core/editable"

import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

/**
 * `<kui-editable>` around `kui-part="root"`, a `preview`, which says the text (or the
 * placeholder while there is none) unless the page gave it something to say, an `input` or a
 * textarea, and `edit-trigger`, `submit-trigger` and `cancel-trigger` buttons. The input's id is
 * the element's `kui-id`. `value`, `default-value`, `editing`, `default-editing`, `placeholder`,
 * `activation`, `submit-on-blur`, `select-on-focus`, `disabled`, `read-only`, `name`, `form`;
 * it tells `value-change` and `editing-change`.
 */
export const tag = defineElement<EditableProps, Editable>({
  tag: "kui-editable",
  props: {
    value: "string",
    "default-value": "string",
    editing: "boolean",
    "default-editing": "boolean",
    placeholder: "string",
    activation: "string",
    "submit-on-blur": "boolean",
    "select-on-focus": "boolean",
    disabled: "boolean",
    "read-only": "boolean",
    name: "string",
    form: "string",
  },
  create: (props) => createEditable(props),
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onEditingChange: { event: "editing-change", prop: "editing" },
  },
  parts: {
    root: (controller) => controller.root,
    preview: (controller) => ({ part: controller.preview, text: controller.text }),
    input: (controller) => controller.input,
    "edit-trigger": (controller) => controller.editTrigger,
    "submit-trigger": (controller) => controller.submitTrigger,
    "cancel-trigger": (controller) => controller.cancelTrigger,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-editable": ElementOf<
      typeof tag,
      {
        "value-change": ["onValueChange", "value"]
        "editing-change": ["onEditingChange", "editing"]
      }
    >
  }
}
