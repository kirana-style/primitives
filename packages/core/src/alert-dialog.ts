import { createDialog } from "./dialog.ts"
import type { DirectionAround } from "./direction.ts"
import type { Dialog, DialogProps } from "./dialog.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export type AlertDialogProps = Omit<
  DialogProps,
  "disablePointerDismissal" | "closeOnOutsidePress" | "dismissible" | "modal"
>
export type AlertDialog = Dialog

/**
 * A dialog that interrupts to ask for an answer (`role="alertdialog"`): always modal, and a press
 * outside it does not close it. Its parts are a dialog's.
 */
export const createAlertDialog = (
  props: ReadonlySignal<AlertDialogProps>,
  around: DirectionAround = {}
): AlertDialog => createDialog(props, around, { alert: true })
