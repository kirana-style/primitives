import type { ToggleProps as Props } from "@kirana-ui/core/toggle"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

/** Inside a `<ToggleGroup>`, `value` makes it one of the group's toggles. */
export type ToggleProps = PartAttributes<"button", StateFor<"toggle", "root">, Controlled<Props>>
