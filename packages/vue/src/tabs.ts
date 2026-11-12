import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createTabs } from "@kirana-ui/core/tabs"
import type { Tabs as Controller } from "@kirana-ui/core/tabs"
import { defineComponent, h, onBeforeUnmount, onMounted, useId, watchEffect } from "vue"
import type { PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { context, controller, fromSignal, optional, partComponent, toSignal } from "./runtime.ts"

const scope = context<Controller>("Tabs")
const ANY = null as unknown as PropType<unknown>

const RootElement = partComponent("TabsRootElement", "div", () => scope.use().root)

/** `v-model:value`, or `value` with `@value-change="(value, details) => …"`. */
const Root = defineComponent({
  name: "TabsRoot",
  inheritAttrs: false,
  props: {
    value: optional(ANY),
    defaultValue: { type: ANY, default: null as unknown },
    orientation: String as PropType<Orientation>,
    id: String,
  },
  emits: ["update:value", "valueChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const direction = useDirectionAround()
    scope.provide(
      controller(within(createTabs, { direction }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        orientation: props.orientation,
        onValueChange(value: unknown, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
})

const ListElement = partComponent("TabsListElement", "div", () => scope.use().list)

const List = defineComponent({
  name: "TabsList",
  inheritAttrs: false,
  props: { activateOnFocus: optional(Boolean), loop: optional(Boolean) },
  setup(props, { attrs, slots }) {
    const { listOptions } = scope.use()
    watchEffect(() => listOptions.set(defined({ ...props })), { flush: "sync" })
    return () => h(ListElement, attrs, slots)
  },
})

const Tab = defineComponent({
  name: "TabsTab",
  inheritAttrs: false,
  props: { value: { type: ANY, required: true }, disabled: optional(Boolean) },
  setup(props, { attrs, slots }) {
    const options = toSignal(() => ({ disabled: props.disabled }))
    // A tab is its value for as long as it is in the page.
    const part = scope.use().tab(props.value, () => defined(options.get()))
    const Element = partComponent("TabsTabElement", "button", () => part)
    return () => h(Element, attrs, slots)
  },
})

/** `keep-mounted` keeps the panel in the page, `hidden`, while its tab is not the active one. */
const Panel = defineComponent({
  name: "TabsPanel",
  inheritAttrs: false,
  props: { value: { type: ANY, required: true }, keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const panel = scope.use().panel(props.value)
    let stop: (() => void) | undefined
    onMounted(() => {
      stop = panel.mount()
    })
    onBeforeUnmount(() => stop?.())
    const mounted = fromSignal(panel.mounted)
    const Element = partComponent("TabsPanelElement", "div", () => panel.part)
    return () => (mounted.value || props.keepMounted ? h(Element, attrs, slots) : null)
  },
})

export const Tabs = {
  Root,
  List,
  Tab,
  Indicator: partComponent("TabsIndicator", "span", () => scope.use().indicator),
  Panel,
}
