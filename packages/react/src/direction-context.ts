import type { Direction, ReadonlySignal } from "@kirana-ui/core"
import { createContext } from "react"

/** The reading direction a provider states, if a component is inside one. */
export const DirectionContext = createContext<ReadonlySignal<Direction> | null>(null)
