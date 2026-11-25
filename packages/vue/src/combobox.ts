import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createAutocomplete } from "@kirana-ui/core/autocomplete"
import type { AutocompleteProps } from "@kirana-ui/core/autocomplete"
import { createCombobox } from "@kirana-ui/core/combobox"
import type {
  Combobox as Controller,
  ComboboxEntry,
  ComboboxGroup,
  ComboboxItemOptions,
  ComboboxProps,
  ComboboxShown,
} from "@kirana-ui/core/combobox"
import { defineComponent, Fragment, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType, PublicProps } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { useFieldAround } from "./field-context.ts"
import { positionerComponent } from "./popover.ts"
import {
  context,
  controller,
  fromSignal,
  optional,
  partComponent,
  portalComponent,
  toSignal,
} from "./runtime.ts"
import type {
  Changes,
  Listeners,
  PartComponent,
  PartComponentProps,
  PlainComponent,
  PlainInstance,
  StatesOf,
} from "./runtime.ts"

export type { PositionerProps } from "./popover.ts"
export type { PortalProps } from "./runtime.ts"

type State = StatesOf<"combobox">

const scope = context<Controller>("Combobox")
const ITEM: InjectionKey<unknown> = Symbol("ComboboxItem")
const ANY = null as unknown as PropType<unknown>

const GROUP: InjectionKey<ComboboxGroup | null> = Symbol("ComboboxGroup")

export interface GroupProps extends PartComponentProps {
  id?: string | undefined
}

/** Items that belong together, named by their `GroupLabel`. Hidden while none is shown. */
const Group = defineComponent({
  name: "ComboboxGroup",
  inheritAttrs: false,
  props: { id: String },
  setup(props, { attrs, slots }) {
    const generated = useId()
    const group = scope.use().group(props.id ?? generated)
    provide(GROUP, group)
    const Element = partComponent("ComboboxGroupElement", "div", () => group.root)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["group"], GroupProps>

/** Names the group it is in. With no group around it, it is plain text. */
const GroupLabel = partComponent<"div", State["groupLabel"]>(
  "ComboboxGroupLabel",
  "div",
  () => inject(GROUP, null)?.label ?? scope.use().groupLabel
)

const HiddenInput = partComponent("ComboboxHiddenInput", "input", () => scope.use().hidden)

/** `Multiple` is read from `multiple`: with it, `value` and `@value-change` hold a list. */
export type RootProps<Value = unknown, Multiple extends boolean | undefined = false> = Omit<
  ComboboxProps<Value, Multiple>,
  "id" | "multiple" | "onValueChange" | "onValuesChange" | "onInputValueChange" | "onOpenChange"
> & {
  id?: string | undefined
  /** Several values: `value` and `@value-change` then hold a list. Read once. */
  multiple?: Multiple | undefined
}

/** The value is `null` when the combobox is cleared. */
export type RootEmits<Value = unknown, Multiple extends boolean | undefined = false> = Changes<
  "value",
  Multiple extends true ? Value[] : Value | null
> & {
  /** @deprecated Use `update:value`, which holds the list with `multiple`. Both are emitted. */
  "update:values": (value: Value[]) => void
  /** @deprecated Use `valueChange`, told the list with `multiple`. Both are emitted. */
  valuesChange: (value: Value[], details: ChangeDetails) => void
} & Changes<"inputValue", string> &
  Changes<"open", boolean>

/**
 * `v-model:value`, `v-model:inputValue`, `v-model:open`; the `-change` events carry the details.
 * With `multiple`, the value is a list (`v-model:values`, the older shape, is still emitted).
 */
const Root = defineComponent({
  name: "ComboboxRoot",
  props: {
    value: { type: ANY, default: undefined as unknown },
    defaultValue: { type: ANY, default: null as unknown },
    inputValue: String,
    defaultInputValue: String,
    open: optional(Boolean),
    defaultOpen: Boolean,
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    multiple: Boolean,
    values: optional(Array as PropType<readonly unknown[]>),
    defaultValues: Array as PropType<readonly unknown[]>,
    inline: Boolean,
    virtualized: Object as PropType<ComboboxProps["virtualized"]>,
    presentation: String as PropType<ComboboxProps["presentation"]>,
    sheetBelow: Number,
    autoHighlight: Boolean,
    name: String,
    form: String,
    items: [Array, Object] as PropType<ComboboxProps["items"]>,
    filter: {
      type: null as unknown as PropType<((label: string, query: string) => boolean) | null>,
      default: undefined,
    },
    itemToStringLabel: {
      type: Function as PropType<(value: unknown) => string>,
      default: undefined as unknown,
    },
    itemToStringValue: {
      type: Function as PropType<(value: unknown) => string>,
      default: undefined as unknown,
    },
    id: String,
  },
  emits: [
    "update:value",
    "valueChange",
    "update:inputValue",
    "inputValueChange",
    "update:open",
    "openChange",
    "update:values",
    "valuesChange",
  ],
  setup(props, { slots, emit }) {
    const generated = useId()
    const field = useFieldAround()
    const made = scope.provide(
      controller(within(createCombobox, { field, direction: useDirectionAround() }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        inputValue: props.inputValue,
        defaultInputValue: props.defaultInputValue,
        open: props.open,
        defaultOpen: props.defaultOpen,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        multiple: props.multiple,
        values: props.values,
        defaultValues: props.defaultValues,
        inline: props.inline,
        virtualized: props.virtualized,
        presentation: props.presentation,
        sheetBelow: props.sheetBelow,
        autoHighlight: props.autoHighlight,
        name: props.name,
        form: props.form,
        items: props.items,
        filter: props.filter,
        itemToStringLabel: props.itemToStringLabel as ComboboxProps["itemToStringLabel"],
        itemToStringValue: props.itemToStringValue as ComboboxProps["itemToStringValue"],
        onValueChange(value: unknown, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
          // With `multiple` the core tells the list here, as Base UI's `onValueChange` is told
          // it; the older events too, as a listener cannot be told from none.
          if (!props.multiple || !Array.isArray(value)) return
          emit("valuesChange", value, details)
          if (!details.canceled) emit("update:values", value)
        },
        onInputValueChange(value: string, details: ChangeDetails) {
          emit("inputValueChange", value, details)
          if (!details.canceled) emit("update:inputValue", value)
        },
        onOpenChange(open: boolean, details: ChangeDetails) {
          emit("openChange", open, details)
          if (!details.canceled) emit("update:open", open)
        },
      }))
    )
    const named = fromSignal(made.named)
    return () => [slots.default?.(), named.value ? h(HiddenInput) : null]
  },
}) as unknown as new <Value = unknown, Multiple extends boolean | undefined = false>(
  props: RootProps<Value, Multiple> & Listeners<RootEmits<Value, Multiple>> & PublicProps
) => PlainInstance<RootProps<Value, Multiple>, RootEmits<Value, Multiple>, {}>

export interface ItemProps extends Omit<ComboboxItemOptions, "id">, PartComponentProps {
  /** What the combobox's value is while this item is the chosen one. */
  value: unknown
  id?: string | undefined
}

/** `label` is what is filtered and what the input shows; the item's text when left out. */
const Item = defineComponent({
  name: "ComboboxItem",
  inheritAttrs: false,
  props: {
    value: { type: ANY, required: true },
    disabled: optional(Boolean),
    label: String,
    id: String,
    index: Number,
  },
  setup(props, { attrs, slots }) {
    // An item is its value for as long as it is in the page.
    const value = props.value
    const generated = useId()
    const options = toSignal(() => ({
      disabled: props.disabled,
      label: props.label,
      index: props.index,
      id: props.id ?? generated,
    }))
    const part = scope.use().item(value, () => options.get(), inject(GROUP, null) ?? undefined)
    provide(ITEM, value)
    const Element = partComponent("ComboboxItemElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["item"], ItemProps>

export interface ItemIndicatorProps extends PartComponentProps {
  /** Keeps the mark in the page while its item is not chosen. */
  keepMounted?: boolean | undefined
}

const ItemIndicator = defineComponent({
  name: "ComboboxItemIndicator",
  inheritAttrs: false,
  props: { keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const value = inject(ITEM)
    const made = scope.use()
    // In the page while chosen, and through its exit.
    const indicator = controller(
      () => made.itemIndicator(value),
      () => ({})
    )
    const mounted = fromSignal(indicator.mounted)
    const Element = partComponent("ComboboxItemIndicatorElement", "span", () => indicator)
    return () => (mounted.value || props.keepMounted ? h(Element, attrs, slots) : null)
  },
}) as unknown as PartComponent<"span", State["itemIndicator"], ItemIndicatorProps>

export interface ClearProps extends PartComponentProps {
  /** Keeps the button in the page while there is nothing to clear. */
  keepMounted?: boolean | undefined
}

/** A button that empties the input and the value. Drawn while there is something to clear. */
const Clear = defineComponent({
  name: "ComboboxClear",
  inheritAttrs: false,
  props: { keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const made = scope.use()
    const clearable = fromSignal(made.clearable)
    const Element = partComponent("ComboboxClearElement", "button", () => made.clear)
    return () => (clearable.value || props.keepMounted ? h(Element, attrs, slots) : null)
  },
}) as unknown as PartComponent<"button", State["clear"], ClearProps>

const CHIP: InjectionKey<unknown> = Symbol("ComboboxChip")

export interface ChipProps extends PartComponentProps {
  /** The chosen value it stands for: what its remove button takes away. */
  value: unknown
}

/** With `multiple`: one chosen value. Its `value` is what its remove button takes away. */
const Chip = defineComponent({
  name: "ComboboxChip",
  inheritAttrs: false,
  props: { value: { type: ANY, required: true } },
  setup(props, { attrs, slots }) {
    // A chip is its value for as long as it is in the page.
    const value = props.value
    provide(CHIP, value)
    const part = scope.use().chip(value)
    const Element = partComponent("ComboboxChipElement", "span", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"span", State["chip"], ChipProps>

export type EmptyProps = PartComponentProps

/** Drawn while no item is shown for what was typed. */
const Empty = defineComponent({
  name: "ComboboxEmpty",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const made = scope.use()
    const empty = fromSignal(made.empty)
    const Element = partComponent("ComboboxEmptyElement", "div", () => made.emptyPart)
    return () => (empty.value ? h(Element, attrs, slots) : null)
  },
}) as unknown as PartComponent<"div", State["empty"], EmptyProps>

export interface ValueProps {
  /** What it shows while nothing is chosen. */
  placeholder?: string | undefined
}

/**
 * The chosen value's label, or `placeholder` while nothing is chosen; with `multiple`, the
 * chosen labels with commas between. Or what its slot makes of them
 * (`v-slot="{ value, label }"`, with `multiple` `v-slot="{ values, labels }"`, in the order
 * they were chosen). For a button that is the combobox, its input inside the popup. It draws
 * no element.
 */
const Value = defineComponent({
  name: "ComboboxValue",
  props: { placeholder: { type: String, default: "" } },
  setup(props, { slots }) {
    const shown = fromSignal(scope.use().shown)
    return () =>
      slots.default ? slots.default(shown.value) : (shown.value.label ?? props.placeholder)
  },
}) as unknown as PlainComponent<ValueProps, {}, ComboboxShown>

export interface CollectionProps {
  /** A group the root's `items` gave: its items left are then what is drawn. */
  of?: ComboboxEntry | undefined
}

/**
 * Draws the list from the root's `items`: its slot (`v-slot="{ entry }"`) once for each item
 * left for what was typed, or for each group that has items left; with `of`, for each of that
 * group's. The root then filters, and no item hides itself. It draws no element.
 */
const Collection = defineComponent({
  name: "ComboboxCollection",
  props: { of: Object as PropType<ComboboxEntry> },
  setup(props, { slots }) {
    // A group is known by its key, which is its own for as long as it is drawn.
    const entries = fromSignal(scope.use().entries(props.of))
    return () =>
      entries.value.map((entry) => h(Fragment, { key: entry.key }, slots.default?.({ entry })))
  },
}) as unknown as PlainComponent<CollectionProps, {}, { entry: ComboboxEntry }>

export type AutocompleteRootProps = Omit<
  AutocompleteProps,
  "id" | "value" | "onValueChange" | "onOpenChange"
> & {
  /** The text, which is the value: `v-model`. */
  modelValue?: string | undefined
  id?: string | undefined
}

export type AutocompleteRootEmits = {
  "update:modelValue": (value: string) => void
  valueChange: (value: string, details: ChangeDetails) => void
} & Changes<"open", boolean>

/** A combobox whose text is the value: `v-model` is the text. The list only suggests. */
const AutocompleteRoot = defineComponent({
  name: "AutocompleteRoot",
  props: {
    modelValue: String,
    defaultValue: String,
    open: optional(Boolean),
    defaultOpen: Boolean,
    mode: String as PropType<AutocompleteProps["mode"]>,
    filter: {
      type: null as unknown as PropType<AutocompleteProps["filter"]>,
      default: undefined,
    },
    openOnInputClick: Boolean,
    disabled: Boolean,
    readOnly: Boolean,
    items: [Array, Object] as PropType<AutocompleteProps["items"]>,
    required: Boolean,
    name: String,
    form: String,
    virtualized: Object as PropType<AutocompleteProps["virtualized"]>,
    autoHighlight: Boolean,
    id: String,
  },
  emits: ["update:modelValue", "valueChange", "update:open", "openChange"],
  setup(props, { slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(within(createAutocomplete, { field: useFieldAround() }), () => ({
        id: props.id ?? generated,
        value: props.modelValue,
        defaultValue: props.defaultValue,
        open: props.open,
        defaultOpen: props.defaultOpen,
        mode: props.mode,
        filter: props.filter,
        openOnInputClick: props.openOnInputClick,
        disabled: props.disabled,
        readOnly: props.readOnly,
        items: props.items,
        required: props.required,
        name: props.name,
        form: props.form,
        virtualized: props.virtualized,
        autoHighlight: props.autoHighlight,
        onValueChange(value: string, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:modelValue", value)
        },
        onOpenChange(open: boolean, details: ChangeDetails) {
          emit("openChange", open, details)
          if (!details.canceled) emit("update:open", open)
        },
      }))
    )
    return () => slots.default?.()
  },
}) as unknown as PlainComponent<AutocompleteRootProps, AutocompleteRootEmits>

export type InputProps = PartComponentProps
export type TriggerProps = PartComponentProps
export type ChipsProps = PartComponentProps
export type ChipRemoveProps = PartComponentProps
export type PopupProps = PartComponentProps
export type BackdropProps = PartComponentProps
export type ListProps = PartComponentProps
export type GroupLabelProps = PartComponentProps
export type SeparatorProps = PartComponentProps
export type StatusProps = PartComponentProps

/**
 * Says how the list stands ("3 results", "Loading") to software that reads the page, as its
 * text changes. Keep it in the page and change what it holds: inside the popup, or beside the
 * input.
 */
const Status = partComponent<"div", State["status"]>(
  "ComboboxStatus",
  "div",
  () => scope.use().status
)

export const Combobox = {
  Root,
  Input: partComponent<"input", State["input"]>("ComboboxInput", "input", () => scope.use().input),
  Trigger: partComponent<"button", State["trigger"]>(
    "ComboboxTrigger",
    "button",
    () => scope.use().trigger
  ),
  Value,
  Clear,
  /** With `multiple`: what holds the chips and the input. */
  Chips: partComponent<"div", State["chips"]>("ComboboxChips", "div", () => scope.use().chips),
  Chip,
  ChipRemove: partComponent<"button", State["chipRemove"]>("ComboboxChipRemove", "button", () =>
    scope.use().chipRemove(inject(CHIP))
  ),
  Portal: portalComponent("ComboboxPortal", () => scope.use().mounted),
  /** What lies over the page behind the list: a sheet's (`presentation`) is modal. */
  Backdrop: partComponent<"div", State["backdrop"]>(
    "ComboboxBackdrop",
    "div",
    () => scope.use().backdrop
  ),
  Positioner: positionerComponent<State["positioner"]>(
    "ComboboxPositioner",
    () => scope.use(),
    partComponent("ComboboxPositionerElement", "div", () => scope.use().positioner)
  ),
  Popup: partComponent<"div", State["popup"]>("ComboboxPopup", "div", () => scope.use().popup),
  /**
   * The items' own box inside the popup, when the popup holds more than items (an input): it
   * is then the listbox.
   */
  List: partComponent<"div", State["list"]>("ComboboxList", "div", () => scope.use().list),
  Collection,
  Group,
  GroupLabel,
  /** A line between groups. */
  Separator: partComponent<"div", State["separator"]>(
    "ComboboxSeparator",
    "div",
    () => scope.use().separator
  ),
  Item,
  ItemIndicator,
  Empty,
  Status,
}

export const Autocomplete = {
  Root: AutocompleteRoot,
  Input: Combobox.Input,
  Trigger: Combobox.Trigger,
  Clear: Combobox.Clear,
  Portal: Combobox.Portal,
  Positioner: Combobox.Positioner,
  Popup: Combobox.Popup,
  List: Combobox.List,
  Collection: Combobox.Collection,
  Group: Combobox.Group,
  GroupLabel: Combobox.GroupLabel,
  Separator: Combobox.Separator,
  Item: Combobox.Item,
  Empty: Combobox.Empty,
  Status: Combobox.Status,
}
