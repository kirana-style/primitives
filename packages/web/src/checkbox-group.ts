import { computed } from "@kirana-ui/core"
import { createCheckboxGroup } from "@kirana-ui/core/checkbox-group"
import type { CheckboxGroup, CheckboxGroupProps } from "@kirana-ui/core/checkbox-group"

import { fieldAround, list } from "./around.ts"
import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

type Props = Omit<CheckboxGroupProps, "value" | "defaultValue" | "allValues"> & {
  value?: string | readonly string[]
  defaultValue?: string | readonly string[]
  allValues?: string | readonly string[]
}

/**
 * `<kui-checkbox-group>` around `kui-part="root"` and its `<kui-checkbox>`es, each with a
 * `value`; one marked `parent` stands for every value of `all-values`. `value`,
 * `default-value` and `all-values` (with commas between), `disabled`; it tells `value-change`.
 */
export const tag = defineElement<Props, CheckboxGroup>({
  tag: "kui-checkbox-group",
  props: {
    value: "string",
    "default-value": "string",
    "all-values": "string",
    disabled: "boolean",
  },
  create: (props, host) =>
    createCheckboxGroup(
      computed(() => {
        const own = props.get()
        return {
          ...own,
          value: list(own.value),
          defaultValue: list(own.defaultValue),
          allValues: list(own.allValues),
        }
      }),
      { field: fieldAround(host) }
    ),
  changes: { onValueChange: { event: "value-change", prop: "value" } },
  parts: { root: (controller) => controller.root },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-checkbox-group": ElementOf<typeof tag, { "value-change": ["onValueChange", "value"] }>
  }
}
