import type { CheckboxGroupProps as Props } from "@kirana-ui/core/checkbox-group"

import type { RootProps, StateFor } from "../types.ts"

/** Checkboxes that hold one list of values: `bind:value`, or `value` with `onValueChange`. */
export type CheckboxGroupProps = RootProps<Props, StateFor<"checkboxGroup", "root">>
