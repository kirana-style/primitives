// An alert dialog is a dialog that asks for an answer: its parts are a dialog's.
export { AlertDialog } from "./dialog.ts"
export type * from "./dialog.ts"
// Its root is its own: a dialog's without `modal` and `disablePointerDismissal`.
export type { AlertRootProps as RootProps } from "./dialog.ts"
