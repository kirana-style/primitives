import type { Direction, ReadonlySignal } from "@kirana-ui/core"
import { inject, provide } from "vue"
import type { InjectionKey } from "vue"

const KEY: InjectionKey<ReadonlySignal<Direction>> = Symbol("Direction")

export const provideDirection = (direction: ReadonlySignal<Direction>): void =>
  provide(KEY, direction)

/** The reading direction a provider states, if a component is inside one. */
export const useDirectionAround = (): ReadonlySignal<Direction> | undefined =>
  inject(KEY, undefined)
