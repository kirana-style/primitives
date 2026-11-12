import { defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createAccordion } from "@kirana-ui/core/accordion"
import type { AccordionItem, Accordion as Controller } from "@kirana-ui/core/accordion"
import { defineComponent, h, inject, onBeforeUnmount, onMounted, provide, useId } from "vue"
import type { InjectionKey, PropType } from "vue"

import { context, controller, fromSignal, optional, partComponent, toSignal } from "./runtime.ts"

const scope = context<Controller>("Accordion")
const ITEM: InjectionKey<AccordionItem> = Symbol("AccordionItem")
const ANY = null as unknown as PropType<unknown>

function useItem(): AccordionItem {
  const item = inject(ITEM, undefined)
  if (!item) throw new Error("An Accordion part must be inside <Accordion.Item>")
  return item
}

const RootElement = partComponent("AccordionRootElement", "div", () => scope.use().root)

/** `v-model:value` (a list), or `value` with `@value-change="(value, details) => …"`. */
const Root = defineComponent({
  name: "AccordionRoot",
  inheritAttrs: false,
  props: {
    value: optional(Array as PropType<readonly unknown[]>),
    defaultValue: Array as PropType<readonly unknown[]>,
    multiple: Boolean,
    disabled: Boolean,
    orientation: String as PropType<Orientation>,
    loop: optional(Boolean),
    id: String,
  },
  emits: ["update:value", "valueChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(createAccordion, () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        multiple: props.multiple,
        disabled: props.disabled,
        orientation: props.orientation,
        loop: props.loop,
        onValueChange(value: unknown[], details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
})

const Item = defineComponent({
  name: "AccordionItem",
  inheritAttrs: false,
  props: { value: { type: ANY, required: true }, disabled: optional(Boolean) },
  setup(props, { attrs, slots }) {
    const options = toSignal(() => ({ disabled: props.disabled }))
    // An item is its value for as long as it is in the page.
    const item = scope.use().item(props.value, () => defined(options.get()))
    provide(ITEM, item)
    let stop: (() => void) | undefined
    onMounted(() => {
      stop = item.mount()
    })
    onBeforeUnmount(() => stop?.())
    const Element = partComponent("AccordionItemElement", "div", () => item.root)
    return () => h(Element, attrs, slots)
  },
})

const PanelElement = partComponent("AccordionPanelElement", "div", () => useItem().panel)

/** `keep-mounted` keeps the closed panel in the page, `hidden`. */
const Panel = defineComponent({
  name: "AccordionPanel",
  inheritAttrs: false,
  props: { keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const mounted = fromSignal(useItem().mounted)
    return () => (mounted.value || props.keepMounted ? h(PanelElement, attrs, slots) : null)
  },
})

export const Accordion = {
  Root,
  Item,
  Header: partComponent("AccordionHeader", "h3", () => useItem().header),
  Trigger: partComponent("AccordionTrigger", "button", () => useItem().trigger),
  Panel,
}
