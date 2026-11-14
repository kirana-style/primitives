import { within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createCarousel } from "@kirana-ui/core/carousel"
import type { Carousel as Controller } from "@kirana-ui/core/carousel"
import { defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { context, controller, optional, partComponent } from "./runtime.ts"

const scope = context<Controller>("Carousel")

const RootElement = partComponent("CarouselRootElement", "div", () => scope.use().root)

/** `v-model:index`, and `@index-change="(index, details) => …"`. */
const Root = defineComponent({
  name: "CarouselRoot",
  inheritAttrs: false,
  props: {
    index: optional(Number),
    defaultIndex: Number,
    orientation: String as PropType<Orientation>,
    loop: Boolean,
    id: String,
  },
  emits: ["update:index", "indexChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const direction = useDirectionAround()
    scope.provide(
      controller(within(createCarousel, { direction }), () => ({
        id: props.id ?? generated,
        index: props.index,
        defaultIndex: props.defaultIndex,
        orientation: props.orientation,
        loop: props.loop,
        onIndexChange: (index: number, details: ChangeDetails) => {
          emit("indexChange", index, details)
          if (!details.canceled) emit("update:index", index)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
})

const Viewport = partComponent("CarouselViewport", "div", () => scope.use().viewport)
const Previous = partComponent("CarouselPrevious", "button", () => scope.use().previous)
const Next = partComponent("CarouselNext", "button", () => scope.use().next)

const Item = defineComponent({
  name: "CarouselItem",
  inheritAttrs: false,
  props: { index: { type: Number, required: true } },
  setup(props, { attrs, slots }) {
    const part = scope.use().item(props.index)
    const Element = partComponent("CarouselItemElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
})

const Indicator = defineComponent({
  name: "CarouselIndicator",
  inheritAttrs: false,
  props: { index: { type: Number, required: true } },
  setup(props, { attrs, slots }) {
    const part = scope.use().indicator(props.index)
    const Element = partComponent("CarouselIndicatorElement", "button", () => part)
    return () => h(Element, attrs, slots)
  },
})

export const Carousel = { Root, Viewport, Item, Previous, Next, Indicator }
