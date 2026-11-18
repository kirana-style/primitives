import type { RadioGroupProps, RadioItemOptions } from "@kirana-ui/core/radio-group"

import type { Controlled, HeldInput, PartAttributes, StateFor } from "../types.ts"

/** `Value` is what an item's `value` is: read from `value`, `defaultValue` or `onValueChange`. */
export type RootProps<Value = unknown> = PartAttributes<
  "div",
  StateFor<"radioGroup", "root">,
  Controlled<RadioGroupProps<Value>>
>

/** One choice. With `child`, the snippet is also given `input`, the item's native input. */
export type ItemProps = PartAttributes<
  "span",
  StateFor<"radioGroup", "item">,
  RadioItemOptions & { value: unknown },
  HeldInput
>

export type IndicatorProps = PartAttributes<
  "span",
  StateFor<"radioGroup", "indicator">,
  {
    /** Keeps the mark in the page while its item is not the chosen one. */
    keepMounted?: boolean | undefined
  }
>
