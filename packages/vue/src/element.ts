import { composeProps, mergeProps } from "@kirana-ui/core"
import type { PartProps } from "@kirana-ui/core"
import { Comment, Fragment, cloneVNode, h } from "vue"
import type { Component, VNode, VNodeArrayChildren } from "vue"

function firstElement(nodes: VNode[] | undefined): VNode | undefined {
  for (const node of nodes ?? []) {
    if (node.type === Comment) continue
    if (node.type === Fragment) return firstElement(node.children as VNode[])
    return node
  }
  return undefined
}

type Listener = (...given: unknown[]) => void

/** Vue keeps several listeners of one event as a list: one function, so each is merged as one. */
function single(props: PartProps): PartProps {
  let out = props
  for (const key in props) {
    const value = props[key]
    if (!key.startsWith("on") || !Array.isArray(value)) continue
    if (out === props) out = { ...props }
    out[key] = (...given: unknown[]) => {
      for (const each of value as Listener[]) each(...given)
    }
  }
  return out
}

/**
 * What a part keeps in its element beside its content (a control's native input, a code
 * cell's character, the text it writes): given the content, it returns what the element
 * holds. `composed` says the element is the caller's own (`as-child`), and the content that
 * element's.
 */
export type Hold = (
  content: VNodeArrayChildren | undefined,
  composed: boolean
) => VNodeArrayChildren

/**
 * What the element of a part that writes its own text holds: with `as-child`, the text while
 * the caller's element has no content of its own, as the part's own element would.
 */
export function written(text: () => unknown): Hold {
  return (content, composed) => {
    if (!composed || (content != null && content.length > 0)) return content ?? []
    const own = text() as VNodeArrayChildren[number]
    return own == null ? [] : [own]
  }
}

type Slot = (...given: unknown[]) => VNodeArrayChildren | undefined

/**
 * The caller's own element holding what the part keeps in it: among the children of an
 * element, in the default slot of a component. Its content is then a list this adapter made,
 * so nothing the compiler said of the element's children (which of them can change) stands.
 */
function holding(child: VNode, hold: Hold): Partial<VNode> & { dynamicChildren: null } {
  const given = child.children
  let made: VNode
  if (typeof child.type === "string") {
    const content = typeof given === "string" ? [given] : (given as VNodeArrayChildren | null)
    made = h(child.type, null, hold(content ?? undefined, true))
  } else {
    // A component given no named slots takes whatever it was given as its default slot.
    const slots =
      given && typeof given === "object" && !Array.isArray(given)
        ? (given as Record<string, Slot | undefined>)
        : { default: (() => (typeof given === "string" ? [given] : (given ?? undefined))) as Slot }
    // Without the compiler's mark on the slots, which says they never change: these do.
    const { _: _mark, default: content, ...named } = slots
    made = h(child.type as Component, null, {
      ...named,
      default: (...handed: unknown[]) => hold(content?.(...handed), true),
    })
  }
  return { children: made.children, shapeFlag: made.shapeFlag, patchFlag: 0, dynamicChildren: null }
}

/**
 * The element a part draws, or a plain one (`own` left out): `as`, or with `asChild` the
 * caller's own element, the first in `content`. Three layers of props, lowest first: the
 * attributes on the component, the slotted element's own, the part's. A higher layer wins an
 * attribute, classes join, styles are merged, and every listener of an event runs, lowest
 * first. What the part keeps in its element (`hold`) is in it whichever element that is.
 */
export function draw(
  as: string | Component,
  asChild: boolean,
  attrs: PartProps,
  content: VNode[] | undefined,
  own?: PartProps,
  ref?: (target: unknown) => void,
  hold?: Hold
): VNode | null {
  const whole = (under: PartProps) => {
    const merged = own ? mergeProps(under, own) : under
    return ref ? { ...merged, ref } : merged
  }
  if (!asChild) {
    const inside = hold ? hold(content, false) : content
    // A component takes its content as a slot.
    return typeof as === "string"
      ? h(as, whole(single(attrs)), inside)
      : h(as, whole(single(attrs)), () => inside)
  }
  const child = firstElement(content)
  if (!child) return null
  // Its ref is the element's own, which the clone keeps beside the part's.
  const { ref: _ref, ref_key: _key, ref_for: _for, ...theirs } = child.props ?? {}
  // Cloned with its props taken off: Vue would lay them under these a second time, its class
  // twice and its listener beside the one that already calls it.
  return cloneVNode(
    { ...child, props: null, ...(hold ? holding(child, hold) : null) },
    whole(composeProps(single(attrs), single(theirs))),
    true
  )
}
