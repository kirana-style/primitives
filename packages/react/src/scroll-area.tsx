import type { Orientation, Part } from "@kirana-ui/core"
import { within } from "@kirana-ui/core"
import { createScrollArea } from "@kirana-ui/core/scroll-area"
import type { ScrollArea as Controller, ScrollAreaScrollbar } from "@kirana-ui/core/scroll-area"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)
const ScrollbarContext = createContext<ScrollAreaScrollbar | null>(null)

function useScrollArea(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<ScrollArea.${part}> must be inside <ScrollArea.Root>`)
  return controller
}

function Root(props: PartComponentProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller = useController(within(createScrollArea, { direction }), {})
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", props)}</Context.Provider>
  )
}

const PartElement = ({ part, tag, ...props }: PartComponentProps & { part: Part; tag: string }) =>
  usePart(part, tag, props)

const Viewport = (props: PartComponentProps) =>
  usePart(useScrollArea("Viewport").viewport, "div", props)
const Content = (props: PartComponentProps) =>
  usePart(useScrollArea("Content").content, "div", props)

export interface ScrollbarProps extends PartComponentProps {
  /** Which way it scrolls. Default: `vertical`. */
  orientation?: Orientation
  /** In the page even while there is nothing to scroll its way. */
  keepMounted?: boolean
}

function Scrollbar({ orientation = "vertical", keepMounted, ...props }: ScrollbarProps) {
  const bar = useScrollArea("Scrollbar").scrollbar(orientation)
  const shown = useSignal(bar.shown)
  if (!shown && !keepMounted) return null
  return (
    <ScrollbarContext.Provider value={bar}>
      <PartElement part={bar.part} tag="div" {...props} />
    </ScrollbarContext.Provider>
  )
}

function Thumb(props: PartComponentProps): ReactElement {
  const bar = useContext(ScrollbarContext)
  if (!bar) throw new Error("<ScrollArea.Thumb> must be inside <ScrollArea.Scrollbar>")
  return usePart(bar.thumb, "div", props)
}

function Corner(props: PartComponentProps): ReactElement | null {
  const { corner } = useScrollArea("Corner")
  const shown = useSignal(corner.shown)
  return shown ? <PartElement part={corner.part} tag="div" {...props} /> : null
}

export const ScrollArea = { Root, Viewport, Content, Scrollbar, Thumb, Corner }
