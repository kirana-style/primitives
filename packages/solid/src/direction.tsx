import { signal } from "@kirana-ui/core"
import type { Direction } from "@kirana-ui/core"
import { createDirection } from "@kirana-ui/core/direction"
import { useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { controller, fromSignal } from "./runtime.tsx"

export interface DirectionProviderProps {
  /** The reading direction of what is inside. `ltr` when left out. */
  direction?: Direction
  children?: JSX.Element
}

/**
 * States the reading direction for the components inside. It draws nothing: set the page's own
 * `dir` attribute with it.
 */
export function DirectionProvider(props: DirectionProviderProps): JSX.Element {
  const made = controller(createDirection, () => ({ direction: props.direction }))
  return (
    <DirectionContext.Provider value={made.direction}>{props.children}</DirectionContext.Provider>
  )
}

/** The direction the nearest provider states; `ltr` outside one. */
export function useDirection(): () => Direction {
  return fromSignal(useContext(DirectionContext) ?? signal<Direction>("ltr"))
}
