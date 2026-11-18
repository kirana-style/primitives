import { defined } from "@kirana-ui/core"
import type { Anchor, ChangeDetails, PartState, PositionOptions } from "@kirana-ui/core"
import { createPopover } from "@kirana-ui/core/popover"
import type { Popover as Controller, PopoverProps } from "@kirana-ui/core/popover"
import { defineComponent, h, unref, useId, watchEffect } from "vue"
import type { Component, ComponentPublicInstance, PropType, Ref } from "vue"

import {
  context,
  controller,
  elementOf,
  optional,
  partComponent,
  portalComponent,
} from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PlainComponent,
  StatesOf,
} from "./runtime.ts"

export type { PortalProps } from "./runtime.ts"

type State = StatesOf<"popover">

/**
 * The popover its parts are inside. Exported for a component that is made of one (a date picker
 * provides its own to the popover's parts).
 */
const scope = context<Controller>("Popover")
/** For a component made of this one's parts: a date picker. */
export { scope as popoverScope }

export type RootProps = Omit<PopoverProps, "id" | "onOpenChange"> & { id?: string | undefined }

export type RootEmits = Changes<"open", boolean>

const Root = defineComponent({
  name: "PopoverRoot",
  props: { open: optional(Boolean), defaultOpen: Boolean, id: String },
  emits: ["update:open", "openChange"],
  setup(props, { slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(createPopover, () => ({
        id: props.id ?? generated,
        open: props.open,
        defaultOpen: props.defaultOpen,
        onOpenChange(open: boolean, details: ChangeDetails) {
          emit("openChange", open, details)
          if (!details.canceled) emit("update:open", open)
        },
      }))
    )
    return () => slots.default?.()
  },
}) as unknown as PlainComponent<RootProps, RootEmits>

/**
 * What a positioner's `anchor` may be: an element, a place in the viewport (an object with
 * `getBoundingClientRect`), a template ref to an element or a component (in a template that is
 * the element or the component's instance), or a function that gives an element or a place.
 */
export type PositionerAnchor =
  | Anchor
  | ComponentPublicInstance
  | Ref<Anchor | ComponentPublicInstance | null | undefined>
  | (() => Anchor | null | undefined)
  | null
  | undefined

function anchorOf(given: unknown): PositionOptions["anchor"] {
  const named: unknown = unref(given)
  // A function is asked here, so a change of what it reads is followed; and given whole while
  // it has nothing, to be asked again as the popup is placed.
  if (typeof named === "function") {
    const ask = named as () => Anchor | null | undefined
    return ask() ?? ask
  }
  if (!named || typeof named !== "object") return named as null | undefined
  if ("getBoundingClientRect" in named) return named as Anchor
  // A component's instance.
  return elementOf(named) ?? undefined
}

/** A positioner's own props: where its popup goes, and what it is placed against. */
export interface PositionerProps
  extends
    Partial<
      Pick<PositionOptions, "side" | "align" | "sideOffset" | "alignOffset" | "collisionPadding">
    >,
    PartComponentProps {
  /**
   * What the popup is placed against, when that is not its trigger. It may change while the
   * popup is open: the popup follows.
   */
  anchor?: PositionerAnchor
}

/**
 * A positioner: the part's element, with where it goes as props. The one place a positioner's
 * own props are named.
 */
export function positionerComponent<Placed = PartState>(
  name: string,
  use: () => { positioning: Controller["positioning"] },
  element: Component
): PartComponent<"div", Placed, PositionerProps> {
  return defineComponent({
    name,
    inheritAttrs: false,
    props: {
      side: String as PropType<PositionOptions["side"]>,
      align: String as PropType<PositionOptions["align"]>,
      sideOffset: Number,
      alignOffset: Number,
      collisionPadding: Number,
      /**
       * What the popup is placed against, when that is not its trigger. It may change while
       * the popup is open: the popup follows.
       */
      anchor: {
        type: null as unknown as PropType<PositionerAnchor>,
        default: undefined as unknown,
      },
    },
    setup(props, { attrs, slots }) {
      const { positioning } = use()
      // As they change, and before the element attaches: the first placement reads these.
      watchEffect(() => positioning.set(defined({ ...props, anchor: anchorOf(props.anchor) })), {
        flush: "sync",
      })
      return () => h(element, attrs, slots)
    },
  }) as unknown as PartComponent<"div", Placed, PositionerProps>
}

export type TriggerProps = PartComponentProps
export type PopupProps = PartComponentProps
export type TitleProps = PartComponentProps
export type DescriptionProps = PartComponentProps
export type CloseProps = PartComponentProps
export const Popover = {
  Root,
  Trigger: partComponent<"button", State["trigger"]>(
    "PopoverTrigger",
    "button",
    () => scope.use().trigger
  ),
  Portal: portalComponent("PopoverPortal", () => scope.use().mounted),
  Positioner: positionerComponent<State["positioner"]>(
    "PopoverPositioner",
    () => scope.use(),
    partComponent("PopoverPositionerElement", "div", () => scope.use().positioner)
  ),
  Popup: partComponent<"div", State["popup"]>("PopoverPopup", "div", () => scope.use().popup),
  Title: partComponent<"h2", State["title"]>("PopoverTitle", "h2", () => scope.use().title),
  Description: partComponent<"p", State["description"]>(
    "PopoverDescription",
    "p",
    () => scope.use().description
  ),
  Close: partComponent<"button", State["close"]>("PopoverClose", "button", () => scope.use().close),
}
