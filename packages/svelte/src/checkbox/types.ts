import type { CheckboxProps } from "@kirana-ui/core/checkbox"

import type { Controlled, HeldInput, PartAttributes, StateFor } from "../types.ts"

/** The box. With `child`, the snippet is also given `input`, the box's native input. */
export type RootProps = PartAttributes<
  "span",
  StateFor<"checkbox", "root">,
  Controlled<CheckboxProps>,
  HeldInput
>

/**
 * A dash while mixed and a tick while checked, from the snippet's state: `<Checkbox.Indicator>{#snippet
 * child({ props, state })}<span {...props}>{state.indeterminate ? "–" : "✓"}</span>{/snippet}</Checkbox.Indicator>`.
 */
export type IndicatorProps = PartAttributes<
  "span",
  StateFor<"checkbox", "indicator">,
  {
    /** Keeps the mark in the page while the box is unchecked. */
    keepMounted?: boolean | undefined
  }
>
