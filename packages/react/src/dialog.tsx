import { createAlertDialog } from "@kirana-ui/core/alert-dialog"
import type { AlertDialogProps } from "@kirana-ui/core/alert-dialog"
import { createDialog } from "@kirana-ui/core/dialog"
import type { Dialog as Controller, DialogProps } from "@kirana-ui/core/dialog"
import { createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { Portal as BodyPortal, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function useDialog(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Dialog.${part}> must be inside <Dialog.Root>`)
  return controller
}

export type RootProps = Omit<DialogProps, "id"> & { id?: string; children?: ReactNode }

function Root({ children, ...props }: RootProps): ReactElement {
  const controller = useController(createDialog, props)
  return <Context.Provider value={controller}>{children}</Context.Provider>
}

function Portal({ children }: { children?: ReactNode }): ReactElement | null {
  const mounted = useSignal(useDialog("Portal").mounted)
  return mounted ? <BodyPortal>{children}</BodyPortal> : null
}

const Trigger = (props: PartComponentProps) =>
  usePart(useDialog("Trigger").trigger, "button", props)
const Backdrop = (props: PartComponentProps) =>
  usePart(useDialog("Backdrop").backdrop, "div", props)
const Popup = (props: PartComponentProps) => usePart(useDialog("Popup").popup, "div", props)
const Title = (props: PartComponentProps) => usePart(useDialog("Title").title, "h2", props)
const Description = (props: PartComponentProps) =>
  usePart(useDialog("Description").description, "p", props)
const Close = (props: PartComponentProps) => usePart(useDialog("Close").close, "button", props)

export const Dialog = { Root, Trigger, Portal, Backdrop, Popup, Title, Description, Close }

export type AlertRootProps = Omit<AlertDialogProps, "id"> & { id?: string; children?: ReactNode }

function AlertRoot({ children, ...props }: AlertRootProps): ReactElement {
  const controller = useController(createAlertDialog, props)
  return <Context.Provider value={controller}>{children}</Context.Provider>
}

/** A dialog that asks for an answer: a press outside it does not close it. Its parts are a dialog's. */
export const AlertDialog = { ...Dialog, Root: AlertRoot }
