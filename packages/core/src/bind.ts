import { effect } from "./reactivity.ts"
import { isPrevented, preventable, styleText } from "./part.ts"
import type { Part, PartProps, PartStyle } from "./part.ts"
import { clearGeometry, setGeometry } from "./services/geometry.ts"

const HANDLER = /^on[A-Z]/

// A form control's live state, which an attribute only seeds.
const PROPERTIES = new Set(["checked", "value"])

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
  let styled: PartStyle = {}
  const listeners = new Map<string, EventListener>()

  const stop = effect(() => {
    const next = part.props.get()
    for (const key in current) {
      if (HANDLER.test(key) || key === "style") continue
      if (PROPERTIES.has(key) && key in element) continue
      // Only what the part wrote is the part's to take away: an attribute it has no value for
      // may be the caller's own.
      if (next[key] === undefined && current[key] !== undefined) element.removeAttribute(key)
    }
    for (const key in next) {
      const value = next[key]
      if (key === "style") {
        // Property by property, kept there: the element's other styles are the caller's.
        const style = (value ?? {}) as PartStyle
        for (const name in styled) if (!(name in style)) clearGeometry(element, name)
        for (const name in style) setGeometry(element, name, style[name]!)
        styled = style
      } else if (HANDLER.test(key)) {
        if (listeners.has(key) || typeof value !== "function") continue
        // One listener for the element's life: it calls whatever handler the part has now.
        const listener: EventListener = (event) => {
          const handler = current[key]
          if (typeof handler === "function" && !isPrevented(event))
            (handler as EventListener)(event)
        }
        listeners.set(key, listener)
        // In the capture phase, which reaches the element before any listener a caller put on
        // it: their handler finds `event.preventKiranaHandler()` there, as in a framework that
        // merges handlers.
        element.addEventListener(eventType(key), preventable, true)
        element.addEventListener(eventType(key), listener)
      } else if (PROPERTIES.has(key) && key in element) {
        // What a person changes after the page loads is the property, not the attribute. A
        // value that is not given is left alone: a checkbox's own default is `on`.
        const control = element as unknown as Record<string, unknown>
        if (key === "checked") control.checked = value !== undefined
        else if (value !== undefined) control[key] = value
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
    for (const [key, listener] of listeners) {
      element.removeEventListener(eventType(key), preventable, true)
      element.removeEventListener(eventType(key), listener)
    }
  }
}

/**
 * Writes a part on an element once: its attributes and its style, no listeners and none of its
 * DOM work. For a document on a server, where nothing changes after the page is written and the
 * browser's own objects (observers, layout) do not exist. The client then binds the same element.
 */
export function write(element: HTMLElement, part: Part): void {
  const props = part.props.peek()
  for (const key in props) {
    const value = props[key]
    if (value === undefined || HANDLER.test(key)) continue
    if (key === "style") {
      const own = element.getAttribute("style")
      const text = styleText(value as PartStyle)
      if (text) element.setAttribute("style", own ? `${own};${text}` : text)
    } else {
      element.setAttribute(key, String(value))
    }
  }
}
