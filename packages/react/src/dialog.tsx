import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createAlertDialog } from "@kirana-ui/core/alert-dialog"
import type { AlertDialogProps } from "@kirana-ui/core/alert-dialog"
import { createDialog } from "@kirana-ui/core/dialog"
import { createDrawer } from "@kirana-ui/core/drawer"
import type { DrawerProps } from "@kirana-ui/core/drawer"
import type { Dialog as Controller, DialogProps } from "@kirana-ui/core/dialog"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import { Portal as BodyPortal, parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps, PortalProps } from "./runtime.tsx"

export type { PortalProps }

type Parts = Vocabulary["dialog"]

const Context = createContext<Controller | null>(null)

function useDialog(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Dialog.${part}> must be inside <Dialog.Root>`)
  return controller
}

export type RootProps = Omit<DialogProps, "id"> & { id?: string; children?: ReactNode }

function Root({ children, ...props }: RootProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller = useController(within(createDialog, { direction }), props)
  return <Context.Provider value={controller}>{children}</Context.Provider>
}

function Portal({ children }: PortalProps): ReactElement | null {
  const mounted = useSignal(useDialog("Portal").mounted)
  return mounted ? <BodyPortal>{children}</BodyPortal> : null
}

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>
export type BackdropProps = PartComponentProps<"div", StateOf<Parts["backdrop"]>>
export type ViewportProps = PartComponentProps<"div", StateOf<Parts["viewport"]>>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type TitleProps = PartComponentProps<"h2", StateOf<Parts["title"]>>
export type DescriptionProps = PartComponentProps<"p", StateOf<Parts["description"]>>
export type CloseProps = PartComponentProps<"button", StateOf<Parts["close"]>>

const Trigger = (props: TriggerProps) => usePart(useDialog("Trigger").trigger, "button", props)
const Backdrop = (props: BackdropProps) => usePart(useDialog("Backdrop").backdrop, "div", props)
/** What a long dialog scrolls in, around its popup: it may be left out. */
const Viewport = (props: ViewportProps) => usePart(useDialog("Viewport").viewport, "div", props)
const Popup = (props: PopupProps) => usePart(useDialog("Popup").popup, "div", props)
const Title = (props: TitleProps) => usePart(useDialog("Title").title, "h2", props)
const Description = (props: DescriptionProps) =>
  usePart(useDialog("Description").description, "p", props)
const Close = (props: CloseProps) => usePart(useDialog("Close").close, "button", props)

export const Dialog = /* @__PURE__ */ parts("Dialog", {
  Root,
  Trigger,
  Portal,
  Backdrop,
  Viewport,
  Popup,
  Title,
  Description,
  Close,
})

export type AlertRootProps = Omit<AlertDialogProps, "id"> & { id?: string; children?: ReactNode }

function AlertRoot({ children, ...props }: AlertRootProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller = useController(within(createAlertDialog, { direction }), props)
  return <Context.Provider value={controller}>{children}</Context.Provider>
}

/** A dialog that asks for an answer: a press outside it does not close it. Its parts are a dialog's. */
export const AlertDialog = /* @__PURE__ */ parts("AlertDialog", { ...Dialog, Root: AlertRoot })

export type DrawerRootProps = Omit<DrawerProps, "id"> & { id?: string; children?: ReactNode }

function DrawerRoot({ children, ...props }: DrawerRootProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller = useController(within(createDrawer, { direction }), props)
  return <Context.Provider value={controller}>{children}</Context.Provider>
}

type DrawerParts = Vocabulary["drawer"]

export type DrawerBackdropProps = PartComponentProps<"div", StateOf<DrawerParts["backdrop"]>>
export type DrawerPopupProps = PartComponentProps<"div", StateOf<DrawerParts["popup"]>>

// A dialog's, which a drawer's controller gives more to say: how far it has been dragged.
const DrawerBackdrop: (props: DrawerBackdropProps) => ReactElement = Dialog.Backdrop
const DrawerPopup: (props: DrawerPopupProps) => ReactElement = Dialog.Popup

// A drawer has no viewport: it lies at an edge of the page, and what scrolls is inside it.
const { Viewport: _, ...shared } = Dialog

/** A dialog that comes from an edge and is dragged back to it. Its parts are a dialog's. */
export const Drawer = /* @__PURE__ */ parts("Drawer", {
  ...shared,
  Root: DrawerRoot,
  Backdrop: DrawerBackdrop,
  Popup: DrawerPopup,
})
