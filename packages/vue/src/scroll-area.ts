import { within } from "@kirana-ui/core"
import type { Orientation } from "@kirana-ui/core"
import { createScrollArea } from "@kirana-ui/core/scroll-area"
import type { ScrollArea as Controller, ScrollAreaScrollbar } from "@kirana-ui/core/scroll-area"
import { defineComponent, h, inject, provide } from "vue"
import type { InjectionKey, PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { context, controller, fromSignal, partComponent } from "./runtime.ts"

const scope = context<Controller>("ScrollArea")
const SCROLLBAR: InjectionKey<ScrollAreaScrollbar> = Symbol("ScrollAreaScrollbar")

const Root = defineComponent({
  name: "ScrollAreaRoot",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const direction = useDirectionAround()
    const made = scope.provide(controller(within(createScrollArea, { direction }), () => ({})))
    const Element = partComponent("ScrollAreaRootElement", "div", () => made.root)
    return () => h(Element, attrs, slots)
  },
})

/** `orientation` is which way it scrolls (`vertical` by default). */
const Scrollbar = defineComponent({
  name: "ScrollAreaScrollbar",
  inheritAttrs: false,
  props: {
    orientation: { type: String as PropType<Orientation>, default: "vertical" },
    keepMounted: Boolean,
  },
  setup(props, { attrs, slots }) {
    const bar = scope.use().scrollbar(props.orientation)
    provide(SCROLLBAR, bar)
    const shown = fromSignal(bar.shown)
    const Element = partComponent("ScrollAreaScrollbarElement", "div", () => bar.part)
    return () => (shown.value || props.keepMounted ? h(Element, attrs, slots) : null)
  },
})

const Thumb = partComponent("ScrollAreaThumb", "div", () => {
  const bar = inject(SCROLLBAR, undefined)
  if (!bar) throw new Error("A ScrollArea.Thumb must be inside <ScrollArea.Scrollbar>")
  return bar.thumb
})

const Corner = defineComponent({
  name: "ScrollAreaCorner",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const { corner } = scope.use()
    const shown = fromSignal(corner.shown)
    const Element = partComponent("ScrollAreaCornerElement", "div", () => corner.part)
    return () => (shown.value ? h(Element, attrs, slots) : null)
  },
})

export const ScrollArea = {
  Root,
  Viewport: partComponent("ScrollAreaViewport", "div", () => scope.use().viewport),
  Content: partComponent("ScrollAreaContent", "div", () => scope.use().content),
  Scrollbar,
  Thumb,
  Corner,
}
