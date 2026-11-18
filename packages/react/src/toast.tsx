import type { Part, StateOf } from "@kirana-ui/core"
import { createToast, createToaster as createCoreToaster } from "@kirana-ui/core/toast"
import type * as Core from "@kirana-ui/core/toast"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Fragment, createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** What a toast's title, description and action's label may be here: anything React draws. */
export type ToastContent = ReactNode
export type ToastActionOptions<Content = ReactNode> = Core.ToastActionOptions<Content>
export type ToastOptions<Content = ReactNode> = Core.ToastOptions<Content>
export type ToastRecord<Content = ReactNode> = Core.ToastRecord<Content>
export type ToastState<Content = ReactNode> = Core.ToastState<Content>
export type Toaster<Content = ReactNode> = Core.Toaster<Content>
export type { ToasterOptions } from "@kirana-ui/core/toast"

/**
 * The toasts of a page, made once, in a module: `toaster.add({ title })` from anywhere. A
 * title, a description and an action's label are anything React draws, unless `Content` says
 * otherwise.
 */
export const createToaster: <Content = ReactNode>(
  options?: Core.ToasterOptions
) => Toaster<Content> = createCoreToaster

type Parts = Vocabulary["toast"]

type Controller = Core.Toast<ReactNode>
type ToastParts = Core.ToastParts<ReactNode>
type ToastProps = Core.ToastProps<ReactNode>

const Context = createContext<Controller | null>(null)
const ToastContext = createContext<ToastParts | null>(null)

function useToast(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Toast.${part}> must be inside <Toast.Viewport>`)
  return controller
}

function useParts(part: string): ToastParts {
  const made = useContext(ToastContext)
  if (!made) throw new Error(`<Toast.${part}> must be inside <Toast.Root>`)
  return made
}

export type ViewportProps = PartComponentProps<
  "div",
  StateOf<Parts["viewport"]>,
  Omit<ToastProps, "id"> & { id?: string }
>

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

export interface ListProps {
  /** Draws one toast, once for each, the newest first: a `Toast.Root` given it as `toast`. */
  children: (toast: ToastRecord) => ReactNode
}

/** Draws its child once for each toast, the newest first. */
function List({ children }: ListProps): ReactElement {
  const toasts = useSignal(useToast("List").toasts)
  return (
    <>
      {toasts.map((toast) => (
        <Fragment key={toast.id}>{children(toast)}</Fragment>
      ))}
    </>
  )
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  {
    /** The toast it draws: the one `Toast.List` gave its child. */
    toast: ToastRecord
  }
>

function Root({ toast, ...props }: RootProps): ReactElement {
  const made = useToast("Root").toast(toast.id)
  return (
    <ToastContext.Provider value={made}>{usePart(made.root, "div", props)}</ToastContext.Provider>
  )
}

export type ContentProps = PartComponentProps<"div", StateOf<Parts["content"]>>
export type TitleProps = PartComponentProps<"div", StateOf<Parts["title"]>>
export type DescriptionProps = PartComponentProps<"div", StateOf<Parts["description"]>>
export type CloseProps = PartComponentProps<"button", StateOf<Parts["close"]>>
export type ActionProps = PartComponentProps<"button", StateOf<Parts["action"]>>

const Content = (props: ContentProps) => usePart(useParts("Content").content, "div", props)

/** A part that says something of the toast's, and what the toast was added with for it to say. */
function useSaid(
  name: string,
  part: "title" | "description" | "action"
): { part: Part; said: ReactNode } {
  const made = useParts(name)
  const toast = useSignal(made.record)
  return { part: made[part], said: part === "action" ? toast?.action?.label : toast?.[part] }
}

// A `render` draws what it likes; without one, an element with nothing to say is not drawn.
const unlessSilent = (element: ReactElement, children: ReactNode, render: unknown) =>
  children == null && !render ? null : element

/**
 * The toast's title: the caller's children when it has any, what the toast was added with
 * otherwise, and nothing in the page when there is neither.
 */
function Title(props: TitleProps): ReactElement | null {
  const { part, said } = useSaid("Title", "title")
  const children = props.children ?? said
  return unlessSilent(usePart(part, "div", { ...props, children }), children, props.render)
}

/** The toast's description, unless it is given children of its own. */
function Description(props: DescriptionProps): ReactElement | null {
  const { part, said } = useSaid("Description", "description")
  const children = props.children ?? said
  return unlessSilent(usePart(part, "div", { ...props, children }), children, props.render)
}

const Close = (props: CloseProps) => usePart(useParts("Close").close, "button", props)

/**
 * The toast's action, its label unless it is given children of its own. A press tells the
 * action (`onAction`), then closes the toast unless the action called `details.cancel()`.
 */
function Action(props: ActionProps): ReactElement | null {
  const { part, said } = useSaid("Action", "action")
  const children = props.children ?? said
  return unlessSilent(usePart(part, "button", { ...props, children }), children, props.render)
}

export const Toast = /* @__PURE__ */ parts("Toast", {
  Viewport,
  List,
  Root,
  Content,
  Title,
  Description,
  Close,
  Action,
})
