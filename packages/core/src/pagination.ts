import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export interface PaginationProps {
  id: string
  /** The page shown, from 1. */
  page?: number | undefined
  /** The page it starts at, when the caller does not hold `page`. Read once. */
  defaultPage?: number | undefined
  /** Heard as another page is about to be shown: `details.cancel()` keeps the page as it was. */
  onPageChange?: ((page: number, details: ChangeDetails) => void) | undefined
  /** How many items there are in all. */
  count: number
  /** How many items a page holds. Default 10. */
  pageSize?: number | undefined
  /** How many pages are listed each side of the one shown. Default 1. */
  siblingCount?: number | undefined
  /** How many pages are always listed at each end. Default 1. */
  boundaryCount?: number | undefined
  /** Disabled: no page can be gone to. */
  disabled?: boolean | undefined
}

/** One piece of the list of pages: a page, or the mark for pages left out. */
export type PaginationEntry =
  | { readonly type: "page"; readonly page: number; readonly key: string }
  | { readonly type: "ellipsis"; readonly key: "start" | "end" }

export interface Pagination {
  readonly page: ReadonlySignal<number>
  /** How many pages there are. */
  readonly pages: ReadonlySignal<number>
  /** What is listed: the first and last pages, the ones around the page shown, and marks. */
  readonly entries: ReadonlySignal<readonly PaginationEntry[]>
  setPage(page: number, details: ChangeDetails): void
  mount(): () => void
  /** A `<nav>`. */
  readonly root: Part
  item(page: number): Part
  /** The mark for pages left out: not read, not pressed. */
  readonly ellipsis: Part
  readonly previous: Part
  readonly next: Part
}

const NOTHING = () => {}
const ELLIPSIS = computed(() => ({ "aria-hidden": "true" }))

function range(from: number, to: number): number[] {
  const list: number[] = []
  for (let each = from; each <= to; each++) list.push(each)
  return list
}

/**
 * The pages of a long list, as a row of buttons: the first and the last, the ones around the
 * page shown, and a mark where pages are left out. The row keeps its length as the page
 * changes, so a button does not move from under a pointer.
 */
export function createPagination(props: ReadonlySignal<PaginationProps>): Pagination {
  const pages = computed(() => {
    const { count, pageSize = 10 } = props.get()
    return Math.max(1, Math.ceil(Math.max(0, count) / Math.max(1, pageSize)))
  })
  const held = bindable<number>({
    value: () => props.get().page,
    defaultValue: props.peek().defaultPage ?? 1,
    onChange: (next, by) => props.peek().onPageChange?.(next, by),
  })
  // A caller's page that is no page is the nearest that is.
  const page = computed(() => Math.min(pages.get(), Math.max(1, Math.round(held.get()))))
  const disabled = computed(() => Boolean(props.get().disabled))

  const entries = computed<readonly PaginationEntry[]>(() => {
    const total = pages.get()
    const now = page.get()
    const around = Math.max(0, props.get().siblingCount ?? 1)
    const ends = Math.max(1, props.get().boundaryCount ?? 1)
    const numbered = (list: number[]): PaginationEntry[] =>
      list.map((each) => ({ type: "page", page: each, key: String(each) }))
    // Few enough to list every one: as many as the row would hold anyway.
    if (total <= 2 * ends + 2 * around + 3) return numbered(range(1, total))
    const from = Math.max(Math.min(now - around, total - ends - 2 * around - 1), ends + 2)
    const to = Math.min(Math.max(now + around, ends + 2 * around + 2), total - ends - 1)
    return [
      ...numbered(range(1, ends)),
      // A mark stands for two pages or more: for one, the page itself.
      ...(from > ends + 2 ? [{ type: "ellipsis", key: "start" } as const] : numbered([ends + 1])),
      ...numbered(range(from, to)),
      ...(to < total - ends - 1
        ? [{ type: "ellipsis", key: "end" } as const]
        : numbered([total - ends])),
      ...numbered(range(total - ends + 1, total)),
    ]
  })

  function setPage(next: number, by: ChangeDetails) {
    if (disabled.peek()) return
    const to = Math.min(pages.peek(), Math.max(1, Math.round(next)))
    if (to !== page.peek()) held.set(to, by)
  }

  const made = new Map<number, Part>()

  function step(by: 1 | -1, label: string, reason: string): Part {
    return {
      props: computed(() => {
        const off = disabled.get() || (by > 0 ? page.get() >= pages.get() : page.get() <= 1)
        return {
          type: "button",
          "aria-label": label,
          disabled: flag(off),
          "data-disabled": flag(off),
          onClick: (event: Event) => setPage(page.peek() + by, details(reason, event)),
        }
      }),
      attach: () => NOTHING,
    }
  }

  return {
    page,
    pages,
    entries,
    setPage,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        "aria-label": "Pagination",
        "data-disabled": flag(disabled.get()),
      })),
      attach: () => NOTHING,
    },
    item(each) {
      let part = made.get(each)
      if (part) return part
      part = {
        props: computed(() => {
          const on = page.get() === each
          return {
            type: "button",
            "aria-label": `Page ${each}`,
            "aria-current": on ? "page" : undefined,
            disabled: flag(disabled.get()),
            "data-selected": flag(on),
            "data-disabled": flag(disabled.get()),
            onClick: (event: Event) => setPage(each, details("item-press", event)),
          }
        }),
        attach: () => NOTHING,
      }
      made.set(each, part)
      return part
    },
    ellipsis: { props: ELLIPSIS, attach: () => NOTHING },
    previous: step(-1, "Previous page", "previous-press"),
    next: step(1, "Next page", "next-press"),
  }
}
