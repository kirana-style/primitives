import { signal } from "@kirana-ui/core"
import type { Direction } from "@kirana-ui/core"
import { createDirection } from "@kirana-ui/core/direction"
import { useContext, useState } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import { useController, useSignal } from "./runtime.tsx"

export interface DirectionProviderProps {
  /** The reading direction of what is inside. `ltr` when left out. */
  direction?: Direction
  children?: ReactNode
}

/**
 * States the reading direction for the components inside. It draws nothing: set the page's own
 * `dir` attribute with it.
 */
export function DirectionProvider({ direction, children }: DirectionProviderProps): ReactElement {
  const controller = useController(createDirection, { direction })
  return (
    <DirectionContext.Provider value={controller.direction}>{children}</DirectionContext.Provider>
  )
}

/** The direction the nearest provider states; `ltr` outside one. */
export function useDirection(): Direction {
  const given = useContext(DirectionContext)
  const [fallback] = useState(() => signal<Direction>("ltr"))
  return useSignal(given ?? fallback)
}
