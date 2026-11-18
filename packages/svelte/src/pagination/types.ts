import type { PaginationEntry, PaginationProps } from "@kirana-ui/core/pagination"
import type { Snippet } from "svelte"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

/** `bind:page` is the page shown, from 1. */
export type RootProps = PartAttributes<
  "nav",
  StateFor<"pagination", "root">,
  Controlled<PaginationProps>
>

export type PreviousProps = PartAttributes<"button", StateFor<"pagination", "previous">>

/**
 * Draws nothing itself: its snippet once for each piece of the row, a page or the mark for
 * pages left out.
 */
export type ItemsProps = { children: Snippet<[PaginationEntry]> }

export type ItemProps = PartAttributes<
  "button",
  StateFor<"pagination", "item">,
  {
    /** The page it goes to, from 1. */
    page: number
  }
>

export type EllipsisProps = PartAttributes<"span", StateFor<"pagination", "ellipsis">>

export type NextProps = PartAttributes<"button", StateFor<"pagination", "next">>
