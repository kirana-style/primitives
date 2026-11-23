import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createCommand } from "@kirana-ui/core/command"
import type { CommandGroup, CommandProps, Command as Controller } from "@kirana-ui/core/command"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Show, createContext, createUniqueId, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["command"]

const Context = createContext<Controller>()
const GroupContext = createContext<CommandGroup>()

function useCommand(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Command part must be inside <Command.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  {
    inputValue?: string
    defaultInputValue?: string
    onInputValueChange?: (value: string, details: ChangeDetails) => void
    /** An item was chosen. It takes the place of the element's own `select` event. */
    onSelect?: (value: string, details: ChangeDetails) => void
    filter?: CommandProps["filter"]
    loop?: boolean
    /** Whether the first item shown is highlighted from the start. Default: `true`. */
    autoHighlight?: boolean
    disabled?: boolean
    id?: string
  }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "inputValue",
    "defaultInputValue",
    "onInputValueChange",
    "onSelect",
    "filter",
    "loop",
    "autoHighlight",
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
    autoHighlight: local.autoHighlight,
    disabled: local.disabled,
    onInputValueChange: (value: string, details: ChangeDetails) =>
      local.onInputValueChange?.(value, details),
    onSelect: (value: string, details: ChangeDetails) => local.onSelect?.(value, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>
export type ListProps = PartComponentProps<"div", StateOf<Parts["list"]>>
export type EmptyProps = PartComponentProps<"div", StateOf<Parts["empty"]>>
export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>, { id?: string }>
export type GroupHeadingProps = PartComponentProps<"div", StateOf<Parts["groupHeading"]>>
export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  {
    /** What `onSelect` is told; its `label`, or its text, when left out. */
    value?: string
    disabled?: boolean
    label?: string
    keywords?: readonly string[]
    id?: string
  }
>
export type SeparatorProps = PartComponentProps<
  "div",
  StateOf<Parts["separator"]>,
  { alwaysRender?: boolean }
>

const Input = (props: InputProps) => <Part of={useCommand().input} tag="input" {...props} />
const List = (props: ListProps) => <Part of={useCommand().list} tag="div" {...props} />

/** Drawn while no item is shown for what was typed. */
function Empty(props: EmptyProps): JSX.Element {
  const made = useCommand()
  const empty = fromSignal(made.empty)
  return (
    <Show when={empty()}>
      <Part of={made.emptyPart} tag="div" {...props} />
    </Show>
  )
}

/** Items under a `<Command.GroupHeading>`. Hidden while none of them is shown. */
function Group(props: GroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["id"])
  const generated = createUniqueId()
  const group = useCommand().group(untrack(() => local.id) ?? generated)
  return (
    <GroupContext.Provider value={group}>
      <Part of={group.part} tag="div" {...rest} />
    </GroupContext.Provider>
  )
}

function GroupHeading(props: GroupHeadingProps): JSX.Element {
  const part = useContext(GroupContext)?.heading ?? useCommand().heading
  return <Part of={part} tag="div" {...props} />
}

/** `label` is what is filtered, the item's text when left out; `keywords` are other words for it. */
function Item(props: ItemProps): JSX.Element {
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
  return <Part of={part} tag="div" {...rest} />
}

/** A line between groups: gone while something is typed, unless `alwaysRender`. */
function Separator(props: SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ["alwaysRender"])
  const options = toSignal(() => ({ alwaysRender: local.alwaysRender }))
  const part = useCommand().separator(() => options.get().alwaysRender)
  return <Part of={part} tag="div" {...rest} />
}

export const Command = { Root, Input, List, Empty, Group, GroupHeading, Item, Separator }
