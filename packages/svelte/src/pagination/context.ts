import type { Pagination } from "@kirana-ui/core/pagination"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Pagination")

export const provide = (controller: Pagination): Pagination => setContext(KEY, controller)

export function usePagination(): Pagination {
  const controller = getContext<Pagination | undefined>(KEY)
  if (!controller) throw new Error("A Pagination part must be inside <Pagination.Root>")
  return controller
}
