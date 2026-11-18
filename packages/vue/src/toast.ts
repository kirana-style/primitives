import { createToast, createToaster as createCoreToaster } from "@kirana-ui/core/toast"
import type * as Core from "@kirana-ui/core/toast"
import { Fragment, defineComponent, h, useId } from "vue"
import type { PropType, VNodeChild } from "vue"

import { written } from "./element.ts"
import { context, controller, fromSignal, partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, PlainComponent, StatesOf } from "./runtime.ts"

type State = StatesOf<"toast">

/**
 * What a toast's title, description and action's label may be here: what a render function
 * returns (a string, `h("b", "Saved")`, several of them).
 */
export type ToastContent = VNodeChild
export type ToastActionOptions<Content = VNodeChild> = Core.ToastActionOptions<Content>
export type ToastOptions<Content = VNodeChild> = Core.ToastOptions<Content>
export type ToastRecord<Content = VNodeChild> = Core.ToastRecord<Content>
export type ToastState<Content = VNodeChild> = Core.ToastState<Content>
export type Toaster<Content = VNodeChild> = Core.Toaster<Content>
export type { ToasterOptions } from "@kirana-ui/core/toast"

/**
 * The toasts of a page, made once, in a module: `toaster.add({ title })` from anywhere. A
 * title, a description and an action's label are what a render function returns, unless
 * `Content` says otherwise.
 */
export const createToaster: <Content = VNodeChild>(
  options?: Core.ToasterOptions
) => Toaster<Content> = createCoreToaster

type Controller = Core.Toast<VNodeChild>
type ToastParts = Core.ToastParts<VNodeChild>
type ToastProps = Core.ToastProps<VNodeChild>

const scope = context<Controller>("Toast")
const toastScope = context<ToastParts>("Toast.Root")

const ViewportElement = partComponent("ToastViewportElement", "div", () => scope.use().viewport)

export type ViewportProps = Omit<ToastProps, "id"> & {
  id?: string | undefined
} & PartComponentProps

/** Where a toaster's toasts are drawn. Always in the page: put it once, near the root. */
const Viewport = defineComponent({
  name: "ToastViewport",
  inheritAttrs: false,
  props: {
    toaster: { type: Object as PropType<Toaster>, required: true },
    label: String,
    hotkey: String,
    swipeDirection: String as PropType<ToastProps["swipeDirection"]>,
    id: String,
  },
  setup(props, { attrs, slots }) {
    const generated = useId()
    scope.provide(
      controller(createToast, () => ({
        id: props.id ?? generated,
        toaster: props.toaster,
        label: props.label,
        hotkey: props.hotkey,
        swipeDirection: props.swipeDirection,
      }))
    )
    return () => h(ViewportElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["viewport"], ViewportProps>

export type ListProps = Record<never, never>

/** Draws its slot once for each toast, the newest first: `v-slot="{ toast }"`. */
const List = defineComponent({
  name: "ToastList",
  setup(_, { slots }) {
    const toasts = fromSignal(scope.use().toasts)
    return () =>
      toasts.value.map((toast) => h(Fragment, { key: toast.id }, slots.default?.({ toast })))
  },
}) as unknown as PlainComponent<ListProps, {}, { toast: ToastRecord }>

const RootElement = partComponent("ToastRootElement", "div", () => toastScope.use().root)

export interface RootProps extends PartComponentProps {
  /** The toast it draws, as `Toast.List` gives it. */
  toast: ToastRecord
}

const Root = defineComponent({
  name: "ToastRoot",
  inheritAttrs: false,
  props: { toast: { type: Object as PropType<ToastRecord>, required: true } },
  setup(props, { attrs, slots }) {
    toastScope.provide(scope.use().toast(props.toast.id))
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps>

const Content = partComponent<"div", State["content"]>(
  "ToastContent",
  "div",
  () => toastScope.use().content
)

/**
 * A part that says something of the toast's: the caller's slot when it has one, what the
 * toast was added with otherwise, and nothing in the page when there is neither.
 */
function said<Tag extends string, Said extends "title" | "description" | "action">(
  name: string,
  tag: Tag,
  part: Said
) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const toast = fromSignal(toastScope.use().record)
      const given = () => (part === "action" ? toast.value?.action?.label : toast.value?.[part])
      // With `as-child` the caller's element holds what the toast says, unless it writes its own.
      const Element = partComponent<string>(
        `${name}Element`,
        tag,
        () => toastScope.use()[part],
        written(given)
      )
      return () => {
        if (slots.default) return h(Element, attrs, slots)
        const words = given()
        return words == null ? null : h(Element, attrs, () => words)
      }
    },
  }) as unknown as PartComponent<Tag, State[Said]>
}

export type ContentProps = PartComponentProps
export type TitleProps = PartComponentProps
export type DescriptionProps = PartComponentProps
export type CloseProps = PartComponentProps
export type ActionProps = PartComponentProps

/** The toast's title, unless it is given a slot of its own. */
const Title = said("ToastTitle", "div", "title")
/** The toast's description, unless it is given a slot of its own. */
const Description = said("ToastDescription", "div", "description")
const Close = partComponent<"button", State["close"]>(
  "ToastClose",
  "button",
  () => toastScope.use().close
)
/**
 * The toast's action, its label unless it is given a slot of its own. A press tells the
 * action (`onAction`), then closes the toast unless the action called `details.cancel()`.
 */
const Action = said("ToastAction", "button", "action")

export const Toast = { Viewport, List, Root, Content, Title, Description, Close, Action }
