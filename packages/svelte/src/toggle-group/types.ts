import type { ToggleGroupProps as Props } from "@kirana-ui/core/toggle-group"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

/**
 * Toggles that are one control. `Value` is what a toggle's `value` is: read from `value`,
 * `defaultValue` or `onValueChange`.
 */
export type ToggleGroupProps<Value = unknown> = PartAttributes<
  "div",
  StateFor<"toggleGroup", "root">,
  Controlled<Props<Value>>
>
