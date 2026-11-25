import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createEditable } from "@kirana-ui/core/editable"
import type { Editable as Controller, EditableProps } from "@kirana-ui/core/editable"
import { defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { written } from "./element.ts"
import { useFieldAround } from "./field-context.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"
import type { Changes, PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"editable">

const scope = context<Controller>("Editable")

const RootElement = partComponent("EditableRootElement", "div", () => scope.use().root)

export type RootProps = Omit<EditableProps, "id" | "onValueChange" | "onEditingChange"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = Changes<"value", string> & Changes<"editing", boolean>

/** `v-model:value` and `v-model:editing`, or each with its `@…-change="(value, details) => …"`. */
const Root = defineComponent({
  name: "EditableRoot",
  inheritAttrs: false,
  props: {
    value: optional(String),
    defaultValue: String,
    editing: optional(Boolean),
    defaultEditing: Boolean,
    placeholder: String,
    activation: String as PropType<EditableProps["activation"]>,
    submitOnBlur: optional(Boolean),
    selectOnFocus: optional(Boolean),
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    name: String,
    form: String,
    id: String,
  },
  emits: ["update:value", "valueChange", "update:editing", "editingChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(within(createEditable, { field: useFieldAround() }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        editing: props.editing,
        defaultEditing: props.defaultEditing,
        placeholder: props.placeholder,
        activation: props.activation,
        submitOnBlur: props.submitOnBlur,
        selectOnFocus: props.selectOnFocus,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        name: props.name,
        form: props.form,
        onValueChange(value: string, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
        onEditingChange(editing: boolean, details: ChangeDetails) {
          emit("editingChange", editing, details)
          if (!details.canceled) emit("update:editing", editing)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

/** Says the text, or the placeholder while there is none, unless its slot says something else. */
const Preview = defineComponent({
  name: "EditablePreview",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const made = scope.use()
    const text = fromSignal(made.text)
    // With `as-child` the caller's element holds the text, unless it writes its own.
    const Element = partComponent(
      "EditablePreviewElement",
      "span",
      () => made.preview,
      written(() => text.value)
    )
    return () =>
      h(Element, attrs, {
        default: (given: object) => slots.default?.(given) ?? text.value,
      })
  },
}) as unknown as PartComponent<"span", State["preview"]>

export type PreviewProps = PartComponentProps
export type InputProps = PartComponentProps
export type EditTriggerProps = PartComponentProps
export type SubmitTriggerProps = PartComponentProps
export type CancelTriggerProps = PartComponentProps
export const Editable = {
  Root,
  Preview,
  /** An `<input>`; `as="textarea"` for a text of several lines. */
  Input: partComponent<"input", State["input"]>("EditableInput", "input", () => scope.use().input),
  EditTrigger: partComponent<"button", State["editTrigger"]>(
    "EditableEditTrigger",
    "button",
    () => scope.use().editTrigger
  ),
  SubmitTrigger: partComponent<"button", State["submitTrigger"]>(
    "EditableSubmitTrigger",
    "button",
    () => scope.use().submitTrigger
  ),
  CancelTrigger: partComponent<"button", State["cancelTrigger"]>(
    "EditableCancelTrigger",
    "button",
    () => scope.use().cancelTrigger
  ),
}
