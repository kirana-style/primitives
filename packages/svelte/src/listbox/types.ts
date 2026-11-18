import type { ListboxItemOptions, ListboxProps } from "@kirana-ui/core/listbox"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

/** `Value` is what an item's `value` is: read from `value`, `defaultValue` or `onValueChange`. */
export type RootProps<Value = unknown> = PartAttributes<
  "div",
  StateFor<"listbox", "root">,
  Controlled<ListboxProps<Value>>
>

export type GroupProps = PartAttributes<
  "div",
  StateFor<"listbox", "group">,
  { id?: string | undefined }
>

export type GroupLabelProps = PartAttributes<"div", StateFor<"listbox", "groupLabel">>

export type ItemProps = PartAttributes<
  "div",
  StateFor<"listbox", "item">,
  ListboxItemOptions & { value: unknown }
>

export type ItemIndicatorProps = PartAttributes<
  "span",
  StateFor<"listbox", "itemIndicator">,
  {
    /** Keeps the mark in the page while its item is not chosen. */
    keepMounted?: boolean | undefined
  }
>
