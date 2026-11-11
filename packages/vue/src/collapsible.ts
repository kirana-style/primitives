import type { ChangeDetails } from "@kirana-ui/core"
import { createCollapsible } from "@kirana-ui/core/collapsible"
import type { Collapsible as Controller } from "@kirana-ui/core/collapsible"
import { defineComponent, h, useId } from "vue"

import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"

const scope = context<Controller>("Collapsible")

const RootElement = partComponent("CollapsibleRootElement", "div", () => scope.use().root)

/** `v-model:open`, or `open` with `@open-change="(open, details) => …"`. */
const Root = defineComponent({
  name: "CollapsibleRoot",
  inheritAttrs: false,
  props: {
    open: optional(Boolean),
    defaultOpen: Boolean,
    disabled: Boolean,
    id: String,
  },
  emits: ["update:open", "openChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(createCollapsible, () => ({
        id: props.id ?? generated,
        open: props.open,
        defaultOpen: props.defaultOpen,
        disabled: props.disabled,
        onOpenChange(open: boolean, details: ChangeDetails) {
          emit("openChange", open, details)
          if (!details.canceled) emit("update:open", open)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
})

const Trigger = partComponent("CollapsibleTrigger", "button", () => scope.use().trigger)

const PanelElement = partComponent("CollapsiblePanelElement", "div", () => scope.use().panel)

/** `keep-mounted` keeps the closed panel in the page, `hidden`. */
const Panel = defineComponent({
  name: "CollapsiblePanel",
  inheritAttrs: false,
  props: { keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const mounted = fromSignal(scope.use().mounted)
    return () => (mounted.value || props.keepMounted ? h(PanelElement, attrs, slots) : null)
  },
})

export const Collapsible = { Root, Trigger, Panel }
