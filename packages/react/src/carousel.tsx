import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createCarousel } from "@kirana-ui/core/carousel"
import type { Carousel as Controller, CarouselProps } from "@kirana-ui/core/carousel"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext, useMemo } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { parts, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["carousel"]

const Context = createContext<Controller | null>(null)

function useCarousel(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Carousel.${part}> must be inside <Carousel.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<CarouselProps, "id"> & { id?: string }
>

function Root({
  index,
  defaultIndex,
  onIndexChange,
  orientation,
  loop,
  id,
  ...rest
}: RootProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller = useController<CarouselProps, Controller>(
    within(createCarousel, { direction }),
    { index, defaultIndex, onIndexChange, orientation, loop, id }
  )
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

export type ViewportProps = PartComponentProps<"div", StateOf<Parts["viewport"]>>

const Viewport = (props: ViewportProps) => usePart(useCarousel("Viewport").viewport, "div", props)

export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  {
    /** Its place among the slides, from 0. */
    index: number
  }
>

function Item({ index, ...props }: ItemProps): ReactElement {
  const controller = useCarousel("Item")
  const part = useMemo(() => controller.item(index), [controller, index])
  return usePart(part, "div", props)
}

export type PreviousProps = PartComponentProps<"button", StateOf<Parts["previous"]>>

const Previous = (props: PreviousProps) =>
  usePart(useCarousel("Previous").previous, "button", props)
export type NextProps = PartComponentProps<"button", StateOf<Parts["next"]>>

const Next = (props: NextProps) => usePart(useCarousel("Next").next, "button", props)

export type IndicatorProps = PartComponentProps<
  "button",
  StateOf<Parts["indicator"]>,
  {
    /** The slide it goes to, from 0. */
    index: number
  }
>

function Indicator({ index, ...props }: IndicatorProps): ReactElement {
  const controller = useCarousel("Indicator")
  const part = useMemo(() => controller.indicator(index), [controller, index])
  return usePart(part, "button", props)
}

export const Carousel = /* @__PURE__ */ parts("Carousel", {
  Root,
  Viewport,
  Item,
  Previous,
  Next,
  Indicator,
})
