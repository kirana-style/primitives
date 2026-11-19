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
  /**
   * Where the part is drawn while it is mounted, when that is not where it was written: a
   * navigation menu's content, in the menu's one viewport. Out of the page while there is none.
   */
  readonly into?: ReadonlySignal<HTMLElement | undefined> | undefined
  /** What the part's element says, when the page gave it nothing to say. */
  readonly text?: ReadonlySignal<string | undefined> | undefined
}

type Kind = "boolean" | "string" | "number"

/** A list a component draws from a `<template kui-each>`. */
export interface Each<Entry = any> {
  readonly entries: ReadonlySignal<readonly Entry[]> | readonly Entry[]
  /** What an entry is known by from one drawing to the next. */
  key(entry: Entry): string | number
  /**
   * Which of the template's elements an entry is drawn with, when they differ: the ones
   * whose `kui-when` says so (a page, an ellipsis). Elements without `kui-when` are for all.
   */
  type?(entry: Entry): string
  /**
   * What `{name}` stands for in the template's text and attributes
   * (`data-testid="row-{id}"`). Left out: the entry's own fields.
   */
  values?(entry: Entry): Record<string, unknown>
}

const ENTRY = new WeakMap<Node, unknown>()

/**
 * The entry an element was stamped for, or the nearest around it: a part reads its own. With
 * `which`, the nearest that is of that list (a day's month, around its week).
 */
export function entryAround<Entry>(
  element: Node,
  which?: (entry: unknown) => boolean
): Entry | undefined {
  for (let each: Node | null = element; each; each = each.parentNode) {
    if (ENTRY.has(each) && (!which || which(ENTRY.get(each)))) return ENTRY.get(each) as Entry
  }
  return undefined
}

/** `{name}` in a text, for each name there is a value for; another brace is the page's own. */
const fill = (text: string, values: Record<string, unknown>) =>
  text.replace(/\{([A-Za-z_][\w-]*)\}/g, (whole, name: string) =>
    name in values ? String(values[name] ?? "") : whole
  )

interface Row {
  entry: unknown
  nodes: ChildNode[]
  /** Where a `{name}` was written: read again when the entry changes. */
  written: (readonly [Attr | Text, string])[]
}

export interface ElementSpec<Props extends { id: string }, Controller> {
  /** The custom element's name: `kui-dialog`. */
  tag: string
  /** Its props by attribute name, each with how an attribute's text is read. */
  props: Record<string, Kind>
  /** Props that are only properties: a function, an object. By their names as properties. */
  properties?: readonly string[] | undefined
  /**
   * What the component draws a list of, by name: a calendar's weeks, a toast for each
   * message. The page writes one of an entry as a `<template kui-each="name">` where the
   * list goes, and the element stamps it for each entry, keyed, so an entry that stays keeps
   * its elements. `around` is the entry of the list this one is written in (a week, for its
   * days).
   */
  lists?: Record<string, (controller: Controller, around: unknown) => Each | undefined>
  /**
   * The hidden native input a form reads, for a component with no part to hold it: drawn as
   * the element's last child, while `mounted` (a select with a name).
   */
  inner?(controller: Controller): { part: Part; mounted?: ReadonlySignal<boolean> | undefined }
  /** `host` is the custom element: what is around it (a field, a group) is found from it. */
  create(props: ReadonlySignal<Props>, host: HTMLElement): Controller
  /**
   * Its change callbacks: the event each is told as, and the prop the element then holds
   * (`open`). The event is cancelable: `preventDefault()` keeps the value as it was.
   */
  changes: Record<string, { event: string; prop: string; hold?: boolean }>
  /** Each part by its `kui-part` name. */
  parts: Record<string, (controller: Controller, element: HTMLElement) => Part | Drawn | undefined>
}

declare const DEFINED: unique symbol

/**
 * A custom element's name as `defineElement` gives it. For TypeScript it also says what the
 * element was defined from, which `ElementOf` reads back; in the page it is the name alone.
 */
export type Tag<Props = unknown, Controller = unknown> = string & {
  readonly [DEFINED]?: readonly [Props, Controller]
}

/**
 * What a component tells: an event whose `detail` holds the value under its prop's name
 * (`detail.open`, `detail.values`) and why it changed (`detail.details.reason`).
 * `preventDefault()` keeps the value as it was.
 */
export type Told<Prop extends string, Value> = CustomEvent<
  { readonly [Name in Prop]: Value } & { readonly details: ChangeDetails }
>

/** A tag with its props said, where `defineElement` was left to work them out. */
export type As<Defined, Props> =
  Defined extends Tag<unknown, infer Controller> ? Tag<Props, Controller> : never

type Callback<Props, Name> = Name extends keyof Props
  ? Extract<Props[Name], (...given: never[]) => unknown>
  : never

interface Listens<Events> {
  addEventListener<Type extends keyof Events>(
    type: Type,
    listener: (this: HTMLElement, event: Events[Type]) => void,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<Type extends keyof Events>(
    type: Type,
    listener: (this: HTMLElement, event: Events[Type]) => void,
    options?: boolean | EventListenerOptions
  ): void
}

/**
 * A component's custom element as TypeScript knows it, from its `tag`: its props as properties
 * (`element.open = true`), its controller once it has begun, and its events with their
 * `detail`. `Changes` names each event with the callback it tells and the prop it holds
 * (`{ "open-change": ["onOpenChange", "open"] }`), as the element's `changes` do; `More` is
 * for events its parts tell from their own elements, which reach it too.
 */
export type ElementOf<Defined, Changes = {}, More = {}> =
  Defined extends Tag<infer Props, infer Controller>
    ? Listens<
        {
          readonly [Event in keyof Changes]: Changes[Event] extends readonly [
            infer Name,
            infer Prop extends string,
          ]
            ? Told<Prop, Parameters<Callback<Props, Name>>[0]>
            : never
        } & More
      > & {
        -readonly [
          Name in keyof Props as Name extends "id" | `on${Capitalize<string>}` ? never : Name
        ]?: Props[Name]
      } & { controller?: Controller } & HTMLElement
    : never

const camel = (name: string) =>
  name.replace(/-([a-z])/g, (_all, letter: string) => letter.toUpperCase())
const hosts = new Set<string>()
const OWNER = Symbol("kui-owner")
let made = 0

type Owned = HTMLElement & { [OWNER]?: HTMLElement }

/**
 * Whether an element is a component's: one that was defined, or a `kui-` one that is yet to
 * be (its entry is imported later). What is inside it is its own from the start, and not a
 * part of the component around it that happens to have a part of the same name.
 */
const ours = (element: Element) =>
  hosts.has(element.localName) || element.localName.startsWith("kui-")

/** The component a part belongs to: the nearest around it, or the one that moved it to the page's end. */
export function ownerOf(element: Element): HTMLElement | null {
  for (let each: Element | null = element.parentElement; each; each = each.parentElement) {
    if (ours(each)) return each as HTMLElement
    const moved = (each as Owned)[OWNER]
    if (moved) return moved
  }
  return null
}

/**
 * The controller of the component around a custom element: the field a control is in, the
 * group a toggle is one of. Through a portal too: what was moved to the page's end is still
 * inside what it was written in.
 */
export function controllerAround<Controller>(host: Element, tag: string): Controller | undefined {
  return hostAround(host, [tag])?.controller as Controller | undefined
}

/** The nearest component around a custom element that is one of `tags`: which, and its controller. */
export function hostAround(
  host: Element,
  tags: readonly string[]
): { tag: string; controller: unknown } | undefined {
  for (let each: Element | null = ownerOf(host); each; each = ownerOf(each)) {
    if (tags.includes(each.localName))
      return { tag: each.localName, controller: (each as { controller?: unknown }).controller }
  }
  return undefined
}

/** The nearest element around `element` (or itself) that is the part called `name`. */
export function partAround(element: Element, name: string): HTMLElement | null {
  return element.closest<HTMLElement>(`[kui-part="${name}"]`)
}

// Elements the page had drawn before their part gave them a style of its own.
let settling: HTMLElement[] | undefined

/**
 * A page's markup is drawn before its components begin, so a part's style (a slider thumb's
 * place) reaches an element the browser has already styled, and a design's `transition` on it
 * would run as the page begins: each thumb gliding to where it was all along. A framework's
 * element has its style before it is first drawn; here what the first style started is ended
 * before the page is drawn again, once for all the parts of a pass.
 */
function settle(element: HTMLElement): void {
  if (typeof element.getAnimations !== "function") return
  if (!settling) {
    const written: HTMLElement[] = (settling = [])
    queueMicrotask(() => {
      settling = undefined
      for (const each of written) {
        for (const animation of each.getAnimations()) {
          if (animation instanceof CSSTransition) animation.cancel()
        }
      }
    })
  }
  settling.push(element)
}

/**
 * Puts a part on an element, and takes it off whole: what the part wrote is gone with it. A
 * framework draws a new element each time a part comes back; here the same element is the
 * part again, and must not still say what it said before (`data-closed`, `aria-controls`).
 */
function put(element: HTMLElement, part: Part, drawn = false): () => void {
  const before = new Map(Array.from(element.attributes, (each) => [each.name, each.value]))
  const unbind = bind(element, part)
  if (drawn && part.props.peek().style) settle(element)
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

/**
 * The props of something inside a component that has props of its own (a menu's checkbox
 * item, its radio group), read from its element's `kui-` attributes: `kui-checked`,
 * `kui-default-value`. What it tells is told from that element, and may be refused; a value
 * its element was given is held there, and one the page writes later is followed.
 */
export function partProps<Props>(
  element: HTMLElement,
  kinds: Record<string, Kind>,
  changes: Record<string, { event: string; prop: string }>
): { props: ReadonlySignal<Props>; mount(): () => void } {
  const attribute = (name: string) => `kui-${name}`
  const told: Record<string, unknown> = {}
  const all = () => {
    const next: Record<string, unknown> = { ...told }
    for (const [name, kind] of Object.entries(kinds)) {
      const text = element.getAttribute(attribute(name))
      if (text !== null) next[camel(name)] = read(kind, text)
    }
    return next as Props
  }
  const source = signal<Props>({} as Props, sameProps as (a: Props, b: Props) => boolean)
  for (const [callback, { event, prop }] of Object.entries(changes)) {
    told[callback] = (value: unknown, details?: ChangeDetails) => {
      const heard = new CustomEvent(event, {
        detail: { [prop]: value, details },
        bubbles: true,
        cancelable: true,
      })
      if (!element.dispatchEvent(heard)) return details?.cancel()
      const held = attribute(prop.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`))
      if (element.hasAttribute(held)) element.setAttribute(held, String(value))
      source.set(all())
    }
  }
  source.set(all())
  return {
    props: source,
    mount() {
      const observer = new MutationObserver(() => source.set(all()))
      observer.observe(element, {
        attributes: true,
        attributeFilter: Object.keys(kinds).map(attribute),
      })
      return () => observer.disconnect()
    },
  }
}

function read(kind: Kind, text: string | null): unknown {
  if (kind === "boolean") return text !== null && text !== "false"
  if (text === null) return undefined
  return kind === "number" ? Number(text) : text
}

// Components written inside one that has not begun: its element is not defined yet (its
// entry is imported later), or it waits itself. They begin when it has.
const waiting = new Set<{ begin(): void }>()

/** Whether a component around `element` has yet to begin: what is inside it reads it. */
function early(element: Element): boolean {
  for (let each: Element | null = element.parentElement; each; each = each.parentElement) {
    // Moved to the page's end by a component that had begun: on from that one.
    const moved = (each as Owned)[OWNER]
    if (moved) return early(moved)
    if (ours(each) && !(each as { controller?: unknown }).controller) return true
  }
  return false
}

/** What can be a part: an element of the page, one of a drawing (`<svg>`, `<path>`) too. */
const drawable = (node: Node): node is HTMLElement => node instanceof Element

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
export function defineElement<Props extends { id: string }, Controller extends object>(
  spec: ElementSpec<Props, Controller>
): Tag<Props, Controller> {
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
    // While the parts the page wrote are first taken: they were drawn before they were parts.
    #first = false
    #watch: (element: HTMLElement) => void = () => {}

    connectedCallback() {
      this.#leaving = false
      this.begin()
    }

    /** Begins, unless a component around it has not: then it waits for that one. */
    begin() {
      if (this.controller || !this.isConnected) return
      if (early(this)) return void waiting.add(this)
      waiting.delete(this)
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
      for (const [callback, { event, prop, hold }] of Object.entries(spec.changes)) {
        initial[callback] = (value: unknown, details?: ChangeDetails) => {
          const told = new CustomEvent(event, {
            detail: { [prop]: value, details },
            bubbles: true,
            cancelable: true,
          })
          if (!this.dispatchEvent(told)) return details?.cancel()
          // A value that was given is held by the element from then on, as `<details open>`
          // holds its own: it follows what happens to it.
          if (hold !== false && this.given(prop) !== undefined) this.give(prop, value)
        }
      }
      this.#props = signal(initial as Props, sameProps as (a: Props, b: Props) => boolean)
      this.controller = spec.create(this.#props, this)
      const unmount = (this.controller as { mount?(): () => void }).mount?.()
      if (unmount) this.#stops.push(unmount)
      // Parts that come and go: a page that draws its rows later, a list that changes.
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.removedNodes) {
            if (drawable(node)) this.#release(node)
          }
          for (const node of record.addedNodes) if (drawable(node)) this.#scan(node)
        }
      })
      observer.observe(this, { childList: true, subtree: true })
      this.#watch = (element) => observer.observe(element, { childList: true, subtree: true })
      this.#stops.push(() => observer.disconnect())
      // A copy: a part that is not in the page yet is taken out as it is met.
      this.#first = true
      for (const each of Array.from(this.children)) if (drawable(each)) this.#scan(each)
      this.#first = false
      const inner = spec.inner?.(this.controller)
      if (inner) {
        const input = this.ownerDocument.createElement("input")
        let unbind: (() => void) | undefined
        const drawn = effect(() => {
          const wanted = inner.mounted?.get() ?? true
          if (wanted && !unbind) {
            this.append(input)
            unbind = bind(input, inner.part)
          } else if (!wanted && unbind) {
            unbind()
            unbind = undefined
            input.remove()
          }
        })
        this.#stops.push(() => {
          drawn()
          unbind?.()
          input.remove()
        })
      }
      for (const each of Array.from(waiting)) each.begin()
    }

    disconnectedCallback() {
      // Moved, it comes straight back: only an element that has left is taken apart.
      this.#leaving = true
      queueMicrotask(() => {
        if (!this.#leaving || this.isConnected) return
        waiting.delete(this)
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
      if (element instanceof HTMLTemplateElement) {
        if (element.hasAttribute("kui-each") && ownerOf(element) === this) this.#each(element)
        return
      }
      if (element.hasAttribute("kui-part")) this.#adopt(element)
      for (const each of Array.from(element.children)) if (drawable(each)) this.#scan(each)
    }

    /** Draws a list from its template: a copy for each entry, where the template was. */
    #each(template: HTMLTemplateElement) {
      const list = spec.lists?.[template.getAttribute("kui-each")!]?.(
        this.controller!,
        entryAround(template)
      )
      if (!list) return
      // The template leaves the page for a mark: what is drawn is the page a framework draws.
      const mark = this.ownerDocument.createComment("")
      if (ENTRY.has(template)) ENTRY.set(mark, ENTRY.get(template))
      template.replaceWith(mark)
      const rows = new Map<string | number, Row>()
      const stamp = (entry: unknown): Row => {
        const type = list.type?.(entry)
        const copy = template.content.cloneNode(true) as DocumentFragment
        for (const node of Array.from(copy.childNodes)) {
          const blank = node.nodeType === Node.TEXT_NODE && !node.textContent!.trim()
          const other =
            node instanceof Element &&
            node.hasAttribute("kui-when") &&
            node.getAttribute("kui-when") !== type
          if (blank || other || node.nodeType === Node.COMMENT_NODE) node.remove()
        }
        const written: (readonly [Attr | Text, string])[] = []
        const walker = this.ownerDocument.createTreeWalker(
          copy,
          NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        )
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          // A list written in this one is filled when it is drawn, for its own entries.
          if (node instanceof Text) {
            if (node.data.includes("{")) written.push([node, node.data])
          } else if (!(node instanceof HTMLTemplateElement)) {
            for (const attribute of Array.from((node as Element).attributes))
              if (attribute.value.includes("{")) written.push([attribute, attribute.value])
          }
        }
        const nodes = Array.from(copy.childNodes)
        for (const node of nodes) ENTRY.set(node, entry)
        return { entry, nodes, written }
      }
      const write = (row: Row) => {
        const values =
          list.values?.(row.entry) ?? (row.entry as Record<string, unknown> | undefined) ?? {}
        for (const [node, text] of row.written) {
          const next = fill(text, values)
          if (node instanceof Text) {
            if (node.data !== next) node.data = next
          } else if (node.value !== next) node.value = next
        }
      }
      const draw = () => {
        const { entries } = list
        const next = "get" in entries ? entries.get() : entries
        const parent = mark.parentNode
        if (!parent) return
        const kept = new Set<string | number>()
        const fresh: Row[] = []
        const ordered = next.map((entry) => {
          const key = list.key(entry)
          kept.add(key)
          let row = rows.get(key)
          if (!row) {
            rows.set(key, (row = stamp(entry)))
            fresh.push(row)
            write(row)
          } else if (row.entry !== entry) {
            row.entry = entry
            for (const node of row.nodes) ENTRY.set(node, entry)
            write(row)
          }
          return row
        })
        for (const [key, row] of rows) {
          if (kept.has(key)) continue
          rows.delete(key)
          for (const node of row.nodes) node.remove()
        }
        // From the end: a copy that is where it belongs is not moved, and keeps focus.
        let before: ChildNode = mark
        for (const row of ordered.reverse()) {
          for (const node of row.nodes.toReversed()) {
            if (node.nextSibling !== before || node.parentNode !== parent)
              parent.insertBefore(node, before)
            before = node
          }
        }
        for (const row of fresh) for (const node of row.nodes) if (drawable(node)) this.#scan(node)
      }
      const stop = effect(draw)
      this.#stops.push(() => {
        stop()
        for (const row of rows.values()) for (const node of row.nodes) node.remove()
        rows.clear()
        mark.replaceWith(template)
      })
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
      if (drawn.text && element.childNodes.length === 0) {
        const { text } = drawn
        // Taken off, the element says nothing again: put back on (a popup opened a second
        // time), the text is the part's to write still, and not taken for the page's.
        stops.push(
          effect(() => void (element.textContent = text.get() ?? "")),
          () => void (element.textContent = "")
        )
      }
      const mounted = element.hasAttribute("kui-keep-mounted") ? undefined : drawn.mounted
      const first = this.#first
      if (!mounted) return void stops.push(put(element, drawn.part, first))
      // In the page only while it is mounted: out of it otherwise, its place kept by a mark.
      const home = this.ownerDocument.createComment("")
      let unbind: (() => void) | undefined
      stops.push(
        effect(() => {
          const elsewhere = drawn.into?.get()
          // Still where the page drew it: not moved, and never yet taken out.
          const own = first && !elsewhere && !held.parked && !unbind
          if (mounted.get() && (!drawn.into || elsewhere)) {
            if (elsewhere) {
              // Its place where it was written is kept by the mark all the while.
              if (!held.parked && element.parentNode) element.replaceWith(home)
              held.parked = true
              if (element.parentNode !== elsewhere) elsewhere.append(element)
            } else if (held.parked) {
              held.parked = false
              home.replaceWith(element)
            }
            unbind ??= put(element, drawn.part, own)
          } else {
            unbind?.()
            unbind = undefined
            if (!held.parked && element.parentNode) {
              held.parked = true
              element.replaceWith(home)
            } else if (drawn.into) element.remove()
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
  for (const name of [...names, ...(spec.properties ?? [])]) {
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
