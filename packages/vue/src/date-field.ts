import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createDateField } from "@kirana-ui/core/date-field"
import type {
  DateField as Controller,
  DateFieldProps,
  DateFieldSegment,
} from "@kirana-ui/core/date-field"
import { Fragment, defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"

const scope = context<Controller>("DateField")
/** For a component made of this one's parts: a date picker. */
export { scope as dateFieldScope }

const RootElement = partComponent("DateFieldRootElement", "div", () => scope.use().root)

/** `v-model:value`, and `@value-change="(value, details) => …"`. */
const Root = defineComponent({
  name: "DateFieldRoot",
  inheritAttrs: false,
  props: {
    value: optional([String, null] as unknown as PropType<string | null>),
    defaultValue: String as PropType<string | null>,
    locale: String,
    min: String,
    max: String,
    placeholders: Object as PropType<DateFieldProps["placeholders"]>,
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    name: String,
    form: String,
    id: String,
  },
  emits: ["update:value", "valueChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const direction = useDirectionAround()
    scope.provide(
      controller(within(createDateField, { direction }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        locale: props.locale,
        min: props.min,
        max: props.max,
        placeholders: props.placeholders,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        name: props.name,
        form: props.form,
        onValueChange(value: string | null, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
})

/** Its slot once for each piece of the date, in the locale's order: `v-slot="{ segment }"`. */
const Segments = defineComponent({
  name: "DateFieldSegments",
  setup(_, { slots }) {
    const segments = fromSignal(scope.use().segments)
    return () =>
      segments.value.map((segment) =>
        h(Fragment, { key: `${segment.index}-${segment.type}` }, slots.default?.({ segment }))
      )
  },
})

/** One piece: a part that is typed, or what stands between two. It writes its own text. */
const Segment = defineComponent({
  name: "DateFieldSegment",
  inheritAttrs: false,
  props: { segment: { type: Object as PropType<DateFieldSegment>, required: true } },
  setup(props, { attrs }) {
    const { part, text } = scope.use().segment(props.segment)
    const shown = fromSignal(text)
    const Element = partComponent("DateFieldSegmentElement", "span", () => part)
    return () => h(Element, attrs, () => shown.value)
  },
})

const Input = partComponent("DateFieldInput", "input", () => scope.use().input)

export const DateField = { Root, Segments, Segment, Input }
