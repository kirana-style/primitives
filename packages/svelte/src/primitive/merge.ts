import { mergeProps as layer } from "@kirana-ui/core"
import type { PartProps } from "@kirana-ui/core"

/** The props of several sets as one: each set's, the later's over the earlier's. */
export type Merged<Sets extends readonly unknown[]> = Sets extends readonly [
  infer First,
  ...infer Rest,
]
  ? Omit<NonNullable<First>, keyof Merged<Rest>> & Merged<Rest>
  : Sets extends readonly []
    ? {}
    : Record<PropertyKey, unknown>

/**
 * Several sets of props as one, for a component's own props and its caller's: a later set
 * wins an attribute it gives (one it leaves `undefined` stays), classes join (Svelte's lists
 * and objects of conditions too), styles are merged property by property, the handlers of an
 * event run in order until one calls `event.preventKiranaHandler()`, which stops those after
 * it, and every attachment (`{@attach}`) is kept. Read where it is spread
 * (`<Primitive {...mergeProps({ class: "badge" }, rest)} />`), it follows the props it reads.
 */
export function mergeProps<const Sets extends readonly (object | undefined)[]>(
  ...sets: Sets
): Merged<Sets> {
  let merged: PartProps = {}
  for (const set of sets) if (set) merged = layer(merged, set as PartProps)
  const out: Record<PropertyKey, unknown> = merged
  // An attachment is a property keyed by a symbol, which the rule's own keys do not reach.
  for (const set of sets) {
    if (!set) continue
    for (const key of Object.getOwnPropertySymbols(set)) out[key] = (set as typeof out)[key]
  }
  return out as Merged<Sets>
}
