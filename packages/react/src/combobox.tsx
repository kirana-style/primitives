import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createAutocomplete } from "@kirana-ui/core/autocomplete"
import type { AutocompleteProps } from "@kirana-ui/core/autocomplete"
import { createCombobox } from "@kirana-ui/core/combobox"
import type { Combobox as Controller, ComboboxGroup, ComboboxProps } from "@kirana-ui/core/combobox"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext, useId, useMemo } from "react"
import type { ReactElement, ReactNode } from "react"

import { FieldContext } from "./field-context.ts"
import {
  Portal as BodyPortal,
  PartElement,
  parts,
  useController,
  useOptions,
  useOwnText,
  usePart,
  usePositioning,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps, PortalProps, PositionerOptions } from "./runtime.tsx"

export type { PortalProps }

type Parts = Vocabulary["combobox"]

const Context = createContext<Controller | null>(null)
const ItemContext = createContext<unknown>(undefined)

function useCombobox(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Combobox.${part}> must be inside <Combobox.Root>`)
  return controller
}

/** `Value` is what tells an item from the others: the type of `value`, and of `values`' entries. */
export type RootProps<Value = unknown> = Omit<ComboboxProps<Value>, "id"> & {
  id?: string
  children?: ReactNode
}

function Root<Value = unknown>({ children, ...props }: RootProps<Value>): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const controller: Controller = useController<ComboboxProps<Value>, Controller<Value>>(
    within(createCombobox<Value>, { field }),
    props
  )
  const named = useSignal(controller.named)
  return (
    <Context.Provider value={controller}>
      {children}
      {named ? <HiddenInput /> : null}
    </Context.Provider>
  )
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>
export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type ListProps = PartComponentProps<"div", StateOf<Parts["list"]>>

const HiddenInput = () => usePart(useCombobox("Root").hidden, "input", {})
const Input = (props: InputProps) => usePart(useOwnText(useCombobox("Input").input), "input", props)
const Trigger = (props: TriggerProps) => usePart(useCombobox("Trigger").trigger, "button", props)
const Popup = (props: PopupProps) => usePart(useCombobox("Popup").popup, "div", props)
/**
 * The items' own box inside the popup, when the popup holds more than items (an input): it
 * is then the listbox.
 */
const List = (props: ListProps) => usePart(useCombobox("List").list, "div", props)

function Portal({ children }: PortalProps): ReactElement | null {
  const mounted = useSignal(useCombobox("Portal").mounted)
  return mounted ? <BodyPortal>{children}</BodyPortal> : null
}

export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions
>

function Positioner(props: PositionerProps): ReactElement {
  const controller = useCombobox("Positioner")
  return usePart(controller.positioner, "div", usePositioning(controller.positioning, props))
}

const GroupContext = createContext<ComboboxGroup | null>(null)

export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>, { id?: string }>

/** Items that belong together, named by their `GroupLabel`. Hidden while none is shown. */
function Group({ id, ...props }: GroupProps): ReactElement {
  const controller = useCombobox("Group")
  const generated = useId()
  const group = useMemo(() => controller.group(id ?? generated), [controller, id, generated])
  return (
    <GroupContext.Provider value={group}>{usePart(group.root, "div", props)}</GroupContext.Provider>
  )
}

export type GroupLabelProps = PartComponentProps<"div", StateOf<Parts["groupLabel"]>>

/** A group's name. Outside a group it is plain text, and names nothing. */
function GroupLabel(props: GroupLabelProps): ReactElement {
  const lone = useCombobox("GroupLabel").groupLabel
  return usePart(useContext(GroupContext)?.label ?? lone, "div", props)
}

export type SeparatorProps = PartComponentProps<"div", StateOf<Parts["separator"]>>

/** A line between groups. */
const Separator = (props: SeparatorProps) =>
  usePart(useCombobox("Separator").separator, "div", props)

export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  {
    /** What the combobox's value is while this item is chosen. */
    value: unknown
    /** Disables this item: it cannot be chosen, and the arrows pass over it. */
    disabled?: boolean
    /** What is filtered and what the input shows; the item's text when left out. */
    label?: string
    id?: string
    /** Its place among all the rows, in a virtualized list. */
    index?: number
  }
>

function Item({ value, disabled, label, id, index, ...props }: ItemProps): ReactElement {
  const controller = useCombobox("Item")
  const group = useContext(GroupContext) ?? undefined
  const generated = useId()
  const options = useOptions({ disabled, label, index, id: id ?? generated })
  const part = useMemo(
    () => controller.item(value, () => options.get(), group),
    [controller, value, options, group]
  )
  return <ItemContext.Provider value={value}>{usePart(part, "div", props)}</ItemContext.Provider>
}

export type ItemIndicatorProps = PartComponentProps<
  "span",
  StateOf<Parts["itemIndicator"]>,
  {
    /** Keeps the mark in the page while its item is not chosen. */
    keepMounted?: boolean
  }
>

/** In the page while its item is a chosen one. */
function ItemIndicator({ keepMounted, ...props }: ItemIndicatorProps): ReactElement | null {
  const controller = useCombobox("ItemIndicator")
  const value = useContext(ItemContext)
  const selected = useSignal(controller.selected(value))
  const part = useMemo(() => controller.itemIndicator(value), [controller, value])
  return selected || keepMounted ? <PartElement of={part} tag="span" {...props} /> : null
}

export type ClearProps = PartComponentProps<
  "button",
  StateOf<Parts["clear"]>,
  {
    /** Keeps the button in the page while there is nothing to clear. */
    keepMounted?: boolean
  }
>

/** A button that empties the input and the value. Drawn while there is something to clear. */
function Clear({ keepMounted, ...props }: ClearProps): ReactElement | null {
  const controller = useCombobox("Clear")
  const clearable = useSignal(controller.clearable)
  return clearable || keepMounted ? (
    <PartElement of={controller.clear} tag="button" {...props} />
  ) : null
}

export type ChipsProps = PartComponentProps<"div", StateOf<Parts["chips"]>>

/** With `multiple`: what holds the chips and the input. */
const Chips = (props: ChipsProps) => usePart(useCombobox("Chips").chips, "div", props)

const ChipContext = createContext<unknown>(undefined)

export type ChipProps = PartComponentProps<
  "span",
  StateOf<Parts["chip"]>,
  {
    /** The chosen value this chip stands for. */
    value: unknown
  }
>

/** With `multiple`: one chosen value. Its `value` is what its remove button takes away. */
function Chip({ value, ...props }: ChipProps): ReactElement {
  const controller = useCombobox("Chip")
  const part = useMemo(() => controller.chip(value), [controller, value])
  return <ChipContext.Provider value={value}>{usePart(part, "span", props)}</ChipContext.Provider>
}

export type ChipRemoveProps = PartComponentProps<"button", StateOf<Parts["chipRemove"]>>

function ChipRemove(props: ChipRemoveProps): ReactElement {
  const controller = useCombobox("ChipRemove")
  const value = useContext(ChipContext)
  const part = useMemo(() => controller.chipRemove(value), [controller, value])
  return usePart(part, "button", props)
}

export type EmptyProps = PartComponentProps<"div", StateOf<Parts["empty"]>>

/** Drawn while no item is shown for what was typed. */
function Empty(props: EmptyProps): ReactElement | null {
  const controller = useCombobox("Empty")
  const empty = useSignal(controller.empty)
  return empty ? <PartElement of={controller.emptyPart} tag="div" {...props} /> : null
}

export type AutocompleteRootProps = Omit<AutocompleteProps, "id"> & {
  id?: string
  children?: ReactNode
}

/** A combobox whose text is the value: the list only suggests. */
function AutocompleteRoot({ children, ...props }: AutocompleteRootProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const controller = useController<AutocompleteProps, Controller>(
    within(createAutocomplete, { field }),
    props
  )
  return <Context.Provider value={controller}>{children}</Context.Provider>
}

export const Combobox = /* @__PURE__ */ parts("Combobox", {
  Root,
  Input,
  Trigger,
  Clear,
  Chips,
  Chip,
  ChipRemove,
  Portal,
  Positioner,
  Popup,
  List,
  Group,
  GroupLabel,
  Separator,
  Item,
  ItemIndicator,
  Empty,
})

export const Autocomplete = /* @__PURE__ */ parts("Autocomplete", {
  Root: AutocompleteRoot,
  Input,
  Trigger,
  Clear,
  Portal,
  Positioner,
  Popup,
  List,
  Group,
  GroupLabel,
  Separator,
  Item,
  Empty,
})
