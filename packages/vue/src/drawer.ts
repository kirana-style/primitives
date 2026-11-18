// A drawer is a dialog that is dragged: its parts are a dialog's.
export { Drawer } from "./dialog.ts"
export type * from "./dialog.ts"
// Its root is its own: a dialog's with the side it is dragged to and its snap points.
export type { DrawerRootEmits as RootEmits, DrawerRootProps as RootProps } from "./dialog.ts"
