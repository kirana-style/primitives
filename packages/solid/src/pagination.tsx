import type { ChangeDetails } from "@kirana-ui/core"
import { createPagination } from "@kirana-ui/core/pagination"
import type {
  Pagination as Controller,
  PaginationEntry,
  PaginationProps,
} from "@kirana-ui/core/pagination"
import { For, createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function usePagination(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Pagination part must be inside <Pagination.Root>")
  return made
}

export type RootProps = PartComponentProps & Omit<PaginationProps, "id"> & { id?: string }

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, [
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
    <Context.Provider value={made}>
      <Part part={made.root} tag="nav" {...rest} />
    </Context.Provider>
  )
}

/** Draws its child once for each piece of the row: a page, or the mark for pages left out. */
function Items(props: { children: (entry: PaginationEntry) => JSX.Element }): JSX.Element {
  const entries = fromSignal(usePagination().entries)
  // By key: a page that stays in the row keeps its element.
  const keys = () => entries().map((each) => each.key)
  const of = (key: string) => entries().find((each) => each.key === key)!
  return <For each={keys()}>{(key) => props.children(of(key))}</For>
}

function Item(props: PartComponentProps & { page: number }): JSX.Element {
  const [local, rest] = splitProps(props, ["page"])
  const made = usePagination()
  return <Part part={made.item(local.page)} tag="button" {...rest} />
}

const part =
  (name: "ellipsis" | "previous" | "next", tag: string) => (props: PartComponentProps) => (
    <Part part={usePagination()[name]} tag={tag} {...props} />
  )

export const Pagination = {
  Root,
  Items,
  Item,
  Ellipsis: part("ellipsis", "span"),
  Previous: part("previous", "button"),
  Next: part("next", "button"),
}
