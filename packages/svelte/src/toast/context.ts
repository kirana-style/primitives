import type { Toast, ToastParts } from "@kirana-ui/core/toast"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Toast")
const PARTS = Symbol("ToastParts")

export const provide = (controller: Toast): Toast => setContext(KEY, controller)

export function useToast(): Toast {
  const controller = getContext<Toast | undefined>(KEY)
  if (!controller) throw new Error("A Toast part must be inside <Toast.Viewport>")
  return controller
}

export const provideParts = (parts: ToastParts): ToastParts => setContext(PARTS, parts)

export function useParts(): ToastParts {
  const parts = getContext<ToastParts | undefined>(PARTS)
  if (!parts) throw new Error("A toast's part must be inside <Toast.Root>")
  return parts
}
