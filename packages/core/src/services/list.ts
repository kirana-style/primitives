import { batch, signal } from "../reactivity.ts"
import type { ReadonlySignal, Signal } from "../reactivity.ts"
import { stepTo } from "./roving.ts"
import type { Step } from "./roving.ts"
import { createTypeahead, printable, textOf } from "./typeahead.ts"

export interface ListRowOptions {
  disabled?: boolean | undefined
  /** What typing matches; the row's text when left out. */
  label?: string | undefined
  /** Not shown (filtered out): the keys pass it over as if it were not there. */
  hidden?: boolean | undefined
  /** Its place among all the rows, when only some are in the page (`collection`). */
  index?: number | undefined
}

/**
 * Every row of a list of which only some are in the page: a virtualizer draws the ones in view.
 * The keys then move by place, and ask for a row that is not drawn to be brought into the page.
 */
export interface ListCollection {
  /** How many rows there are, drawn or not. */
  count: number
  /** A row's name by its place: what typing matches. Without it, typing finds nothing. */
  label?(index: number): string
  disabled?(index: number): boolean
  /** The place of a value, or -1: where a list opens on what is chosen. */
  indexOf?(value: unknown): number
  /** Brings a row into the page: the virtualizer's own scroll. */
  scrollToIndex(index: number): void
}

/** One row of a list: an option, a menu's item. */
export interface ListRow {
  /** Whether the pointer or the keyboard is on it. */
  readonly active: ReadonlySignal<boolean>
  /** Its element, while it is in the page. */
  element(): HTMLElement | undefined
  disabled(): boolean
  /** Its name, read from the page as it is now. */
  label(): string
  /** For the row's `attach`. */
  attach(element: HTMLElement): () => void
}

export interface List {
  readonly highlighted: ReadonlySignal<ListRow | undefined>
  /**
   * A row, made before its element is known. `name` reads the row's name from its element when
   * no `label` is given (the element's text without it).
   */
  row(options?: () => ListRowOptions, name?: (element: HTMLElement) => string): ListRow
  /** The row an element is, if it is one of this list's. */
  rowOf(element: Element | null | undefined): ListRow | undefined
  /** For the `attach` of the element the rows are inside. */
  attach(element: HTMLElement): () => void
  /** The rows that can be highlighted, in the page's order, read now. */
  rows(): ListRow[]
  /**
   * Puts the highlight on a row, or on none. With `focus`, focus goes with it: to the row, or to
   * the list itself for none.
   */
  highlight(row: ListRow | undefined, focus?: boolean): void
  /** Moves the highlight and focus a step from where it is. */
  move(step: Step): void
  /**
   * With a collection: the highlight goes to the row at `index`, which is brought into the
   * page if it is not there, and takes focus once it is.
   */
  goto(index: number): void
  /**
   * Whether a name is being typed: Space is then part of the name ("New file"), not a press
   * of the highlighted row.
   */
  typing(): boolean
  /** With a collection: what a row at `index` says of its place, for assistive technology. */
  place(index: number | undefined): Record<string, string | undefined>
  /** The collection, while there is one. */
  collection(): ListCollection | undefined
  /**
   * With a collection: whether the list is holding focus for a row that is being brought into
   * the page. Focus on the list is then its own doing, not someone arriving.
   */
  holding(): boolean
  /**
   * The keys a list answers: the arrows along it, Home, End, and letters that name a row. Says
   * whether the key was one of them.
   */
  key(event: KeyboardEvent): boolean
}

interface Entry extends ListRow {
  hidden(): boolean
  readonly active: Signal<boolean>
}

/**
 * Moving through a list of rows with the pointer and the keyboard: a select's options, a menu's
 * items. The rows are read from the page, in its order, when a key needs them: nothing is
 * registered in an order a framework chooses, and nothing re-renders for a row to be known.
 * Rows that are disabled are passed over.
 *
 * Focus is real: the highlighted row has it. A screen reader on a phone does not follow
 * `aria-activedescendant`, and one on a desktop stops echoing what is typed once it is set.
 */
export function createList(config: {
  /** What matches a row's element inside the list (`[role="option"]`). */
  selector: string
  /** Whether a step past an end goes round to the other. Read at each step. */
  loop?: () => boolean
  /**
   * Focus stays where it is (a combobox's input) and the highlight alone moves; the element
   * that has focus names the highlighted row with `aria-activedescendant`.
   */
  virtual?: boolean
  /** Every row, when only some are in the page. Read at each key. */
  collection?: () => ListCollection | undefined
}): List {
  const entries = new WeakMap<Element, Entry>()
  const highlighted = signal<ListRow | undefined>(undefined)
  const typeahead = createTypeahead()
  let list: HTMLElement | undefined
  const collection = () => config.collection?.()
  // With a collection: the place the highlight is on or going to, and the rows in the page.
  let wanted = -1
  const drawn = new Map<number, Entry>()

  function rows(): Entry[] {
    if (!list) return []
    const found: Entry[] = []
    for (const each of list.querySelectorAll(config.selector)) {
      // Only its own: a list inside one of its rows keeps the rows that are its.
      const entry = entries.get(each)
      if (entry && !entry.disabled() && !entry.hidden()) found.push(entry)
    }
    return found
  }

  function highlight(row: ListRow | undefined, focus = false) {
    const before = highlighted.peek() as Entry | undefined
    const after = row as Entry | undefined
    if (after && collection()) {
      for (const [index, entry] of drawn) if (entry === after) wanted = index
    }
    if (before !== after) {
      batch(() => {
        before?.active.set(false)
        after?.active.set(true)
        highlighted.set(after)
      })
    }
    if (!focus) return
    const element = after ? after.element() : list
    if (!config.virtual) element?.focus({ preventScroll: true })
    if (after && element) reveal(element)
  }

  /**
   * Brings a row into view inside the list's own scroll, and only there. The page is never
   * scrolled for it: `scrollIntoView` scrolls every ancestor, and a list that has just opened
   * is not placed yet, so it took the page to wherever the list stood before its place was known.
   */
  function reveal(row: HTMLElement) {
    for (let box = row.parentElement; box; box = box.parentElement) {
      if (box.scrollHeight > box.clientHeight) {
        const overflow = getComputedStyle(box).overflowY
        if (overflow === "auto" || overflow === "scroll") {
          const around = box.getBoundingClientRect()
          const at = row.getBoundingClientRect()
          // Inside the box's border: where its content is drawn.
          const top = around.top + box.clientTop
          const bottom = top + box.clientHeight
          if (at.top < top) box.scrollTop -= top - at.top
          else if (at.bottom > bottom) box.scrollTop += at.bottom - bottom
          return
        }
      }
      // The list, or what places it: nothing further out is the list's to scroll.
      if (box === list?.parentElement) return
    }
  }

  /** The place a step lands on among all the rows, past the disabled; -1 when there is none. */
  function placeAfter(all: ListCollection, step: Step): number {
    const { count } = all
    const off = (index: number) => Boolean(all.disabled?.(index))
    const loop = config.loop?.() ?? false
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
        if (!loop || step === "first" || step === "last") return -1
        index = (index + count) % count
      }
      if (!off(index)) return index
      index += forward ? 1 : -1
    }
    return -1
  }

  function goto(index: number) {
    const all = collection()
    if (!all || index < 0 || index >= all.count) return
    wanted = index
    const entry = drawn.get(index)
    if (entry) return highlight(entry, true)
    // Not in the page: the list itself holds focus while the row is brought in, so the next
    // key is still heard; the row takes the highlight and focus as it is drawn.
    highlight(undefined)
    if (!config.virtual) list?.focus({ preventScroll: true })
    all.scrollToIndex(index)
  }

  function move(step: Step) {
    const every = collection()
    if (every) {
      const to = placeAfter(every, step)
      // Past an end that does not go round: stays where it is.
      if (to >= 0) goto(to)
      return
    }
    const all = rows()
    if (all.length === 0) return
    const index = all.indexOf(highlighted.peek() as Entry)
    // With no row highlighted, a step back starts from the end.
    const to = index < 0 && step === -1 ? "last" : step
    highlight(all[stepTo(all.length, index, to, config.loop?.() ?? false)], true)
  }

  return {
    highlighted,
    rows,
    highlight,
    move,
    goto,
    collection,
    holding: () => collection() !== undefined && wanted >= 0 && !drawn.has(wanted),
    typing: () => typeahead.typing(),
    place(index) {
      const all = collection()
      if (!all || index === undefined) return {}
      return { "aria-setsize": String(all.count), "aria-posinset": String(index + 1) }
    },
    rowOf: (element) => (element ? entries.get(element) : undefined),
    attach(element) {
      list = element
      return () => {
        if (list !== element) return
        list = undefined
        highlight(undefined)
        typeahead.reset()
        wanted = -1
      }
    },
    row(options = () => ({}), name = textOf) {
      let own: HTMLElement | undefined
      const entry: Entry = {
        active: signal(false),
        element: () => own,
        disabled: () => Boolean(options().disabled),
        hidden: () => Boolean(options().hidden),
        label: () => options().label ?? (own ? name(own) : ""),
        attach(element) {
          own = element
          entries.set(element, entry)
          const index = collection() ? options().index : undefined
          if (index !== undefined) {
            drawn.set(index, entry)
            // The row the keys asked for, now in the page.
            if (index === wanted && highlighted.peek() !== entry) highlight(entry, true)
          }
          return () => {
            if (own !== element) return
            own = undefined
            entries.delete(element)
            if (index !== undefined && drawn.get(index) === entry) drawn.delete(index)
            if (highlighted.peek() !== entry) return
            // A row that leaves takes its highlight with it. Scrolled out of a collection, it
            // had focus: the list takes it, so the keys go on from the same place.
            highlight(undefined)
            if (index !== undefined && !config.virtual && list?.isConnected) {
              list.focus({ preventScroll: true })
            }
          }
        },
      }
      return entry
    },
    key(event) {
      let step: Step | undefined
      if (event.key === "ArrowDown") step = 1
      else if (event.key === "ArrowUp") step = -1
      else if (event.key === "Home") step = "first"
      else if (event.key === "End") step = "last"
      if (step !== undefined) {
        event.preventDefault()
        move(step)
        return true
      }
      // A space inside a name that is being typed is a letter of it.
      const spaced = event.key === " " && typeahead.typing()
      if (!printable(event) && !spaced) return false
      if (spaced) event.preventDefault()
      const every = collection()
      if (every) {
        if (!every.label) return true
        const places: { label: string; index: number }[] = []
        let current = -1
        for (let index = 0; index < every.count; index++) {
          if (every.disabled?.(index)) continue
          if (index === wanted) current = places.length
          places.push({ label: every.label(index), index })
        }
        const found = typeahead.match(event.key, places, current)
        if (found) goto(found.index)
        return true
      }
      const all = rows()
      const match = typeahead.match(
        event.key,
        all.map((row) => ({ label: row.label(), row })),
        all.indexOf(highlighted.peek() as Entry)
      )
      if (match) highlight(match.row, true)
      return true
    },
  }
}
