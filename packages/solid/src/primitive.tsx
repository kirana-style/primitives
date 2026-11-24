import { mergeProps as layer, stateAttributes } from "@kirana-ui/core"
import type { PartProps } from "@kirana-ui/core"
import { Show, children, createMemo, splitProps } from "solid-js"
import type { JSX } from "solid-js"
import { Dynamic } from "solid-js/web"

import type { PartTag } from "./runtime.tsx"

/** What a `Primitive` reads of its props; the rest are its element's. */
export interface PrimitiveOwnProps<State extends Record<string, unknown>> {
  /** Another tag for the element; a `div` when left out. */
  as?: PartTag | (string & {}) | undefined
  /**
   * Renders the caller's own element in place of the `Primitive`'s, as a part's `render` does:
   * `props()` is the attributes given here with the state's `data-*` attributes under them, and
   * `children` what the `Primitive` holds; `state()` is `state`. What the element writes after
   * `{...props()}` wins.
   */
  render?: ((props: () => PartProps, state: () => State) => JSX.Element) | undefined
  /**
   * The element's state. `render` is given it, and it is written on the element as `data-*`
   * attributes, under the attributes given: `true` is present and empty, `false`, `null` and
   * `undefined` are absent, anything else is its text, and `isActive` is `data-is-active`.
   */
  state?: State | undefined
  children?: JSX.Element
}

/** What a `Primitive` drawn as `Tag` takes: its own props, and what the element takes. */
export type PrimitiveProps<
  Tag extends PartTag = "div",
  State extends Record<string, unknown> = Record<string, never>,
> = PrimitiveOwnProps<State> &
  Omit<JSX.IntrinsicElements[Tag], keyof PrimitiveOwnProps<State>> & {
    as?: Tag | (string & {}) | undefined
  }

/**
 * A plain element of one's own (a badge, a breadcrumb's link) with the composition a part has:
 * `as` for another tag (a `div` unless said), or `render` for the caller's own element, given the
 * props to spread and the state. `state` is written as `data-*` attributes under the attributes
 * given. Merge the component's own props with its caller's through `mergeProps`, as a part's
 * are merged.
 */
export function Primitive<
  Tag extends PartTag = "div",
  State extends Record<string, unknown> = Record<string, never>,
>(props: PrimitiveProps<Tag, State>): JSX.Element {
  const [local, rest] = splitProps(props as PrimitiveOwnProps<State> & Record<string, unknown>, [
    "as",
    "render",
    "state",
    "children",
  ])
  const marks = () => stateAttributes(local.state ?? {})
  return (
    <Show
      when={local.render}
      fallback={
        <Dynamic component={local.as ?? "div"} {...marks()} {...rest}>
          {local.children}
        </Dynamic>
      }
    >
      {(render) => {
        // Resolved once, as a part's are: a change of the props hands the same nodes over again.
        const held = children(() => local.children)
        const handed = createMemo((): PartProps => {
          const given: PartProps = { ...marks() }
          for (const key of Object.keys(rest)) given[key] = rest[key]
          return { ...given, children: held() }
        })
        return render()(handed, () => local.state ?? ({} as State))
      }}
    </Show>
  )
}

type Props = Record<string, unknown>

/** The props of several sets as one: each set's, the later's over the earlier's. */
export type Merged<Sets extends readonly unknown[]> = Sets extends readonly [
  infer First,
  ...infer Rest,
]
  ? Omit<NonNullable<First>, keyof Merged<Rest>> & Merged<Rest>
  : Sets extends readonly []
    ? {}
    : Record<string, unknown>

/** One key of several sets, by a part's rule. */
function mergedValue(sets: readonly (Props | undefined)[], key: string): unknown {
  if (key === "ref") {
    // Solid hands a component a function whatever was written: each set's gets the element.
    const refs = sets.map((set) => set?.ref).filter((ref) => typeof ref === "function")
    if (refs.length < 2) return refs[0]
    return (element: unknown) => {
      for (const ref of refs) (ref as (element: unknown) => void)(element)
    }
  }
  let merged: PartProps = {}
  for (const set of sets) if (set && key in set) merged = layer(merged, { [key]: set[key] })
  return merged[key]
}

/**
 * Several sets of props as one, for a component's own props and its caller's: a later set
 * wins an attribute it gives (one it leaves `undefined` stays), classes join, styles are
 * merged property by property, the handlers of an event run in order until one calls
 * `event.preventKiranaHandler()`, which stops those after it, and every `ref` gets the
 * element. It reads its sets when a prop is read, so a component's props stay reactive: spread
 * it (`<Primitive {...mergeProps({ class: "badge" }, props)} />`). Not solid-js's
 * `mergeProps`, where a later class replaces an earlier one: import one under another name
 * where both are used.
 */
export function mergeProps<const Sets extends readonly (object | undefined)[]>(
  ...sets: Sets
): Merged<Sets> {
  const given = sets as readonly (Props | undefined)[]
  // An attribute no set has a value for is not among the keys: spread after an element's own
  // attribute, it would take it away. (Children are not read here: reading them draws them.)
  const keys = () => {
    const all = new Set<string>()
    for (const set of sets) if (set) for (const key of Object.keys(set)) all.add(key)
    return [...all].filter(
      (key) => key === "children" || key === "ref" || mergedValue(given, key) !== undefined
    )
  }
  return new Proxy({} as Merged<Sets>, {
    get: (_, key) => (typeof key === "string" ? mergedValue(given, key) : undefined),
    has: (_, key) => typeof key === "string" && keys().includes(key),
    ownKeys: () => keys(),
    getOwnPropertyDescriptor: (_, key) =>
      typeof key === "string" && keys().includes(key)
        ? { configurable: true, enumerable: true, get: () => mergedValue(given, key) }
        : undefined,
  })
}
