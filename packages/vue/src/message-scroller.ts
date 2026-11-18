import type { ChangeDetails } from "@kirana-ui/core"
import { createMessageScroller } from "@kirana-ui/core/message-scroller"
import type {
  MessageScroller as Controller,
  MessageScrollerProps,
} from "@kirana-ui/core/message-scroller"
import { defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { context, controller, partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"messageScroller">

const scope = context<Controller>("MessageScroller")

const RootElement = partComponent("MessageScrollerRootElement", "div", () => scope.use().root)

export type RootProps = Omit<MessageScrollerProps, "id" | "onAtBottomChange"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = {
  /** It came to the end, or left it. */
  atBottomChange: (atBottom: boolean, details: ChangeDetails) => void
}

/** `@at-bottom-change="(atBottom, details) => …"` when it comes to the end or leaves it. */
const Root = defineComponent({
  name: "MessageScrollerRoot",
  inheritAttrs: false,
  props: { initial: String as PropType<"bottom" | "top">, threshold: Number, id: String },
  emits: ["atBottomChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(createMessageScroller, () => ({
        id: props.id ?? generated,
        initial: props.initial,
        threshold: props.threshold,
        onAtBottomChange: (atBottom: boolean, details: ChangeDetails) =>
          emit("atBottomChange", atBottom, details),
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

export type ViewportProps = PartComponentProps
export type ContentProps = PartComponentProps
export type ButtonProps = PartComponentProps
const Viewport = partComponent<"div", State["viewport"]>(
  "MessageScrollerViewport",
  "div",
  () => scope.use().viewport
)
const Content = partComponent<"div", State["content"]>(
  "MessageScrollerContent",
  "div",
  () => scope.use().content
)
const Button = partComponent<"button", State["button"]>(
  "MessageScrollerButton",
  "button",
  () => scope.use().button
)

export const MessageScroller = { Root, Viewport, Content, Button }
