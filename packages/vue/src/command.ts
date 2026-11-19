import type { ChangeDetails } from "@kirana-ui/core"
import { createCommand } from "@kirana-ui/core/command"
import type {
  CommandGroup,
  CommandItemOptions,
  CommandProps,
  Command as Controller,
} from "@kirana-ui/core/command"
import { defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType } from "vue"

import { context, controller, fromSignal, optional, partComponent, toSignal } from "./runtime.ts"
import type { Changes, PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"command">

const scope = context<Controller>("Command")
const GROUP: InjectionKey<CommandGroup> = Symbol("CommandGroup")

const RootElement = partComponent("CommandRootElement", "div", () => scope.use().root)

export type RootProps = Omit<CommandProps, "id" | "onInputValueChange" | "onSelect"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = Changes<"inputValue", string> & {
  /** An item was chosen: its value. */
  select: (value: string, details: ChangeDetails) => void
}

/** `v-model:inputValue`; `@select` hears the item chosen. */
const Root = defineComponent({
  name: "CommandRoot",
  inheritAttrs: false,
  props: {
    inputValue: String,
    defaultInputValue: String,
    filter: {
      type: null as unknown as PropType<CommandProps["filter"]>,
      default: undefined,
    },
    loop: Boolean,
    autoHighlight: optional(Boolean),
    disabled: Boolean,
    id: String,
  },
  emits: ["update:inputValue", "inputValueChange", "select"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(createCommand, () => ({
        id: props.id ?? generated,
        inputValue: props.inputValue,
        defaultInputValue: props.defaultInputValue,
        filter: props.filter,
        loop: props.loop,
        autoHighlight: props.autoHighlight,
        disabled: props.disabled,
        onInputValueChange(value: string, details: ChangeDetails) {
          emit("inputValueChange", value, details)
          if (!details.canceled) emit("update:inputValue", value)
        },
        onSelect: (value: string, details: ChangeDetails) => emit("select", value, details),
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

const EmptyElement = partComponent("CommandEmptyElement", "div", () => scope.use().emptyPart)

export type EmptyProps = PartComponentProps

/** Drawn while no item is shown for what was typed. */
const Empty = defineComponent({
  name: "CommandEmpty",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const empty = fromSignal(scope.use().empty)
    return () => (empty.value ? h(EmptyElement, attrs, slots) : null)
  },
}) as unknown as PartComponent<"div", State["empty"], EmptyProps>

export interface GroupProps extends PartComponentProps {
  id?: string | undefined
}

/** Items under a `<Command.GroupHeading>`. Hidden while none of them is shown. */
const Group = defineComponent({
  name: "CommandGroup",
  inheritAttrs: false,
  props: { id: String },
  setup(props, { attrs, slots }) {
    const generated = useId()
    const group = scope.use().group(props.id ?? generated)
    provide(GROUP, group)
    const Element = partComponent("CommandGroupElement", "div", () => group.part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["group"], GroupProps>

export type GroupHeadingProps = PartComponentProps

const GroupHeading = defineComponent({
  name: "CommandGroupHeading",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const part = inject(GROUP, undefined)?.heading ?? scope.use().heading
    const Element = partComponent("CommandGroupHeadingElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["groupHeading"], GroupHeadingProps>

export interface ItemProps extends Omit<CommandItemOptions, "id">, PartComponentProps {
  /** What `@select` is told when this item is chosen. */
  value: string
  id?: string | undefined
}

/** `label` is what is filtered, the item's text when left out; `keywords` are other words for it. */
const Item = defineComponent({
  name: "CommandItem",
  inheritAttrs: false,
  props: {
    value: { type: String, required: true },
    disabled: optional(Boolean),
    label: String,
    keywords: Array as PropType<readonly string[]>,
    id: String,
  },
  setup(props, { attrs, slots }) {
    const generated = useId()
    const options = toSignal(() => ({
      disabled: props.disabled,
      label: props.label,
      keywords: props.keywords,
      id: props.id ?? generated,
    }))
    const part = scope.use().item(props.value, () => options.get(), inject(GROUP, undefined))
    const Element = partComponent("CommandItemElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["item"], ItemProps>

export interface SeparatorProps extends PartComponentProps {
  /** Keeps the line while something is typed. */
  alwaysRender?: boolean | undefined
}

/** A line between groups: gone while something is typed, unless `always-render`. */
const Separator = defineComponent({
  name: "CommandSeparator",
  inheritAttrs: false,
  props: { alwaysRender: Boolean },
  setup(props, { attrs, slots }) {
    const options = toSignal(() => ({ alwaysRender: props.alwaysRender }))
    const part = scope.use().separator(() => options.get().alwaysRender)
    const Element = partComponent("CommandSeparatorElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["separator"], SeparatorProps>

export type InputProps = PartComponentProps
export type ListProps = PartComponentProps
export const Command = {
  Root,
  Input: partComponent<"input", State["input"]>("CommandInput", "input", () => scope.use().input),
  List: partComponent<"div", State["list"]>("CommandList", "div", () => scope.use().list),
  Empty,
  Group,
  GroupHeading,
  Item,
  Separator,
}
