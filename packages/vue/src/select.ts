import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createSelect } from "@kirana-ui/core/select"
import type {
  Select as Controller,
  SelectGroup,
  SelectItemOptions,
  SelectProps,
  SelectShown,
} from "@kirana-ui/core/select"
import {
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  useId,
  watchEffect,
} from "vue"
import type { InjectionKey, PropType, PublicProps } from "vue"

import { positionerComponent } from "./popover.ts"
import type { PositionerProps as PlacedProps } from "./popover.ts"
import { useFieldAround } from "./field-context.ts"
import { written } from "./element.ts"
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
  PartGiven,
  PartInstance,
  PlainInstance,
  StatesOf,
} from "./runtime.ts"

export type { PortalProps } from "./runtime.ts"

type State = StatesOf<"select">

const scope = context<Controller>("Select")
const ITEM: InjectionKey<unknown> = Symbol("SelectItem")

const HiddenInput = partComponent("SelectHiddenInput", "input", () => scope.use().input)

/** `Multiple` is read from `multiple`: with it, `value` and `@value-change` hold a list. */
export type RootProps<Value = unknown, Multiple extends boolean | undefined = false> = Omit<
  SelectProps<Value, Multiple>,
  "id" | "multiple" | "onValueChange" | "onValuesChange" | "onOpenChange"
> & {
  id?: string | undefined
  /** Several values: `value` and `@value-change` then hold a list. Read once. */
  multiple?: Multiple | undefined
}

/** The value is `null` when the select is put back to none chosen. */
export type RootEmits<Value = unknown, Multiple extends boolean | undefined = false> = Changes<
  "value",
  Multiple extends true ? Value[] : Value | null
> & {
  /** @deprecated Use `update:value`, which holds the list with `multiple`. Both are emitted. */
  "update:values": (value: Value[]) => void
  /** @deprecated Use `valueChange`, told the list with `multiple`. Both are emitted. */
  valuesChange: (value: Value[], details: ChangeDetails) => void
} & Changes<"open", boolean>

/**
 * `v-model:value`, `v-model:open`; `@value-change` and `@open-change` carry the details. With
 * `multiple`, the value is a list (`v-model:values` and `@values-change`, the older shape, are
 * still emitted).
 */
const Root = defineComponent({
  name: "SelectRoot",
  props: {
    value: { type: null as unknown as PropType<unknown>, default: undefined as unknown },
    defaultValue: { type: null as unknown as PropType<unknown>, default: null as unknown },
    open: optional(Boolean),
    defaultOpen: Boolean,
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    name: String,
    form: String,
    items: [Array, Object] as PropType<SelectProps["items"]>,
    multiple: Boolean,
    values: optional(Array as PropType<readonly unknown[]>),
    defaultValues: Array as PropType<readonly unknown[]>,
    virtualized: Object as PropType<SelectProps["virtualized"]>,
    presentation: String as PropType<SelectProps["presentation"]>,
    sheetBelow: Number,
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
    "update:values",
    "valuesChange",
    "update:open",
    "openChange",
  ],
  setup(props, { slots, emit }) {
    const generated = useId()
    const field = useFieldAround()
    const made = scope.provide(
      controller(within(createSelect, { field }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        open: props.open,
        defaultOpen: props.defaultOpen,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        name: props.name,
        form: props.form,
        items: props.items,
        multiple: props.multiple,
        values: props.values,
        defaultValues: props.defaultValues,
        virtualized: props.virtualized,
        presentation: props.presentation,
        sheetBelow: props.sheetBelow,
        itemToStringLabel: props.itemToStringLabel as SelectProps["itemToStringLabel"],
        itemToStringValue: props.itemToStringValue as SelectProps["itemToStringValue"],
        onValueChange(value: unknown, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
          // With `multiple` the core tells the list here, as Base UI's `onValueChange` is told
          // it; the older events too, as a listener cannot be told from none.
          if (!props.multiple || !Array.isArray(value)) return
          emit("valuesChange", value, details)
          if (!details.canceled) emit("update:values", value)
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

export interface ValueProps extends PartComponentProps {
  /** What it shows while nothing is chosen. */
  placeholder?: string | undefined
}

/**
 * Shows the chosen value's label, or `placeholder` while nothing is chosen; with `multiple`,
 * the chosen labels with commas between. Or what its slot makes of them
 * (`v-slot="{ value, label }"`, with `multiple` `v-slot="{ values, labels }"`, in the items'
 * order), which is given the part's `state` too.
 */
const Value = defineComponent({
  name: "SelectValue",
  inheritAttrs: false,
  props: { placeholder: { type: String, default: "" } },
  setup(props, { attrs, slots }) {
    const shown = fromSignal(scope.use().shown)
    const label = () => shown.value.label ?? props.placeholder
    // With `as-child` the caller's element holds the label, unless it writes its own.
    const ValueElement = partComponent(
      "SelectValueElement",
      "span",
      () => scope.use().valuePart,
      written(label)
    )
    return () =>
      h(ValueElement, attrs, {
        default: (given: object) =>
          slots.default ? slots.default({ ...given, ...shown.value }) : label(),
      })
  },
}) as unknown as new <As extends string = "span">(
  props: PartGiven<As, ValueProps> & PublicProps
) => PartInstance<As, ValueProps, {}, { state: State["value"] } & SelectShown>

export interface ItemProps extends SelectItemOptions, PartComponentProps {
  /** What the select's value is while this item is the chosen one. */
  value: unknown
}

/** `label` is what typeahead matches and the trigger shows; the item's text when left out. */
const Item = defineComponent({
  name: "SelectItem",
  inheritAttrs: false,
  props: {
    value: { type: null as unknown as PropType<unknown>, required: true },
    disabled: optional(Boolean),
    label: String,
    index: Number,
  },
  setup(props, { attrs, slots }) {
    // An item is its value for as long as it is in the page.
    const value = props.value
    const options = toSignal(() => ({
      disabled: props.disabled,
      label: props.label,
      index: props.index,
    }))
    const part = scope.use().item(value, () => defined(options.get()))
    provide(ITEM, value)
    const Element = partComponent("SelectItemElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["item"], ItemProps>

const ItemText = partComponent<"span", State["itemText"]>("SelectItemText", "span", () =>
  scope.use().itemText(inject(ITEM))
)

export interface ItemIndicatorProps extends PartComponentProps {
  /** Keeps the mark in the page while its item is not chosen. */
  keepMounted?: boolean | undefined
}

const ItemIndicator = defineComponent({
  name: "SelectItemIndicator",
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
    const Element = partComponent("SelectItemIndicatorElement", "span", () => indicator)
    return () => (mounted.value || props.keepMounted ? h(Element, attrs, slots) : null)
  },
}) as unknown as PartComponent<"span", State["itemIndicator"], ItemIndicatorProps>

const PlacedPositioner = positionerComponent<State["positioner"]>(
  "SelectPlacedPositioner",
  () => scope.use(),
  partComponent("SelectPositionerElement", "div", () => scope.use().positioner)
)

export interface PositionerProps extends PlacedProps {
  /**
   * Opens the list over its trigger, the chosen item's text on the trigger's own, where there is
   * room and unless a finger opened it. While it lies there the page's scroll is held (its
   * scrollbar's room kept), and a scroll of a box around the trigger closes the list
   * (`"ancestor-scroll"`), as a change of the window's size does (`"window-resize"`).
   */
  alignItemWithTrigger?: boolean | undefined
}

/**
 * `align-item-with-trigger`: the list opens over its trigger, the chosen item's text on the
 * trigger's own, where there is room and unless a finger opened it. While it lies there the page's
 * scroll is held (its scrollbar's room kept), and a scroll of a box around the trigger closes the
 * list (`"ancestor-scroll"`), as a change of the window's size does (`"window-resize"`).
 */
const Positioner = defineComponent({
  name: "SelectPositioner",
  inheritAttrs: false,
  props: { alignItemWithTrigger: Boolean },
  setup(props, { attrs, slots }) {
    const made = scope.use()
    watchEffect(() => made.alignItemWithTrigger.set(props.alignItemWithTrigger), {
      flush: "sync",
    })
    return () => h(PlacedPositioner, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["positioner"], PositionerProps>

const GROUP: InjectionKey<SelectGroup | null> = Symbol("SelectGroup")

export interface GroupProps extends PartComponentProps {
  id?: string | undefined
}

/** Items that belong together, named by their `<Select.GroupLabel>`. */
const Group = defineComponent({
  name: "SelectGroup",
  inheritAttrs: false,
  props: { id: String },
  setup(props, { attrs, slots }) {
    const generated = useId()
    const group = scope.use().group(props.id ?? generated)
    provide(GROUP, group)
    const Element = partComponent("SelectGroupElement", "div", () => group.root)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["group"], GroupProps>

/** Names the group it is in. With no group around it, it is plain text. */
const GroupLabel = partComponent<"div", State["groupLabel"]>(
  "SelectGroupLabel",
  "div",
  () => inject(GROUP, null)?.label ?? scope.use().groupLabel
)

function scrollArrow<Arrow extends "scrollUpArrow" | "scrollDownArrow">(
  name: string,
  direction: "up" | "down"
) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      const arrow = scope.use().scrollArrow(direction)
      let stop: (() => void) | undefined
      onMounted(() => {
        stop = arrow.mount()
      })
      onBeforeUnmount(() => stop?.())
      const mounted = fromSignal(arrow.mounted)
      const Element = partComponent(`${name}Element`, "div", () => arrow.part)
      return () => (mounted.value ? h(Element, attrs, slots) : null)
    },
  }) as unknown as PartComponent<"div", State[Arrow]>
}

export type TriggerProps = PartComponentProps
export type PopupProps = PartComponentProps
export type BackdropProps = PartComponentProps
export type ListProps = PartComponentProps
export type ScrollUpArrowProps = PartComponentProps
export type ScrollDownArrowProps = PartComponentProps
export type GroupLabelProps = PartComponentProps
export type SeparatorProps = PartComponentProps
export type ItemTextProps = PartComponentProps
export const Select = {
  Root,
  Trigger: partComponent<"button", State["trigger"]>(
    "SelectTrigger",
    "button",
    () => scope.use().trigger
  ),
  Value,
  Portal: portalComponent("SelectPortal", () => scope.use().mounted),
  /** What lies over the page behind the list: a sheet's (`presentation`) is modal. */
  Backdrop: partComponent<"div", State["backdrop"]>(
    "SelectBackdrop",
    "div",
    () => scope.use().backdrop
  ),
  Positioner,
  Popup: partComponent<"div", State["popup"]>("SelectPopup", "div", () => scope.use().popup),
  /** The items' own box inside the popup, when the popup also holds scroll arrows. */
  List: partComponent<"div", State["list"]>("SelectList", "div", () => scope.use().list),
  /** In the page while there is more of the list above: it scrolls it under a moving pointer. */
  ScrollUpArrow: scrollArrow<"scrollUpArrow">("SelectScrollUpArrow", "up"),
  /** In the page while there is more of the list below. */
  ScrollDownArrow: scrollArrow<"scrollDownArrow">("SelectScrollDownArrow", "down"),
  Group,
  GroupLabel,
  /** A line between groups. */
  Separator: partComponent<"div", State["separator"]>(
    "SelectSeparator",
    "div",
    () => scope.use().separator
  ),
  Item,
  ItemText,
  ItemIndicator,
}
