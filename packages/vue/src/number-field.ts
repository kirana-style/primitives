import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createNumberField } from "@kirana-ui/core/number-field"
import type {
  NumberField as Controller,
  NumberFieldProps,
  NumberFieldScrubOptions,
} from "@kirana-ui/core/number-field"
import { defineComponent, h, useId, watchEffect } from "vue"
import type { PropType } from "vue"

import { useFieldAround } from "./field-context.ts"
import { context, controller, fromSignal, partComponent, portalComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"numberField">

const scope = context<Controller>("NumberField")

const HiddenInput = partComponent("NumberFieldHiddenInput", "input", () => scope.use().hidden)

export type RootProps = Omit<
  NumberFieldProps,
  "id" | "value" | "onValueChange" | "onValueCommitted"
> & {
  /** The number, `null` for none: `v-model`. */
  modelValue?: number | null | undefined
  id?: string | undefined
} & PartComponentProps

export type RootEmits = {
  "update:modelValue": (value: number | null) => void
  valueChange: (value: number | null, details: ChangeDetails) => void
  valueCommitted: (value: number | null, details: ChangeDetails) => void
}

/** `v-model` is the number, `null` for none; `@value-committed` hears a change that is done. */
const Root = defineComponent({
  name: "NumberFieldRoot",
  inheritAttrs: false,
  props: {
    modelValue: { type: null as unknown as PropType<number | null>, default: undefined },
    defaultValue: { type: null as unknown as PropType<number | null>, default: undefined },
    min: Number,
    max: Number,
    step: Number,
    smallStep: Number,
    largeStep: Number,
    snapOnStep: Boolean,
    allowWheelScrub: Boolean,
    format: Object as PropType<Intl.NumberFormatOptions>,
    locale: String,
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    name: String,
    form: String,
    id: String,
  },
  emits: ["update:modelValue", "valueChange", "valueCommitted"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const made = scope.provide(
      controller(within(createNumberField, { field: useFieldAround() }), () => ({
        id: props.id ?? generated,
        value: props.modelValue,
        defaultValue: props.defaultValue,
        min: props.min,
        max: props.max,
        step: props.step,
        smallStep: props.smallStep,
        largeStep: props.largeStep,
        snapOnStep: props.snapOnStep,
        allowWheelScrub: props.allowWheelScrub,
        format: props.format,
        locale: props.locale,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        name: props.name,
        form: props.form,
        onValueChange(value: number | null, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:modelValue", value)
        },
        onValueCommitted: (value: number | null, details: ChangeDetails) =>
          emit("valueCommitted", value, details),
      }))
    )
    const named = fromSignal(made.named)
    // Its hidden input is the element's last child, whatever element the caller asked for.
    const RootElement = partComponent(
      "NumberFieldRootElement",
      "div",
      () => made.root,
      (content) => [content, named.value ? h(HiddenInput) : null]
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

/** What a scrub area takes of its own: which way it is dragged, and how fast. */
export type ScrubAreaProps = NumberFieldScrubOptions & PartComponentProps

const ScrubAreaElement = partComponent(
  "NumberFieldScrubAreaElement",
  "span",
  () => scope.use().scrubArea
)

/** Pressed and dragged to change the number; `direction`, `pixel-sensitivity`, `teleport-distance`. */
const ScrubArea = defineComponent({
  name: "NumberFieldScrubArea",
  inheritAttrs: false,
  props: {
    direction: String as PropType<"horizontal" | "vertical">,
    pixelSensitivity: Number,
    teleportDistance: Number,
  },
  setup(props, { attrs, slots }) {
    const { scrub } = scope.use()
    watchEffect(() => scrub.set(defined({ ...props })), { flush: "sync" })
    return () => h(ScrubAreaElement, attrs, slots)
  },
}) as unknown as PartComponent<"span", State["scrubArea"], ScrubAreaProps>

const CursorPortal = portalComponent(
  "NumberFieldScrubAreaCursorPortal",
  () => scope.use().scrubAreaCursor.mounted
)
const CursorElement = partComponent(
  "NumberFieldScrubAreaCursorElement",
  "span",
  () => scope.use().scrubAreaCursor.part
)

/** Drawn in place of the pointer while it is locked for a drag, at the end of `<body>`. */
const ScrubAreaCursor = defineComponent({
  name: "NumberFieldScrubAreaCursor",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    return () => h(CursorPortal, null, { default: () => h(CursorElement, attrs, slots) })
  },
}) as unknown as PartComponent<"span", State["scrubAreaCursor"]>

export type ScrubAreaCursorProps = PartComponentProps
export type GroupProps = PartComponentProps
export type InputProps = PartComponentProps
export type IncrementProps = PartComponentProps
export type DecrementProps = PartComponentProps
export const NumberField = {
  Root,
  Group: partComponent<"div", State["group"]>("NumberFieldGroup", "div", () => scope.use().group),
  Input: partComponent<"input", State["input"]>(
    "NumberFieldInput",
    "input",
    () => scope.use().input
  ),
  Increment: partComponent<"button", State["increment"]>(
    "NumberFieldIncrement",
    "button",
    () => scope.use().increment
  ),
  Decrement: partComponent<"button", State["decrement"]>(
    "NumberFieldDecrement",
    "button",
    () => scope.use().decrement
  ),
  ScrubArea,
  ScrubAreaCursor,
}
