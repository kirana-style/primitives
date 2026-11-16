import { bind, effect, sameProps, signal } from "@kirana-ui/core"
import type { ChangeDetails, Part, ReadonlySignal, Signal } from "@kirana-ui/core"

/**
 * A component as a custom element, for a page with no framework.
 *
 * The custom element (`<kui-dialog>`) holds the component and draws nothing: it takes no room
 * (`display: contents`) and no attribute of the component's. Its parts are the page's own
 * elements, named by `kui-part` (`<button kui-part="trigger">`), the root among them. So a
 * trigger is a real button and a switch a real button, and the page is the page the other
 * adapters draw: nothing is wrapped, and there is no shadow root for a design to reach into.
 *
 * A part that is in the page only some of the time (a closed panel, a popup) is taken out of
 * the page while it is not, and put back where it was; `kui-keep-mounted` keeps it.
 */

/** What a part's name gives: the part, and what comes with it. */
export interface Drawn {
  readonly part: Part
  /** In the page only while this holds. */
  readonly mounted?: ReadonlySignal<boolean> | undefined
  /** Runs while the part is the component's. Returns the stop. */
  mount?(): () => void
  /** A hidden native input the part draws itself, as its last child. */
  readonly inner?: Part | undefined
}

type Kind = "boolean" | "string" | "number"

export interface ElementSpec<Props extends { id: string }, Controller> {
  /** The custom element's name: `kui-dialog`. */
  tag: string
  /** Its props by attribute name, each with how an attribute's text is read. */
  props: Record<string, Kind>
  create(props: ReadonlySignal<Props>): Controller
  /**
   * Its change callbacks: the event each is told as, and the prop the element then holds
   * (`open`). The event is cancelable: `preventDefault()` keeps the value as it was.
   */
  changes: Record<string, { event: string; prop: string }>
  /** Each part by its `kui-part` name. */
  parts: Record<string, (controller: Controller, element: HTMLElement) => Part | Drawn | undefined>
}

const camel = (name: string) =>
  name.replace(/-([a-z])/g, (_all, letter: string) => letter.toUpperCase())
const hosts = new Set<string>()
const OWNER = Symbol("kui-owner")
let made = 0

type Owned = HTMLElement & { [OWNER]?: HTMLElement }

/** The component a part belongs to: the nearest around it, or the one that moved it to the page's end. */
function ownerOf(element: Element): HTMLElement | null {
  for (let each: Element | null = element.parentElement; each; each = each.parentElement) {
    if (hosts.has(each.localName)) return each as HTMLElement
    const moved = (each as Owned)[OWNER]
    if (moved) return moved
  }
  return null
}

/** The nearest element around `element` (or itself) that is the part called `name`. */
export function partAround(element: Element, name: string): HTMLElement | null {
  return element.closest<HTMLElement>(`[kui-part="${name}"]`)
}

/**
 * Puts a part on an element, and takes it off whole: what the part wrote is gone with it. A
 * framework draws a new element each time a part comes back; here the same element is the
 * part again, and must not still say what it said before (`data-closed`, `aria-controls`).
 */
function put(element: HTMLElement, part: Part): () => void {
  const before = new Map(Array.from(element.attributes, (each) => [each.name, each.value]))
  const unbind = bind(element, part)
  return () => {
    unbind()
    for (const { name } of Array.from(element.attributes)) {
      // Its classes are the page's own, whatever was added to them since.
      if (!before.has(name) && name !== "class") element.removeAttribute(name)
    }
    for (const [name, value] of before) {
      if (name !== "class" && element.getAttribute(name) !== value)
        element.setAttribute(name, value)
    }
  }
}

function read(kind: Kind, text: string | null): unknown {
  if (kind === "boolean") return text !== null && text !== "false"
  if (text === null) return undefined
  return kind === "number" ? Number(text) : text
}

interface Held {
  stop(): void
  /** Taken out of the page by the component itself: still its part. */
  parked: boolean
}

/**
 * Defines a component's custom element, and gives its name (for
 * `customElements.whenDefined`). Where there are no custom elements (a server) it defines
 * nothing.
 */
export function defineElement<
  Props extends { id: string },
  Controller extends { mount(): () => void },
>(spec: ElementSpec<Props, Controller>): string {
  if (typeof customElements === "undefined" || customElements.get(spec.tag)) return spec.tag
  hosts.add(spec.tag)
  const names = Object.keys(spec.props)

  class KuiElement extends HTMLElement {
    static observedAttributes = names
    controller?: Controller
    #props?: Signal<Props> | undefined
    // Set as properties before the element was upgraded, or before it joined the page.
    #given: Record<string, unknown> = {}
    #held = new Map<HTMLElement, Held>()
    #stops: (() => void)[] = []
    #leaving = false
    #watch: (element: HTMLElement) => void = () => {}

    connectedCallback() {
      this.#leaving = false
      if (this.controller) return
      // It holds its parts and draws nothing: no box of its own between them and the page.
      if (!this.style.display) this.style.display = "contents"
      const initial: Record<string, unknown> = {
        id: this.getAttribute("kui-id") || `kui-${++made}`,
      }
      for (const name of names) {
        const text = this.getAttribute(name)
        // An attribute that is not there says nothing: the component's own default holds.
        if (text !== null) initial[camel(name)] = read(spec.props[name]!, text)
      }
      Object.assign(initial, this.#given)
      for (const [callback, { event, prop }] of Object.entries(spec.changes)) {
        initial[callback] = (value: unknown, details: ChangeDetails) => {
          const told = new CustomEvent(event, {
            detail: { [prop]: value, details },
            bubbles: true,
            cancelable: true,
          })
          if (!this.dispatchEvent(told)) return details.cancel()
          // A value that was given is held by the element from then on, as `<details open>`
          // holds its own: it follows what happens to it.
          if (this.given(prop) !== undefined) this.give(prop, value)
        }
      }
      this.#props = signal(initial as Props, sameProps as (a: Props, b: Props) => boolean)
      this.controller = spec.create(this.#props)
      this.#stops.push(this.controller.mount())
      // Parts that come and go: a page that draws its rows later, a list that changes.
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.removedNodes) {
            if (node instanceof HTMLElement) this.#release(node)
          }
          for (const node of record.addedNodes) if (node instanceof HTMLElement) this.#scan(node)
        }
      })
      observer.observe(this, { childList: true, subtree: true })
      this.#watch = (element) => observer.observe(element, { childList: true, subtree: true })
      this.#stops.push(() => observer.disconnect())
      // A copy: a part that is not in the page yet is taken out as it is met.
      for (const each of Array.from(this.children))
        if (each instanceof HTMLElement) this.#scan(each)
    }

    disconnectedCallback() {
      // Moved, it comes straight back: only an element that has left is taken apart.
      this.#leaving = true
      queueMicrotask(() => {
        if (!this.#leaving || this.isConnected) return
        for (const held of this.#held.values()) held.stop()
        this.#held.clear()
        for (const stop of this.#stops.splice(0).reverse()) stop()
        delete this.controller
        this.#props = undefined
      })
    }

    attributeChangedCallback(name: string, _before: string | null, text: string | null) {
      this.give(camel(name), read(spec.props[name]!, text))
    }

    /** A prop as it was last given: by an attribute, or as a property. */
    given(prop: string): unknown {
      return this.#props ? (this.#props.peek() as Record<string, unknown>)[prop] : this.#given[prop]
    }

    give(prop: string, value: unknown) {
      if (!this.#props) return void (this.#given[prop] = value)
      if (!Object.is((this.#props.peek() as Record<string, unknown>)[prop], value))
        this.#props.set({ ...this.#props.peek(), [prop]: value })
    }

    /** Takes the parts in a subtree, in the page's order: one that leaves takes its own with it. */
    #scan(element: HTMLElement) {
      if (!element.isConnected) return
      if (element.hasAttribute("kui-part")) this.#adopt(element)
      for (const each of Array.from(element.children))
        if (each instanceof HTMLElement) this.#scan(each)
    }

    #adopt(element: HTMLElement) {
      if (this.#held.has(element) || ownerOf(element) !== this || !this.controller) return
      const name = element.getAttribute("kui-part")!
      if (name === "portal") return this.#portal(element)
      const given = spec.parts[name]?.(this.controller, element)
      if (!given) return
      const drawn: Drawn = "attach" in given ? { part: given } : given
      const stops: (() => void)[] = []
      const held: Held = {
        parked: false,
        stop: () => {
          for (const stop of stops.splice(0).reverse()) stop()
        },
      }
      this.#held.set(element, held)
      const unmount = drawn.mount?.()
      if (unmount) stops.push(unmount)
      if (drawn.inner) {
        // One a server wrote there is taken over.
        const last = element.lastElementChild
        const taken = last instanceof HTMLInputElement && last.type === "hidden" ? last : undefined
        const input = taken ?? this.ownerDocument.createElement("input")
        if (!taken) element.append(input)
        stops.push(bind(input, drawn.inner), () => {
          if (!taken) input.remove()
        })
      }
      const mounted = element.hasAttribute("kui-keep-mounted") ? undefined : drawn.mounted
      if (!mounted) return void stops.push(put(element, drawn.part))
      // In the page only while it is mounted: out of it otherwise, its place kept by a mark.
      const home = this.ownerDocument.createComment("")
      let unbind: (() => void) | undefined
      stops.push(
        effect(() => {
          if (mounted.get()) {
            if (held.parked) {
              held.parked = false
              home.replaceWith(element)
            }
            unbind ??= put(element, drawn.part)
          } else {
            unbind?.()
            unbind = undefined
            if (!held.parked && element.parentNode) {
              held.parked = true
              element.replaceWith(home)
            }
          }
        }),
        () => {
          unbind?.()
          if (held.parked) home.replaceWith(element)
        }
      )
    }

    /** What is inside is drawn at the end of the page while the component is mounted. */
    #portal(element: HTMLElement) {
      const mounted = (this.controller as { mounted?: ReadonlySignal<boolean> }).mounted
      if (!mounted) return
      ;(element as Owned)[OWNER] = this
      const home = this.ownerDocument.createComment("")
      const held: Held = { parked: false, stop: () => {} }
      this.#held.set(element, held)
      this.#watch(element)
      const body = this.ownerDocument.body
      const stop = effect(() => {
        if (mounted.get()) {
          if (element.parentNode === body) return
          // Its place in the page is kept by a mark, for when the component leaves.
          if (!home.parentNode && element.parentNode) element.replaceWith(home)
          held.parked = false
          element.setAttribute("data-kirana-portal", "")
          body.append(element)
          this.#scan(element)
        } else if (!held.parked) {
          held.parked = true
          if (!home.parentNode && element.parentNode) element.replaceWith(home)
          else element.remove()
        }
      })
      held.stop = () => {
        stop()
        element.removeAttribute("data-kirana-portal")
        if (home.parentNode) home.replaceWith(element)
        else element.remove()
      }
    }

    #release(element: HTMLElement) {
      // Moved to the page's end by its own portal, or put back: still this component's.
      if (element.isConnected) return
      for (const [each, held] of this.#held) {
        if (each !== element && !element.contains(each)) continue
        // Taken out by the component itself: it is still the component's, to be put back.
        if (each === element && held.parked) continue
        held.stop()
        this.#held.delete(each)
      }
    }
  }

  // Each prop as a property too: `element.open = true`, and what the element holds read back.
  for (const name of names) {
    const prop = camel(name)
    Object.defineProperty(KuiElement.prototype, prop, {
      configurable: true,
      get(this: KuiElement) {
        const state = (this.controller as Record<string, unknown> | undefined)?.[prop] as
          | ReadonlySignal<unknown>
          | undefined
        return typeof state?.peek === "function" ? state.peek() : this.given(prop)
      },
      set(this: KuiElement, value: unknown) {
        this.give(prop, value)
      },
    })
  }
  customElements.define(spec.tag, KuiElement)
  return spec.tag
}
