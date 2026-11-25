import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createAlertDialog } from "@kirana-ui/core/alert-dialog"
import type { AlertDialogProps } from "@kirana-ui/core/alert-dialog"
import { createDialog } from "@kirana-ui/core/dialog"
import { createDrawer } from "@kirana-ui/core/drawer"
import type { DrawerProps, DrawerSide, DrawerSnapPoint } from "@kirana-ui/core/drawer"
import type { Dialog as Controller, DialogProps } from "@kirana-ui/core/dialog"
import { defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import {
  context,
  controller,
  optional,
  partComponent,
  portalComponent,
  toSignal,
} from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PlainComponent,
  StatesOf,
} from "./runtime.ts"

export type { PortalProps } from "./runtime.ts"

type State = StatesOf<"dialog">

const scope = context<Controller>("Dialog")

export type RootProps = Omit<DialogProps, "id" | "onOpenChange"> & { id?: string | undefined }

export type RootEmits = Changes<"open", boolean>

const Root = defineComponent({
  name: "DialogRoot",
  props: {
    open: optional(Boolean),
    defaultOpen: Boolean,
    modal: { type: Boolean, default: true },
    disablePointerDismissal: optional(Boolean),
    /**
     * Whether a press outside closes it.
     * @deprecated Use `disablePointerDismissal`, the other way round, which wins.
     */
    closeOnOutsidePress: optional(Boolean),
    dismissible: { type: Boolean, default: true },
    id: String,
  },
  emits: ["update:open", "openChange"],
  setup(props, { slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(within(createDialog, { direction: useDirectionAround() }), () => ({
        id: props.id ?? generated,
        open: props.open,
        defaultOpen: props.defaultOpen,
        modal: props.modal,
        disablePointerDismissal: props.disablePointerDismissal,
        closeOnOutsidePress: props.closeOnOutsidePress,
        dismissible: props.dismissible,
        onOpenChange(open: boolean, details: ChangeDetails) {
          emit("openChange", open, details)
          if (!details.canceled) emit("update:open", open)
        },
      }))
    )
    return () => slots.default?.()
  },
}) as unknown as PlainComponent<RootProps, RootEmits>

export type AlertRootProps = Omit<AlertDialogProps, "id" | "onOpenChange"> & {
  id?: string | undefined
}

const AlertRoot = defineComponent({
  name: "AlertDialogRoot",
  props: { open: optional(Boolean), defaultOpen: Boolean, id: String },
  emits: ["update:open", "openChange"],
  setup(props, { slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(within(createAlertDialog, { direction: useDirectionAround() }), () => ({
        id: props.id ?? generated,
        open: props.open,
        defaultOpen: props.defaultOpen,
        onOpenChange(open: boolean, details: ChangeDetails) {
          emit("openChange", open, details)
          if (!details.canceled) emit("update:open", open)
        },
      }))
    )
    return () => slots.default?.()
  },
}) as unknown as PlainComponent<AlertRootProps, RootEmits>

export interface TriggerProps extends PartComponentProps {
  /** It cannot be pressed: the button is disabled, and says so (`data-disabled`). */
  disabled?: boolean | undefined
}
export type BackdropProps = PartComponentProps
export type ViewportProps = PartComponentProps
export type PopupProps = PartComponentProps
export type TitleProps = PartComponentProps
export type DescriptionProps = PartComponentProps
export type CloseProps = TriggerProps

/** A trigger or a close button, with its own `disabled`. */
function button<Name extends "trigger" | "close">(name: string, which: Name) {
  return defineComponent({
    name,
    inheritAttrs: false,
    props: { disabled: Boolean },
    setup(props, { attrs, slots }) {
      const options = toSignal(() => ({ disabled: props.disabled }))
      const made = scope.use()
      const part = (which === "trigger" ? made.triggerPart : made.closePart)(() => options.get())
      const Element = partComponent(`${name}Element`, "button", () => part)
      return () => h(Element, attrs, slots)
    },
  }) as unknown as PartComponent<"button", State[Name], TriggerProps>
}

export const Dialog = {
  Root,
  Trigger: button("DialogTrigger", "trigger"),
  Portal: portalComponent("DialogPortal", () => scope.use().mounted),
  Backdrop: partComponent<"div", State["backdrop"]>(
    "DialogBackdrop",
    "div",
    () => scope.use().backdrop
  ),
  /** What a long dialog scrolls in, around its popup: it may be left out. */
  Viewport: partComponent<"div", State["viewport"]>(
    "DialogViewport",
    "div",
    () => scope.use().viewport
  ),
  Popup: partComponent<"div", State["popup"]>("DialogPopup", "div", () => scope.use().popup),
  Title: partComponent<"h2", State["title"]>("DialogTitle", "h2", () => scope.use().title),
  Description: partComponent<"p", State["description"]>(
    "DialogDescription",
    "p",
    () => scope.use().description
  ),
  Close: button("DialogClose", "close"),
}

/** A dialog that asks for an answer: a press outside it does not close it. Its parts are a dialog's. */
export const AlertDialog = { ...Dialog, Root: AlertRoot }

export type DrawerRootProps = Omit<DrawerProps, "id" | "onOpenChange" | "onSnapPointChange"> & {
  id?: string | undefined
}

export type DrawerRootEmits = Changes<"open", boolean> & Changes<"snapPoint", DrawerSnapPoint>

const DrawerRoot = defineComponent({
  name: "DrawerRoot",
  props: {
    open: optional(Boolean),
    defaultOpen: Boolean,
    modal: { type: Boolean, default: true },
    disablePointerDismissal: optional(Boolean),
    /**
     * Whether a press outside closes it.
     * @deprecated Use `disablePointerDismissal`, the other way round, which wins.
     */
    closeOnOutsidePress: optional(Boolean),
    dismissible: { type: Boolean, default: true },
    swipeDirection: String as PropType<DrawerSide>,
    snapPoints: Array as PropType<readonly DrawerSnapPoint[]>,
    snapPoint: optional([Number, String] as PropType<DrawerSnapPoint>),
    defaultSnapPoint: [Number, String] as PropType<DrawerSnapPoint>,
    id: String,
  },
  emits: ["update:open", "openChange", "update:snapPoint", "snapPointChange"],
  setup(props, { slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(within(createDrawer, { direction: useDirectionAround() }), () => ({
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
        onSnapPointChange(snapPoint: DrawerSnapPoint, details: ChangeDetails) {
          emit("snapPointChange", snapPoint, details)
          if (!details.canceled) emit("update:snapPoint", snapPoint)
        },
        onOpenChange(open: boolean, details: ChangeDetails) {
          emit("openChange", open, details)
          if (!details.canceled) emit("update:open", open)
        },
      }))
    )
    return () => slots.default?.()
  },
}) as unknown as PlainComponent<DrawerRootProps, DrawerRootEmits>

// A drawer has no viewport: it lies at an edge of the page, and what scrolls is inside it.
const { Viewport: _, ...shared } = Dialog

/** A dialog that comes from an edge and is dragged back to it. Its parts are a dialog's. */
export const Drawer = {
  ...shared,
  Root: DrawerRoot,
  // The same two parts, with what they also say of a drag.
  Backdrop: Dialog.Backdrop as unknown as PartComponent<"div", StatesOf<"drawer">["backdrop"]>,
  Popup: Dialog.Popup as unknown as PartComponent<"div", StatesOf<"drawer">["popup"]>,
}
