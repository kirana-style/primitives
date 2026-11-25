import type { ComboboxEntry, ComboboxProps, ComboboxShown } from "@kirana-ui/core/combobox"
import type { Snippet } from "svelte"

import type { PartAttributes, Placement, Renderless, StateFor } from "../types.ts"

/**
 * It draws nothing. `Value` is what an item's `value` is: read from `value`, `defaultValue`,
 * `values`, `items` or a change callback.
 */
export type RootProps<Value = unknown> = Renderless<ComboboxProps<Value>>

export type InputProps = PartAttributes<"input", StateFor<"combobox", "input">>

export type TriggerProps = PartAttributes<"button", StateFor<"combobox", "trigger">>

/** A button that empties the input and the value. Drawn while there is something to clear. */
export type ClearProps = PartAttributes<
  "button",
  StateFor<"combobox", "clear">,
  {
    /** Keeps the button in the page while there is nothing to clear. */
    keepMounted?: boolean | undefined
  }
>

/** With `multiple`: what holds the chips and the input. */
export type ChipsProps = PartAttributes<"div", StateFor<"combobox", "chips">>

/** With `multiple`: one chosen value. */
export type ChipProps = PartAttributes<
  "span",
  StateFor<"combobox", "chip">,
  {
    /** The chosen value it shows: what its remove button takes away. */
    value: unknown
  }
>

export type ChipRemoveProps = PartAttributes<"button", StateFor<"combobox", "chipRemove">>

/** Draws nothing itself: its content at the end of `<body>`, or where a `<PortalProvider>` says. */
export type PortalProps = { children?: Snippet | undefined }

export type PositionerProps = PartAttributes<"div", StateFor<"combobox", "positioner">, Placement>

export type PopupProps = PartAttributes<"div", StateFor<"combobox", "popup">>

/** What lies over the page behind the list: a sheet's (`presentation`) is modal. */
export type BackdropProps = PartAttributes<"div", StateFor<"combobox", "backdrop">>

/**
 * The items' own box inside the popup, when the popup holds more than items (an input): it is
 * then the listbox.
 */
export type ListProps = PartAttributes<"div", StateFor<"combobox", "list">>

export type ItemProps = PartAttributes<
  "div",
  StateFor<"combobox", "item">,
  {
    value: unknown
    disabled?: boolean | undefined
    /** What is filtered and what the input shows; the item's text when left out. */
    label?: string | undefined
    /** The item's id: the input names the highlighted item by it. One is made when left out. */
    id?: string | undefined
    /** Its place among all the rows, in a virtualized list. */
    index?: number | undefined
  }
>

export type ItemIndicatorProps = PartAttributes<
  "span",
  StateFor<"combobox", "itemIndicator">,
  {
    /** Keeps the mark in the page while its item is not chosen. */
    keepMounted?: boolean | undefined
  }
>

/** Items that belong together, named by their `GroupLabel`. Hidden while none is shown. */
export type GroupProps = PartAttributes<
  "div",
  StateFor<"combobox", "group">,
  { id?: string | undefined }
>

/** Names the group it is in. With no group around it, it is plain text. */
export type GroupLabelProps = PartAttributes<"div", StateFor<"combobox", "groupLabel">>

/** A line between groups. */
export type SeparatorProps = PartAttributes<"div", StateFor<"combobox", "separator">>

/** Drawn while no item is shown for what was typed. */
export type EmptyProps = PartAttributes<"div", StateFor<"combobox", "empty">>

/**
 * Says how the list stands ("3 results", "Loading") to software that reads the page, as its
 * text changes. Keep it in the page and change what it holds: inside the popup, or beside the
 * input.
 */
export type StatusProps = PartAttributes<"div", StateFor<"combobox", "status">>

/**
 * The chosen value's label, for a button that is the combobox, its input inside the popup. It
 * draws no element.
 */
export type ValueProps = {
  /** Shown while nothing is chosen. */
  placeholder?: string | undefined
  /**
   * Draws something else than the label: it is given what is chosen (`value` and `label`;
   * with `multiple`, `values` and `labels`, in the order they were chosen).
   */
  children?: Snippet<[shown: ComboboxShown]> | undefined
}

/**
 * Draws the list from the root's `items`: its snippet once for each item left for what was
 * typed, or for each group that has items left. The root then filters, and no item hides
 * itself. It draws no element.
 */
export type CollectionProps = {
  /** A group the root's `items` gave: its items left are then what is drawn. */
  of?: ComboboxEntry | undefined
  /** Drawn once for each item left, or for each group that has items left. */
  children: Snippet<[entry: ComboboxEntry]>
}
