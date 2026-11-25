import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createTree } from "@kirana-ui/core/tree"
import type { Tree as Controller, TreeItem, TreeProps } from "@kirana-ui/core/tree"
import { defineComponent, h, inject, onBeforeUnmount, onMounted, provide, useId } from "vue"
import type { InjectionKey, PropType, PublicProps } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { context, controller, fromSignal, optional, partComponent, toSignal } from "./runtime.ts"
import type {
  PartComponent,
  PartComponentProps,
  PartGiven,
  PartInstance,
  StatesOf,
} from "./runtime.ts"

type State = StatesOf<"tree">

const scope = context<Controller>("Tree")
// The node a part is inside, for its row, mark, text and group.
const ITEM: InjectionKey<TreeItem> = Symbol("TreeItem")
// How deep the nodes inside are: 0 at the root, so a node at the top is at level 1. Known from
// how the parts are nested, so a server writes `aria-level` too.
const LEVEL: InjectionKey<number> = Symbol("TreeLevel")
const ANY = null as unknown as PropType<unknown>

function useItem(): TreeItem {
  const item = inject(ITEM, undefined)
  if (!item) throw new Error("A Tree part must be inside <Tree.Item>")
  return item
}

const RootElement = partComponent("TreeRootElement", "div", () => scope.use().root)

/** `Value` is what tells a node from the others: the type of the values' entries. */
export type RootProps<Value = unknown> = Omit<
  TreeProps<Value>,
  "id" | "onExpandedChange" | "onSelectedChange"
> & { id?: string | undefined } & PartComponentProps

export type RootEmits<Value = unknown> = {
  "update:expandedValue": (value: Value[]) => void
  expandedChange: (value: Value[], details: ChangeDetails) => void
  "update:selectedValue": (value: Value[]) => void
  selectedChange: (value: Value[], details: ChangeDetails) => void
}

/**
 * `v-model:expanded-value` and `v-model:selected-value`, or each with its
 * `@expanded-change` / `@selected-change="(value, details) => …"`.
 */
const Root = defineComponent({
  name: "TreeRoot",
  inheritAttrs: false,
  props: {
    expandedValue: optional(Array as PropType<readonly unknown[]>),
    defaultExpandedValue: Array as PropType<readonly unknown[]>,
    selectionMode: String as PropType<TreeProps["selectionMode"]>,
    selectedValue: optional(Array as PropType<readonly unknown[]>),
    defaultSelectedValue: Array as PropType<readonly unknown[]>,
    expandOnClick: optional(Boolean),
    id: String,
  },
  emits: ["update:expandedValue", "expandedChange", "update:selectedValue", "selectedChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(within(createTree, { direction: useDirectionAround() }), () => ({
        id: props.id ?? generated,
        expandedValue: props.expandedValue,
        defaultExpandedValue: props.defaultExpandedValue,
        selectionMode: props.selectionMode,
        selectedValue: props.selectedValue,
        defaultSelectedValue: props.defaultSelectedValue,
        expandOnClick: props.expandOnClick,
        onExpandedChange(value: unknown[], details: ChangeDetails) {
          emit("expandedChange", value, details)
          if (!details.canceled) emit("update:expandedValue", value)
        },
        onSelectedChange(value: unknown[], details: ChangeDetails) {
          emit("selectedChange", value, details)
          if (!details.canceled) emit("update:selectedValue", value)
        },
      }))
    )
    provide(LEVEL, 0)
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as new <Value = unknown, As extends string = "div">(
  props: PartGiven<As, RootProps<Value>, RootEmits<Value>> & PublicProps
) => PartInstance<As, RootProps<Value>, RootEmits<Value>, { state: State["root"] }>

export interface ItemProps extends PartComponentProps {
  /** What tells this node from the others in the tree: what the values hold. */
  value: unknown
  /** A branch: it has children, drawn in its `Tree.Group`, and opens and closes. */
  branch?: boolean | undefined
  /** Disables this node: it cannot be chosen, opened or closed, and the keys pass over it. */
  disabled?: boolean | undefined
  /** A branch whose children are being loaded. */
  loading?: boolean | undefined
  /** What typing matches, when it is not the node's text. */
  label?: string | undefined
}

/** `value` tells this node from the others; `branch` for one with children in a `Tree.Group`. */
const Item = defineComponent({
  name: "TreeItem",
  inheritAttrs: false,
  props: {
    value: { type: ANY, default: undefined as unknown },
    branch: Boolean,
    disabled: Boolean,
    loading: Boolean,
    label: String,
  },
  setup(props, { attrs, slots }) {
    const level = inject(LEVEL, 0) + 1
    const options = toSignal(() => ({
      branch: props.branch,
      disabled: props.disabled,
      loading: props.loading,
      label: props.label,
      level,
    }))
    // A node is its value for as long as it is in the page.
    const item = scope.use().item(props.value, () => defined(options.get()))
    provide(ITEM, item)
    provide(LEVEL, level)
    let stop: (() => void) | undefined
    onMounted(() => {
      stop = item.mount()
    })
    onBeforeUnmount(() => stop?.())
    const Element = partComponent("TreeItemElement", "div", () => item.root)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["item"], ItemProps>

const GroupElement = partComponent("TreeGroupElement", "div", () => useItem().group)

export interface GroupProps extends PartComponentProps {
  /** Keeps the closed group in the page, `hidden`. */
  keepMounted?: boolean | undefined
}

/** A branch's children; `keep-mounted` keeps the closed group in the page, `hidden`. */
const Group = defineComponent({
  name: "TreeGroup",
  inheritAttrs: false,
  props: { keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const mounted = fromSignal(useItem().mounted)
    return () => (mounted.value || props.keepMounted ? h(GroupElement, attrs, slots) : null)
  },
}) as unknown as PartComponent<"div", State["group"], GroupProps>

export type ItemRowProps = PartComponentProps
export type ItemIndicatorProps = PartComponentProps
export type ItemTextProps = PartComponentProps
export const Tree = {
  Root,
  Item,
  ItemRow: partComponent<"div", State["itemRow"]>("TreeItemRow", "div", () => useItem().row),
  ItemIndicator: partComponent<"span", State["itemIndicator"]>(
    "TreeItemIndicator",
    "span",
    () => useItem().indicator
  ),
  ItemText: partComponent<"span", State["itemText"]>("TreeItemText", "span", () => useItem().text),
  Group,
}
