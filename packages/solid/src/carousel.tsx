import { within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation, StateOf } from "@kirana-ui/core"
import { createCarousel } from "@kirana-ui/core/carousel"
import type { Carousel as Controller } from "@kirana-ui/core/carousel"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["carousel"]

const Context = createContext<Controller | null>(null)

function useCarousel(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Carousel part must be inside <Carousel.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  {
    index?: number
    defaultIndex?: number
    onIndexChange?: (index: number, details: ChangeDetails) => void
    orientation?: Orientation
    loop?: boolean
    id?: string
  }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "index",
    "defaultIndex",
    "onIndexChange",
    "orientation",
    "loop",
    "id",
  ])
  const generated = createUniqueId()
  const direction = useContext(DirectionContext) ?? undefined
  const made = controller(within(createCarousel, { direction }), () => ({
    id: local.id ?? generated,
    index: local.index,
    defaultIndex: local.defaultIndex,
    orientation: local.orientation,
    loop: local.loop,
    onIndexChange: (index: number, details: ChangeDetails) => local.onIndexChange?.(index, details),
  }))
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context>
  )
}

export type ViewportProps = PartComponentProps<"div", StateOf<Parts["viewport"]>>
export type ItemProps = PartComponentProps<"div", StateOf<Parts["item"]>, { index: number }>
export type PreviousProps = PartComponentProps<"button", StateOf<Parts["previous"]>>
export type NextProps = PartComponentProps<"button", StateOf<Parts["next"]>>
export type IndicatorProps = PartComponentProps<
  "button",
  StateOf<Parts["indicator"]>,
  { index: number }
>

const Viewport = (props: ViewportProps) => <Part of={useCarousel().viewport} tag="div" {...props} />
function Item(props: ItemProps): JSX.Element {
  const [local, rest] = split(props, ["index"])
  // A slide is its place for as long as it is in the page.
  const part = useCarousel().item(local.index)
  return <Part of={part} tag="div" {...rest} />
}
const Previous = (props: PreviousProps) => (
  <Part of={useCarousel().previous} tag="button" {...props} />
)
const Next = (props: NextProps) => <Part of={useCarousel().next} tag="button" {...props} />

function Indicator(props: IndicatorProps): JSX.Element {
  const [local, rest] = split(props, ["index"])
  // A button is its slide for as long as it is in the page.
  const part = useCarousel().indicator(local.index)
  return <Part of={part} tag="button" {...rest} />
}

export const Carousel = { Root, Viewport, Item, Previous, Next, Indicator }
