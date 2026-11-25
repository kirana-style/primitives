import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createAlertDialog } from "@kirana-ui/core/alert-dialog"
import { createDialog } from "@kirana-ui/core/dialog"
import { createDrawer } from "@kirana-ui/core/drawer"
import type { DrawerSide, DrawerSnapPoint } from "@kirana-ui/core/drawer"
import type { Dialog as Controller, DialogButtonOptions } from "@kirana-ui/core/dialog"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { Part, Portal as BodyPortal, controller, split, toSignal } from "./runtime.tsx"
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
  /** Keeps it open when the pointer presses outside it. Default `false`. */
  disablePointerDismissal?: boolean
  /**
   * Whether a press outside closes it. Default `true`.
   * @deprecated Use `disablePointerDismissal`, the other way round, which wins
   * when both are given.
   */
  closeOnOutsidePress?: boolean
  /**
   * Whether a press outside closes it.
   * @deprecated Use `disablePointerDismissal`, which wins over this.
   */
  dismissible?: boolean
  id?: string
  children?: JSX.Element
}

function Root(props: RootProps): JSX.Element {
  const generated = createUniqueId()
  const direction = useContext(DirectionContext) ?? undefined
  const made = controller(within(createDialog, { direction }), () => ({
    id: props.id ?? generated,
    open: props.open,
    defaultOpen: props.defaultOpen,
    modal: props.modal,
    disablePointerDismissal: props.disablePointerDismissal,
    closeOnOutsidePress: props.closeOnOutsidePress,
    dismissible: props.dismissible,
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  return <Context value={made}>{props.children}</Context>
}

export type PortalProps = { children?: JSX.Element }

const Portal = (props: PortalProps) => (
  <BodyPortal mounted={useDialog().mounted}>{props.children}</BodyPortal>
)

export type TriggerProps = PartComponentProps<
  "button",
  StateOf<Parts["trigger"]>,
  DialogButtonOptions
>
export type BackdropProps = PartComponentProps<"div", StateOf<Parts["backdrop"]>>
export type ViewportProps = PartComponentProps<"div", StateOf<Parts["viewport"]>>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type TitleProps = PartComponentProps<"h2", StateOf<Parts["title"]>>
export type DescriptionProps = PartComponentProps<"p", StateOf<Parts["description"]>>
export type CloseProps = PartComponentProps<"button", StateOf<Parts["close"]>, DialogButtonOptions>

const part =
  <Props extends Record<string, unknown>>(
    name: "trigger" | "backdrop" | "viewport" | "popup" | "title" | "description" | "close",
    tag: string
  ) =>
  (props: Props): JSX.Element => <Part of={useDialog()[name]} tag={tag} {...props} />

/** A trigger or a close button, with its own `disabled`. */
const button =
  <Props extends DialogButtonOptions>(name: "triggerPart" | "closePart") =>
  (props: Props): JSX.Element => {
    const [local, rest] = split(props, ["disabled"])
    const options = toSignal(() => ({ disabled: local.disabled }))
    const made = useDialog()[name](() => options.get())
    return <Part of={made} tag="button" {...rest} />
  }

export type AlertRootProps = Omit<
  RootProps,
  "modal" | "disablePointerDismissal" | "closeOnOutsidePress" | "dismissible"
>

function AlertRoot(props: AlertRootProps): JSX.Element {
  const generated = createUniqueId()
  const direction = useContext(DirectionContext) ?? undefined
  const made = controller(within(createAlertDialog, { direction }), () => ({
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
  Trigger: button<TriggerProps>("triggerPart"),
  Backdrop: part<BackdropProps>("backdrop", "div"),
  /** What a long dialog scrolls in, around its popup: it may be left out. */
  Viewport: part<ViewportProps>("viewport", "div"),
  Popup: part<PopupProps>("popup", "div"),
  Title: part<TitleProps>("title", "h2"),
  Description: part<DescriptionProps>("description", "p"),
  Close: button<CloseProps>("closePart"),
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
  const direction = useContext(DirectionContext) ?? undefined
  const made = controller(within(createDrawer, { direction }), () => ({
    id: props.id ?? generated,
    open: props.open,
    defaultOpen: props.defaultOpen,
    modal: props.modal,
    disablePointerDismissal: props.disablePointerDismissal,
    closeOnOutsidePress: props.closeOnOutsidePress,
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
