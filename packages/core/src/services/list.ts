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
}): List {
  const entries = new WeakMap<Element, Entry>()
  const highlighted = signal<ListRow | undefined>(undefined)
  const typeahead = createTypeahead()
  let list: HTMLElement | undefined

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

  function move(step: Step) {
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
    rowOf: (element) => (element ? entries.get(element) : undefined),
    attach(element) {
      list = element
      return () => {
        if (list !== element) return
        list = undefined
        highlight(undefined)
        typeahead.reset()
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
          return () => {
            if (own !== element) return
            own = undefined
            entries.delete(element)
            // A row that leaves takes its highlight with it.
            if (highlighted.peek() === entry) highlight(undefined)
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
      if (!printable(event)) return false
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
