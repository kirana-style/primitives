import type { ButtonProps as Props } from "@kirana-ui/core/button"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

/** A `<button>`, or with `child` and `nativeButton={false}` another element that acts as one. */
export type ButtonProps = PartAttributes<"button", StateFor<"button", "root">, Controlled<Props>>
