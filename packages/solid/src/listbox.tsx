import { defined } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createListbox } from "@kirana-ui/core/listbox"
import type { Listbox as Controller, ListboxGroup, ListboxProps } from "@kirana-ui/core/listbox"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Show, createContext, createUniqueId, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["listbox"]

const Context = createContext<Controller>()
const ItemContext = createContext<unknown>()
const GroupContext = createContext<ListboxGroup>()

function useListbox(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Listbox part must be inside <Listbox.Root>")
  return made
}

/** `Value` is what an item's `value` is: the root's `value` holds the chosen ones. */
export type RootProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<ListboxProps<Value>, "id"> & { id?: string }
>

function Root<Value = unknown>(props: RootProps<Value>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "multiple",
    "disabled",
    "loop",
    "name",
    "form",
    "virtualized",
    "id",
  ])
  const generated = createUniqueId()
  const made = controller(createListbox<Value>, () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    multiple: local.multiple,
    disabled: local.disabled,
    loop: local.loop,
    name: local.name,
    form: local.form,
    virtualized: local.virtualized,
    onValueChange: (value: Value[], details: ChangeDetails) =>
      local.onValueChange?.(value, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  {
    value: unknown
    disabled?: boolean
    label?: string
    index?: number
  }
>

function Item(props: ItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "disabled", "label", "index"])
  // An item is its value for as long as it is in the page.
  const value = untrack(() => local.value)
  const options = toSignal(() => ({
    disabled: local.disabled,
    label: local.label,
    index: local.index,
  }))
  const part = useListbox().item(value, () => defined(options.get()))
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
  const made = useListbox()
  const value = useContext(ItemContext)
  const selected = fromSignal(made.selected(value))
  return (
    <Show when={selected() || local.keepMounted}>
      <Part of={made.indicator(value)} tag="span" {...rest} />
    </Show>
  )
}

export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>, { id?: string }>

function Group(props: GroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["id"])
  const generated = createUniqueId()
  const group = useListbox().group(untrack(() => local.id) ?? generated)
  return (
    <GroupContext.Provider value={group}>
      <Part of={group.root} tag="div" {...rest} />
    </GroupContext.Provider>
  )
}

export type GroupLabelProps = PartComponentProps<"div", StateOf<Parts["groupLabel"]>>

function GroupLabel(props: GroupLabelProps): JSX.Element {
  const group = useContext(GroupContext)
  if (!group) throw new Error("A Listbox.GroupLabel must be inside <Listbox.Group>")
  return <Part of={group.label} tag="div" {...props} />
}

export const Listbox = { Root, Item, ItemIndicator, Group, GroupLabel }
