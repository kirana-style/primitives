import type { ChangeDetails } from "@kirana-ui/core"
import { createCommand } from "@kirana-ui/core/command"
import type { CommandGroup, CommandProps, Command as Controller } from "@kirana-ui/core/command"
import { Show, createContext, createUniqueId, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()
const GroupContext = createContext<CommandGroup>()

function useCommand(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Command part must be inside <Command.Root>")
  return made
}

export type RootProps = PartComponentProps & {
  inputValue?: string
  defaultInputValue?: string
  onInputValueChange?: (value: string, details: ChangeDetails) => void
  onSelect?: (value: string, details: ChangeDetails) => void
  filter?: CommandProps["filter"]
  loop?: boolean
  disabled?: boolean
  id?: string
}

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "inputValue",
    "defaultInputValue",
    "onInputValueChange",
    "onSelect",
    "filter",
    "loop",
    "disabled",
    "id",
  ])
  const generated = createUniqueId()
  const made = controller(createCommand, () => ({
    id: local.id ?? generated,
    inputValue: local.inputValue,
    defaultInputValue: local.defaultInputValue,
    filter: local.filter,
    loop: local.loop,
    disabled: local.disabled,
    onInputValueChange: (value: string, details: ChangeDetails) =>
      local.onInputValueChange?.(value, details),
    onSelect: (value: string, details: ChangeDetails) => local.onSelect?.(value, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

const Input = (props: PartComponentProps) => (
  <Part part={useCommand().input} tag="input" {...props} />
)
const List = (props: PartComponentProps) => <Part part={useCommand().list} tag="div" {...props} />

/** Drawn while no item is shown for what was typed. */
function Empty(props: PartComponentProps): JSX.Element {
  const made = useCommand()
  const empty = fromSignal(made.empty)
  return (
    <Show when={empty()}>
      <Part part={made.emptyPart} tag="div" {...props} />
    </Show>
  )
}

/** Items under a `<Command.GroupHeading>`. Hidden while none of them is shown. */
function Group(props: PartComponentProps & { id?: string }): JSX.Element {
  const [local, rest] = splitProps(props, ["id"])
  const generated = createUniqueId()
  const group = useCommand().group(untrack(() => local.id) ?? generated)
  return (
    <GroupContext.Provider value={group}>
      <Part part={group.part} tag="div" {...rest} />
    </GroupContext.Provider>
  )
}

function GroupHeading(props: PartComponentProps): JSX.Element {
  const part = useContext(GroupContext)?.heading ?? useCommand().heading
  return <Part part={part} tag="div" {...props} />
}

/** `label` is what is filtered, the item's text when left out; `keywords` are other words for it. */
function Item(
  props: PartComponentProps & {
    value: string
    disabled?: boolean
    label?: string
    keywords?: readonly string[]
    id?: string
  }
): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "disabled", "label", "keywords", "id"])
  const generated = createUniqueId()
  const options = toSignal(() => ({
    disabled: local.disabled,
    label: local.label,
    keywords: local.keywords,
    id: local.id ?? generated,
  }))
  const part = useCommand().item(
    untrack(() => local.value),
    () => options.get(),
    useContext(GroupContext)
  )
  return <Part part={part} tag="div" {...rest} />
}

/** A line between groups: gone while something is typed, unless `alwaysRender`. */
function Separator(props: PartComponentProps & { alwaysRender?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["alwaysRender"])
  const options = toSignal(() => ({ alwaysRender: local.alwaysRender }))
  const part = useCommand().separator(() => options.get().alwaysRender)
  return <Part part={part} tag="div" {...rest} />
}

export const Command = { Root, Input, List, Empty, Group, GroupHeading, Item, Separator }
