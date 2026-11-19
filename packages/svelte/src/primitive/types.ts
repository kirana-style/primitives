import type { Snippet } from "svelte"

import type { ChildGiven, ElementAttributes, Tag } from "../types.ts"

/** What a `Primitive` reads of its props; the rest are its element's. */
export type PrimitiveOwnProps<State extends Record<string, unknown>> = {
  /** Another tag for the element; a `div` when left out. */
  as?: Tag | undefined
  /**
   * Draws the caller's own element in place of the `Primitive`'s, as a part's `child` does: it
   * is given `props`, the attributes given here with the state's `data-*` attributes under
   * them, to spread, and `state`. What the element writes after `{...props}` wins.
   */
  child?: Snippet<[ChildGiven<State>]> | undefined
  /**
   * The element's state. `child` is given it, and it is written on the element as `data-*`
   * attributes, under the attributes given: `true` is present and empty, `false`, `null` and
   * `undefined` are absent, anything else is its text, and `isActive` is `data-is-active`.
   */
  state?: State | undefined
  children?: Snippet | undefined
}

/** What a `Primitive` drawn as `Name` takes: its own props, and what the element takes. */
export type PrimitiveProps<
  Name extends Tag = "div",
  State extends Record<string, unknown> = Record<string, never>,
> = PrimitiveOwnProps<State> & {
  [
    Each in keyof ElementAttributes<Name> as Each extends keyof PrimitiveOwnProps<State>
      ? never
      : Each
  ]: ElementAttributes<Name>[Each]
} & { as?: Name | undefined }
