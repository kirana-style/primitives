import type { CommandProps } from "@kirana-ui/core/command"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<"div", StateFor<"command", "root">, Controlled<CommandProps>>

export type InputProps = PartAttributes<"input", StateFor<"command", "input">>

export type ListProps = PartAttributes<"div", StateFor<"command", "list">>

/** Drawn while no item is shown for what was typed. */
export type EmptyProps = PartAttributes<"div", StateFor<"command", "empty">>

/** Items under a `<Command.GroupHeading>`. Hidden while none of them is shown. */
export type GroupProps = PartAttributes<
  "div",
  StateFor<"command", "group">,
  { id?: string | undefined }
>

export type GroupHeadingProps = PartAttributes<"div", StateFor<"command", "groupHeading">>

export type ItemProps = PartAttributes<
  "div",
  StateFor<"command", "item">,
  {
    /** What `onSelect` is told when the item is chosen; its `label`, or its text, when left out. */
    value?: string | undefined
    disabled?: boolean | undefined
    /** What is filtered; the item's text when left out. */
    label?: string | undefined
    /** Other words the item answers to. */
    keywords?: readonly string[] | undefined
    /** The item's id: the input names the highlighted item by it. One is made when left out. */
    id?: string | undefined
  }
>

/** A line between groups. */
export type SeparatorProps = PartAttributes<
  "div",
  StateFor<"command", "separator">,
  {
    /** Keeps the line while something is typed: it is gone then otherwise. */
    alwaysRender?: boolean | undefined
  }
>
