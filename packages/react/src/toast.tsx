import { createToast } from "@kirana-ui/core/toast"
import type {
  Toast as Controller,
  ToastParts,
  ToastProps,
  ToastRecord,
} from "@kirana-ui/core/toast"
import { Fragment, createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)
const ToastContext = createContext<ToastParts | null>(null)

function useToast(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Toast.${part}> must be inside <Toast.Viewport>`)
  return controller
}

function useParts(part: string): ToastParts {
  const parts = useContext(ToastContext)
  if (!parts) throw new Error(`<Toast.${part}> must be inside <Toast.Root>`)
  return parts
}

export type ViewportProps = Omit<ToastProps, "id"> & { id?: string } & PartComponentProps

/** Where a toaster's toasts are drawn. Always in the page: put it once, near the root. */
function Viewport({
  toaster,
  label,
  hotkey,
  swipeDirection,
  id,
  ...rest
}: ViewportProps): ReactElement {
  const controller = useController<ToastProps, Controller>(createToast, {
    toaster,
    label,
    hotkey,
    swipeDirection,
    id,
  })
  return (
    <Context.Provider value={controller}>
      {usePart(controller.viewport, "div", rest)}
    </Context.Provider>
  )
}

/** Draws its child once for each toast, the newest first. */
function List({ children }: { children: (toast: ToastRecord) => ReactNode }): ReactElement {
  const toasts = useSignal(useToast("List").toasts)
  return (
    <>
      {toasts.map((toast) => (
        <Fragment key={toast.id}>{children(toast)}</Fragment>
      ))}
    </>
  )
}

function Root({ toast, ...props }: PartComponentProps & { toast: ToastRecord }): ReactElement {
  const parts = useToast("Root").toast(toast.id)
  return (
    <ToastContext.Provider value={parts}>{usePart(parts.root, "div", props)}</ToastContext.Provider>
  )
}

const Title = (props: PartComponentProps) => usePart(useParts("Title").title, "div", props)
const Description = (props: PartComponentProps) =>
  usePart(useParts("Description").description, "div", props)
const Close = (props: PartComponentProps) => usePart(useParts("Close").close, "button", props)
const Action = (props: PartComponentProps) => usePart(useParts("Action").action, "button", props)

export const Toast = { Viewport, List, Root, Title, Description, Close, Action }

export { createToaster } from "@kirana-ui/core/toast"
export type { ToastOptions, ToastRecord, Toaster } from "@kirana-ui/core/toast"
