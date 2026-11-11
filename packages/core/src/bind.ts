import { effect } from "./reactivity.ts"
import type { Part, PartProps } from "./part.ts"

const HANDLER = /^on[A-Z]/

/** A handler's DOM event. `onFocus` and `onBlur` are the bubbling ones, as in React. */
export function eventType(key: string): string {
  const name = key.slice(2).toLowerCase()
  if (name === "focus") return "focusin"
  if (name === "blur") return "focusout"
  return name
}

/**
 * Puts a part on an element with no framework: writes its attributes as they change, listens for
 * its events and runs its DOM work. This is the whole adapter for plain DOM, and what an adapter
 * uses when its framework renders the element but should not re-render for the part (Angular).
 */
export function bind(element: HTMLElement, part: Part): () => void {
  let current: PartProps = {}
  const listeners = new Map<string, EventListener>()

  const stop = effect(() => {
    const next = part.props.get()
    for (const key in current) {
      if (HANDLER.test(key)) continue
      if (next[key] === undefined) element.removeAttribute(key)
    }
    for (const key in next) {
      const value = next[key]
      if (HANDLER.test(key)) {
        if (listeners.has(key) || typeof value !== "function") continue
        // One listener for the element's life: it calls whatever handler the part has now.
        const listener: EventListener = (event) => {
          const handler = current[key]
          if (typeof handler === "function") (handler as EventListener)(event)
        }
        listeners.set(key, listener)
        element.addEventListener(eventType(key), listener)
      } else if (value !== undefined && value !== current[key]) {
        element.setAttribute(key, String(value))
      }
    }
    current = next
  })
  const detach = part.attach(element)

  return () => {
    stop()
    detach()
    for (const [key, listener] of listeners) element.removeEventListener(eventType(key), listener)
  }
}
