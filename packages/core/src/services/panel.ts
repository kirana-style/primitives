import type { ReadonlySignal } from "../reactivity.ts"
import { setGeometry } from "./geometry.ts"
import { createPresence } from "./presence.ts"
import type { Presence } from "./presence.ts"

/**
 * The presence of a panel that opens by growing: a collapsible's, an accordion's. Its content's
 * size is on the element as `<prefix>-height` and `<prefix>-width` while it opens or closes, for
 * a transition to run between it and nothing, and `auto` once it is open, so it follows its
 * content.
 */
export function createPanelPresence(open: ReadonlySignal<boolean>, prefix: string): Presence {
  const measure = (element: HTMLElement) => {
    setGeometry(element, `${prefix}-height`, `${element.scrollHeight}px`)
    setGeometry(element, `${prefix}-width`, `${element.scrollWidth}px`)
  }
  const release = (element: HTMLElement) => {
    setGeometry(element, `${prefix}-height`, "auto")
    setGeometry(element, `${prefix}-width`, "auto")
  }
  const presence = createPresence(open, {
    onEnter: measure,
    onEntered: release,
    onExit(element) {
      // From `auto` to a length a transition can leave from.
      measure(element)
      void element.offsetHeight
    },
  })
  return {
    ...presence,
    attach(element) {
      // Open from the start: there is no entrance to measure for.
      if (open.peek() && presence.status.peek() === undefined) release(element)
      return presence.attach(element)
    },
  }
}
