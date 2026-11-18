import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createMessageScroller } from "@kirana-ui/core/message-scroller"
import type { MessageScroller as Controller } from "@kirana-ui/core/message-scroller"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["messageScroller"]

const Context = createContext<Controller>()

function useScroller(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A MessageScroller part must be inside <MessageScroller.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  {
    initial?: "bottom" | "top"
    threshold?: number
    onAtBottomChange?: (atBottom: boolean, details: ChangeDetails) => void
    id?: string
  }
>

function Root(props: RootProps): JSX.Element {
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
      <Part of={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type ViewportProps = PartComponentProps<"div", StateOf<Parts["viewport"]>>
export type ContentProps = PartComponentProps<"div", StateOf<Parts["content"]>>
export type ButtonProps = PartComponentProps<"button", StateOf<Parts["button"]>>

const Viewport = (props: ViewportProps) => <Part of={useScroller().viewport} tag="div" {...props} />
const Content = (props: ContentProps) => <Part of={useScroller().content} tag="div" {...props} />
const Button = (props: ButtonProps) => <Part of={useScroller().button} tag="button" {...props} />

export const MessageScroller = { Root, Viewport, Content, Button }
