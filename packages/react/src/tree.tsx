import { defined, within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createTree } from "@kirana-ui/core/tree"
import type { Tree as Controller, TreeItem, TreeProps } from "@kirana-ui/core/tree"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext, useMemo } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import {
  PartElement,
  parts,
  useController,
  useMount,
  useOptions,
  usePart,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["tree"]

const Context = createContext<Controller | null>(null)
// The node a part is inside, for its row, mark, text and group.
const ItemContext = createContext<TreeItem | null>(null)
// How deep the nodes inside are: 0 at the root, so a node at the top is at level 1. Known from
// how the parts are nested, so a server writes `aria-level` too.
const LevelContext = createContext(0)

function useTree(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Tree.${part}> must be inside <Tree.Root>`)
  return controller
}

function useItem(part: string): TreeItem {
  const item = useContext(ItemContext)
  if (!item) throw new Error(`<Tree.${part}> must be inside <Tree.Item>`)
  return item
}

/** `Value` is what tells a node from the others: the type of the values' entries. */
export type RootProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<TreeProps<Value>, "id"> & { id?: string }
>

function Root<Value = unknown>({
  expandedValue,
  defaultExpandedValue,
  onExpandedChange,
  selectionMode,
  selectedValue,
  defaultSelectedValue,
  onSelectedChange,
  expandOnClick,
  id,
  ...rest
}: RootProps<Value>): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const create = within(createTree<Value>, { direction })
  const controller: Controller = useController(create, {
    expandedValue,
    defaultExpandedValue,
    onExpandedChange,
    selectionMode,
    selectedValue,
    defaultSelectedValue,
    onSelectedChange,
    expandOnClick,
    id,
  })
  return (
    <Context.Provider value={controller as Controller<unknown>}>
      <LevelContext.Provider value={0}>
        {usePart(controller.root, "div", rest)}
      </LevelContext.Provider>
    </Context.Provider>
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

function Item({ value, branch, disabled, loading, label, ...rest }: ItemProps): ReactElement {
  const controller = useTree("Item")
  const level = useContext(LevelContext) + 1
  const options = useOptions({ branch, disabled, loading, label, level })
  const item = useMemo(
    () => controller.item(value, () => defined(options.get())),
    [controller, value, options]
  )
  useMount(item)
  return (
    <ItemContext.Provider value={item}>
      <LevelContext.Provider value={level}>
        <PartElement of={item.root} tag="div" {...rest} />
      </LevelContext.Provider>
    </ItemContext.Provider>
  )
}

export type ItemRowProps = PartComponentProps<"div", StateOf<Parts["itemRow"]>>
export type ItemIndicatorProps = PartComponentProps<"span", StateOf<Parts["itemIndicator"]>>
export type ItemTextProps = PartComponentProps<"span", StateOf<Parts["itemText"]>>

const ItemRow = (props: ItemRowProps) => usePart(useItem("ItemRow").row, "div", props)
const ItemIndicator = (props: ItemIndicatorProps) =>
  usePart(useItem("ItemIndicator").indicator, "span", props)
const ItemText = (props: ItemTextProps) => usePart(useItem("ItemText").text, "span", props)

export type GroupProps = PartComponentProps<
  "div",
  StateOf<Parts["group"]>,
  {
    /** Keeps the closed group in the page, `hidden`. */
    keepMounted?: boolean
  }
>

function Group({ keepMounted, ...props }: GroupProps): ReactElement | null {
  const item = useItem("Group")
  const mounted = useSignal(item.mounted)
  if (!mounted && !keepMounted) return null
  return <PartElement of={item.group} tag="div" {...props} />
}

export const Tree = /* @__PURE__ */ parts("Tree", {
  Root,
  Item,
  ItemRow,
  ItemIndicator,
  ItemText,
  Group,
})
