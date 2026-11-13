import { within } from "@kirana-ui/core"
import type { Orientation } from "@kirana-ui/core"
import { createScrollArea } from "@kirana-ui/core/scroll-area"
import type { ScrollArea as Controller, ScrollAreaScrollbar } from "@kirana-ui/core/scroll-area"
import { Show, createContext, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()
const ScrollbarContext = createContext<ScrollAreaScrollbar>()

function useScrollArea(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A ScrollArea part must be inside <ScrollArea.Root>")
  return made
}

function Root(props: PartComponentProps): JSX.Element {
  const direction = useContext(DirectionContext)
  const made = controller(within(createScrollArea, { direction }), () => ({}))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...props} />
    </Context.Provider>
  )
}

/** `orientation` is which way it scrolls (`vertical` by default). */
function Scrollbar(
  props: PartComponentProps & { orientation?: Orientation; keepMounted?: boolean }
): JSX.Element {
  const [local, rest] = splitProps(props, ["orientation", "keepMounted"])
  const bar = useScrollArea().scrollbar(untrack(() => local.orientation) ?? "vertical")
  const shown = fromSignal(bar.shown)
  return (
    <ScrollbarContext.Provider value={bar}>
      <Show when={shown() || local.keepMounted}>
        <Part part={bar.part} tag="div" {...rest} />
      </Show>
    </ScrollbarContext.Provider>
  )
}

function Thumb(props: PartComponentProps): JSX.Element {
  const bar = useContext(ScrollbarContext)
  if (!bar) throw new Error("A ScrollArea.Thumb must be inside <ScrollArea.Scrollbar>")
  return <Part part={bar.thumb} tag="div" {...props} />
}

function Corner(props: PartComponentProps): JSX.Element {
  const { corner } = useScrollArea()
  const shown = fromSignal(corner.shown)
  return (
    <Show when={shown()}>
      <Part part={corner.part} tag="div" {...props} />
    </Show>
  )
}

const part = (name: "viewport" | "content") => (props: PartComponentProps) => (
  <Part part={useScrollArea()[name]} tag="div" {...props} />
)

export const ScrollArea = {
  Root,
  Viewport: part("viewport"),
  Content: part("content"),
  Scrollbar,
  Thumb,
  Corner,
}
