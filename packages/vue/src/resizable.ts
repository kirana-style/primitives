import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createResizable } from "@kirana-ui/core/resizable"
import type {
  Resizable as Controller,
  ResizablePanelOptions,
  ResizableProps,
} from "@kirana-ui/core/resizable"
import { defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { context, controller, optional, partComponent, toSignal } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"resizable">

const scope = context<Controller>("Resizable")

const GroupElement = partComponent("ResizableGroupElement", "div", () => scope.use().group)

export type GroupProps = Omit<ResizableProps, "id" | "onSizesChange"> & {
  id?: string | undefined
} & PartComponentProps

export type GroupEmits = {
  /** The panels were resized: each one's share, in order. */
  sizesChange: (sizes: number[], details: ChangeDetails) => void
}

/** `@sizes-change="(sizes, details) => …"` as the panels are resized. */
const Group = defineComponent({
  name: "ResizableGroup",
  inheritAttrs: false,
  props: {
    orientation: String as PropType<Orientation>,
    keyboardStep: Number,
    disabled: Boolean,
    id: String,
  },
  emits: ["sizesChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const direction = useDirectionAround()
    scope.provide(
      controller(within(createResizable, { direction }), () => ({
        id: props.id ?? generated,
        orientation: props.orientation,
        keyboardStep: props.keyboardStep,
        disabled: props.disabled,
        onSizesChange: (sizes: number[], details: ChangeDetails) =>
          emit("sizesChange", sizes, details),
      }))
    )
    return () => h(GroupElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["group"], GroupProps, GroupEmits>

export interface PanelProps extends ResizablePanelOptions, PartComponentProps {}

const Panel = defineComponent({
  name: "ResizablePanel",
  inheritAttrs: false,
  props: { defaultSize: Number, minSize: Number, maxSize: Number },
  setup(props, { attrs, slots }) {
    const options = toSignal(() => ({ ...props }))
    const part = scope.use().panel(() => defined(options.get()))
    const Element = partComponent("ResizablePanelElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["panel"], PanelProps>

export interface HandleProps extends PartComponentProps {
  disabled?: boolean | undefined
}

const Handle = defineComponent({
  name: "ResizableHandle",
  inheritAttrs: false,
  props: { disabled: optional(Boolean) },
  setup(props, { attrs, slots }) {
    const options = toSignal(() => ({ disabled: props.disabled }))
    const part = scope.use().handle(() => defined(options.get()))
    const Element = partComponent("ResizableHandleElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["handle"], HandleProps>

export const Resizable = { Group, Panel, Handle }
