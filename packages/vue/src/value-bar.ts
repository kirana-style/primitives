import type { ReadonlySignal } from "@kirana-ui/core"
import type { ValueBar, ValueBarProps } from "@kirana-ui/core/progress"
import { defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { context, controller, fromSignal, partComponent } from "./runtime.ts"

/** The parts of a value drawn as a filled track: a progress bar's, a meter's. */
export function valueBar(name: string, create: (props: ReadonlySignal<ValueBarProps>) => ValueBar) {
  const scope = context<ValueBar>(name)
  const RootElement = partComponent(`${name}RootElement`, "div", () => scope.use().root)

  const Root = defineComponent({
    name: `${name}Root`,
    inheritAttrs: false,
    props: {
      value: { type: null as unknown as PropType<number | null>, required: true },
      min: Number,
      max: Number,
      format: Object as PropType<Intl.NumberFormatOptions>,
      locale: String,
      getAriaValueText: Function as PropType<ValueBarProps["getAriaValueText"]>,
      id: String,
    },
    setup(props, { attrs, slots }) {
      const generated = useId()
      scope.provide(controller(create, () => ({ ...props, id: props.id ?? generated })))
      return () => h(RootElement, attrs, slots)
    },
  })

  const ValueElement = partComponent(`${name}ValueElement`, "span", () => scope.use().value)

  /** The written value, or what its slot makes of it (`v-slot="{ text }"`). */
  const Value = defineComponent({
    name: `${name}Value`,
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      const text = fromSignal(scope.use().text)
      return () => h(ValueElement, attrs, () => slots.default?.({ text: text.value }) ?? text.value)
    },
  })

  return {
    Root,
    Track: partComponent(`${name}Track`, "div", () => scope.use().track),
    Indicator: partComponent(`${name}Indicator`, "div", () => scope.use().indicator),
    Value,
    Label: partComponent(`${name}Label`, "span", () => scope.use().label),
  }
}
