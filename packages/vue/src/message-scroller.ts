import type { ChangeDetails } from "@kirana-ui/core"
import { createMessageScroller } from "@kirana-ui/core/message-scroller"
import type { MessageScroller as Controller } from "@kirana-ui/core/message-scroller"
import { defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { context, controller, partComponent } from "./runtime.ts"

const scope = context<Controller>("MessageScroller")

const RootElement = partComponent("MessageScrollerRootElement", "div", () => scope.use().root)

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
})

const Viewport = partComponent("MessageScrollerViewport", "div", () => scope.use().viewport)
const Content = partComponent("MessageScrollerContent", "div", () => scope.use().content)
const Button = partComponent("MessageScrollerButton", "button", () => scope.use().button)

export const MessageScroller = { Root, Viewport, Content, Button }
