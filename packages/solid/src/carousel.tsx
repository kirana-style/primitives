import { within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createCarousel } from "@kirana-ui/core/carousel"
import type { Carousel as Controller } from "@kirana-ui/core/carousel"
import { createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function useCarousel(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Carousel part must be inside <Carousel.Root>")
  return made
}

function Root(
  props: PartComponentProps & {
    index?: number
    defaultIndex?: number
    onIndexChange?: (index: number, details: ChangeDetails) => void
    orientation?: Orientation
    loop?: boolean
    id?: string
  }
): JSX.Element {
  const [local, rest] = splitProps(props, [
    "index",
    "defaultIndex",
    "onIndexChange",
    "orientation",
    "loop",
    "id",
  ])
  const generated = createUniqueId()
  const direction = useContext(DirectionContext)
  const made = controller(within(createCarousel, { direction }), () => ({
    id: local.id ?? generated,
    index: local.index,
    defaultIndex: local.defaultIndex,
    orientation: local.orientation,
    loop: local.loop,
    onIndexChange: (index: number, details: ChangeDetails) => local.onIndexChange?.(index, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

const Viewport = (props: PartComponentProps) => (
  <Part part={useCarousel().viewport} tag="div" {...props} />
)
function Item(props: PartComponentProps & { index: number }): JSX.Element {
  const [local, rest] = splitProps(props, ["index"])
  // A slide is its place for as long as it is in the page.
  const part = useCarousel().item(local.index)
  return <Part part={part} tag="div" {...rest} />
}
const Previous = (props: PartComponentProps) => (
  <Part part={useCarousel().previous} tag="button" {...props} />
)
const Next = (props: PartComponentProps) => (
  <Part part={useCarousel().next} tag="button" {...props} />
)

function Indicator(props: PartComponentProps & { index: number }): JSX.Element {
  const [local, rest] = splitProps(props, ["index"])
  // A button is its slide for as long as it is in the page.
  const part = useCarousel().indicator(local.index)
  return <Part part={part} tag="button" {...rest} />
}

export const Carousel = { Root, Viewport, Item, Previous, Next, Indicator }
