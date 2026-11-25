import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createTour } from "@kirana-ui/core/tour"
import type { Tour as Controller, TourProps, TourStep } from "@kirana-ui/core/tour"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import {
  Portal as BodyPortal,
  parts,
  useController,
  usePart,
  usePositioning,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps, PortalProps, PositionerOptions } from "./runtime.tsx"

export type { PortalProps }

type Parts = Vocabulary["tour"]

const Context = createContext<Controller | null>(null)

function useTour(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Tour.${part}> must be inside <Tour.Root>`)
  return controller
}

/** `Step` is what each step is: a `TourStep` with whatever the page draws it from. */
export type RootProps<Step extends TourStep = TourStep> = Omit<TourProps<Step>, "id"> & {
  id?: string
  children?: ReactNode
}

function Root<Step extends TourStep = TourStep>({
  children,
  ...props
}: RootProps<Step>): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller = useController(within(createTour<Step>, { direction }), props)
  return <Context.Provider value={controller as Controller}>{children}</Context.Provider>
}

function Portal({ children }: PortalProps): ReactElement | null {
  const mounted = useSignal(useTour("Portal").mounted)
  return mounted ? <BodyPortal>{children}</BodyPortal> : null
}

export type SpotlightProps = PartComponentProps<"div", StateOf<Parts["spotlight"]>>

const Spotlight = (props: SpotlightProps) => usePart(useTour("Spotlight").spotlight, "div", props)

export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions
>

function Positioner(props: PositionerProps): ReactElement {
  const controller = useTour("Positioner")
  return usePart(controller.positioner, "div", usePositioning(controller.positioning, props))
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
    /** What the popup holds, or a function given the step shown that draws it. */
    children?: ReactNode | ((shown: TourShownStep<Step>) => ReactNode)
  }
>

/** The step: its children, or what a function of the step shown draws. */
function Popup<Step extends TourStep = TourStep>({
  children,
  ...props
}: PopupProps<Step>): ReactElement {
  const controller = useTour("Popup")
  const step = useSignal(controller.shown) as Step | undefined
  const index = useSignal(controller.index)
  const current = useSignal(controller.current)
  const total = useSignal(controller.total)
  return usePart(controller.popup, "div", {
    ...props,
    children: typeof children === "function" ? children({ step, index, current, total }) : children,
  })
}

export type ArrowProps = PartComponentProps<"div", StateOf<Parts["arrow"]>>
export type TitleProps = PartComponentProps<"h2", StateOf<Parts["title"]>>
export type DescriptionProps = PartComponentProps<"p", StateOf<Parts["description"]>>
export type PreviousProps = PartComponentProps<"button", StateOf<Parts["previous"]>>
export type NextProps = PartComponentProps<"button", StateOf<Parts["next"]>>
export type CloseProps = PartComponentProps<"button", StateOf<Parts["close"]>>

const Arrow = (props: ArrowProps) => usePart(useTour("Arrow").arrow, "div", props)
const Title = (props: TitleProps) => usePart(useTour("Title").title, "h2", props)
const Description = (props: DescriptionProps) =>
  usePart(useTour("Description").description, "p", props)
const Previous = (props: PreviousProps) => usePart(useTour("Previous").previous, "button", props)
const Next = (props: NextProps) => usePart(useTour("Next").next, "button", props)
const Close = (props: CloseProps) => usePart(useTour("Close").close, "button", props)

export const Tour = /* @__PURE__ */ parts("Tour", {
  Root,
  Portal,
  Spotlight,
  Positioner,
  Popup,
  Arrow,
  Title,
  Description,
  Previous,
  Next,
  Close,
})
