import type { ListCollection, ListRow } from "./list.ts"
import type { Step } from "./roving.ts"
import type { Typeahead } from "./typeahead.ts"

/** What moving by place needs of the list it is given to. */
export interface ListHost {
  /** Puts the highlight on a row, or on none; with `focus`, focus goes with it. */
  highlight(row: ListRow | undefined, focus?: boolean): void
  highlighted(): ListRow | undefined
  /** The list's own element, while it is in the page. */
  element(): HTMLElement | undefined
  /** Whether focus stays where it is and only the highlight moves. */
  readonly virtual: boolean
  loop(): boolean
}

/**
 * Moving through a list by place, for one of which only some rows are in the page. Given to a
 * list (`createList({ places })`) by the components that can be virtualized; a list that never
 * is (a menu) does not carry it.
 */
export interface ListPlaces {
  collection(): ListCollection | undefined
  /** Called once by the list it is given to. */
  host(list: ListHost): void
  /** Takes a step; says whether there was a collection to take it in. */
  move(step: Step): boolean
  /** Finds a row by a typed key; says whether there was a collection to look in. */
  type(key: string, typeahead: Typeahead): boolean
  goto(index: number): void
  holding(): boolean
  place(index: number | undefined): Record<string, string | undefined>
  /** A row with a place is in the page. */
  attached(row: ListRow, index: number | undefined): void
  /** A row has left the page; `had` says it had the highlight. */
  detached(row: ListRow, index: number | undefined, had: boolean): void
  /** The highlight went to a row some other way: by the pointer, by a press. */
  highlighted(row: ListRow): void
  reset(): void
}

export function byPlace(read: () => ListCollection | undefined): ListPlaces {
  let list!: ListHost
  // The place the highlight is on or going to, and the rows in the page.
  let wanted = -1
  const drawn = new Map<number, ListRow>()

  /** The place a step lands on among all the rows, past the disabled; -1 when there is none. */
  function after(all: ListCollection, step: Step): number {
    const { count } = all
    const forward = step === 1 || step === "first"
    let index =
      step === "first"
        ? 0
        : step === "last"
          ? count - 1
          : wanted < 0
            ? forward
              ? 0
              : count - 1
            : wanted + step
    for (let tried = 0; tried < count; tried++) {
      if (index < 0 || index >= count) {
        if (!list.loop() || step === "first" || step === "last") return -1
        index = (index + count) % count
      }
      if (!all.disabled?.(index)) return index
      index += forward ? 1 : -1
    }
    return -1
  }

  function goto(index: number) {
    const all = read()
    if (!all || index < 0 || index >= all.count) return
    wanted = index
    const row = drawn.get(index)
    if (row) return list.highlight(row, true)
    // Not in the page: the list itself holds focus while the row is brought in, so the next
    // key is still heard; the row takes the highlight and focus as it is drawn.
    list.highlight(undefined)
    if (!list.virtual) list.element()?.focus({ preventScroll: true })
    all.scrollToIndex(index)
  }

  return {
    collection: read,
    host: (given) => void (list = given),
    goto,
    holding: () => read() !== undefined && wanted >= 0 && !drawn.has(wanted),
    place(index) {
      const all = read()
      if (!all || index === undefined) return {}
      return { "aria-setsize": String(all.count), "aria-posinset": String(index + 1) }
    },
    move(step) {
      const all = read()
      if (!all) return false
      const to = after(all, step)
      // Past an end that does not go round: stays where it is.
      if (to >= 0) goto(to)
      return true
    },
    type(key, typeahead) {
      const all = read()
      if (!all) return false
      if (!all.label) return true
      const places: { label: string; index: number }[] = []
      let current = -1
      for (let index = 0; index < all.count; index++) {
        if (all.disabled?.(index)) continue
        if (index === wanted) current = places.length
        places.push({ label: all.label(index), index })
      }
      const found = typeahead.match(key, places, current)
      if (found) goto(found.index)
      return true
    },
    attached(row, index) {
      if (index === undefined || !read()) return
      drawn.set(index, row)
      // The row the keys asked for, now in the page.
      if (index === wanted && list.highlighted() !== row) list.highlight(row, true)
    },
    detached(row, index, had) {
      if (index === undefined) return
      if (drawn.get(index) === row) drawn.delete(index)
      // Scrolled out of the page, it had focus: the list takes it, so the keys go on from
      // the same place.
      const element = list.element()
      if (had && !list.virtual && element?.isConnected) element.focus({ preventScroll: true })
    },
    highlighted(row) {
      if (!read()) return
      for (const [index, each] of drawn) if (each === row) wanted = index
    },
    reset: () => void (wanted = -1),
  }
}
