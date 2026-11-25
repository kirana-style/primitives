import { within } from "@kirana-ui/core"
import { createMenubar } from "@kirana-ui/core/menubar"
import type { MenubarProps as CoreProps } from "@kirana-ui/core/menubar"
import type { Orientation } from "@kirana-ui/core"
import { defineComponent, h, provide, useId } from "vue"
import type { PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { MENUBAR } from "./menubar-context.ts"
import { controller, optional, partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

export type MenubarProps = Omit<CoreProps, "id"> & { id?: string | undefined } & PartComponentProps

/** A row of menus that work as one. Each `Menu.Root` inside it is one of its items. */
export const Menubar = defineComponent({
  name: "Menubar",
  inheritAttrs: false,
  props: {
    loopFocus: optional(Boolean),
    /**
     * Whether the arrows wrap from the last item to the first.
     * @deprecated Use `loopFocus`, which wins when both are given.
     */
    loop: optional(Boolean),
    disabled: Boolean,
    orientation: String as PropType<Orientation>,
    /** Holds the page while one of its menus is open. Default `false`. */
    modal: Boolean,
    id: String,
  },
  setup(props, { attrs, slots }) {
    const generated = useId()
    const direction = useDirectionAround()
    const made = controller(within(createMenubar, { direction }), () => ({
      id: props.id ?? generated,
      loop: props.loop,
      loopFocus: props.loopFocus,
      disabled: props.disabled,
      orientation: props.orientation,
      modal: props.modal,
    }))
    provide(MENUBAR, made)
    const Element = partComponent("MenubarElement", "div", () => made.root)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", StatesOf<"menubar">["root"], MenubarProps>
