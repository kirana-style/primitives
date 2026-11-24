import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createPagination } from "@kirana-ui/core/pagination"
import type {
  Pagination as Controller,
  PaginationEntry,
  PaginationProps,
} from "@kirana-ui/core/pagination"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { For, createContext, createUniqueId, untrack, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { Part, controller, fromSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["pagination"]

const Context = createContext<Controller | null>(null)

function usePagination(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Pagination part must be inside <Pagination.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "nav",
  StateOf<Parts["root"]>,
  Omit<PaginationProps, "id"> & { id?: string }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "page",
    "defaultPage",
    "onPageChange",
    "count",
    "pageSize",
    "siblingCount",
    "boundaryCount",
    "disabled",
    "id",
  ])
  const generated = createUniqueId()
  const made = controller(createPagination, () => ({
    id: local.id ?? generated,
    page: local.page,
    defaultPage: local.defaultPage,
    count: local.count,
    pageSize: local.pageSize,
    siblingCount: local.siblingCount,
    boundaryCount: local.boundaryCount,
    disabled: local.disabled,
    onPageChange: (page: number, details: ChangeDetails) => local.onPageChange?.(page, details),
  }))
  return (
    <Context value={made}>
      <Part of={made.root} tag="nav" {...rest} />
    </Context>
  )
}

export type ItemsProps = { children: (entry: PaginationEntry) => JSX.Element }

/** Draws its child once for each piece of the row: a page, or the mark for pages left out. */
function Items(props: ItemsProps): JSX.Element {
  const entries = fromSignal(usePagination().entries)
  // By key: a page that stays in the row keeps its element.
  const keys = () => entries().map((each) => each.key)
  const of = (key: string) => entries().find((each) => each.key === key)!
  // Each key's piece once, as it comes into the row.
  return <For each={keys()}>{(key) => props.children(untrack(() => of(key)))}</For>
}

export type ItemProps = PartComponentProps<"button", StateOf<Parts["item"]>, { page: number }>

function Item(props: ItemProps): JSX.Element {
  const [local, rest] = split(props, ["page"])
  const made = usePagination()
  return <Part of={made.item(local.page)} tag="button" {...rest} />
}

export type EllipsisProps = PartComponentProps<"span", StateOf<Parts["ellipsis"]>>
export type PreviousProps = PartComponentProps<"button", StateOf<Parts["previous"]>>
export type NextProps = PartComponentProps<"button", StateOf<Parts["next"]>>

const part =
  <Props extends Record<string, unknown>>(name: "ellipsis" | "previous" | "next", tag: string) =>
  (props: Props): JSX.Element => <Part of={usePagination()[name]} tag={tag} {...props} />

export const Pagination = {
  Root,
  Items,
  Item,
  Ellipsis: part<EllipsisProps>("ellipsis", "span"),
  Previous: part<PreviousProps>("previous", "button"),
  Next: part<NextProps>("next", "button"),
}
