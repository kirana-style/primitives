import { createToast } from "@kirana-ui/core/toast"
import type {
  Toast as Controller,
  ToastParts,
  ToastProps,
  ToastRecord,
  Toaster,
} from "@kirana-ui/core/toast"
import { For, createContext, createMemo, createUniqueId, splitProps, useContext } from "solid-js"
import type { Accessor, JSX } from "solid-js"

import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()
const ToastContext = createContext<ToastParts>()

function useToast(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Toast part must be inside <Toast.Viewport>")
  return made
}

function useParts(): ToastParts {
  const parts = useContext(ToastContext)
  if (!parts) throw new Error("A toast's part must be inside <Toast.Root>")
  return parts
}

/** Where a toaster's toasts are drawn. Always in the page: put it once, near the root. */
function Viewport(
  props: PartComponentProps & {
    toaster: Toaster
    label?: string
    hotkey?: string
    swipeDirection?: ToastProps["swipeDirection"]
    id?: string
  }
): JSX.Element {
  const [local, rest] = splitProps(props, ["toaster", "label", "hotkey", "swipeDirection", "id"])
  const generated = createUniqueId()
  const made = controller(createToast, () => ({
    id: local.id ?? generated,
    toaster: local.toaster,
    label: local.label,
    hotkey: local.hotkey,
    swipeDirection: local.swipeDirection,
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.viewport} tag="div" {...rest} />
    </Context.Provider>
  )
}

/**
 * Draws its child once for each toast, the newest first. The child is given the toast as an
 * accessor: one that changes is the same toast, drawn again where it stands.
 */
function List(props: { children: (toast: Accessor<ToastRecord>) => JSX.Element }): JSX.Element {
  const toasts = fromSignal(useToast().toasts)
  const ids = createMemo(() => toasts().map((each) => each.id), undefined, {
    equals: (a, b) => a.length === b.length && a.every((each, at) => each === b[at]),
  })
  return (
    <For each={ids()}>{(id) => props.children(() => toasts().find((each) => each.id === id)!)}</For>
  )
}

function Root(props: PartComponentProps & { toast: ToastRecord }): JSX.Element {
  const [local, rest] = splitProps(props, ["toast"])
  // A root is its toast for as long as it is in the page.
  const parts = useToast().toast(local.toast.id)
  return (
    <ToastContext.Provider value={parts}>
      <Part part={parts.root} tag="div" {...rest} />
    </ToastContext.Provider>
  )
}

const Title = (props: PartComponentProps) => <Part part={useParts().title} tag="div" {...props} />
const Description = (props: PartComponentProps) => (
  <Part part={useParts().description} tag="div" {...props} />
)
const Close = (props: PartComponentProps) => (
  <Part part={useParts().close} tag="button" {...props} />
)
const Action = (props: PartComponentProps) => (
  <Part part={useParts().action} tag="button" {...props} />
)

export const Toast = { Viewport, List, Root, Title, Description, Close, Action }

export { createToaster } from "@kirana-ui/core/toast"
export type { ToastOptions, ToastRecord, Toaster } from "@kirana-ui/core/toast"
