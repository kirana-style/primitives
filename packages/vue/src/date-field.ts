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
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PlainComponent,
  StatesOf,
} from "./runtime.ts"

type State = StatesOf<"dateField">

/**
 * The date field its parts are inside. Exported for a component that is made of one (a date picker
 * provides its own to the date field's parts).
 */
const scope = context<Controller>("DateField")
/** For a component made of this one's parts: a date picker. */
export { scope as dateFieldScope }

const RootElement = partComponent("DateFieldRootElement", "div", () => scope.use().root)

export type RootProps = Omit<DateFieldProps, "id" | "onValueChange"> & {
  id?: string | undefined
} & PartComponentProps

/** The value is `null` while the date is not whole. */
export type RootEmits = Changes<"value", string | null>

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
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

export type SegmentsProps = Record<never, never>

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
}) as unknown as PlainComponent<SegmentsProps, {}, { segment: DateFieldSegment }>

export interface SegmentProps extends PartComponentProps {
  /** The piece it draws, as `DateField.Segments` gives it. */
  segment: DateFieldSegment
}

/** One piece: a part that is typed, or what stands between two. It writes its own text. */
const Segment = defineComponent({
  name: "DateFieldSegment",
  inheritAttrs: false,
  props: { segment: { type: Object as PropType<DateFieldSegment>, required: true } },
  setup(props, { attrs, slots }) {
    const { part, text } = scope.use().segment(props.segment)
    const shown = fromSignal(text)
    // Its text is the field's to write, whatever its slot holds: with `as-child` the slot is
    // the caller's element, which holds the text unless it writes its own.
    const Element = partComponent(
      "DateFieldSegmentElement",
      "span",
      () => part,
      (content, composed) =>
        composed && content != null && content.length > 0 ? content : [shown.value]
    )
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"span", State["segment"], SegmentProps>

export type InputProps = PartComponentProps
const Input = partComponent<"input", State["input"]>(
  "DateFieldInput",
  "input",
  () => scope.use().input
)

export const DateField = { Root, Segments, Segment, Input }
