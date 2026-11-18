import type { StateOf } from "@kirana-ui/core"
import { createCommand } from "@kirana-ui/core/command"
import type { CommandGroup, CommandProps, Command as Controller } from "@kirana-ui/core/command"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext, useId, useMemo } from "react"
import type { ReactElement } from "react"

import {
  PartElement,
  parts,
  useController,
  useOptions,
  useOwnText,
  usePart,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["command"]

const Context = createContext<Controller | null>(null)
const GroupContext = createContext<CommandGroup | undefined>(undefined)

function useCommand(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Command.${part}> must be inside <Command.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<CommandProps, "id"> & { id?: string }
>

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
      <PartElement of={controller.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>

const Input = (props: InputProps) => usePart(useOwnText(useCommand("Input").input), "input", props)
export type ListProps = PartComponentProps<"div", StateOf<Parts["list"]>>

const List = (props: ListProps) => usePart(useCommand("List").list, "div", props)

export type EmptyProps = PartComponentProps<"div", StateOf<Parts["empty"]>>

/** Drawn while no item is shown for what was typed. */
function Empty(props: EmptyProps): ReactElement | null {
  const controller = useCommand("Empty")
  const empty = useSignal(controller.empty)
  return empty ? <PartElement of={controller.emptyPart} tag="div" {...props} /> : null
}

export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>, { id?: string }>

/** Items under a `<Command.GroupHeading>`. Hidden while none of them is shown. */
function Group({ id, ...props }: GroupProps): ReactElement {
  const controller = useCommand("Group")
  const generated = useId()
  const name = id ?? generated
  const group = useMemo(() => controller.group(name), [controller, name])
  return (
    <GroupContext.Provider value={group}>{usePart(group.part, "div", props)}</GroupContext.Provider>
  )
}

export type GroupHeadingProps = PartComponentProps<"div", StateOf<Parts["groupHeading"]>>

function GroupHeading(props: GroupHeadingProps): ReactElement {
  const lone = useCommand("GroupHeading").heading
  return usePart(useContext(GroupContext)?.heading ?? lone, "div", props)
}

export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  {
    /** What `onSelect` is told. */
    value: string
    /** Disables this item: it cannot be chosen, and the arrows pass over it. */
    disabled?: boolean
    /** What is filtered; the item's text when left out. */
    label?: string
    /** Other words the item answers to. */
    keywords?: readonly string[]
    id?: string
  }
>

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

export type SeparatorProps = PartComponentProps<
  "div",
  StateOf<Parts["separator"]>,
  {
    /** Stays while something is typed. */
    alwaysRender?: boolean
  }
>

function Separator({ alwaysRender, ...props }: SeparatorProps): ReactElement {
  const controller = useCommand("Separator")
  const options = useOptions({ alwaysRender })
  const part = useMemo(
    () => controller.separator(() => options.get().alwaysRender),
    [controller, options]
  )
  return usePart(part, "div", props)
}

export const Command = /* @__PURE__ */ parts("Command", {
  Root,
  Input,
  List,
  Empty,
  Group,
  GroupHeading,
  Item,
  Separator,
})
