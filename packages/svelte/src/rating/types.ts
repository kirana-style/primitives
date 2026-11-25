import type { RatingProps } from "@kirana-ui/core/rating"
import type { Snippet } from "svelte"

import type { Controlled, HeldInput, PartAttributes, StateFor } from "../types.ts"

/**
 * `bind:value` is how much is given. With `child`, the snippet is also given `input`: the
 * hidden input a form reads the value from.
 */
export type RootProps = PartAttributes<
  "div",
  StateFor<"rating", "root">,
  Controlled<RatingProps>,
  HeldInput
>

/** Draws nothing itself: its snippet once for each item, given the item's place, from 1. */
export type ItemsProps = { children: Snippet<[place: number]> }

export type ItemProps = PartAttributes<
  "span",
  StateFor<"rating", "item">,
  {
    /** Its place among the items, from 1. */
    place: number
  }
>
