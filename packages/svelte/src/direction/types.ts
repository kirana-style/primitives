import type { Direction } from "@kirana-ui/core"
import type { Snippet } from "svelte"

/** It draws nothing: set the page's own `dir` attribute with it. */
export type DirectionProviderProps = {
  /** The reading direction of what is inside. Default: `ltr`. */
  direction?: Direction | undefined
  children?: Snippet | undefined
}
