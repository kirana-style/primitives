import { createLabel } from "@kirana-ui/core/label"
import { defineComponent, h } from "vue"

import { useFieldAround } from "./field-context.ts"
import { partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

export type LabelProps = PartComponentProps

/** A `<label>`. Inside a `<Field.Root>` it is the field's label. */
export const Label = defineComponent({
  name: "Label",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const made = createLabel({ field: useFieldAround() })
    const Element = partComponent("LabelElement", "label", () => made.label)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"label", StatesOf<"label">["label"], LabelProps>
