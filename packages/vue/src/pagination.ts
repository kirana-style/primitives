import type { ChangeDetails } from "@kirana-ui/core"
import { createPagination } from "@kirana-ui/core/pagination"
import type {
  Pagination as Controller,
  PaginationEntry,
  PaginationProps,
} from "@kirana-ui/core/pagination"
import { Fragment, defineComponent, h, useId } from "vue"

import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PlainComponent,
  StatesOf,
} from "./runtime.ts"

type State = StatesOf<"pagination">

const scope = context<Controller>("Pagination")

const RootElement = partComponent("PaginationRootElement", "nav", () => scope.use().root)

export type RootProps = Omit<PaginationProps, "id" | "onPageChange"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = Changes<"page", number>

/** `v-model:page`, and `@page-change="(page, details) => …"`. */
const Root = defineComponent({
  name: "PaginationRoot",
  inheritAttrs: false,
  props: {
    page: optional(Number),
    defaultPage: Number,
    count: { type: Number, required: true },
    pageSize: Number,
    siblingCount: Number,
    boundaryCount: Number,
    disabled: Boolean,
    id: String,
  },
  emits: ["update:page", "pageChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(createPagination, () => ({
        id: props.id ?? generated,
        page: props.page,
        defaultPage: props.defaultPage,
        count: props.count,
        pageSize: props.pageSize,
        siblingCount: props.siblingCount,
        boundaryCount: props.boundaryCount,
        disabled: props.disabled,
        onPageChange(page: number, details: ChangeDetails) {
          emit("pageChange", page, details)
          if (!details.canceled) emit("update:page", page)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"nav", State["root"], RootProps, RootEmits>

export type ItemsProps = Record<never, never>

/** Draws its slot once for each piece of the row (`v-slot="{ entry }"`). */
const Items = defineComponent({
  name: "PaginationItems",
  setup(_props, { slots }) {
    const entries = fromSignal(scope.use().entries)
    return () =>
      entries.value.map((entry) => h(Fragment, { key: entry.key }, slots.default?.({ entry })))
  },
}) as unknown as PlainComponent<ItemsProps, {}, { entry: PaginationEntry }>

export interface ItemProps extends PartComponentProps {
  /** The page it goes to. */
  page: number
}

const Item = defineComponent({
  name: "PaginationItem",
  inheritAttrs: false,
  props: { page: { type: Number, required: true } },
  setup(props, { attrs, slots }) {
    const made = scope.use()
    const Element = partComponent("PaginationItemElement", "button", () => made.item(props.page))
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"button", State["item"], ItemProps>

export type EllipsisProps = PartComponentProps
export type PreviousProps = PartComponentProps
export type NextProps = PartComponentProps
export const Pagination = {
  Root,
  Items,
  Item,
  Ellipsis: partComponent<"span", State["ellipsis"]>(
    "PaginationEllipsis",
    "span",
    () => scope.use().ellipsis
  ),
  Previous: partComponent<"button", State["previous"]>(
    "PaginationPrevious",
    "button",
    () => scope.use().previous
  ),
  Next: partComponent<"button", State["next"]>("PaginationNext", "button", () => scope.use().next),
}
