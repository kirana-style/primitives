import type { SeparatorProps as Props } from "@kirana-ui/core/separator"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

export type SeparatorProps = PartAttributes<"div", StateFor<"separator", "root">, Controlled<Props>>
