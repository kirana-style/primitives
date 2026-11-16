import { createPagination } from "@kirana-ui/core/pagination"
import type {
  Pagination as Controller,
  PaginationEntry,
  PaginationProps,
} from "@kirana-ui/core/pagination"
import { Fragment, createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function usePagination(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Pagination.${part}> must be inside <Pagination.Root>`)
  return controller
}

export type RootProps = Omit<PaginationProps, "id"> & { id?: string } & PartComponentProps

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

/** Draws its child once for each piece of the row: a page, or the mark for pages left out. */
function Items({ children }: { children: (entry: PaginationEntry) => ReactNode }): ReactElement {
  const entries = useSignal(usePagination("Items").entries)
  return (
    <>
      {entries.map((entry) => (
        <Fragment key={entry.key}>{children(entry)}</Fragment>
      ))}
    </>
  )
}

function Item({ page, ...props }: PartComponentProps & { page: number }): ReactElement {
  return usePart(usePagination("Item").item(page), "button", props)
}

const Ellipsis = (props: PartComponentProps) =>
  usePart(usePagination("Ellipsis").ellipsis, "span", props)
const Previous = (props: PartComponentProps) =>
  usePart(usePagination("Previous").previous, "button", props)
const Next = (props: PartComponentProps) => usePart(usePagination("Next").next, "button", props)

export const Pagination = { Root, Items, Item, Ellipsis, Previous, Next }
