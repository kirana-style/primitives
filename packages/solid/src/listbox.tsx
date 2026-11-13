import { defined } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createListbox } from "@kirana-ui/core/listbox"
import type { Listbox as Controller, ListboxGroup } from "@kirana-ui/core/listbox"
import { Show, createContext, createUniqueId, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()
const ItemContext = createContext<unknown>()
const GroupContext = createContext<ListboxGroup>()

function useListbox(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Listbox part must be inside <Listbox.Root>")
  return made
}

export type RootProps = PartComponentProps & {
  value?: readonly unknown[]
  defaultValue?: readonly unknown[]
  onValueChange?: (value: unknown[], details: ChangeDetails) => void
  multiple?: boolean
  disabled?: boolean
  loop?: boolean
  id?: string
}

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "multiple",
    "disabled",
    "loop",
    "id",
  ])
  const generated = createUniqueId()
  const made = controller(createListbox, () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    multiple: local.multiple,
    disabled: local.disabled,
    loop: local.loop,
    onValueChange: (value: unknown[], details: ChangeDetails) =>
      local.onValueChange?.(value, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

function Item(
  props: PartComponentProps & { value: unknown; disabled?: boolean; label?: string }
): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "disabled", "label"])
  // An item is its value for as long as it is in the page.
  const value = untrack(() => local.value)
  const options = toSignal(() => ({ disabled: local.disabled, label: local.label }))
  const part = useListbox().item(value, () => defined(options.get()))
  return (
    <ItemContext.Provider value={value}>
      <Part part={part} tag="div" {...rest} />
    </ItemContext.Provider>
  )
}

function ItemIndicator(props: PartComponentProps & { keepMounted?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const made = useListbox()
  const value = useContext(ItemContext)
  const selected = fromSignal(made.selected(value))
  return (
    <Show when={selected() || local.keepMounted}>
      <Part part={made.indicator(value)} tag="span" {...rest} />
    </Show>
  )
}

function Group(props: PartComponentProps & { id?: string }): JSX.Element {
  const [local, rest] = splitProps(props, ["id"])
  const generated = createUniqueId()
  const group = useListbox().group(untrack(() => local.id) ?? generated)
  return (
    <GroupContext.Provider value={group}>
      <Part part={group.root} tag="div" {...rest} />
    </GroupContext.Provider>
  )
}

function GroupLabel(props: PartComponentProps): JSX.Element {
  const group = useContext(GroupContext)
  if (!group) throw new Error("A Listbox.GroupLabel must be inside <Listbox.Group>")
  return <Part part={group.label} tag="div" {...props} />
}

export const Listbox = { Root, Item, ItemIndicator, Group, GroupLabel }
