import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createTagsInput } from "@kirana-ui/core/tags-input"
import type {
  TagsInput as Controller,
  TagsInputEntry,
  TagsInputProps,
} from "@kirana-ui/core/tags-input"
import { Fragment, defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { written } from "./element.ts"
import { useFieldAround } from "./field-context.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PlainComponent,
  StatesOf,
} from "./runtime.ts"

type State = StatesOf<"tagsInput">

const scope = context<Controller>("TagsInput")
// The tag an item is, for the parts inside it.
const ITEM: InjectionKey<() => TagsInputEntry> = Symbol("TagsInputItem")

function useEntry(part: string): () => TagsInputEntry {
  const entry = inject(ITEM, undefined)
  if (!entry) throw new Error(`<TagsInput.${part}> must be inside <TagsInput.Item>`)
  return entry
}

const HiddenInput = partComponent("TagsInputHiddenInput", "input", () => scope.use().hiddenInput)

// The first of the inputs a form reads is the element's last child; the rest follow it.
const RootElement = partComponent(
  "TagsInputRootElement",
  "div",
  () => scope.use().root,
  (content) => [content, h(HiddenInput)]
)

export type RootProps = Omit<TagsInputProps, "id" | "onValueChange" | "onValueInvalid"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = Changes<"value", string[]> & {
  /** A text that was not made a tag, and why. */
  valueInvalid: (text: string, reason: "duplicate" | "max" | "invalid") => void
}

/** `v-model:value`, or `value` with `@value-change="(value, details) => …"`. */
const Root = defineComponent({
  name: "TagsInputRoot",
  inheritAttrs: false,
  props: {
    value: optional(Array as PropType<readonly string[]>),
    defaultValue: Array as PropType<readonly string[]>,
    validate: Function as PropType<TagsInputProps["validate"]>,
    max: Number,
    allowDuplicates: Boolean,
    delimiter: {
      type: null as unknown as PropType<string | RegExp | null>,
      default: undefined as unknown,
    },
    addOnBlur: Boolean,
    addOnPaste: optional(Boolean),
    editable: optional(Boolean),
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    name: String,
    form: String,
    id: String,
  },
  emits: ["update:value", "valueChange", "valueInvalid"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const field = useFieldAround()
    scope.provide(
      controller(within(createTagsInput, { field, direction: useDirectionAround() }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        validate: props.validate,
        max: props.max,
        allowDuplicates: props.allowDuplicates,
        delimiter: props.delimiter as string | RegExp | null | undefined,
        addOnBlur: props.addOnBlur,
        addOnPaste: props.addOnPaste,
        editable: props.editable,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        name: props.name,
        form: props.form,
        onValueChange(value: string[], details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
        onValueInvalid: (text: string, reason: "duplicate" | "max" | "invalid") =>
          emit("valueInvalid", text, reason),
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

export type ItemsProps = Record<never, never>

/** Draws its slot once for each tag, kept by the tag's key (`v-slot="{ entry }"`). */
const Items = defineComponent({
  name: "TagsInputItems",
  setup(_props, { slots }) {
    const entries = fromSignal(scope.use().entries)
    return () =>
      entries.value.map((entry) => h(Fragment, { key: entry.key }, slots.default?.({ entry })))
  },
}) as unknown as PlainComponent<ItemsProps, {}, { entry: TagsInputEntry }>

export interface ItemProps extends PartComponentProps {
  /** The tag it is, as `Items` gave it. */
  entry: TagsInputEntry
}

const Item = defineComponent({
  name: "TagsInputItem",
  inheritAttrs: false,
  props: { entry: { type: Object as PropType<TagsInputEntry>, required: true } },
  setup(props, { attrs, slots }) {
    // An item is its tag's key for as long as it is in the page.
    const key = props.entry.key
    const made = scope.use()
    provide(ITEM, () => props.entry)
    const Element = partComponent("TagsInputItemElement", "span", () => made.item(key))
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"span", State["item"], ItemProps>

export type ItemTextProps = PartComponentProps

/** Says the tag's text unless its slot says something else. */
const ItemText = defineComponent({
  name: "TagsInputItemText",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const entry = useEntry("ItemText")
    const made = scope.use()
    // With `as-child` the caller's element holds the text, unless it writes its own.
    const Element = partComponent(
      "TagsInputItemTextElement",
      "span",
      () => made.itemText(entry().key),
      written(() => entry().value)
    )
    return () =>
      h(Element, attrs, {
        default: (given: object) => slots.default?.(given) ?? entry().value,
      })
  },
}) as unknown as PartComponent<"span", State["itemText"], ItemTextProps>

export type ItemInputProps = PartComponentProps

const ItemInput = defineComponent({
  name: "TagsInputItemInput",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const entry = useEntry("ItemInput")
    const made = scope.use()
    const Element = partComponent("TagsInputItemInputElement", "input", () =>
      made.itemInput(entry().key)
    )
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"input", State["itemInput"], ItemInputProps>

export type ItemRemoveProps = PartComponentProps

const ItemRemove = defineComponent({
  name: "TagsInputItemRemove",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const entry = useEntry("ItemRemove")
    const made = scope.use()
    const Element = partComponent("TagsInputItemRemoveElement", "button", () =>
      made.itemRemove(entry().key)
    )
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"button", State["itemRemove"], ItemRemoveProps>

export type ListProps = PartComponentProps
export type InputProps = PartComponentProps
export type ClearProps = PartComponentProps
export const TagsInput = {
  Root,
  List: partComponent<"div", State["list"]>("TagsInputList", "div", () => scope.use().list),
  Items,
  Item,
  ItemText,
  ItemInput,
  ItemRemove,
  Input: partComponent<"input", State["input"]>("TagsInputInput", "input", () => scope.use().input),
  Clear: partComponent<"button", State["clear"]>(
    "TagsInputClear",
    "button",
    () => scope.use().clear
  ),
}
