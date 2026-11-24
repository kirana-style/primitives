import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createAlertDialog } from "@kirana-ui/core/alert-dialog"
import { createDialog } from "@kirana-ui/core/dialog"
import { createDrawer } from "@kirana-ui/core/drawer"
import type { DrawerSide, DrawerSnapPoint } from "@kirana-ui/core/drawer"
import type { Dialog as Controller } from "@kirana-ui/core/dialog"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { Part, Portal as BodyPortal, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["dialog"]
type DrawerParts = Vocabulary["drawer"]

const Context = createContext<Controller | null>(null)

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
  return <Context value={made}>{props.children}</Context>
}

export type PortalProps = { children?: JSX.Element }

const Portal = (props: PortalProps) => (
  <BodyPortal mounted={useDialog().mounted}>{props.children}</BodyPortal>
)

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>
export type BackdropProps = PartComponentProps<"div", StateOf<Parts["backdrop"]>>
export type ViewportProps = PartComponentProps<"div", StateOf<Parts["viewport"]>>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type TitleProps = PartComponentProps<"h2", StateOf<Parts["title"]>>
export type DescriptionProps = PartComponentProps<"p", StateOf<Parts["description"]>>
export type CloseProps = PartComponentProps<"button", StateOf<Parts["close"]>>

const part =
  <Props extends Record<string, unknown>>(
    name: "trigger" | "backdrop" | "viewport" | "popup" | "title" | "description" | "close",
    tag: string
  ) =>
  (props: Props): JSX.Element => <Part of={useDialog()[name]} tag={tag} {...props} />

export type AlertRootProps = Omit<RootProps, "modal" | "dismissible">

function AlertRoot(props: AlertRootProps): JSX.Element {
  const generated = createUniqueId()
  const made = controller(createAlertDialog, () => ({
    id: props.id ?? generated,
    open: props.open,
    defaultOpen: props.defaultOpen,
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  return <Context value={made}>{props.children}</Context>
}

export const Dialog = {
  Root,
  Portal,
  Trigger: part<TriggerProps>("trigger", "button"),
  Backdrop: part<BackdropProps>("backdrop", "div"),
  /** What a long dialog scrolls in, around its popup: it may be left out. */
  Viewport: part<ViewportProps>("viewport", "div"),
  Popup: part<PopupProps>("popup", "div"),
  Title: part<TitleProps>("title", "h2"),
  Description: part<DescriptionProps>("description", "p"),
  Close: part<CloseProps>("close", "button"),
}

/** A dialog that asks for an answer: a press outside it does not close it. Its parts are a dialog's. */
export const AlertDialog = { ...Dialog, Root: AlertRoot }

export type DrawerRootProps = RootProps & {
  swipeDirection?: DrawerSide
  snapPoints?: readonly DrawerSnapPoint[]
  snapPoint?: DrawerSnapPoint
  defaultSnapPoint?: DrawerSnapPoint
  onSnapPointChange?: (snapPoint: DrawerSnapPoint, details: ChangeDetails) => void
}

function DrawerRoot(props: DrawerRootProps): JSX.Element {
  const generated = createUniqueId()
  const made = controller(createDrawer, () => ({
    id: props.id ?? generated,
    open: props.open,
    defaultOpen: props.defaultOpen,
    modal: props.modal,
    dismissible: props.dismissible,
    swipeDirection: props.swipeDirection,
    snapPoints: props.snapPoints,
    snapPoint: props.snapPoint,
    defaultSnapPoint: props.defaultSnapPoint,
    onSnapPointChange: (snapPoint: DrawerSnapPoint, details: ChangeDetails) =>
      props.onSnapPointChange?.(snapPoint, details),
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  return <Context value={made}>{props.children}</Context>
}

/** A drawer's backdrop and popup say more than a dialog's: how they are being dragged. */
export type DrawerBackdropProps = PartComponentProps<"div", StateOf<DrawerParts["backdrop"]>>
export type DrawerPopupProps = PartComponentProps<"div", StateOf<DrawerParts["popup"]>>

// A drawer has no viewport: it lies at an edge of the page, and what scrolls is inside it.
const { Viewport: _, ...shared } = Dialog

/** A dialog that comes from an edge and is dragged back to it. Its parts are a dialog's. */
export const Drawer = {
  ...shared,
  Root: DrawerRoot,
  // The same components: only what `render` reads of their state is a drawer's.
  Backdrop: Dialog.Backdrop as (props: DrawerBackdropProps) => JSX.Element,
  Popup: Dialog.Popup as (props: DrawerPopupProps) => JSX.Element,
}
