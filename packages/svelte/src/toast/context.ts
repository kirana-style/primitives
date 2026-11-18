import type { Toast, ToastParts } from "@kirana-ui/core/toast"
import { getContext, setContext } from "svelte"
import type { Snippet } from "svelte"

/** What a toast says here: a string, or a snippet that draws it. */
export type ToastContent = string | Snippet

const KEY = Symbol("Toast")
const PARTS = Symbol("ToastParts")

export const provide = (controller: Toast<ToastContent>): Toast<ToastContent> =>
  setContext(KEY, controller)

export function useToast(): Toast<ToastContent> {
  const controller = getContext<Toast<ToastContent> | undefined>(KEY)
  if (!controller) throw new Error("A Toast part must be inside <Toast.Viewport>")
  return controller
}

export const provideParts = (parts: ToastParts<ToastContent>): ToastParts<ToastContent> =>
  setContext(PARTS, parts)

export function useParts(): ToastParts<ToastContent> {
  const parts = getContext<ToastParts<ToastContent> | undefined>(PARTS)
  if (!parts) throw new Error("A toast's part must be inside <Toast.Root>")
  return parts
}
