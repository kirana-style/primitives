import type { PartState, ReadonlySignal } from "@kirana-ui/core"
import type { ValueBar, ValueBarProps } from "@kirana-ui/core/progress"
import { defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { written } from "./element.ts"
import { context, controller, fromSignal, partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps } from "./runtime.ts"

export type RootProps<Value extends number | null = number | null> = Omit<
  ValueBarProps,
  "id" | "value"
> & {
  /** The value; a progress bar's is `null` while how far it has come is not known. */
  value: Value
  id?: string | undefined
} & PartComponentProps

export type TrackProps = PartComponentProps
export type IndicatorProps = PartComponentProps
export type ValueProps = PartComponentProps
export type LabelProps = PartComponentProps

/** What a bar's `Value` hands its slot beside its state. */
export interface ValueGiven {
  /** The value as it is written; nothing while it is not known. */
  text: string | undefined
}

/**
 * The parts of a value drawn as a filled track: a progress bar's, a meter's. `States` is the
 * state of each (`StatesOf<"progress">`), `Value` what its value may be.
 */
export function valueBar<
  States extends Record<"root" | "track" | "indicator" | "value" | "label", PartState>,
  Value extends number | null = number | null,
>(name: string, create: (props: ReadonlySignal<ValueBarProps>) => ValueBar) {
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
  }) as unknown as PartComponent<"div", States["root"], RootProps<Value>>

  /** The written value, or what its slot makes of it (`v-slot="{ text }"`). */
  const Value = defineComponent({
    name: `${name}Value`,
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      const text = fromSignal(scope.use().text)
      // With `as-child` the caller's element holds the text, unless it writes its own.
      const ValueElement = partComponent(
        `${name}ValueElement`,
        "span",
        () => scope.use().value,
        written(() => text.value)
      )
      return () =>
        h(ValueElement, attrs, {
          default: (given: object) => slots.default?.({ ...given, text: text.value }) ?? text.value,
        })
    },
  }) as unknown as PartComponent<"span", States["value"], ValueProps, {}, ValueGiven>

  return {
    Root,
    Track: partComponent<"div", States["track"]>(`${name}Track`, "div", () => scope.use().track),
    Indicator: partComponent<"div", States["indicator"]>(
      `${name}Indicator`,
      "div",
      () => scope.use().indicator
    ),
    Value,
    Label: partComponent<"span", States["label"]>(`${name}Label`, "span", () => scope.use().label),
  }
}
