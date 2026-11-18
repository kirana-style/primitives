import { defineComponent } from "vue"
import type { Component, DefineSetupFnComponent, PropType, PublicProps } from "vue"

import { draw } from "./element.ts"
import type { DefaultSlot, ElementAttributes } from "./runtime.ts"

export interface PrimitiveProps {
  /** Another tag for the element, or a component to draw in its place; a `div` when left out. */
  as?: string | Component | undefined
  /** Draws the element in its slot in place of its own: it takes the attributes given here. */
  asChild?: boolean | undefined
}

/** What a `Primitive` drawn as `Tag` takes: its two props, and what the element takes. */
export type PrimitiveGiven<Tag extends string> = PrimitiveProps &
  Omit<ElementAttributes<Tag>, keyof PrimitiveProps>

/**
 * A plain element of one's own (a badge, a breadcrumb's link) with the composition a part
 * has: `as` for another tag or component (a `div` unless said), or with `as-child` the
 * caller's own element in its slot. By a part's rule: the slotted element's own props lie
 * over the attributes on the `Primitive`, classes join, styles are merged, and both listeners
 * of an event run, the `Primitive`'s first.
 */
export const Primitive = defineComponent({
  name: "Primitive",
  inheritAttrs: false,
  props: {
    as: { type: [String, Object] as PropType<string | Component>, default: "div" },
    asChild: Boolean,
  },
  setup(props, { attrs, slots }) {
    return () => draw(props.as, props.asChild, attrs, slots.default?.())
  },
}) as unknown as new <As extends string = "div">(
  props: PrimitiveGiven<As> & { as?: As | Component | undefined } & PublicProps
) => InstanceType<DefineSetupFnComponent<PrimitiveGiven<As>, {}, DefaultSlot<{}>>>
