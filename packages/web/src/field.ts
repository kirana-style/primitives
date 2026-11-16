import { createField } from "@kirana-ui/core/field"
import type { Field, FieldProps, ValidityKey } from "@kirana-ui/core/field"
import type { Fieldset } from "@kirana-ui/core/fieldset"
import type { Form } from "@kirana-ui/core/form"

import { controllerAround, defineElement } from "./runtime.ts"

/**
 * `<kui-field>` around `kui-part="root"`, a `label`, a `control` (an input, a textarea or a
 * select), a `description` and an `error`, which is in the page while something is wrong and
 * says what, unless the page gave it something to say (`kui-match="valueMissing"` for one
 * finding of the browser's, `kui-match` alone for always). `name`, `disabled`, `invalid`,
 * `validation-mode`, `validation-debounce-time`; `validate` as a property.
 */
export const tag = defineElement<FieldProps, Field>({
  tag: "kui-field",
  props: {
    name: "string",
    disabled: "boolean",
    invalid: "boolean",
    "validation-mode": "string",
    "validation-debounce-time": "number",
  },
  properties: ["validate"],
  create: (props, host) =>
    createField(props, {
      form: controllerAround<Form>(host, "kui-form"),
      fieldset: controllerAround<Fieldset>(host, "kui-fieldset"),
    }),
  changes: {},
  parts: {
    root: (controller) => controller.root,
    label: (controller) => controller.label,
    control: (controller) => controller.control,
    description: (controller) => controller.description,
    error(controller, element) {
      const error = controller.error(() => {
        const match = element.getAttribute("kui-match")
        return match === null ? undefined : match === "" ? true : (match as ValidityKey)
      })
      return {
        part: error.part,
        mounted: error.mounted,
        text: error.text,
        mount: () => error.mount(),
      }
    },
  },
})
