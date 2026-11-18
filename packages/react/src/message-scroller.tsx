import type { StateOf } from "@kirana-ui/core"
import { createMessageScroller } from "@kirana-ui/core/message-scroller"
import type {
  MessageScroller as Controller,
  MessageScrollerProps,
} from "@kirana-ui/core/message-scroller"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { parts, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["messageScroller"]

const Context = createContext<Controller | null>(null)

function useScroller(part: string): Controller {
  const controller = useContext(Context)
  if (!controller)
    throw new Error(`<MessageScroller.${part}> must be inside <MessageScroller.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<MessageScrollerProps, "id"> & { id?: string }
>

function Root({ initial, threshold, onAtBottomChange, id, ...rest }: RootProps): ReactElement {
  const controller = useController<MessageScrollerProps, Controller>(createMessageScroller, {
    initial,
    threshold,
    onAtBottomChange,
    id,
  })
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

export type ViewportProps = PartComponentProps<"div", StateOf<Parts["viewport"]>>

const Viewport = (props: ViewportProps) => usePart(useScroller("Viewport").viewport, "div", props)
export type ContentProps = PartComponentProps<"div", StateOf<Parts["content"]>>

const Content = (props: ContentProps) => usePart(useScroller("Content").content, "div", props)
export type ButtonProps = PartComponentProps<"button", StateOf<Parts["button"]>>

const Button = (props: ButtonProps) => usePart(useScroller("Button").button, "button", props)

export const MessageScroller = /* @__PURE__ */ parts("MessageScroller", {
  Root,
  Viewport,
  Content,
  Button,
})
