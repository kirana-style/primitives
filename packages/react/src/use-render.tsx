import { composeProps, mergeProps as layer, stateAttributes } from "@kirana-ui/core"
import { cloneElement, createElement, isValidElement, useCallback } from "react"
import type { ReactElement, Ref } from "react"

import { REF_IS_A_PROP, give, refOf } from "./element.ts"
import type { RenderProp } from "./runtime.tsx"

export type { RenderProp } from "./runtime.tsx"

/** What `useRender` takes. */
export interface UseRenderOptions<State extends Record<string, unknown>> {
  /**
   * What its caller asked the element to be drawn as: an element, whose own props lie over
   * `props`, or a function given the props and the state.
   */
  render?: RenderProp<NoInfer<State>> | undefined
  /** The element drawn when there is no `render`: a `div` unless said. */
  defaultTagName?: string | undefined
  /** The element's props: the component's own and its caller's, already merged (`mergeProps`). */
  props?: Record<string, unknown> | undefined
  /**
   * The component's state. A function `render` is given it, and it is written on the element
   * as `data-*` attributes, under `props`: `true` is present and empty, `false`, `null` and
   * `undefined` are absent, anything else is its text, and `isActive` is `data-is-active`.
   */
  state?: State | undefined
  /** A ref of the component's own, given the element beside `props.ref` and the `render` element's. */
  ref?: Ref<HTMLElement> | undefined
}

/**
 * Gives a plain element of one's own (a badge, a breadcrumb's link) the `render` prop a part
 * takes, by a part's rule: `props` lie under the `render` element's own props, classes join,
 * styles are merged property by property, both handlers of an event run (`props`' first), the
 * `render` element's own children are drawn when it has any, and every ref gets the element.
 */
export function useRender<State extends Record<string, unknown> = Record<string, never>>({
  render,
  defaultTagName = "div",
  props,
  state,
  ref,
}: UseRenderOptions<State>): ReactElement {
  const asked = isValidElement(render) ? render : undefined
  const theirs = asked ? refOf(asked) : undefined
  const { ref: given, ...own } = (props ?? {}) as { ref?: Ref<HTMLElement> }
  const attach = useCallback(
    (element: HTMLElement | null) => {
      give(ref, element)
      give(given, element)
      give(theirs, element)
    },
    [ref, given, theirs]
  )
  let merged: Record<string, unknown> = state ? composeProps(stateAttributes(state), own) : own
  if (asked) {
    // React 19 keeps an element's ref among its props: it is given the element above. Before,
    // the props have none, and reading it there warns.
    const { ref: _ref, ...element } = REF_IS_A_PROP ? asked.props : { ...asked.props }
    merged = composeProps(merged, element)
  }
  // Only where there is a ref to give: a component that takes none would be handed one.
  const drawn = ref || given ? { ...merged, ref: attach } : merged
  if (asked) return cloneElement(asked, drawn)
  if (typeof render === "function") return render(drawn, state as State)
  return createElement(defaultTagName, drawn)
}

/**
 * Several sets of props as one, for a component's own props and its caller's: a later set
 * wins an attribute it gives (one it leaves `undefined` stays), classes join, styles are
 * merged property by property, and the handlers of an event run in order, until one calls
 * `event.preventKiranaHandler()`, which stops those after it.
 */
export function mergeProps(
  ...props: readonly (Record<string, unknown> | undefined)[]
): Record<string, unknown> {
  let merged: Record<string, unknown> = {}
  for (const each of props) if (each) merged = layer(merged, each)
  return merged
}
