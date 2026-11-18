import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createAutocomplete } from "@kirana-ui/core/autocomplete"
import type { AutocompleteProps } from "@kirana-ui/core/autocomplete"
import { createCombobox } from "@kirana-ui/core/combobox"
import type {
  Combobox as Controller,
  ComboboxEntry,
  ComboboxGroup,
  ComboboxProps,
} from "@kirana-ui/core/combobox"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { For, Show, createContext, createUniqueId, splitProps, untrack, useContext } from "solid-js"
import type { Accessor, JSX } from "solid-js"

import { FieldContext } from "./field-context.ts"
import { positioned } from "./popover.tsx"
import type { PortalProps, PositionerOptions } from "./popover.tsx"
import { Part, Portal as BodyPortal, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["combobox"]

export type { PortalProps }

const Context = createContext<Controller>()
const ItemContext = createContext<unknown>()

function useCombobox(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Combobox part must be inside <Combobox.Root>")
  return made
}

/**
 * `Value` is what an item's `value` is: the root's `value` and `onValueChange` hold one or
 * `null` for none, and with `multiple` its `values` and `onValuesChange` hold several.
 */
export type RootProps<Value = unknown> = Omit<ComboboxProps<Value>, "id"> & {
  id?: string
  children?: JSX.Element
}

function Root<Value = unknown>(props: RootProps<Value>): JSX.Element {
  const generated = createUniqueId()
  const field = useContext(FieldContext)
  const made = controller(within(createCombobox<Value>, { field }), () => ({
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
    onValuesChange: (values: Value[], details: ChangeDetails) =>
      props.onValuesChange?.(values, details),
    inline: props.inline,
    virtualized: props.virtualized,
    autoHighlight: props.autoHighlight,
    name: props.name,
    form: props.form,
    items: props.items,
    filter: props.filter,
    onValueChange: (value: Value | null, details: ChangeDetails) =>
      props.onValueChange?.(value, details),
    onInputValueChange: (value: string, details: ChangeDetails) =>
      props.onInputValueChange?.(value, details),
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  const named = fromSignal(made.named)
  return (
    <Context.Provider value={made}>
      {props.children}
      <Show when={named()}>
        <Part of={made.hidden} tag="input" />
      </Show>
    </Context.Provider>
  )
}

const Portal = (props: PortalProps) => (
  <BodyPortal mounted={useCombobox().mounted}>{props.children}</BodyPortal>
)

export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions
>

function Positioner(props: PositionerProps): JSX.Element {
  const made = useCombobox()
  return <Part of={made.positioner} tag="div" {...positioned(props, made.positioning)} />
}

export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  {
    value: unknown
    disabled?: boolean
    label?: string
    id?: string
    index?: number
  }
>

/** `label` is what is filtered and what the input shows; the item's text when left out. */
function Item(props: ItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "disabled", "label", "id", "index"])
  // An item is its value for as long as it is in the page.
  const value = untrack(() => local.value)
  const generated = createUniqueId()
  const options = toSignal(() => ({
    disabled: local.disabled,
    label: local.label,
    index: local.index,
    id: local.id ?? generated,
  }))
  const part = useCombobox().item(value, () => options.get(), useContext(GroupContext))
  return (
    <ItemContext.Provider value={value}>
      <Part of={part} tag="div" {...rest} />
    </ItemContext.Provider>
  )
}

export type ItemIndicatorProps = PartComponentProps<
  "span",
  StateOf<Parts["itemIndicator"]>,
  { keepMounted?: boolean }
>

function ItemIndicator(props: ItemIndicatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const made = useCombobox()
  const value = useContext(ItemContext)
  const selected = fromSignal(made.selected(value))
  return (
    <Show when={selected() || local.keepMounted}>
      <Part of={made.itemIndicator(value)} tag="span" {...rest} />
    </Show>
  )
}

export type ClearProps = PartComponentProps<
  "button",
  StateOf<Parts["clear"]>,
  { keepMounted?: boolean }
>

/** A button that empties the input and the value. Drawn while there is something to clear. */
function Clear(props: ClearProps): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const made = useCombobox()
  const clearable = fromSignal(made.clearable)
  return (
    <Show when={clearable() || local.keepMounted}>
      <Part of={made.clear} tag="button" {...rest} />
    </Show>
  )
}

const ChipContext = createContext<unknown>()

export type ChipProps = PartComponentProps<"span", StateOf<Parts["chip"]>, { value: unknown }>

/** With `multiple`: one chosen value. Its `value` is what its remove button takes away. */
function Chip(props: ChipProps): JSX.Element {
  const [local, rest] = splitProps(props, ["value"])
  // A chip is its value for as long as it is in the page.
  const value = untrack(() => local.value)
  return (
    <ChipContext.Provider value={value}>
      <Part of={useCombobox().chip(value)} tag="span" {...rest} />
    </ChipContext.Provider>
  )
}

export type ChipRemoveProps = PartComponentProps<"button", StateOf<Parts["chipRemove"]>>

const ChipRemove = (props: ChipRemoveProps) => (
  <Part of={useCombobox().chipRemove(useContext(ChipContext))} tag="button" {...props} />
)

export type EmptyProps = PartComponentProps<"div", StateOf<Parts["empty"]>>

/** Drawn while no item is shown for what was typed. */
function Empty(props: EmptyProps): JSX.Element {
  const made = useCombobox()
  const empty = fromSignal(made.empty)
  return (
    <Show when={empty()}>
      <Part of={made.emptyPart} tag="div" {...props} />
    </Show>
  )
}

const GroupContext = createContext<ComboboxGroup>()

export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>, { id?: string }>

/** Items that belong together, named by their `GroupLabel`. Hidden while none is shown. */
function Group(props: GroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["id"])
  const generated = createUniqueId()
  const group = useCombobox().group(untrack(() => local.id) ?? generated)
  return (
    <GroupContext.Provider value={group}>
      <Part of={group.root} tag="div" {...rest} />
    </GroupContext.Provider>
  )
}

export type GroupLabelProps = PartComponentProps<"div", StateOf<Parts["groupLabel"]>>

/** Names the group it is in. With no group around it, it is plain text. */
const GroupLabel = (props: GroupLabelProps) => (
  <Part of={useContext(GroupContext)?.label ?? useCombobox().groupLabel} tag="div" {...props} />
)

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>
export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>
export type ChipsProps = PartComponentProps<"div", StateOf<Parts["chips"]>>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type ListProps = PartComponentProps<"div", StateOf<Parts["list"]>>
export type SeparatorProps = PartComponentProps<"div", StateOf<Parts["separator"]>>

export type StatusProps = PartComponentProps<"div", StateOf<Parts["status"]>>

export type ValueProps<Chosen = unknown> = {
  /** Shown while nothing is chosen. */
  placeholder?: JSX.Element
  /**
   * What to show in place of the label. A function is given the value and its label, each to
   * be called where it is read (`null` and `undefined` while nothing is chosen); with
   * `multiple`, the values and their labels, in the order they were chosen.
   */
  children?:
    | JSX.Element
    | ((
        value: Accessor<Chosen>,
        label: Accessor<Chosen extends readonly unknown[] ? readonly string[] : string | undefined>
      ) => JSX.Element)
}

/**
 * The chosen value's label, or `placeholder` while nothing is chosen; with `multiple`, the
 * chosen labels with commas between. For a button that is the combobox, its input inside the
 * popup. It draws no element.
 */
function Value<Chosen = unknown>(props: ValueProps<Chosen>): JSX.Element {
  const made = useCombobox()
  const shown = fromSignal(made.shown)
  return (
    <>
      {(() => {
        const given = props.children
        // A function that takes nothing is an element of Solid's own, drawn as it is.
        if (typeof given !== "function" || given.length === 0) {
          return (given as JSX.Element) ?? shown().label ?? props.placeholder
        }
        const draw = given as (value: Accessor<unknown>, label: Accessor<unknown>) => JSX.Element
        return made.multiple
          ? draw(
              () => shown().values,
              () => shown().labels
            )
          : draw(
              () => shown().value,
              () => shown().label
            )
      })()}
    </>
  )
}

export type CollectionProps<Value = unknown> = {
  /** A group the root's `items` gave: its items left are then what is drawn. */
  of?: ComboboxEntry<Value> | undefined
  /** Drawn once for each item left, or for each group that has items left. */
  children: (entry: ComboboxEntry<Value>) => JSX.Element
}

/**
 * Draws the list from the root's `items`: its child once for each item left for what was
 * typed, or for each group that has items left; with `of`, for each of that group's. The root
 * then filters, and no item hides itself. It draws no element.
 */
function Collection<Value = unknown>(props: CollectionProps<Value>): JSX.Element {
  const made = useCombobox() as unknown as Controller<Value>
  // A group is known by its key, which is its own for as long as it is drawn.
  const entries = fromSignal(made.entries(untrack(() => props.of)))
  // By key: an item that is left keeps its element.
  const keys = () => entries().map((each) => each.key)
  const of = (key: string) => entries().find((each) => each.key === key)!
  return <For each={keys()}>{(key) => props.children(untrack(() => of(key)))}</For>
}

const part =
  <Props extends Record<string, unknown>>(
    name: "input" | "trigger" | "popup" | "list" | "chips" | "separator" | "status",
    tag: string
  ) =>
  (props: Props): JSX.Element => <Part of={useCombobox()[name]} tag={tag} {...props} />

export type AutocompleteRootProps = Omit<AutocompleteProps, "id"> & {
  id?: string
  children?: JSX.Element
}

/** A combobox whose text is the value: the list only suggests. */
function AutocompleteRoot(props: AutocompleteRootProps): JSX.Element {
  const generated = createUniqueId()
  const field = useContext(FieldContext)
  const made = controller(within(createAutocomplete, { field }), () => ({
    id: props.id ?? generated,
    value: props.value,
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
    onValueChange: (value: string, details: ChangeDetails) => props.onValueChange?.(value, details),
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  return <Context.Provider value={made}>{props.children}</Context.Provider>
}

export const Combobox = {
  Root,
  Input: part<InputProps>("input", "input"),
  Trigger: part<TriggerProps>("trigger", "button"),
  Value,
  Clear,
  /** With `multiple`: what holds the chips and the input. */
  Chips: part<ChipsProps>("chips", "div"),
  Chip,
  ChipRemove,
  Portal,
  Positioner,
  Popup: part<PopupProps>("popup", "div"),
  /**
   * The items' own box inside the popup, when the popup holds more than items (an input): it
   * is then the listbox.
   */
  List: part<ListProps>("list", "div"),
  Collection,
  Group,
  GroupLabel,
  /** A line between groups. */
  Separator: part<SeparatorProps>("separator", "div"),
  Item,
  ItemIndicator,
  Empty,
  /**
   * Says how the list stands ("3 results", "Loading") to software that reads the page, as its
   * text changes. Keep it in the page and change what it holds: inside the popup, or beside
   * the input.
   */
  Status: part<StatusProps>("status", "div"),
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
