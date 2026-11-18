import type { SelectItemOptions, SelectProps, SelectShown } from "@kirana-ui/core/select"
import type { Snippet } from "svelte"

import type { HeldText, PartAttributes, Placement, Renderless, StateFor } from "../types.ts"

/**
 * It draws nothing. `Value` is what an item's `value` is: read from `value`, `defaultValue`,
 * `values`, `items` or a change callback.
 */
export type RootProps<Value = unknown> = Renderless<SelectProps<Value>>

export type TriggerProps = PartAttributes<"button", StateFor<"select", "trigger">>

/** What is chosen, by its label. */
export type ValueProps = PartAttributes<
  "span",
  StateFor<"select", "value">,
  {
    /** Shown while nothing is chosen. */
    placeholder?: string | undefined
    /**
     * Draws something else than the label: it is given what is chosen (`value` and `label`;
     * with `multiple`, `values` and `labels`, in the items' order).
     */
    children?: Snippet<[shown: SelectShown]> | undefined
  },
  HeldText
>

/** Draws nothing itself: its content at the end of `<body>`, or where a `<PortalProvider>` says. */
export type PortalProps = { children?: Snippet | undefined }

export type PositionerProps = PartAttributes<
  "div",
  StateFor<"select", "positioner">,
  Placement & {
    /**
     * The list opens over its trigger, the chosen item's text on the trigger's own, where
     * there is room and unless a finger opened it.
     */
    alignItemWithTrigger?: boolean | undefined
  }
>

export type PopupProps = PartAttributes<"div", StateFor<"select", "popup">>

/** The items' own box inside the popup, when the popup also holds scroll arrows. */
export type ListProps = PartAttributes<"div", StateFor<"select", "list">>

/** In the page while there is more of the list its way: it scrolls it under a moving pointer. */
export type ScrollUpArrowProps = PartAttributes<"div", StateFor<"select", "scrollUpArrow">>

/** In the page while there is more of the list its way: it scrolls it under a moving pointer. */
export type ScrollDownArrowProps = PartAttributes<"div", StateFor<"select", "scrollDownArrow">>

/** Items that belong together, named by their `<Select.GroupLabel>`. */
export type GroupProps = PartAttributes<
  "div",
  StateFor<"select", "group">,
  { id?: string | undefined }
>

/** Names the group it is in. With no group around it, it is plain text. */
export type GroupLabelProps = PartAttributes<"div", StateFor<"select", "groupLabel">>

/** A line between groups. */
export type SeparatorProps = PartAttributes<"div", StateFor<"select", "separator">>

export type ItemProps = PartAttributes<
  "div",
  StateFor<"select", "item">,
  SelectItemOptions & { value: unknown }
>

export type ItemTextProps = PartAttributes<"span", StateFor<"select", "itemText">>

export type ItemIndicatorProps = PartAttributes<
  "span",
  StateFor<"select", "itemIndicator">,
  {
    /** Keeps the mark in the page while its item is not chosen. */
    keepMounted?: boolean | undefined
  }
>
