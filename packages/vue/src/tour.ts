import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createTour } from "@kirana-ui/core/tour"
import type { Tour as Controller, TourProps, TourStep } from "@kirana-ui/core/tour"
import { defineComponent, h, useId } from "vue"
import type { PropType, PublicProps } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { positionerComponent } from "./popover.ts"
import {
  context,
  controller,
  fromSignal,
  optional,
  partComponent,
  portalComponent,
} from "./runtime.ts"
import type {
  Changes,
  Listeners,
  PartComponent,
  PartComponentProps,
  PlainInstance,
  StatesOf,
} from "./runtime.ts"

export type { PortalProps, PositionerProps } from "./popover.ts"

type State = StatesOf<"tour">

const scope = context<Controller>("Tour")

/** `Step` is what each step is: a `TourStep` with whatever the page draws it from. */
export type RootProps<Step extends TourStep = TourStep> = Omit<
  TourProps<Step>,
  "id" | "onOpenChange" | "onStepChange"
> & { id?: string | undefined }

export type RootEmits = Changes<"open", boolean> & Changes<"step", number>

/** `v-model:open` and `v-model:step`, or each with its `@…-change="(value, details) => …"`. */
const Root = defineComponent({
  name: "TourRoot",
  props: {
    steps: { type: Array as PropType<readonly TourStep[]>, required: true },
    open: optional(Boolean),
    defaultOpen: Boolean,
    step: optional(Number),
    defaultStep: Number,
    waitForTarget: Number,
    spotlightPadding: Number,
    closeOnOutsidePress: Boolean,
    interactive: Boolean,
    keyboardNavigation: optional(Boolean),
    id: String,
  },
  emits: ["update:open", "openChange", "update:step", "stepChange"],
  setup(props, { slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(within(createTour, { direction: useDirectionAround() }), () => ({
        id: props.id ?? generated,
        steps: props.steps,
        open: props.open,
        defaultOpen: props.defaultOpen,
        step: props.step,
        defaultStep: props.defaultStep,
        waitForTarget: props.waitForTarget,
        spotlightPadding: props.spotlightPadding,
        closeOnOutsidePress: props.closeOnOutsidePress,
        interactive: props.interactive,
        keyboardNavigation: props.keyboardNavigation,
        onOpenChange(open: boolean, details: ChangeDetails) {
          emit("openChange", open, details)
          if (!details.canceled) emit("update:open", open)
        },
        onStepChange(step: number, details: ChangeDetails) {
          emit("stepChange", step, details)
          if (!details.canceled) emit("update:step", step)
        },
      }))
    )
    return () => slots.default?.()
  },
}) as unknown as new <Step extends TourStep = TourStep>(
  props: RootProps<Step> & Listeners<RootEmits> & PublicProps
) => PlainInstance<RootProps<Step>, RootEmits, {}>

/** What the popup's slot is told of the step it shows, beside its state, to draw it. */
export interface TourShownStep<Step extends TourStep = TourStep> {
  /** The step shown, as the page gave it; `undefined` while none is. */
  step: Step | undefined
  /** Its index, from 0. */
  index: number
  /** Its place, from 1: the "2" of "2 of 5". */
  current: number
  /** How many steps there are: the "5" of "2 of 5". */
  total: number
}

const PopupElement = partComponent("TourPopupElement", "div", () => scope.use().popup)

/** The step, drawn by its slot (`v-slot="{ step, index, current, total }"`). */
const Popup = defineComponent({
  name: "TourPopup",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const made = scope.use()
    const step = fromSignal(made.shown)
    const index = fromSignal(made.index)
    const current = fromSignal(made.current)
    const total = fromSignal(made.total)
    return () =>
      h(PopupElement, attrs, {
        default: (given: object) =>
          slots.default?.({
            ...given,
            step: step.value,
            index: index.value,
            current: current.value,
            total: total.value,
          }),
      })
  },
}) as unknown as PartComponent<"div", State["popup"], PartComponentProps, {}, TourShownStep>

export type SpotlightProps = PartComponentProps
export type PopupProps = PartComponentProps
export type ArrowProps = PartComponentProps
export type TitleProps = PartComponentProps
export type DescriptionProps = PartComponentProps
export type PreviousProps = PartComponentProps
export type NextProps = PartComponentProps
export type CloseProps = PartComponentProps
export const Tour = {
  Root,
  Portal: portalComponent("TourPortal", () => scope.use().mounted),
  Spotlight: partComponent<"div", State["spotlight"]>(
    "TourSpotlight",
    "div",
    () => scope.use().spotlight
  ),
  Positioner: positionerComponent<State["positioner"]>(
    "TourPositioner",
    () => scope.use(),
    partComponent("TourPositionerElement", "div", () => scope.use().positioner)
  ),
  Popup,
  Arrow: partComponent<"div", State["arrow"]>("TourArrow", "div", () => scope.use().arrow),
  Title: partComponent<"h2", State["title"]>("TourTitle", "h2", () => scope.use().title),
  Description: partComponent<"p", State["description"]>(
    "TourDescription",
    "p",
    () => scope.use().description
  ),
  Previous: partComponent<"button", State["previous"]>(
    "TourPrevious",
    "button",
    () => scope.use().previous
  ),
  Next: partComponent<"button", State["next"]>("TourNext", "button", () => scope.use().next),
  Close: partComponent<"button", State["close"]>("TourClose", "button", () => scope.use().close),
}
