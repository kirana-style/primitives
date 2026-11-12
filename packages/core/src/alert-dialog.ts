import { createDialog } from "./dialog.ts"
import type { Dialog, DialogProps } from "./dialog.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export type AlertDialogProps = Omit<DialogProps, "dismissible" | "modal">
export type AlertDialog = Dialog

/**
 * A dialog that interrupts to ask for an answer (`role="alertdialog"`): always modal, and a press
 * outside it does not close it. Its parts are a dialog's.
 */
export const createAlertDialog = (props: ReadonlySignal<AlertDialogProps>): AlertDialog =>
  createDialog(props, { alert: true })
