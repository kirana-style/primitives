import { signal } from "../reactivity.ts"

/**
 * Where each of a component's repeated parts stands among the others, from 0: an accordion's
 * items, a tab list's panels. Each is known by a key (its value, or an id its framework made).
 */
export interface Places<Key> {
  /**
   * Its place, read as a signal: among the parts in the page, by the page's order, once its
   * element is in it. Until then, with `guess`, the place it was first asked for in, among the
   * others asked for and those in the page; without, `undefined`.
   */
  place(key: Key): number | undefined
  /** The part is made: with `guess`, its place until it is in the page follows from when. */
  ask(key: Key): void
  /** Its element is in the page. Returns the leave. */
  join(key: Key, element: HTMLElement): () => void
}

/**
 * The places of repeated parts, as Base UI counts them: the page's order once the parts are in
 * it. A server has no page, so with `guess` a part's place until then is the order its key was
 * first asked for, which is the order a server writes a list drawn in order. Keys are kept, not
 * calls counted: a framework that makes a part twice (React's StrictMode) asks with the same key.
 */
export function createPlaces<Key>({ guess }: { guess: boolean }): Places<Key> {
  const elements = new Map<Key, HTMLElement>()
  // Never a signal: a part is asked for while its framework renders.
  const asked: Key[] = []
  // Bumped when an element comes or goes: every place is read again.
  const drawn = signal(0)

  return {
    place(key) {
      drawn.get()
      const own = elements.get(key)
      if (!own && !guess) return undefined
      let before = 0
      if (own) {
        for (const other of elements.values())
          if (
            other !== own &&
            own.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_PRECEDING
          )
            before++
        return before
      }
      let passed = false
      for (const each of asked) {
        if (each === key) {
          passed = true
          continue
        }
        if (elements.has(each) || !passed) before++
      }
      return before
    },
    ask(key) {
      if (!asked.includes(key)) asked.push(key)
    },
    join(key, element) {
      if (!asked.includes(key)) asked.push(key)
      elements.set(key, element)
      drawn.set(drawn.peek() + 1)
      return () => {
        if (elements.get(key) !== element) return
        // Gone: the parts after it each move up a place.
        elements.delete(key)
        const at = asked.indexOf(key)
        if (at >= 0) asked.splice(at, 1)
        drawn.set(drawn.peek() + 1)
      }
    },
  }
}
