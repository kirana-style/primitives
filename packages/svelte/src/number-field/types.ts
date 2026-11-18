import type { NumberFieldProps } from "@kirana-ui/core/number-field"

import type { Controlled, HeldInput, PartAttributes, StateFor } from "../types.ts"

/**
 * `bind:value` is the number, `null` for none. With `child`, the snippet is also given `input`:
 * the hidden input a form reads the number from, drawn while the field has a `name`.
 */
export type RootProps = PartAttributes<
  "div",
  StateFor<"numberField", "root">,
  Controlled<NumberFieldProps>,
  HeldInput
>

export type GroupProps = PartAttributes<"div", StateFor<"numberField", "group">>

export type InputProps = PartAttributes<"input", StateFor<"numberField", "input">>

export type DecrementProps = PartAttributes<"button", StateFor<"numberField", "decrement">>

export type IncrementProps = PartAttributes<"button", StateFor<"numberField", "increment">>
