import type { ChangeDetails, ReadonlySignal } from "@kirana-ui/core"
import type { HoverPopup, HoverPopupProps } from "@kirana-ui/core/tooltip"
import { defineComponent, useId } from "vue"

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

  return {
    Root,
    Trigger: partComponent(`${name}Trigger`, triggerTag, () => scope.use().trigger),
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
