import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createTimeField } from "@kirana-ui/core/time-field"
import type {
  HourCycle,
  TimeField as Controller,
  TimeFieldProps,
  TimeFieldSegment,
  TimeGranularity,
} from "@kirana-ui/core/time-field"
import { Fragment, defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { useFieldAround } from "./field-context.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PlainComponent,
  StatesOf,
} from "./runtime.ts"

type State = StatesOf<"timeField">

const scope = context<Controller>("TimeField")

const RootElement = partComponent("TimeFieldRootElement", "div", () => scope.use().root)

export type RootProps = Omit<TimeFieldProps, "id" | "onValueChange"> & {
  id?: string | undefined
} & PartComponentProps

/** The value is `null` while the time is not whole. */
export type RootEmits = Changes<"value", string | null>

/** `v-model:value`, and `@value-change="(value, details) => …"`. */
const Root = defineComponent({
  name: "TimeFieldRoot",
  inheritAttrs: false,
  props: {
    value: optional([String, null] as unknown as PropType<string | null>),
    defaultValue: String as PropType<string | null>,
    granularity: String as PropType<TimeGranularity>,
    hourCycle: Number as PropType<HourCycle>,
    locale: String,
    min: String,
    max: String,
    placeholders: Object as PropType<TimeFieldProps["placeholders"]>,
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
      controller(within(createTimeField, { direction, field: useFieldAround() }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        granularity: props.granularity,
        hourCycle: props.hourCycle,
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

/** Its slot once for each piece of the time, in the locale's order: `v-slot="{ segment }"`. */
const Segments = defineComponent({
  name: "TimeFieldSegments",
  setup(_, { slots }) {
    const segments = fromSignal(scope.use().segments)
    return () =>
      segments.value.map((segment) =>
        h(Fragment, { key: `${segment.index}-${segment.type}` }, slots.default?.({ segment }))
      )
  },
}) as unknown as PlainComponent<SegmentsProps, {}, { segment: TimeFieldSegment }>

export interface SegmentProps extends PartComponentProps {
  /** The piece it draws, as `TimeField.Segments` gives it. */
  segment: TimeFieldSegment
}

/** One piece: a part that is typed, or what stands between two. It writes its own text. */
const Segment = defineComponent({
  name: "TimeFieldSegment",
  inheritAttrs: false,
  props: { segment: { type: Object as PropType<TimeFieldSegment>, required: true } },
  setup(props, { attrs, slots }) {
    const { part, text } = scope.use().segment(props.segment)
    const shown = fromSignal(text)
    // Its text is the field's to write, whatever its slot holds: with `as-child` the slot is
    // the caller's element, which holds the text unless it writes its own.
    const Element = partComponent(
      "TimeFieldSegmentElement",
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
  "TimeFieldInput",
  "input",
  () => scope.use().input
)

export const TimeField = { Root, Segments, Segment, Input }
