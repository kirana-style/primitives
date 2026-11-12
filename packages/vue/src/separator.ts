import type { Orientation } from "@kirana-ui/core"
import { createSeparator } from "@kirana-ui/core/separator"
import { defineComponent, h } from "vue"
import type { PropType } from "vue"

import { controller, partComponent } from "./runtime.ts"

export const Separator = defineComponent({
  name: "Separator",
  inheritAttrs: false,
  props: { orientation: String as PropType<Orientation> },
  setup(props, { attrs, slots }) {
    const made = controller(createSeparator, () => ({ orientation: props.orientation }))
    const Element = partComponent("SeparatorElement", "div", () => made.root)
    return () => h(Element, attrs, slots)
  },
})
