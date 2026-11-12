import { signal } from "@kirana-ui/core"
import type { Direction, ReadonlySignal } from "@kirana-ui/core"
import { getContext, setContext } from "svelte"

import { fromSignal } from "../runtime.svelte.ts"

const KEY = Symbol("Direction")

export const provide = (direction: ReadonlySignal<Direction>): ReadonlySignal<Direction> =>
  setContext(KEY, direction)

/** The reading direction a provider states, if a component is inside one. */
export const useDirectionAround = (): ReadonlySignal<Direction> | undefined =>
  getContext<ReadonlySignal<Direction> | undefined>(KEY)

/** The direction the nearest provider states, as `current`; `ltr` outside one. */
export function useDirection(): { readonly current: Direction } {
  return fromSignal(useDirectionAround() ?? signal<Direction>("ltr"))
}
