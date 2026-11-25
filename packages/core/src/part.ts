import type { ReadonlySignal } from "./reactivity.ts"

/**
 * What a part puts on its element, in one neutral shape every adapter maps to its framework:
 * attributes by their HTML names (`tabindex`, `aria-expanded`, `data-open`), where `undefined`
 * leaves the attribute out and a boolean state is `""` or absent, never `"false"`; handlers by
 * camel-cased event names (`onClick`, `onKeyDown`); and, for the few parts whose value is a
 * length (a progress bar's indicator), a `style` of that geometry, which a server can render.
 * Geometry that is measured is not here: the service that measures it writes it on the element.
 */
export type PartProps = Record<string, unknown>

/**
 * One part of a component as the core gives it: the props for its element, and the DOM work
 * that starts once the element is in the page.
 */
export interface Part {
  /** The part's props, the same object until one of them changes. */
  readonly props: ReadonlySignal<PartProps>
  /** DOM work for the part's element (focus, measures, layers). Returns the cleanup. */
  attach(element: HTMLElement): () => void
}

/** A boolean state as an attribute: present and empty, or absent. */
export function flag(on: unknown): "" | undefined {
  return on ? "" : undefined
}

/**
 * What a change callback is given beside the value: why it changed, what made it, and a way
 * to refuse it.
 */
export interface ChangeDetails {
  /** Why the value changed: `"trigger-press"`, `"outside-press"`, `"escape-key"`, `"item-press"` … */
  readonly reason: string
  /** The DOM event behind it, when there is one. */
  readonly event: Event | undefined
  /**
   * What made it: a mouse, a finger, a pen, the keyboard, something that presses without a
   * pointer (a screen reader, `element.click()`), code with no event at all, or an agent
   * acting through the bridge (`@kirana-ui/core/agent`).
   */
  readonly source: ChangeSource
  /** Keeps the value as it was. */
  cancel(): void
  readonly canceled: boolean
}

/**
 * What made a change: a kind of pointer, the keyboard, a press with no pointer (`virtual`),
 * code with no event (`programmatic`), or an agent acting through the bridge.
 */
export type ChangeSource =
  | "mouse"
  | "touch"
  | "pen"
  | "keyboard"
  | "virtual"
  | "programmatic"
  | "agent"

// How many agent actions are under way: a change made while one is, is the agent's.
let acting = 0

/**
 * Runs what an agent asked for. Every change a component makes while it runs says
 * `source: "agent"`, so a caller's callback can tell it from a person's, and refuse it.
 */
export function asAgent<Result>(run: () => Result): Result {
  acting++
  try {
    return run()
  } finally {
    acting--
  }
}

/** What made an event, read from the event: nothing is remembered between events. */
export function sourceOf(event: Event | undefined): ChangeSource {
  if (!event) return "programmatic"
  const type = (event as PointerEvent).pointerType
  if (type === "mouse" || type === "touch" || type === "pen") return type
  if (event.type.startsWith("key")) return "keyboard"
  // A click no pointer made: Enter or Space on a button, a screen reader's press, code.
  if (event.type === "click" && (event as MouseEvent).detail === 0) return "virtual"
  if (event.type.startsWith("mouse") || event.type === "click" || event.type === "contextmenu")
    return "mouse"
  if (event.type.startsWith("touch")) return "touch"
  return "virtual"
}

// The last change a part was making: why, what made it, and when. The agent bridge reads it
// to say who changed a control it sees change; nothing else does.
let last: { reason: string; source: ChangeSource; at: number } | undefined

/** The last change a part of this library began: why, what made it, and when it did. */
export const lastChange = (): typeof last => last

export function details(reason: string, event?: Event): ChangeDetails {
  let canceled = false
  // Known when the change is made: it may be read long after the agent's turn is over.
  const agent = acting > 0
  last = { reason, source: agent ? "agent" : sourceOf(event), at: performance.now() }
  return {
    reason,
    event,
    get source() {
      return agent ? "agent" : sourceOf(event)
    },
    cancel() {
      canceled = true
    },
    get canceled() {
      return canceled
    },
  }
}

/** A caller's handler calls this on the event to stop the part's own handler for it. */
export const PREVENT = "preventKiranaHandler"

/** An event as a handler given to a part hears it. */
export type PartEvent<Heard = Event> = Heard & {
  /** Keeps the part's own handler out of this event. */
  preventKiranaHandler(): void
}

const prevented = new WeakSet<object>()

/** Gives an event its `preventKiranaHandler()`, before a caller's handler sees it. */
export function preventable(event: Event): void {
  ;(event as Event & { [PREVENT]?: () => void })[PREVENT] ??= () => prevented.add(event)
}

/** Whether a caller's handler asked the part's own to stay out of this event. */
export function isPrevented(event: Event): boolean {
  return prevented.has(event)
}

type Handler = (...given: unknown[]) => void

/** Whether a handler was given an event (the browser's, or a framework's own around it). */
const isEvent = (given: unknown): given is Event =>
  typeof given === "object" &&
  given !== null &&
  typeof (given as { preventDefault?: unknown }).preventDefault === "function"

/** Two handlers as one: the lower layer's first; the upper's too, unless it may be stopped and was. */
function chain(first: Handler, second: Handler, stoppable: boolean): Handler {
  return (...given) => {
    // A component's own callback (a value, not an event) passes through as it is.
    const event = given[0]
    if (isEvent(event)) preventable(event)
    first(...given)
    if (!stoppable || !prevented.has(event as object)) second(...given)
  }
}

/** A caller's handler for an event the part does not hear: the event still has its method. */
function alone(handler: Handler): Handler {
  return (...given) => {
    if (isEvent(given[0])) preventable(given[0])
    handler(...given)
  }
}

/** Two classes as one, in whichever form the caller's framework writes them. */
function joinClass(under: unknown, over: unknown): unknown {
  if (typeof under !== "string" || typeof over !== "string") return [under, over]
  return under && over ? `${under} ${over}` : under || over
}

function layer(under: PartProps | undefined, over: PartProps, stoppable: boolean): PartProps {
  // An attribute nobody has a value for is left out, not handed on as `undefined`: the element
  // or component it reaches then keeps its own, whichever order it spreads them in (a Vue
  // component's attributes fall through over its root's own; a spread after an attribute in
  // JSX or Svelte replaces it with whatever the props hold).
  const merged: PartProps = {}
  for (const key in under) if (under[key] !== undefined) merged[key] = under[key]
  for (const key in over) {
    const top = over[key]
    const below = merged[key]
    // Nothing to say: what is under it stays.
    if (top === undefined) continue
    if (below === undefined) {
      merged[key] = top
    } else if (
      // By value, not by name: an adapter merges after renaming handlers to its framework's.
      key.startsWith("on") &&
      typeof top === "function" &&
      typeof below === "function"
    ) {
      merged[key] = chain(below as Handler, top as Handler, stoppable)
    } else if (key === "style") {
      merged[key] = mergeStyle(below, top)
    } else if (key === "class" || key === "className") {
      merged[key] = joinClass(below, top)
    } else {
      merged[key] = top
    }
  }
  return merged
}

/** Whether an element of this tag takes a button's `type`: a `<button>` or an `<input>`. */
export function takesType(tag: string): boolean {
  const name = tag.toLowerCase()
  return name === "button" || name === "input"
}

/**
 * Whether an element is a link that navigates: an `<a>` or an `<area>` with an `href`. A part
 * that makes another element act as a button leaves such a link a link: the browser gives it
 * its role, its place in the tab order and its Enter.
 */
export function isLink(tag: string, href: unknown): boolean {
  return (tag === "a" || tag === "area") && href !== undefined && href !== null && href !== false
}

const OWN_ID = Symbol("an id the caller's own wins over")

/**
 * A part's `id` that is only a default, as props to spread: an `id` the caller gives the element
 * wins over it (`forElement`). A control inside a field is so named by the field until its
 * caller names it, and the field then learns the name from the element.
 */
export function defaultId(id: string | undefined): PartProps {
  return id === undefined ? {} : { id, [OWN_ID]: true }
}

/**
 * A part's own props as they go on an element, before `mergeProps` lays them over the
 * caller's. An `id` given with `defaultId` gives way to the caller's. A part's `type` is a default, not its identity: a `<button>` it draws says
 * `type="button"` so that it never submits a form by accident, but a caller's `type`
 * (`"submit"`, `"reset"`) wins, and an element that takes no button type (a link, where `type`
 * is a MIME type) is given none. A link that navigates (`isLink`, the caller's `href`) is not
 * given a button's role, nor the tab stop that comes with it: it is a link already. `tag` is
 * the element's tag name, or `undefined` when the adapter cannot know it before the element is
 * drawn (a `render` function, a component): the part's props are then kept, `untype` takes the
 * `type` off once the element is known, and a part that draws a role answers the element it
 * is attached to (a button's `attach`).
 */
export function forElement(
  own: PartProps,
  caller: PartProps | undefined,
  tag: string | undefined
): PartProps {
  let placed = own
  if ((own as Record<symbol, unknown>)[OWN_ID]) {
    const fitted: Record<string | symbol, unknown> = { ...own }
    delete fitted[OWN_ID]
    if (typeof caller?.id === "string" && caller.id) delete fitted.id
    placed = fitted as PartProps
  }
  if (
    own.type !== undefined &&
    (caller?.type !== undefined || (tag !== undefined && !takesType(tag)))
  ) {
    const { type: _type, ...rest } = placed
    placed = rest
  }
  if (own.role === "button" && tag !== undefined && isLink(tag, caller?.href)) {
    const { role: _role, tabindex, ...rest } = placed
    placed = tabindex === "0" || tabindex === undefined ? rest : { ...rest, tabindex }
  }
  return placed
}

/**
 * Takes a part's `type="button"` off an element that takes no button type, for an element its
 * adapter could not name before it was drawn (`forElement` with no tag). Each adapter's runtime
 * calls it once the element is known; on a `<button>` it does nothing.
 */
export function untype(element: Element): void {
  if (!takesType(element.localName) && element.getAttribute("type") === "button")
    element.removeAttribute("type")
}

/**
 * Merges a caller's props with a part's, the one rule every adapter uses: the part's attributes
 * win (its identity survives composition; its `type` is not identity, and `forElement` takes it
 * out of the part's props first where the caller gave one) and an `undefined` of the part's
 * leaves the caller's
 * (an attribute neither gives a value is left out of the result, never handed on as `undefined`);
 * classes join (`class` with `class`, `className` with `className`); a style is merged property
 * by property, the part's winning one; and for an event the caller's handler runs first and
 * the part's follows unless the caller called `event.preventKiranaHandler()`.
 */
export function mergeProps(caller: PartProps | undefined, part: PartProps): PartProps {
  const merged = layer(caller, part, true)
  // `event.preventKiranaHandler()` is there to call whether or not the part hears the event:
  // a caller cannot know which events a part has a handler of its own for.
  for (const key in caller) {
    const theirs = caller[key]
    if (key.startsWith("on") && typeof theirs === "function" && merged[key] === theirs) {
      merged[key] = alone(theirs as Handler)
    }
  }
  return merged
}

/**
 * Lays one set of a caller's props over another, under a part's: the props handed to a part,
 * then those of the element the caller asked the part to be drawn as. The upper wins an
 * attribute it gives, classes join, styles are merged property by property, and both handlers
 * of an event run, the lower's first: `event.preventKiranaHandler()` in either stops only the
 * part's own, which `mergeProps` lays over the result.
 */
export function composeProps(under: PartProps | undefined, over: PartProps): PartProps {
  return layer(under, over, false)
}

/** A part's state as its caller reads it: `true` for a flag, its value for a state that has one. */
export type PartState = Record<string, string | true>

/**
 * A part's state, read from the `data-*` attributes of its props: `data-open=""` is
 * `open: true`, `data-side="bottom"` is `side: "bottom"`, `data-starting-style` is
 * `startingStyle`, and an attribute that is absent is absent.
 */
export function stateOf(props: PartProps): PartState {
  const state: PartState = {}
  for (const key in props) {
    if (!key.startsWith("data-")) continue
    const value = props[key]
    if (value === undefined || value === null || value === false) continue
    const name = key
      .slice(5)
      .replace(/-([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase())
    state[name] = value === "" || value === true ? true : String(value)
  }
  return state
}

/**
 * A state as `data-*` attributes, the other way round: `true` is present and empty, `false`,
 * `null` and `undefined` are absent, anything else is its text, and `startingStyle` is
 * `data-starting-style`.
 */
export function stateAttributes(state: Record<string, unknown>): PartProps {
  const props: PartProps = {}
  for (const name in state) {
    const value = state[name]
    if (value === undefined || value === null || value === false) continue
    const key = `data-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
    props[key] = value === true ? "" : String(value)
  }
  return props
}

/** A part's `style`: property names as CSS writes them (`width`, `--thumb-offset`). */
export type PartStyle = Record<string, string>

/** A style as the text of a `style` attribute. */
export function styleText(style: PartStyle): string {
  return Object.entries(style)
    .map(([name, value]) => `${name}: ${value}`)
    .join("; ")
}

const plain = (value: unknown): value is PartStyle =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/** The caller's style with the part's over it, in whichever form the caller's framework writes. */
function mergeStyle(theirs: unknown, own: unknown): unknown {
  if (plain(theirs) && plain(own)) return { ...theirs, ...own }
  if (typeof theirs === "string") {
    const text = plain(own) ? styleText(own) : String(own)
    return `${theirs.trim().replace(/;$/, "")}; ${text}`
  }
  // A list is how Vue takes several: it reads them in order.
  return [theirs, own]
}

/** A state of a part in the vocabulary: the attribute that marks it, and what it means. */
export interface StateDefinition {
  attribute: string
  /** The values the attribute takes; absent for a state the attribute marks by being present. */
  values?: readonly string[]
  description: string
}

/**
 * The state of a part, from its definition in the vocabulary: a state its attribute marks by
 * being present is `true` or absent, one with values is one of them or absent. It is what
 * `stateOf` reads from the part's props.
 */
export type StateOf<Definition extends PartDefinition> = Definition extends {
  states: infer States
}
  ? {
      readonly [Name in keyof States]?:
        | (States[Name] extends { values: readonly (infer Value)[] } ? Value : true)
        | undefined
    }
  : Record<never, never>

/** A part of a component in the vocabulary: its states, its CSS variables, and where it goes. */
export interface PartDefinition {
  description: string
  states?: Record<string, StateDefinition>
  /** Groups of states that never hold together on the element. */
  exclusive?: readonly (readonly string[])[]
  /** CSS custom properties the part's element carries, each with what it holds. */
  variables?: Record<string, string>
  /**
   * Where it goes: the part of the same component it is written inside. Several when it may be
   * in more than one (a submenu's portal is in the submenu, a menu's in the menu); the first is
   * where an anatomy draws it. The outermost part, which a component has one of, names none.
   */
  inside?: string | readonly string[]
  /** A wrapper that may be left out: what it holds is then written where it would have been. */
  optional?: boolean
  /** Written once for each entry (an item, a tab, a toast), or any number of times. */
  repeated?: boolean
}

/** A component in the vocabulary: its parts by name. */
export type ComponentDefinition = Record<string, PartDefinition>

export function defineComponent<const T extends ComponentDefinition>(definition: T): T {
  return definition
}

/**
 * Whether two props objects say the same. Functions are equal to functions: a callback is read
 * when it is called, so a new one each render changes nothing.
 */
export function sameProps(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  for (const key in a) {
    if (typeof a[key] === "function" && typeof b[key] === "function") continue
    if (!Object.is(a[key], b[key])) return false
  }
  for (const key in b) if (!(key in a)) return false
  return true
}

/** An options object without its `undefined` entries, so a default is not overwritten by one. */
export function defined<T extends object>(options: T): Partial<T> {
  const out: Partial<T> = {}
  for (const key in options) if (options[key] !== undefined) out[key] = options[key]
  return out
}

/** A controller's maker with what is around the component (the field it is in) already given. */
export function within<P, A, C>(
  create: (props: ReadonlySignal<P>, around: A) => C,
  around: A
): (props: ReadonlySignal<P>) => C {
  return (props) => create(props, around)
}
