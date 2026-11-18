import { within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createCarousel } from "@kirana-ui/core/carousel"
import type { CarouselProps, Carousel as Controller } from "@kirana-ui/core/carousel"
import { defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { context, controller, optional, partComponent } from "./runtime.ts"
import type { Changes, PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"carousel">

const scope = context<Controller>("Carousel")

const RootElement = partComponent("CarouselRootElement", "div", () => scope.use().root)

export type RootProps = Omit<CarouselProps, "id" | "onIndexChange"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = Changes<"index", number>

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
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

export type ViewportProps = PartComponentProps
export type PreviousProps = PartComponentProps
export type NextProps = PartComponentProps
const Viewport = partComponent<"div", State["viewport"]>(
  "CarouselViewport",
  "div",
  () => scope.use().viewport
)
const Previous = partComponent<"button", State["previous"]>(
  "CarouselPrevious",
  "button",
  () => scope.use().previous
)
const Next = partComponent<"button", State["next"]>(
  "CarouselNext",
  "button",
  () => scope.use().next
)

export interface ItemProps extends PartComponentProps {
  /** Its place among the slides, from 0. */
  index: number
}

const Item = defineComponent({
  name: "CarouselItem",
  inheritAttrs: false,
  props: { index: { type: Number, required: true } },
  setup(props, { attrs, slots }) {
    const part = scope.use().item(props.index)
    const Element = partComponent("CarouselItemElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["item"], ItemProps>

export interface IndicatorProps extends PartComponentProps {
  /** The slide it goes to, from 0. */
  index: number
}

const Indicator = defineComponent({
  name: "CarouselIndicator",
  inheritAttrs: false,
  props: { index: { type: Number, required: true } },
  setup(props, { attrs, slots }) {
    const part = scope.use().indicator(props.index)
    const Element = partComponent("CarouselIndicatorElement", "button", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"button", State["indicator"], IndicatorProps>

export const Carousel = { Root, Viewport, Item, Previous, Next, Indicator }
