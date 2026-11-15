import type { ChangeDetails } from "@kirana-ui/core"
import { createMessageScroller } from "@kirana-ui/core/message-scroller"
import type { MessageScroller as Controller } from "@kirana-ui/core/message-scroller"
import { createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function useScroller(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A MessageScroller part must be inside <MessageScroller.Root>")
  return made
}

function Root(
  props: PartComponentProps & {
    initial?: "bottom" | "top"
    threshold?: number
    onAtBottomChange?: (atBottom: boolean, details: ChangeDetails) => void
    id?: string
  }
): JSX.Element {
  const [local, rest] = splitProps(props, ["initial", "threshold", "onAtBottomChange", "id"])
  const generated = createUniqueId()
  const made = controller(createMessageScroller, () => ({
    id: local.id ?? generated,
    initial: local.initial,
    threshold: local.threshold,
    onAtBottomChange: (atBottom: boolean, details: ChangeDetails) =>
      local.onAtBottomChange?.(atBottom, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

const Viewport = (props: PartComponentProps) => (
  <Part part={useScroller().viewport} tag="div" {...props} />
)
const Content = (props: PartComponentProps) => (
  <Part part={useScroller().content} tag="div" {...props} />
)
const Button = (props: PartComponentProps) => (
  <Part part={useScroller().button} tag="button" {...props} />
)

export const MessageScroller = { Root, Viewport, Content, Button }
