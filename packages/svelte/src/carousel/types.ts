import type { CarouselProps } from "@kirana-ui/core/carousel"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<
  "div",
  StateFor<"carousel", "root">,
  Controlled<CarouselProps>
>

export type ViewportProps = PartAttributes<"div", StateFor<"carousel", "viewport">>

export type ItemProps = PartAttributes<
  "div",
  StateFor<"carousel", "item">,
  {
    /** Its place among the items, from 0. */
    index: number
  }
>

export type PreviousProps = PartAttributes<"button", StateFor<"carousel", "previous">>

export type NextProps = PartAttributes<"button", StateFor<"carousel", "next">>

export type IndicatorProps = PartAttributes<
  "button",
  StateFor<"carousel", "indicator">,
  {
    /** The item it goes to, from 0. */
    index: number
  }
>
