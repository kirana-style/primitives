import { defined } from "@kirana-ui/core"
import type { Part } from "@kirana-ui/core"
import { createListbox } from "@kirana-ui/core/listbox"
import type {
  Listbox as Controller,
  ListboxGroup,
  ListboxItemOptions,
  ListboxProps,
} from "@kirana-ui/core/listbox"
import { createContext, useContext, useId, useMemo } from "react"
import type { ReactElement } from "react"

import { useController, useOptions, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)
const ItemContext = createContext<unknown>(undefined)
const GroupContext = createContext<ListboxGroup | null>(null)

function useListbox(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Listbox.${part}> must be inside <Listbox.Root>`)
  return controller
}

export type RootProps<Value> = Omit<ListboxProps<Value>, "id"> & {
  id?: string
} & PartComponentProps

function Root<Value>({
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
  const controller = useController<ListboxProps<Value>, Controller<Value>>(createListbox, {
    value: value as readonly Value[] | undefined,
    defaultValue: defaultValue as readonly Value[] | undefined,
    onValueChange,
    multiple,
    disabled,
    loop,
    name,
    form,
    virtualized,
    id,
  }) as unknown as Controller
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

export type ItemProps = PartComponentProps & ListboxItemOptions & { value: unknown }

function Item({ value, disabled, label, index, ...props }: ItemProps): ReactElement {
  const controller = useListbox("Item")
  const options = useOptions({ disabled, label, index })
  const part = useMemo(
    () => controller.item(value, () => defined(options.get())),
    [controller, value, options]
  )
  return <ItemContext.Provider value={value}>{usePart(part, "div", props)}</ItemContext.Provider>
}

const PartElement = ({ part, tag, ...props }: PartComponentProps & { part: Part; tag: string }) =>
  usePart(part, tag, props)

export interface ItemIndicatorProps extends PartComponentProps {
  keepMounted?: boolean
}

function ItemIndicator({ keepMounted, ...props }: ItemIndicatorProps): ReactElement | null {
  const controller = useListbox("ItemIndicator")
  const value = useContext(ItemContext)
  const selected = useSignal(controller.selected(value))
  const part = useMemo(() => controller.indicator(value), [controller, value])
  return selected || keepMounted ? <PartElement part={part} tag="span" {...props} /> : null
}

function Group({ id, ...props }: PartComponentProps & { id?: string }): ReactElement {
  const controller = useListbox("Group")
  const generated = useId()
  const group = useMemo(() => controller.group(id ?? generated), [controller, id, generated])
  return (
    <GroupContext.Provider value={group}>{usePart(group.root, "div", props)}</GroupContext.Provider>
  )
}

function GroupLabel(props: PartComponentProps): ReactElement {
  const group = useContext(GroupContext)
  if (!group) throw new Error("<Listbox.GroupLabel> must be inside <Listbox.Group>")
  return usePart(group.label, "div", props)
}

export const Listbox = { Root, Item, ItemIndicator, Group, GroupLabel }
