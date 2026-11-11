import { defined } from "@kirana-ui/core"
import type { ChangeDetails, PositionOptions } from "@kirana-ui/core"
import { createPopover } from "@kirana-ui/core/popover"
import type { Popover as Controller } from "@kirana-ui/core/popover"
import { defineComponent, h, useId, watchEffect } from "vue"
import type { Component, PropType } from "vue"

import { context, controller, optional, partComponent, portalComponent } from "./runtime.ts"

const scope = context<Controller>("Popover")

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
})

/** A positioner: the part's element, with where it goes as props. */
export function positionerComponent(
  name: string,
  use: () => { positioning: Controller["positioning"] },
  element: Component
): Component {
  return defineComponent({
    name,
    inheritAttrs: false,
    props: {
      side: String as PropType<PositionOptions["side"]>,
      align: String as PropType<PositionOptions["align"]>,
      sideOffset: Number,
      alignOffset: Number,
      collisionPadding: Number,
    },
    setup(props, { attrs, slots }) {
      const { positioning } = use()
      // As they change, and before the element attaches: the first placement reads these.
      watchEffect(() => positioning.set(defined({ ...props })), { flush: "sync" })
      return () => h(element, attrs, slots)
    },
  })
}

export const Popover = {
  Root,
  Trigger: partComponent("PopoverTrigger", "button", () => scope.use().trigger),
  Portal: portalComponent("PopoverPortal", () => scope.use().mounted),
  Positioner: positionerComponent(
    "PopoverPositioner",
    () => scope.use(),
    partComponent("PopoverPositionerElement", "div", () => scope.use().positioner)
  ),
  Popup: partComponent("PopoverPopup", "div", () => scope.use().popup),
  Title: partComponent("PopoverTitle", "h2", () => scope.use().title),
  Description: partComponent("PopoverDescription", "p", () => scope.use().description),
  Close: partComponent("PopoverClose", "button", () => scope.use().close),
}
