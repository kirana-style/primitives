import type { StepsProps } from "@kirana-ui/core/steps"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

/** `bind:step` is the step shown, from 0; `count` past the last is every step done. */
export type RootProps = PartAttributes<"div", StateFor<"steps", "root">, Controlled<StepsProps>>

export type ListProps = PartAttributes<"div", StateFor<"steps", "list">>

export type ItemProps = PartAttributes<
  "div",
  StateFor<"steps", "item">,
  {
    /**
     * Which step it is, from 0. Left out, its place among the items in the page, once it is
     * there: give it on a page a server draws, which cannot count them.
     */
    index?: number | undefined
  }
>

export type TriggerProps = PartAttributes<"button", StateFor<"steps", "trigger">>

export type IndicatorProps = PartAttributes<"span", StateFor<"steps", "indicator">>

export type SeparatorProps = PartAttributes<"div", StateFor<"steps", "separator">>

export type ContentProps = PartAttributes<
  "div",
  StateFor<"steps", "content">,
  {
    /** The step it is shown for, from 0. */
    index: number
  }
>

export type CompletedProps = PartAttributes<"div", StateFor<"steps", "completed">>

export type PreviousProps = PartAttributes<"button", StateFor<"steps", "previous">>

export type NextProps = PartAttributes<"button", StateFor<"steps", "next">>
