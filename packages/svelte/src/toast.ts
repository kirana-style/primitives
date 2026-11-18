import { createToaster as createCoreToaster } from "@kirana-ui/core/toast"
import type * as Core from "@kirana-ui/core/toast"

import type { ToastContent } from "./toast/context.ts"

export * as Toast from "./toast/index.ts"
export type { ToastContent }
export type ToastActionOptions<Content = ToastContent> = Core.ToastActionOptions<Content>
export type ToastOptions<Content = ToastContent> = Core.ToastOptions<Content>
export type ToastRecord<Content = ToastContent> = Core.ToastRecord<Content>
export type ToastState<Content = ToastContent> = Core.ToastState<Content>
export type Toaster<Content = ToastContent> = Core.Toaster<Content>
export type { ToasterOptions } from "@kirana-ui/core/toast"

/**
 * The toasts of a page, made once, in a module: `toaster.add({ title })` from anywhere. A
 * title, a description and an action's label are a string or a snippet, unless `Content`
 * says otherwise.
 */
export const createToaster: <Content = ToastContent>(
  options?: Core.ToasterOptions
) => Toaster<Content> = createCoreToaster
export type * from "./toast/types.ts"
