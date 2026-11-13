import { within } from "@kirana-ui/core"
import { createMenubar } from "@kirana-ui/core/menubar"
import { defineComponent, h, provide, useId } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { MENUBAR } from "./menubar-context.ts"
import { controller, optional, partComponent } from "./runtime.ts"

/** A row of menus that work as one. Each `Menu.Root` inside it is one of its items. */
export const Menubar = defineComponent({
  name: "Menubar",
  inheritAttrs: false,
  props: { loop: optional(Boolean), disabled: Boolean, id: String },
  setup(props, { attrs, slots }) {
    const generated = useId()
    const direction = useDirectionAround()
    const made = controller(within(createMenubar, { direction }), () => ({
      id: props.id ?? generated,
      loop: props.loop,
      disabled: props.disabled,
    }))
    provide(MENUBAR, made)
    const Element = partComponent("MenubarElement", "div", () => made.root)
    return () => h(Element, attrs, slots)
  },
})
