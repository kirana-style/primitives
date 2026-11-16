import { createCommand } from "@kirana-ui/core/command"
import type { CommandGroup, CommandProps, Command as Controller } from "@kirana-ui/core/command"
import { createContext, useContext, useId, useMemo } from "react"
import type { ReactElement } from "react"

import { useController, useOptions, useOwnText, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)
const GroupContext = createContext<CommandGroup | undefined>(undefined)

function useCommand(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Command.${part}> must be inside <Command.Root>`)
  return controller
}

export type RootProps = Omit<CommandProps, "id"> & { id?: string } & PartComponentProps

function Root({
  inputValue,
  defaultInputValue,
  onInputValueChange,
  onSelect,
  filter,
  loop,
  disabled,
  id,
  ...rest
}: RootProps): ReactElement {
  const controller = useController<CommandProps, Controller>(createCommand, {
    inputValue,
    defaultInputValue,
    onInputValueChange,
    onSelect,
    filter,
    loop,
    disabled,
    id,
  })
  return (
    <Context.Provider value={controller}>
      <RootElement {...rest} />
    </Context.Provider>
  )
}

const RootElement = (props: PartComponentProps) => usePart(useCommand("Root").root, "div", props)
const Input = (props: PartComponentProps) =>
  usePart(useOwnText(useCommand("Input").input), "input", props)
const List = (props: PartComponentProps) => usePart(useCommand("List").list, "div", props)

const EmptyElement = (props: PartComponentProps) =>
  usePart(useCommand("Empty").emptyPart, "div", props)

/** Drawn while no item is shown for what was typed. */
function Empty(props: PartComponentProps): ReactElement | null {
  const empty = useSignal(useCommand("Empty").empty)
  return empty ? <EmptyElement {...props} /> : null
}

/** Items under a `<Command.GroupHeading>`. Hidden while none of them is shown. */
function Group({ id, ...props }: PartComponentProps & { id?: string }): ReactElement {
  const controller = useCommand("Group")
  const generated = useId()
  const name = id ?? generated
  const group = useMemo(() => controller.group(name), [controller, name])
  return (
    <GroupContext.Provider value={group}>{usePart(group.part, "div", props)}</GroupContext.Provider>
  )
}

function GroupHeading(props: PartComponentProps): ReactElement {
  const lone = useCommand("GroupHeading").heading
  return usePart(useContext(GroupContext)?.heading ?? lone, "div", props)
}

export interface ItemProps extends PartComponentProps {
  /** What `onSelect` is told. */
  value: string
  disabled?: boolean
  /** What is filtered; the item's text when left out. */
  label?: string
  /** Other words the item answers to. */
  keywords?: readonly string[]
  id?: string
}

function Item({ value, disabled, label, keywords, id, ...props }: ItemProps): ReactElement {
  const controller = useCommand("Item")
  const group = useContext(GroupContext)
  const generated = useId()
  const options = useOptions({ disabled, label, keywords, id: id ?? generated })
  const part = useMemo(
    () => controller.item(value, () => options.get(), group),
    [controller, value, options, group]
  )
  return usePart(part, "div", props)
}

export interface SeparatorProps extends PartComponentProps {
  /** Stays while something is typed. */
  alwaysRender?: boolean
}

function Separator({ alwaysRender, ...props }: SeparatorProps): ReactElement {
  const controller = useCommand("Separator")
  const options = useOptions({ alwaysRender })
  const part = useMemo(
    () => controller.separator(() => options.get().alwaysRender),
    [controller, options]
  )
  return usePart(part, "div", props)
}

export const Command = { Root, Input, List, Empty, Group, GroupHeading, Item, Separator }
