import { createMessageScroller } from "@kirana-ui/core/message-scroller"
import type {
  MessageScroller as Controller,
  MessageScrollerProps,
} from "@kirana-ui/core/message-scroller"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function useScroller(part: string): Controller {
  const controller = useContext(Context)
  if (!controller)
    throw new Error(`<MessageScroller.${part}> must be inside <MessageScroller.Root>`)
  return controller
}

export type RootProps = Omit<MessageScrollerProps, "id"> & { id?: string } & PartComponentProps

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

const Viewport = (props: PartComponentProps) =>
  usePart(useScroller("Viewport").viewport, "div", props)
const Content = (props: PartComponentProps) => usePart(useScroller("Content").content, "div", props)
const Button = (props: PartComponentProps) => usePart(useScroller("Button").button, "button", props)

export const MessageScroller = { Root, Viewport, Content, Button }
