// A context menu's parts are a menu's, but for its root and its trigger: an area, not a button.
export { ContextMenu } from "./menu.ts"
export type * from "./menu.ts"
// Its root and its trigger are its own.
export type { ContextRootProps as RootProps, ContextTriggerProps as TriggerProps } from "./menu.ts"
