import { defineComponent } from "./part.ts"
import { DISABLED, EITHER_FRAME, TRANSITION, state } from "./states.ts"

// What a node, its row and its mark say of it, written on all three so any can be styled.
const NODE = {
  selected: state("data-selected", "Present on a chosen node."),
  highlighted: state(
    "data-highlighted",
    "Present on the node focus is on, while it is in the tree."
  ),
  disabled: DISABLED,
  open: state("data-open", "Present on a branch that is open."),
  closed: state("data-closed", "Present on a branch that is closed."),
  loading: state("data-loading", "Present on a branch that says its children are being loaded."),
}

const BRANCH = {
  open: NODE.open,
  closed: NODE.closed,
  loading: NODE.loading,
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const treeVocabulary = defineComponent({
  root: {
    description: "The tree. Its nodes are one stop for Tab.",
  },
  item: {
    inside: ["root", "group"],
    repeated: true,
    description:
      "One node, a `treeitem`: a leaf, or a branch that holds its row and its group. Its `value` tells it from the others; its depth, and its place among its siblings, are read from the page.",
    states: NODE,
    exclusive: [["open", "closed"]],
  },
  itemRow: {
    inside: "item",
    optional: true,
    description:
      "The line a node draws, apart from the children its group holds: what a design gives a background.",
    states: NODE,
    exclusive: [["open", "closed"]],
  },
  itemIndicator: {
    inside: "itemRow",
    description:
      "The mark that says whether a branch is open. A press on it opens or closes the branch and chooses nothing.",
    states: BRANCH,
    exclusive: [["open", "closed"]],
  },
  itemText: {
    inside: "itemRow",
    description: "The node's name: what names it to assistive technology, and what typing matches.",
  },
  group: {
    inside: "item",
    description:
      "A branch's children. In the page while the branch is open, and through its exit's motion.",
    states: TRANSITION,
    exclusive: EITHER_FRAME,
    variables: {
      "--tree-group-height":
        "The group's content height while it opens or closes, `auto` once it is open.",
      "--tree-group-width":
        "The group's content width while it opens or closes, `auto` once it is open.",
    },
  },
})
