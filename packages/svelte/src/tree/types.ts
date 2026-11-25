import type { TreeProps } from "@kirana-ui/core/tree"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

/**
 * `bind:expandedValue` is the values of the open branches, `bind:selectedValue` those of the
 * chosen nodes. `Value` is what tells a node from the others: the type of the values' entries.
 */
export type RootProps<Value = unknown> = PartAttributes<
  "div",
  StateFor<"tree", "root">,
  Controlled<TreeProps<Value>>
>

export type ItemProps = PartAttributes<
  "div",
  StateFor<"tree", "item">,
  {
    /** What tells this node from the others in the tree: what the values hold. */
    value: unknown
    /** A branch: it has children, drawn in its `Tree.Group`, and opens and closes. */
    branch?: boolean | undefined
    /** Disables this node: it cannot be chosen, opened or closed, and the keys pass over it. */
    disabled?: boolean | undefined
    /** A branch whose children are being loaded. */
    loading?: boolean | undefined
    /** What typing matches, when it is not the node's text. */
    label?: string | undefined
  }
>

export type ItemRowProps = PartAttributes<"div", StateFor<"tree", "itemRow">>

export type ItemIndicatorProps = PartAttributes<"span", StateFor<"tree", "itemIndicator">>

export type ItemTextProps = PartAttributes<"span", StateFor<"tree", "itemText">>

export type GroupProps = PartAttributes<
  "div",
  StateFor<"tree", "group">,
  {
    /** Keeps the closed group in the page, `hidden`. */
    keepMounted?: boolean | undefined
  }
>
