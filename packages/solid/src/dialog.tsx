import type { ChangeDetails } from "@kirana-ui/core"
import { createDialog } from "@kirana-ui/core/dialog"
import type { Dialog as Controller } from "@kirana-ui/core/dialog"
import { createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, Portal as BodyPortal, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function useDialog(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Dialog part must be inside <Dialog.Root>")
  return made
}

export type RootProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: ChangeDetails) => void
  modal?: boolean
  dismissible?: boolean
  id?: string
  children?: JSX.Element
}

function Root(props: RootProps): JSX.Element {
  const generated = createUniqueId()
  const made = controller(createDialog, () => ({
    id: props.id ?? generated,
    open: props.open,
    defaultOpen: props.defaultOpen,
    modal: props.modal,
    dismissible: props.dismissible,
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  return <Context.Provider value={made}>{props.children}</Context.Provider>
}

const Portal = (props: { children?: JSX.Element }) => (
  <BodyPortal mounted={useDialog().mounted}>{props.children}</BodyPortal>
)

const part =
  (name: "trigger" | "backdrop" | "popup" | "title" | "description" | "close", tag: string) =>
  (props: PartComponentProps) => <Part part={useDialog()[name]} tag={tag} {...props} />

export const Dialog = {
  Root,
  Portal,
  Trigger: part("trigger", "button"),
  Backdrop: part("backdrop", "div"),
  Popup: part("popup", "div"),
  Title: part("title", "h2"),
  Description: part("description", "p"),
  Close: part("close", "button"),
}
