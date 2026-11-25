import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createTree } from "@kirana-ui/core/tree"
import type { Tree as Controller, TreeItem, TreeProps } from "@kirana-ui/core/tree"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Show, createContext, createUniqueId, onSettled, untrack, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, fromSignal, split, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["tree"]

const Context = createContext<Controller | null>(null)
// The node a part is inside, for its row, mark, text and group.
const ItemContext = createContext<TreeItem | null>(null)
// How deep the nodes inside are: 0 at the root, so a node at the top is at level 1. Known from
// how the parts are nested, so a server writes `aria-level` too.
const LevelContext = createContext(0)

function useTree(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Tree part must be inside <Tree.Root>")
  return made
}

function useItem(): TreeItem {
  const item = useContext(ItemContext)
  if (!item) throw new Error("A Tree part must be inside <Tree.Item>")
  return item
}

/** `Value` is what tells a node from the others: the type of the values' entries. */
export type RootProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<TreeProps<Value>, "id"> & { id?: string }
>

function Root<Value = unknown>(props: RootProps<Value>): JSX.Element {
  const [local, rest] = split(props, [
    "expandedValue",
    "defaultExpandedValue",
    "onExpandedChange",
    "selectionMode",
    "selectedValue",
    "defaultSelectedValue",
    "onSelectedChange",
    "expandOnClick",
    "id",
  ])
  const generated = createUniqueId()
  const direction = useContext(DirectionContext) ?? undefined
  const made = controller(within(createTree<Value>, { direction }), () => ({
    id: local.id ?? generated,
    expandedValue: local.expandedValue,
    defaultExpandedValue: local.defaultExpandedValue,
    selectionMode: local.selectionMode,
    selectedValue: local.selectedValue,
    defaultSelectedValue: local.defaultSelectedValue,
    expandOnClick: local.expandOnClick,
    onExpandedChange: (value: Value[], details: ChangeDetails) =>
      local.onExpandedChange?.(value, details),
    onSelectedChange: (value: Value[], details: ChangeDetails) =>
      local.onSelectedChange?.(value, details),
  }))
  return (
    <Context value={made as Controller<unknown>}>
      <LevelContext value={0}>
        <Part of={made.root} tag="div" {...rest} />
      </LevelContext>
    </Context>
  )
}

export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  {
    /** What tells this node from the others in the tree: what the values hold. */
    value: unknown
    /** A branch: it has children, drawn in its `Tree.Group`, and opens and closes. */
    branch?: boolean
    /** Disables this node: it cannot be chosen, opened or closed, and the keys pass over it. */
    disabled?: boolean
    /** A branch whose children are being loaded. */
    loading?: boolean
    /** What typing matches, when it is not the node's text. */
    label?: string
  }
>

function Item(props: ItemProps): JSX.Element {
  const [local, rest] = split(props, ["value", "branch", "disabled", "loading", "label"])
  const level = useContext(LevelContext) + 1
  const options = toSignal(() => ({
    branch: local.branch,
    disabled: local.disabled,
    loading: local.loading,
    label: local.label,
    level,
  }))
  // A node is its value for as long as it is in the page, and its item is made once.
  const item = useTree().item(
    untrack(() => local.value),
    () => defined(options.get())
  )
  onSettled(() => item.mount())
  return (
    <ItemContext value={item}>
      <LevelContext value={level}>
        <Part of={item.root} tag="div" {...rest} />
      </LevelContext>
    </ItemContext>
  )
}

export type ItemRowProps = PartComponentProps<"div", StateOf<Parts["itemRow"]>>
export type ItemIndicatorProps = PartComponentProps<"span", StateOf<Parts["itemIndicator"]>>
export type ItemTextProps = PartComponentProps<"span", StateOf<Parts["itemText"]>>

const ItemRow = (props: ItemRowProps) => <Part of={useItem().row} tag="div" {...props} />
const ItemIndicator = (props: ItemIndicatorProps) => (
  <Part of={useItem().indicator} tag="span" {...props} />
)
const ItemText = (props: ItemTextProps) => <Part of={useItem().text} tag="span" {...props} />

export type GroupProps = PartComponentProps<
  "div",
  StateOf<Parts["group"]>,
  {
    /** Keeps the closed group in the page, `hidden`. */
    keepMounted?: boolean
  }
>

function Group(props: GroupProps): JSX.Element {
  const [local, rest] = split(props, ["keepMounted"])
  const item = useItem()
  const mounted = fromSignal(item.mounted)
  return (
    <Show when={mounted() || local.keepMounted}>
      <Part of={item.group} tag="div" {...rest} />
    </Show>
  )
}

export const Tree = { Root, Item, ItemRow, ItemIndicator, ItemText, Group }
