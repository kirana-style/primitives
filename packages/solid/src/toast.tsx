import { createToast, createToaster as createCoreToaster } from "@kirana-ui/core/toast"
import type * as Core from "@kirana-ui/core/toast"
import type { StateOf } from "@kirana-ui/core"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import {
  For,
  Show,
  createContext,
  createMemo,
  createUniqueId,
  splitProps,
  useContext,
} from "solid-js"
import type { Accessor, JSX } from "solid-js"

import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps, PartTag } from "./runtime.tsx"

/** What a toast's title, description and action's label may be here: anything Solid draws. */
export type ToastContent = JSX.Element
export type ToastActionOptions<Content = JSX.Element> = Core.ToastActionOptions<Content>
export type ToastOptions<Content = JSX.Element> = Core.ToastOptions<Content>
export type ToastRecord<Content = JSX.Element> = Core.ToastRecord<Content>
export type ToastState<Content = JSX.Element> = Core.ToastState<Content>
export type Toaster<Content = JSX.Element> = Core.Toaster<Content>
export type { ToasterOptions } from "@kirana-ui/core/toast"

/**
 * The toasts of a page, made once, in a module: `toaster.add({ title })` from anywhere. A
 * title, a description and an action's label are anything Solid draws, unless `Content` says
 * otherwise.
 */
export const createToaster: <Content = JSX.Element>(
  options?: Core.ToasterOptions
) => Toaster<Content> = createCoreToaster

type Controller = Core.Toast<JSX.Element>
type ToastParts = Core.ToastParts<JSX.Element>
type ToastProps = Core.ToastProps<JSX.Element>

type Parts = Vocabulary["toast"]

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

export type ViewportProps = PartComponentProps<
  "div",
  StateOf<Parts["viewport"]>,
  {
    toaster: Toaster
    label?: string
    hotkey?: string
    swipeDirection?: ToastProps["swipeDirection"]
    id?: string
  }
>

/** Where a toaster's toasts are drawn. Always in the page: put it once, near the root. */
function Viewport(props: ViewportProps): JSX.Element {
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
      <Part of={made.viewport} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type ListProps = { children: (toast: Accessor<ToastRecord>) => JSX.Element }

/**
 * Draws its child once for each toast, the newest first. The child is given the toast as an
 * accessor: one that changes is the same toast, drawn again where it stands.
 */
function List(props: ListProps): JSX.Element {
  const toasts = fromSignal(useToast().toasts)
  const ids = createMemo(() => toasts().map((each) => each.id), undefined, {
    equals: (a, b) => a.length === b.length && a.every((each, at) => each === b[at]),
  })
  return (
    <For each={ids()}>{(id) => props.children(() => toasts().find((each) => each.id === id)!)}</For>
  )
}

export type RootProps = PartComponentProps<"div", StateOf<Parts["root"]>, { toast: ToastRecord }>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, ["toast"])
  // A root is its toast for as long as it is in the page.
  const parts = useToast().toast(local.toast.id)
  return (
    <ToastContext.Provider value={parts}>
      <Part of={parts.root} tag="div" {...rest} />
    </ToastContext.Provider>
  )
}

export type ContentProps = PartComponentProps<"div", StateOf<Parts["content"]>>
export type TitleProps = PartComponentProps<"div", StateOf<Parts["title"]>>
export type DescriptionProps = PartComponentProps<"div", StateOf<Parts["description"]>>
export type CloseProps = PartComponentProps<"button", StateOf<Parts["close"]>>
export type ActionProps = PartComponentProps<"button", StateOf<Parts["action"]>>

const Content = (props: ContentProps) => <Part of={useParts().content} tag="div" {...props} />

/**
 * A part that says something of the toast's: the caller's children when it has any, what the
 * toast was added with otherwise, and nothing in the page when there is neither.
 */
function Said(
  props: PartComponentProps<PartTag> & { said: "title" | "description" | "action"; tag: string }
): JSX.Element {
  const [local, rest] = splitProps(props, ["said", "tag", "children"])
  const parts = useParts()
  const toast = fromSignal(parts.record)
  const children = createMemo(
    () =>
      local.children ?? (local.said === "action" ? toast()?.action?.label : toast()?.[local.said])
  )
  return (
    // A `render` draws what it likes; without one, an element with nothing to say is not drawn.
    <Show when={children() != null || rest.render}>
      <Part of={parts[local.said]} tag={local.tag} {...rest}>
        {children()}
      </Part>
    </Show>
  )
}

/** The toast's title, unless it is given children of its own. */
const Title = (props: TitleProps) => <Said said="title" tag="div" {...props} />
/** The toast's description, unless it is given children of its own. */
const Description = (props: DescriptionProps) => <Said said="description" tag="div" {...props} />
const Close = (props: CloseProps) => <Part of={useParts().close} tag="button" {...props} />
/**
 * The toast's action, its label unless it is given children of its own. A press tells the
 * action (`onAction`), then closes the toast unless the action called `details.cancel()`.
 */
const Action = (props: ActionProps) => <Said said="action" tag="button" {...props} />

export const Toast = { Viewport, List, Root, Content, Title, Description, Close, Action }
