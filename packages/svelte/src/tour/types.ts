import type { TourProps, TourStep } from "@kirana-ui/core/tour"
import type { Snippet } from "svelte"

import type { PartAttributes, Placement, Renderless, StateFor } from "../types.ts"

/**
 * It draws nothing: `bind:open` is whether the tour shows, `bind:step` the index of the step
 * asked for. `Step` is what each step is: a `TourStep` with whatever the page draws it from.
 */
export type RootProps<Step extends TourStep = TourStep> = Renderless<TourProps<Step>>

/** Draws nothing itself: its content at the end of `<body>`, or where a `<PortalProvider>` says. */
export type PortalProps = { children?: Snippet | undefined }

export type SpotlightProps = PartAttributes<"div", StateFor<"tour", "spotlight">>

export type PositionerProps = PartAttributes<"div", StateFor<"tour", "positioner">, Placement>

/** What the popup's `children` is given of the step it shows, to draw it. */
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

/** What the popup holds: its `children`, a snippet given the step shown. */
export type PopupProps<Step extends TourStep = TourStep> = PartAttributes<
  "div",
  StateFor<"tour", "popup">,
  { children?: Snippet<[shown: TourShownStep<Step>]> | undefined }
>

export type ArrowProps = PartAttributes<"div", StateFor<"tour", "arrow">>

export type TitleProps = PartAttributes<"h2", StateFor<"tour", "title">>

export type DescriptionProps = PartAttributes<"p", StateFor<"tour", "description">>

export type PreviousProps = PartAttributes<"button", StateFor<"tour", "previous">>

export type NextProps = PartAttributes<"button", StateFor<"tour", "next">>

export type CloseProps = PartAttributes<"button", StateFor<"tour", "close">>
