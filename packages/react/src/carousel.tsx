import { within } from "@kirana-ui/core"
import { createCarousel } from "@kirana-ui/core/carousel"
import type { Carousel as Controller, CarouselProps } from "@kirana-ui/core/carousel"
import { createContext, useContext, useMemo } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function useCarousel(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Carousel.${part}> must be inside <Carousel.Root>`)
  return controller
}

export type RootProps = Omit<CarouselProps, "id"> & { id?: string } & PartComponentProps

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

const Viewport = (props: PartComponentProps) =>
  usePart(useCarousel("Viewport").viewport, "div", props)

function Item({ index, ...props }: PartComponentProps & { index: number }): ReactElement {
  const controller = useCarousel("Item")
  const part = useMemo(() => controller.item(index), [controller, index])
  return usePart(part, "div", props)
}

const Previous = (props: PartComponentProps) =>
  usePart(useCarousel("Previous").previous, "button", props)
const Next = (props: PartComponentProps) => usePart(useCarousel("Next").next, "button", props)

function Indicator({ index, ...props }: PartComponentProps & { index: number }): ReactElement {
  const controller = useCarousel("Indicator")
  const part = useMemo(() => controller.indicator(index), [controller, index])
  return usePart(part, "button", props)
}

export const Carousel = { Root, Viewport, Item, Previous, Next, Indicator }
