import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createTour } from "@kirana-ui/core/tour"
import type { Tour as Controller, TourProps, TourStep } from "@kirana-ui/core/tour"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { positioned } from "./popover.tsx"
import type { PositionerOptions } from "./popover.tsx"
import { Part, Portal as BodyPortal, controller, fromSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["tour"]

const Context = createContext<Controller | null>(null)

function useTour(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Tour part must be inside <Tour.Root>")
  return made
}

/** `Step` is what each step is: a `TourStep` with whatever the page draws it from. */
export type RootProps<Step extends TourStep = TourStep> = Omit<TourProps<Step>, "id"> & {
  id?: string
  children?: JSX.Element
}

function Root<Step extends TourStep = TourStep>(props: RootProps<Step>): JSX.Element {
  const generated = createUniqueId()
  const direction = useContext(DirectionContext) ?? undefined
  const made = controller(within(createTour<Step>, { direction }), () => ({
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
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
    onStepChange: (step: number, details: ChangeDetails) => props.onStepChange?.(step, details),
  }))
  return <Context value={made as unknown as Controller}>{props.children}</Context>
}

export type PortalProps = { children?: JSX.Element }

const Portal = (props: PortalProps) => (
  <BodyPortal mounted={useTour().mounted}>{props.children}</BodyPortal>
)

export type SpotlightProps = PartComponentProps<"div", StateOf<Parts["spotlight"]>>

const Spotlight = (props: SpotlightProps) => <Part of={useTour().spotlight} tag="div" {...props} />

export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions
>

function Positioner(props: PositionerProps): JSX.Element {
  const made = useTour()
  return <Part of={made.positioner} tag="div" {...positioned(props, made.positioning)} />
}

/** What the popup's `children` is told of the step it shows, to draw it. */
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

export type PopupProps<Step extends TourStep = TourStep> = PartComponentProps<
  "div",
  StateOf<Parts["popup"]>,
  {
    /** What the popup holds, or a function given the step shown, as an accessor, that draws it. */
    children?: JSX.Element | ((shown: () => TourShownStep<Step>) => JSX.Element)
  }
>

/** The step: its children, or what a function of the step shown draws. */
function Popup<Step extends TourStep = TourStep>(props: PopupProps<Step>): JSX.Element {
  const [local, rest] = split(props, ["children"])
  const made = useTour()
  const step = fromSignal(made.shown)
  const index = fromSignal(made.index)
  const current = fromSignal(made.current)
  const total = fromSignal(made.total)
  const shown = (): TourShownStep<Step> => ({
    step: step() as Step | undefined,
    index: index(),
    current: current(),
    total: total(),
  })
  return (
    <Part of={made.popup} tag="div" {...rest}>
      {(() => {
        const given = local.children
        return typeof given === "function" ? given(shown) : given
      })()}
    </Part>
  )
}

export type ArrowProps = PartComponentProps<"div", StateOf<Parts["arrow"]>>
export type TitleProps = PartComponentProps<"h2", StateOf<Parts["title"]>>
export type DescriptionProps = PartComponentProps<"p", StateOf<Parts["description"]>>
export type PreviousProps = PartComponentProps<"button", StateOf<Parts["previous"]>>
export type NextProps = PartComponentProps<"button", StateOf<Parts["next"]>>
export type CloseProps = PartComponentProps<"button", StateOf<Parts["close"]>>

const part =
  <Props extends Record<string, unknown>>(
    name: "arrow" | "title" | "description" | "previous" | "next" | "close",
    tag: string
  ) =>
  (props: Props): JSX.Element => <Part of={useTour()[name]} tag={tag} {...props} />

export const Tour = {
  Root,
  Portal,
  Spotlight,
  Positioner,
  Popup,
  Arrow: part<ArrowProps>("arrow", "div"),
  Title: part<TitleProps>("title", "h2"),
  Description: part<DescriptionProps>("description", "p"),
  Previous: part<PreviousProps>("previous", "button"),
  Next: part<NextProps>("next", "button"),
  Close: part<CloseProps>("close", "button"),
}
