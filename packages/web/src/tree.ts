import { computed } from "@kirana-ui/core"
import { createTree } from "@kirana-ui/core/tree"
import type { Tree, TreeItem, TreeItemOptions, TreeProps } from "@kirana-ui/core/tree"

import { list, ownValue } from "./around.ts"
import { defineElement, partAround } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

// A node's parts share the node: made once for its element, when the first of them is met.
const items = new WeakMap<HTMLElement, TreeItem>()

/** How deep a node is, from 1: the nodes around it in the page, up to the tree's root. */
function levelOf(node: HTMLElement): number {
  let level = 1
  for (let up = node.parentElement; up; up = up.parentElement) {
    const name = up.getAttribute("kui-part")
    if (name === "root") break
    if (name === "item") level++
  }
  return level
}

function itemOf(controller: Tree<string>, element: HTMLElement): TreeItem | undefined {
  const node = partAround(element, "item")
  if (!node) return undefined
  let item = items.get(node)
  if (!item) {
    // Known from how the nodes are nested, which does not change for an element.
    const level = levelOf(node)
    item = controller.item(node.getAttribute("kui-value") ?? ownValue(node), () => {
      const options: TreeItemOptions = { level }
      if (node.hasAttribute("kui-branch")) options.branch = true
      if (node.hasAttribute("kui-disabled")) options.disabled = true
      if (node.hasAttribute("kui-loading")) options.loading = true
      const label = node.getAttribute("kui-label")
      if (label !== null) options.label = label
      return options
    })
    items.set(node, item)
  }
  return item
}

type Props = Omit<
  TreeProps<string>,
  "expandedValue" | "defaultExpandedValue" | "selectedValue" | "defaultSelectedValue"
> & {
  expandedValue?: string | readonly string[]
  defaultExpandedValue?: string | readonly string[]
  selectedValue?: string | readonly string[]
  defaultSelectedValue?: string | readonly string[]
}

/**
 * `<kui-tree>` around `kui-part="root"` and its nodes: each an `item` (`kui-value`, and
 * `kui-branch`, `kui-disabled`, `kui-loading`, `kui-label` as it needs), nested as the page
 * nests them, holding an `item-row` with an `item-indicator` and an `item-text`, and, for a
 * branch, a `group` of its children, in the page while the branch is open (`kui-keep-mounted`
 * keeps it). A node's depth is read from the nodes around it. `expanded-value`,
 * `default-expanded-value`, `selected-value` and `default-selected-value` (with commas
 * between), `selection-mode`, `expand-on-click`; it tells `expanded-change` and
 * `selected-change`.
 */
export const tag = defineElement<Props & { id: string }, Tree<string>>({
  tag: "kui-tree",
  props: {
    "expanded-value": "string",
    "default-expanded-value": "string",
    "selected-value": "string",
    "default-selected-value": "string",
    "selection-mode": "string",
    "expand-on-click": "boolean",
  },
  create: (props) =>
    createTree<string>(
      computed(() => {
        const own = props.get()
        return {
          ...own,
          expandedValue: list(own.expandedValue),
          defaultExpandedValue: list(own.defaultExpandedValue),
          selectedValue: list(own.selectedValue),
          defaultSelectedValue: list(own.defaultSelectedValue),
        }
      })
    ),
  changes: {
    onExpandedChange: { event: "expanded-change", prop: "expandedValue" },
    onSelectedChange: { event: "selected-change", prop: "selectedValue" },
  },
  parts: {
    root: (controller) => controller.root,
    item(controller, element) {
      const item = itemOf(controller, element)
      return item && { part: item.root, mount: () => item.mount() }
    },
    "item-row": (controller, element) => itemOf(controller, element)?.row,
    "item-indicator": (controller, element) => itemOf(controller, element)?.indicator,
    "item-text": (controller, element) => itemOf(controller, element)?.text,
    group(controller, element) {
      const item = itemOf(controller, element)
      return item && { part: item.group, mounted: item.mounted }
    },
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-tree": ElementOf<
      typeof tag,
      {
        "expanded-change": ["onExpandedChange", "expandedValue"]
        "selected-change": ["onSelectedChange", "selectedValue"]
      }
    >
  }
}
