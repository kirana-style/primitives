import { bind, effect, sameProps, signal } from "@kirana-ui/core"
import type { ChangeDetails, Part, ReadonlySignal, Signal } from "@kirana-ui/core"

/**
 * A component as a custom element, for a page with no framework.
 *
 * The root is the custom element (`<kui-dialog>`); its parts are the page's own elements,
 * named by `kui-part` (`<button kui-part="trigger">`). So a trigger is a real button, a panel
 * a real `<div>`, and the page is the page the other adapters draw: nothing is wrapped, and
 * there is no shadow root for a design to reach into.
 */

/** A part that is in the page only some of the time: hidden while it is not. */
export interface PresentPart {
  readonly mounted: ReadonlySignal<boolean>
  readonly part: Part
  mount?(): () => void
}

type Kind = "boolean" | "string" | "number"

export interface ElementSpec<Props extends { id: string }, Controller> {
  /** The custom element's name: `kui-dialog`. */
  tag: string
  /** Its props by attribute name, each with how an attribute's text is read. */
  props: Record<string, Kind>
  create(props: ReadonlySignal<Props>): Controller
  /** The root element's own part, when the component has one. */
  root?(controller: Controller): Part
  /**
   * Its change callbacks: the event each is told as, and the prop the element then holds
   * (`open`). The event is cancelable: `preventDefault()` keeps the value as it was.
   */
  changes: Record<string, { event: string; prop: string }>
  /** Each part by its `kui-part` name. */
  parts: Record<
    string,
    (controller: Controller, element: HTMLElement) => Part | PresentPart | undefined
  >
  /** Called once the controller is made: for what the root draws itself (a hidden input). */
  setup?(controller: Controller, host: HTMLElement): (() => void) | undefined
}

const camel = (name: string) =>
  name.replace(/-([a-z])/g, (_all, letter: string) => letter.toUpperCase())
const roots = new Set<string>()
const OWNER = Symbol("kui-owner")
let made = 0

type Owned = HTMLElement & { [OWNER]?: HTMLElement }

/** The root a part belongs to: the nearest around it, or the one that moved it to the page's end. */
function ownerOf(element: Element): HTMLElement | null {
  for (let each: Element | null = element.parentElement; each; each = each.parentElement) {
    if (roots.has(each.localName)) return each as HTMLElement
    const moved = (each as Owned)[OWNER]
    if (moved) return moved
  }
  return null
}

function read(kind: Kind, text: string | null): unknown {
  if (kind === "boolean") return text !== null && text !== "false"
  if (text === null) return undefined
  return kind === "number" ? Number(text) : text
}

/**
 * The hidden native input a control draws itself, as its host's last child: what a form and
 * a `<label>` reach. One a server wrote there is taken over. Returns the removal.
 */
export function innerInput(host: HTMLElement, part: Part): () => void {
  const last = host.lastElementChild
  const taken =
    last instanceof HTMLInputElement && last.hasAttribute("kui-input") ? last : undefined
  const input = taken ?? host.ownerDocument.createElement("input")
  if (!taken) host.append(input)
  const unbind = bind(input, part)
  return () => {
    unbind()
    if (!taken) input.remove()
  }
}

/** Defines a component's custom element. Does nothing where there are none (a server). */
export function defineElement<
  Props extends { id: string },
  Controller extends { mount(): () => void },
>(spec: ElementSpec<Props, Controller>): void {
  if (typeof customElements === "undefined" || customElements.get(spec.tag)) return
  roots.add(spec.tag)
  const names = Object.keys(spec.props)

  class KuiElement extends HTMLElement {
    static observedAttributes = names
    controller?: Controller
    #props?: Signal<Props>
    // Set as properties before the element was upgraded, or before it joined the page.
    #given: Record<string, unknown> = {}
    #bound = new Map<Element, () => void>()
    #stops: (() => void)[] = []
    #leaving = false

    connectedCallback() {
      this.#leaving = false
      if (this.controller) return
      const initial: Record<string, unknown> = { id: this.id || `kui-${++made}` }
      for (const name of names) {
        const kind = spec.props[name]!
        const text = this.getAttribute(name)
        // An attribute that is not there says nothing: the component's own default holds.
        if (text !== null || kind === "boolean") initial[camel(name)] = read(kind, text)
      }
      // A value the element holds starts as the component's own: `open` absent is "not said".
      for (const { prop } of Object.values(spec.changes)) {
        if (!this.hasAttribute(prop.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)))
          delete initial[prop]
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
      const controller = spec.create(this.#props)
      this.controller = controller
      const root = spec.root?.(controller)
      if (root) this.#stops.push(bind(this, root))
      const undo = spec.setup?.(controller, this)
      if (undo) this.#stops.push(undo)
      this.#stops.push(controller.mount())
      for (const each of this.querySelectorAll<HTMLElement>("[kui-part]")) this.#adopt(each)
      // Parts that come and go: a page that draws its rows later, a list that changes.
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.removedNodes)
            if (node instanceof HTMLElement) this.#release(node)
          for (const node of record.addedNodes) {
            if (!(node instanceof HTMLElement)) continue
            if (node.hasAttribute("kui-part")) this.#adopt(node)
            for (const each of node.querySelectorAll<HTMLElement>("[kui-part]")) this.#adopt(each)
          }
        }
      })
      observer.observe(this, { childList: true, subtree: true })
      this.#watch = (element) => observer.observe(element, { childList: true, subtree: true })
      this.#stops.push(() => observer.disconnect())
    }

    #watch: (element: HTMLElement) => void = () => {}

    disconnectedCallback() {
      // Moved, it comes straight back: only an element that has left is taken apart.
      this.#leaving = true
      queueMicrotask(() => {
        if (!this.#leaving || this.isConnected) return
        for (const stop of this.#bound.values()) stop()
        this.#bound.clear()
        for (const stop of this.#stops.splice(0).reverse()) stop()
        delete this.controller
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

    #adopt(element: HTMLElement) {
      if (this.#bound.has(element) || ownerOf(element) !== this || !this.controller) return
      const name = element.getAttribute("kui-part")!
      if (name === "portal") return this.#portal(element)
      const part = spec.parts[name]?.(this.controller, element)
      if (!part) return
      if ("attach" in part) return void this.#bound.set(element, bind(element, part))
      // In the page only while it is mounted: hidden otherwise, with nothing listening.
      let unbind: (() => void) | undefined
      const unmount = part.mount?.()
      element.hidden = !part.mounted.peek()
      const stop = effect(() => {
        const on = part.mounted.get()
        if (on === (unbind !== undefined)) return
        if (on) {
          element.hidden = false
          unbind = bind(element, part.part)
        } else {
          unbind?.()
          unbind = undefined
          element.hidden = true
        }
      })
      this.#bound.set(element, () => {
        stop()
        unbind?.()
        unmount?.()
      })
    }

    /** What is inside is drawn at the end of the page while the component is mounted. */
    #portal(element: HTMLElement) {
      const mounted = (this.controller as { mounted?: ReadonlySignal<boolean> }).mounted
      if (!mounted) return
      ;(element as Owned)[OWNER] = this
      const home = this.ownerDocument.createComment("kui-portal")
      let outlet: HTMLElement | undefined
      this.#watch(element)
      const stop = effect(() => {
        if (mounted.get() === (outlet !== undefined)) return
        if (mounted.get()) {
          element.before(home)
          outlet = this.ownerDocument.createElement("div")
          outlet.setAttribute("data-kirana-portal", "")
          this.ownerDocument.body.append(outlet)
          outlet.append(element)
          element.hidden = false
        } else {
          element.hidden = true
          home.replaceWith(element)
          outlet?.remove()
          outlet = undefined
        }
      })
      element.hidden = !mounted.peek()
      this.#bound.set(element, () => {
        stop()
        if (outlet) {
          home.replaceWith(element)
          outlet.remove()
        }
      })
    }

    #release(element: HTMLElement) {
      // Moved to the page's end by its own portal: still this component's.
      if (element.isConnected) return
      for (const [each, stop] of this.#bound) {
        if (each !== element && !element.contains(each)) continue
        stop()
        this.#bound.delete(each)
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
}
