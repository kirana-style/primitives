import { createToast } from "@kirana-ui/core/toast"
import type {
  Toast as Controller,
  ToastParts,
  ToastProps,
  ToastRecord,
  Toaster,
} from "@kirana-ui/core/toast"
import { Fragment, defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { context, controller, fromSignal, partComponent } from "./runtime.ts"

const scope = context<Controller>("Toast")
const toastScope = context<ToastParts>("Toast.Root")

const ViewportElement = partComponent("ToastViewportElement", "div", () => scope.use().viewport)

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
})

/** Draws its slot once for each toast, the newest first: `v-slot="{ toast }"`. */
const List = defineComponent({
  name: "ToastList",
  setup(_, { slots }) {
    const toasts = fromSignal(scope.use().toasts)
    return () =>
      toasts.value.map((toast) => h(Fragment, { key: toast.id }, slots.default?.({ toast })))
  },
})

const RootElement = partComponent("ToastRootElement", "div", () => toastScope.use().root)

const Root = defineComponent({
  name: "ToastRoot",
  inheritAttrs: false,
  props: { toast: { type: Object as PropType<ToastRecord>, required: true } },
  setup(props, { attrs, slots }) {
    toastScope.provide(scope.use().toast(props.toast.id))
    return () => h(RootElement, attrs, slots)
  },
})

const Title = partComponent("ToastTitle", "div", () => toastScope.use().title)
const Description = partComponent("ToastDescription", "div", () => toastScope.use().description)
const Close = partComponent("ToastClose", "button", () => toastScope.use().close)
const Action = partComponent("ToastAction", "button", () => toastScope.use().action)

export const Toast = { Viewport, List, Root, Title, Description, Close, Action }

export { createToaster } from "@kirana-ui/core/toast"
export type { ToastOptions, ToastRecord, Toaster } from "@kirana-ui/core/toast"
