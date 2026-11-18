import { defined } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createListbox } from "@kirana-ui/core/listbox"
import type {
  Listbox as Controller,
  ListboxGroup,
  ListboxItemOptions,
  ListboxProps,
} from "@kirana-ui/core/listbox"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext, useId, useMemo } from "react"
import type { ReactElement } from "react"

import { PartElement, parts, useController, useOptions, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["listbox"]

const Context = createContext<Controller | null>(null)
const ItemContext = createContext<unknown>(undefined)
const GroupContext = createContext<ListboxGroup | null>(null)

function useListbox(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Listbox.${part}> must be inside <Listbox.Root>`)
  return controller
}

/** `Value` is what tells an item from the others: the type of `value`'s entries. */
export type RootProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<ListboxProps<Value>, "id"> & { id?: string }
>

function Root<Value = unknown>({
  value,
  defaultValue,
  onValueChange,
  multiple,
  disabled,
  loop,
  name,
  form,
  virtualized,
  id,
  ...rest
}: RootProps<Value>): ReactElement {
  const controller: Controller = useController<ListboxProps<Value>, Controller<Value>>(
    createListbox,
    { value, defaultValue, onValueChange, multiple, disabled, loop, name, form, virtualized, id }
  )
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  ListboxItemOptions & {
    /** What is in the listbox's value while this item is chosen. */
    value: unknown
  }
>

function Item({ value, disabled, label, index, ...props }: ItemProps): ReactElement {
  const controller = useListbox("Item")
  const options = useOptions({ disabled, label, index })
  const part = useMemo(
    () => controller.item(value, () => defined(options.get())),
    [controller, value, options]
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

function ItemIndicator({ keepMounted, ...props }: ItemIndicatorProps): ReactElement | null {
  const controller = useListbox("ItemIndicator")
  const value = useContext(ItemContext)
  const selected = useSignal(controller.selected(value))
  const part = useMemo(() => controller.indicator(value), [controller, value])
  return selected || keepMounted ? <PartElement of={part} tag="span" {...props} /> : null
}

export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>, { id?: string }>

function Group({ id, ...props }: GroupProps): ReactElement {
  const controller = useListbox("Group")
  const generated = useId()
  const group = useMemo(() => controller.group(id ?? generated), [controller, id, generated])
  return (
    <GroupContext.Provider value={group}>{usePart(group.root, "div", props)}</GroupContext.Provider>
  )
}

export type GroupLabelProps = PartComponentProps<"div", StateOf<Parts["groupLabel"]>>

function GroupLabel(props: GroupLabelProps): ReactElement {
  const group = useContext(GroupContext)
  if (!group) throw new Error("<Listbox.GroupLabel> must be inside <Listbox.Group>")
  return usePart(group.label, "div", props)
}

export const Listbox = /* @__PURE__ */ parts("Listbox", {
  Root,
  Item,
  ItemIndicator,
  Group,
  GroupLabel,
})
