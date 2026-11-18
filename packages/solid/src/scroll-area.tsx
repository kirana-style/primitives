import { within } from "@kirana-ui/core"
import type { Orientation, StateOf } from "@kirana-ui/core"
import { createScrollArea } from "@kirana-ui/core/scroll-area"
import type { ScrollArea as Controller, ScrollAreaScrollbar } from "@kirana-ui/core/scroll-area"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Show, createContext, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["scrollArea"]

const Context = createContext<Controller>()
const ScrollbarContext = createContext<ScrollAreaScrollbar>()

function useScrollArea(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A ScrollArea part must be inside <ScrollArea.Root>")
  return made
}

export type RootProps = PartComponentProps<"div", StateOf<Parts["root"]>>

function Root(props: RootProps): JSX.Element {
  const direction = useContext(DirectionContext)
  const made = controller(within(createScrollArea, { direction }), () => ({}))
  return (
    <Context.Provider value={made}>
      <Part of={made.root} tag="div" {...props} />
    </Context.Provider>
  )
}

export type ScrollbarProps = PartComponentProps<
  "div",
  StateOf<Parts["scrollbar"]>,
  { orientation?: Orientation; keepMounted?: boolean }
>

/** `orientation` is which way it scrolls (`vertical` by default). */
function Scrollbar(props: ScrollbarProps): JSX.Element {
  const [local, rest] = splitProps(props, ["orientation", "keepMounted"])
  const bar = useScrollArea().scrollbar(untrack(() => local.orientation) ?? "vertical")
  const shown = fromSignal(bar.shown)
  return (
    <ScrollbarContext.Provider value={bar}>
      <Show when={shown() || local.keepMounted}>
        <Part of={bar.part} tag="div" {...rest} />
      </Show>
    </ScrollbarContext.Provider>
  )
}

export type ThumbProps = PartComponentProps<"div", StateOf<Parts["thumb"]>>

function Thumb(props: ThumbProps): JSX.Element {
  const bar = useContext(ScrollbarContext)
  if (!bar) throw new Error("A ScrollArea.Thumb must be inside <ScrollArea.Scrollbar>")
  return <Part of={bar.thumb} tag="div" {...props} />
}

export type CornerProps = PartComponentProps<"div", StateOf<Parts["corner"]>>

function Corner(props: CornerProps): JSX.Element {
  const { corner } = useScrollArea()
  const shown = fromSignal(corner.shown)
  return (
    <Show when={shown()}>
      <Part of={corner.part} tag="div" {...props} />
    </Show>
  )
}

export type ViewportProps = PartComponentProps<"div", StateOf<Parts["viewport"]>>
export type ContentProps = PartComponentProps<"div", StateOf<Parts["content"]>>

const part =
  <Props extends Record<string, unknown>>(name: "viewport" | "content") =>
  (props: Props): JSX.Element => <Part of={useScrollArea()[name]} tag="div" {...props} />

export const ScrollArea = {
  Root,
  Viewport: part<ViewportProps>("viewport"),
  Content: part<ContentProps>("content"),
  Scrollbar,
  Thumb,
  Corner,
}
