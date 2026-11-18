import type { StateOf } from "@kirana-ui/core"
import { createPagination } from "@kirana-ui/core/pagination"
import type {
  Pagination as Controller,
  PaginationEntry,
  PaginationProps,
} from "@kirana-ui/core/pagination"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Fragment, createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["pagination"]

const Context = createContext<Controller | null>(null)

function usePagination(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Pagination.${part}> must be inside <Pagination.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "nav",
  StateOf<Parts["root"]>,
  Omit<PaginationProps, "id"> & { id?: string }
>

function Root({
  page,
  defaultPage,
  onPageChange,
  count,
  pageSize,
  siblingCount,
  boundaryCount,
  disabled,
  id,
  ...rest
}: RootProps): ReactElement {
  const controller = useController<PaginationProps, Controller>(createPagination, {
    page,
    defaultPage,
    onPageChange,
    count,
    pageSize,
    siblingCount,
    boundaryCount,
    disabled,
    id,
  })
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "nav", rest)}</Context.Provider>
  )
}

export interface ItemsProps {
  /** Draws one entry, once for each: a page, or the mark for pages left out. */
  children: (entry: PaginationEntry) => ReactNode
}

/** Draws its child once for each piece of the row: a page, or the mark for pages left out. */
function Items({ children }: ItemsProps): ReactElement {
  const entries = useSignal(usePagination("Items").entries)
  return (
    <>
      {entries.map((entry) => (
        <Fragment key={entry.key}>{children(entry)}</Fragment>
      ))}
    </>
  )
}

export type ItemProps = PartComponentProps<
  "button",
  StateOf<Parts["item"]>,
  {
    /** The page it goes to, from 1. */
    page: number
  }
>

function Item({ page, ...props }: ItemProps): ReactElement {
  return usePart(usePagination("Item").item(page), "button", props)
}

export type EllipsisProps = PartComponentProps<"span", StateOf<Parts["ellipsis"]>>

const Ellipsis = (props: EllipsisProps) =>
  usePart(usePagination("Ellipsis").ellipsis, "span", props)
export type PreviousProps = PartComponentProps<"button", StateOf<Parts["previous"]>>

const Previous = (props: PreviousProps) =>
  usePart(usePagination("Previous").previous, "button", props)
export type NextProps = PartComponentProps<"button", StateOf<Parts["next"]>>

const Next = (props: NextProps) => usePart(usePagination("Next").next, "button", props)

export const Pagination = /* @__PURE__ */ parts("Pagination", {
  Root,
  Items,
  Item,
  Ellipsis,
  Previous,
  Next,
})
