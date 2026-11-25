import { within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation, ReadonlySignal } from "@kirana-ui/core"
import { createSteps } from "@kirana-ui/core/steps"
import type { Steps as Controller, StepsProps } from "@kirana-ui/core/steps"
import { defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { context, controller, optional, partComponent } from "./runtime.ts"
import type { Changes, PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"steps">

const scope = context<Controller>("Steps")
// The step an item is, for the parts inside it: given, or counted from the page.
const ITEM: InjectionKey<ReadonlySignal<number>> = Symbol("StepsItem")

function useIndex(part: string): ReadonlySignal<number> {
  const index = inject(ITEM, undefined)
  if (index === undefined) throw new Error(`<Steps.${part}> must be inside <Steps.Item>`)
  return index
}

const RootElement = partComponent("StepsRootElement", "div", () => scope.use().root)

export type RootProps = Omit<StepsProps, "id" | "onStepChange"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = Changes<"step", number>

/** `v-model:step`, or `step` with `@step-change="(step, details) => …"`. */
const Root = defineComponent({
  name: "StepsRoot",
  inheritAttrs: false,
  props: {
    step: optional(Number),
    defaultStep: Number,
    count: Number,
    linear: Boolean,
    orientation: String as PropType<Orientation>,
    id: String,
  },
  emits: ["update:step", "stepChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const direction = useDirectionAround()
    scope.provide(
      controller(within(createSteps, { direction }), () => ({
        id: props.id ?? generated,
        step: props.step,
        defaultStep: props.defaultStep,
        count: props.count,
        linear: props.linear,
        orientation: props.orientation,
        onStepChange(step: number, details: ChangeDetails) {
          emit("stepChange", step, details)
          if (!details.canceled) emit("update:step", step)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

export interface ItemProps extends PartComponentProps {
  /**
   * Which step it is, from 0. Left out, its place among the items in the page, once it is
   * there: give it on a page a server draws, which cannot count them.
   */
  index?: number | undefined
}

const Item = defineComponent({
  name: "StepsItem",
  inheritAttrs: false,
  props: { index: Number },
  setup(props, { attrs, slots }) {
    // An item is its step for as long as it is in the page.
    const item = scope.use().item(props.index)
    provide(ITEM, item.index)
    const Element = partComponent("StepsItemElement", "div", () => item)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["item"], ItemProps>

export interface ContentProps extends PartComponentProps {
  /** The step it is shown for, from 0. */
  index: number
}

const Content = defineComponent({
  name: "StepsContent",
  inheritAttrs: false,
  props: { index: { type: Number, required: true } },
  setup(props, { attrs, slots }) {
    const made = scope.use()
    const Element = partComponent("StepsContentElement", "div", () => made.content(props.index))
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["content"], ContentProps>

export type ListProps = PartComponentProps
export type TriggerProps = PartComponentProps
export type IndicatorProps = PartComponentProps
export type SeparatorProps = PartComponentProps
export type CompletedProps = PartComponentProps
export type PreviousProps = PartComponentProps
export type NextProps = PartComponentProps
export const Steps = {
  Root,
  List: partComponent<"div", State["list"]>("StepsList", "div", () => scope.use().list),
  Item,
  Trigger: partComponent<"button", State["trigger"]>("StepsTrigger", "button", () =>
    scope.use().trigger(useIndex("Trigger"))
  ),
  Indicator: partComponent<"span", State["indicator"]>("StepsIndicator", "span", () =>
    scope.use().indicator(useIndex("Indicator"))
  ),
  Separator: partComponent<"div", State["separator"]>("StepsSeparator", "div", () =>
    scope.use().separator(useIndex("Separator"))
  ),
  Content,
  Completed: partComponent<"div", State["completed"]>(
    "StepsCompleted",
    "div",
    () => scope.use().completed
  ),
  Previous: partComponent<"button", State["previous"]>(
    "StepsPrevious",
    "button",
    () => scope.use().previous
  ),
  Next: partComponent<"button", State["next"]>("StepsNext", "button", () => scope.use().next),
}
