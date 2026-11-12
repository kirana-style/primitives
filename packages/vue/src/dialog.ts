import type { ChangeDetails } from "@kirana-ui/core"
import { createAlertDialog } from "@kirana-ui/core/alert-dialog"
import { createDialog } from "@kirana-ui/core/dialog"
import type { Dialog as Controller } from "@kirana-ui/core/dialog"
import { defineComponent, useId } from "vue"

import { context, controller, optional, partComponent, portalComponent } from "./runtime.ts"

const scope = context<Controller>("Dialog")

const Root = defineComponent({
  name: "DialogRoot",
  props: {
    open: optional(Boolean),
    defaultOpen: Boolean,
    modal: { type: Boolean, default: true },
    dismissible: { type: Boolean, default: true },
    id: String,
  },
  emits: ["update:open", "openChange"],
  setup(props, { slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(createDialog, () => ({
        id: props.id ?? generated,
        open: props.open,
        defaultOpen: props.defaultOpen,
        modal: props.modal,
        dismissible: props.dismissible,
        onOpenChange(open: boolean, details: ChangeDetails) {
          emit("openChange", open, details)
          if (!details.canceled) emit("update:open", open)
        },
      }))
    )
    return () => slots.default?.()
  },
})

const AlertRoot = defineComponent({
  name: "AlertDialogRoot",
  props: { open: optional(Boolean), defaultOpen: Boolean, id: String },
  emits: ["update:open", "openChange"],
  setup(props, { slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(createAlertDialog, () => ({
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
})

export const Dialog = {
  Root,
  Trigger: partComponent("DialogTrigger", "button", () => scope.use().trigger),
  Portal: portalComponent("DialogPortal", () => scope.use().mounted),
  Backdrop: partComponent("DialogBackdrop", "div", () => scope.use().backdrop),
  Popup: partComponent("DialogPopup", "div", () => scope.use().popup),
  Title: partComponent("DialogTitle", "h2", () => scope.use().title),
  Description: partComponent("DialogDescription", "p", () => scope.use().description),
  Close: partComponent("DialogClose", "button", () => scope.use().close),
}

/** A dialog that asks for an answer: a press outside it does not close it. Its parts are a dialog's. */
export const AlertDialog = { ...Dialog, Root: AlertRoot }
