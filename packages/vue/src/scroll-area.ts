import { within } from "@kirana-ui/core"
import type { Orientation } from "@kirana-ui/core"
import { createScrollArea } from "@kirana-ui/core/scroll-area"
import type { ScrollArea as Controller, ScrollAreaScrollbar } from "@kirana-ui/core/scroll-area"
import { defineComponent, h, inject, provide } from "vue"
import type { InjectionKey, PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { context, controller, fromSignal, partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"scrollArea">

const scope = context<Controller>("ScrollArea")
const SCROLLBAR: InjectionKey<ScrollAreaScrollbar> = Symbol("ScrollAreaScrollbar")

export type RootProps = PartComponentProps

const Root = defineComponent({
  name: "ScrollAreaRoot",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const direction = useDirectionAround()
    const made = scope.provide(controller(within(createScrollArea, { direction }), () => ({})))
    const Element = partComponent("ScrollAreaRootElement", "div", () => made.root)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps>

export interface ScrollbarProps extends PartComponentProps {
  /** Which way it scrolls; `vertical` when left out. */
  orientation?: Orientation | undefined
  /** Keeps the bar in the page while there is nothing to scroll that way. */
  keepMounted?: boolean | undefined
}

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
}) as unknown as PartComponent<"div", State["scrollbar"], ScrollbarProps>

export type ThumbProps = PartComponentProps
const Thumb = partComponent<"div", State["thumb"]>("ScrollAreaThumb", "div", () => {
  const bar = inject(SCROLLBAR, undefined)
  if (!bar) throw new Error("A ScrollArea.Thumb must be inside <ScrollArea.Scrollbar>")
  return bar.thumb
})

export type CornerProps = PartComponentProps

const Corner = defineComponent({
  name: "ScrollAreaCorner",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const { corner } = scope.use()
    const shown = fromSignal(corner.shown)
    const Element = partComponent("ScrollAreaCornerElement", "div", () => corner.part)
    return () => (shown.value ? h(Element, attrs, slots) : null)
  },
}) as unknown as PartComponent<"div", State["corner"], CornerProps>

export type ViewportProps = PartComponentProps
export type ContentProps = PartComponentProps
export const ScrollArea = {
  Root,
  Viewport: partComponent<"div", State["viewport"]>(
    "ScrollAreaViewport",
    "div",
    () => scope.use().viewport
  ),
  Content: partComponent<"div", State["content"]>(
    "ScrollAreaContent",
    "div",
    () => scope.use().content
  ),
  Scrollbar,
  Thumb,
  Corner,
}
