import type { ChangeDetails, ReadonlySignal } from "@kirana-ui/core"
import type { HoverPopup, HoverPopupProps } from "@kirana-ui/core/tooltip"
import { defined } from "@kirana-ui/core"
import { defineComponent, h, useId, watchEffect } from "vue"

import { positionerComponent } from "./popover.ts"
import { context, controller, optional, partComponent, portalComponent } from "./runtime.ts"

/** The parts of a popup the pointer opens: a tooltip's, a hover card's. */
export function hoverPopup(
  name: string,
  create: (props: ReadonlySignal<HoverPopupProps>) => HoverPopup,
  triggerTag: string
) {
  const scope = context<HoverPopup>(name)

  /** `v-model:open`, or `open` with `@open-change="(open, details) => …"`. */
  const Root = defineComponent({
    name: `${name}Root`,
    props: {
      open: optional(Boolean),
      defaultOpen: Boolean,
      delay: Number,
      closeDelay: Number,
      disabled: Boolean,
      id: String,
    },
    emits: ["update:open", "openChange"],
    setup(props, { slots, emit }) {
      const generated = useId()
      scope.provide(
        controller(create, () => ({
          id: props.id ?? generated,
          open: props.open,
          defaultOpen: props.defaultOpen,
          delay: props.delay,
          closeDelay: props.closeDelay,
          disabled: props.disabled,
          onOpenChange(open: boolean, details: ChangeDetails) {
            emit("openChange", open, details)
            if (!details.canceled) emit("update:open", open)
          },
        }))
      )
      return () => slots.default?.()
    },
  })

  const TriggerElement = partComponent(
    `${name}TriggerElement`,
    triggerTag,
    () => scope.use().trigger
  )

  /** `delay` and `close-delay` here come before the root's. */
  const Trigger = defineComponent({
    name: `${name}Trigger`,
    inheritAttrs: false,
    props: { delay: Number, closeDelay: Number },
    setup(props, { attrs, slots }) {
      const { timing } = scope.use()
      watchEffect(() => timing.set(defined({ ...props })), { flush: "sync" })
      return () => h(TriggerElement, attrs, slots)
    },
  })

  return {
    Root,
    Trigger,
    Portal: portalComponent(`${name}Portal`, () => scope.use().mounted),
    Positioner: positionerComponent(
      `${name}Positioner`,
      () => scope.use(),
      partComponent(`${name}PositionerElement`, "div", () => scope.use().positioner)
    ),
    Popup: partComponent(`${name}Popup`, "div", () => scope.use().popup),
    Arrow: partComponent(`${name}Arrow`, "div", () => scope.use().arrow),
  }
}
