import { within } from "@kirana-ui/core"
import type { Orientation, StateOf } from "@kirana-ui/core"
import { createScrollArea } from "@kirana-ui/core/scroll-area"
import type { ScrollArea as Controller, ScrollAreaScrollbar } from "@kirana-ui/core/scroll-area"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { PartElement, parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["scrollArea"]

const Context = createContext<Controller | null>(null)
const ScrollbarContext = createContext<ScrollAreaScrollbar | null>(null)

function useScrollArea(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<ScrollArea.${part}> must be inside <ScrollArea.Root>`)
  return controller
}

export type RootProps = PartComponentProps<"div", StateOf<Parts["root"]>>

/**
 * The area. Its scrollbars and its corner are placed against it by the library, in each
 * part's `style`: a design gives a scrollbar its thickness and draws it.
 */
function Root(props: RootProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller = useController(within(createScrollArea, { direction }), {})
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", props)}</Context.Provider>
  )
}

export type ViewportProps = PartComponentProps<"div", StateOf<Parts["viewport"]>>

const Viewport = (props: ViewportProps) => usePart(useScrollArea("Viewport").viewport, "div", props)
export type ContentProps = PartComponentProps<"div", StateOf<Parts["content"]>>

const Content = (props: ContentProps) => usePart(useScrollArea("Content").content, "div", props)

export type ScrollbarProps = PartComponentProps<
  "div",
  StateOf<Parts["scrollbar"]>,
  {
    /** Which way it scrolls. Default: `vertical`. */
    orientation?: Orientation
    /** In the page even while there is nothing to scroll its way. */
    keepMounted?: boolean
  }
>

function Scrollbar({
  orientation = "vertical",
  keepMounted,
  ...props
}: ScrollbarProps): ReactElement | null {
  const bar = useScrollArea("Scrollbar").scrollbar(orientation)
  const shown = useSignal(bar.shown)
  if (!shown && !keepMounted) return null
  return (
    <ScrollbarContext.Provider value={bar}>
      <PartElement of={bar.part} tag="div" {...props} />
    </ScrollbarContext.Provider>
  )
}

export type ThumbProps = PartComponentProps<"div", StateOf<Parts["thumb"]>>

function Thumb(props: ThumbProps): ReactElement {
  const bar = useContext(ScrollbarContext)
  if (!bar) throw new Error("<ScrollArea.Thumb> must be inside <ScrollArea.Scrollbar>")
  return usePart(bar.thumb, "div", props)
}

export type CornerProps = PartComponentProps<"div", StateOf<Parts["corner"]>>

function Corner(props: CornerProps): ReactElement | null {
  const { corner } = useScrollArea("Corner")
  const shown = useSignal(corner.shown)
  return shown ? <PartElement of={corner.part} tag="div" {...props} /> : null
}

export const ScrollArea = /* @__PURE__ */ parts("ScrollArea", {
  Root,
  Viewport,
  Content,
  Scrollbar,
  Thumb,
  Corner,
})
