import type { ChangeDetails, PartState, ReadonlySignal } from "@kirana-ui/core"
import type { HoverPopup, HoverPopupProps } from "@kirana-ui/core/tooltip"
import { defined } from "@kirana-ui/core"
import { defineComponent, h, useId, watchEffect } from "vue"

import { positionerComponent } from "./popover.ts"
import { context, controller, optional, partComponent, portalComponent } from "./runtime.ts"
import type { Changes, PartComponent, PartComponentProps, PlainComponent } from "./runtime.ts"

export type { PositionerProps } from "./popover.ts"

export type { PortalProps } from "./runtime.ts"

export type RootProps = Omit<HoverPopupProps, "id" | "onOpenChange"> & { id?: string | undefined }

export type RootEmits = Changes<"open", boolean>

export interface TriggerProps extends PartComponentProps {
  /** How long the pointer rests on this trigger before the popup opens: before the root's. */
  delay?: number | undefined
  /** How long after the pointer leaves the popup closes: before the root's. */
  closeDelay?: number | undefined
}

export type PopupProps = PartComponentProps
export type ArrowProps = PartComponentProps

/**
 * The parts of a popup the pointer opens: a tooltip's, a hover card's. `States` is the state
 * of each (`StatesOf<"tooltip">`), `Tag` the trigger's element.
 */
export function hoverPopup<
  States extends Record<"trigger" | "positioner" | "popup" | "arrow", PartState>,
  Tag extends string,
>(name: string, create: (props: ReadonlySignal<HoverPopupProps>) => HoverPopup, triggerTag: Tag) {
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
  }) as unknown as PlainComponent<RootProps, RootEmits>

  const TriggerElement = partComponent<string>(
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
  }) as unknown as PartComponent<Tag, States["trigger"], TriggerProps>

  return {
    Root,
    Trigger,
    Portal: portalComponent(`${name}Portal`, () => scope.use().mounted),
    Positioner: positionerComponent<States["positioner"]>(
      `${name}Positioner`,
      () => scope.use(),
      partComponent(`${name}PositionerElement`, "div", () => scope.use().positioner)
    ),
    Popup: partComponent<"div", States["popup"]>(`${name}Popup`, "div", () => scope.use().popup),
    Arrow: partComponent<"div", States["arrow"]>(`${name}Arrow`, "div", () => scope.use().arrow),
  }
}
