import type { Tree, TreeItem } from "@kirana-ui/core/tree"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Tree")

export const provide = (controller: Tree): Tree => setContext(KEY, controller)

export function useTree(): Tree {
  const controller = getContext<Tree | undefined>(KEY)
  if (!controller) throw new Error("A Tree part must be inside <Tree.Root>")
  return controller
}

const ITEM = Symbol("TreeItem")

export const provideItem = (item: TreeItem): TreeItem => setContext(ITEM, item)

export function useItem(): TreeItem {
  const item = getContext<TreeItem | undefined>(ITEM)
  if (!item) throw new Error("A Tree part must be inside <Tree.Item>")
  return item
}

// How deep the nodes inside are: 0 at the root, so a node at the top is at level 1. Known from
// how the parts are nested, so a server writes `aria-level` too.
const LEVEL = Symbol("TreeLevel")

export const provideLevel = (level: number): number => setContext(LEVEL, level)

export const useLevel = (): number => getContext<number | undefined>(LEVEL) ?? 0
