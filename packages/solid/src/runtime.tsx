import { forElement, mergeProps, sameProps, signal, stateOf, untype } from "@kirana-ui/core"
import type {
  Part as CorePart,
  PartEvent,
  PartProps,
  PartState,
  ReadonlySignal,
} from "@kirana-ui/core"
import {
  Show,
  children,
  createContext,
  createRenderEffect,
  createMemo,
  createSignal,
  getOwner,
  omit,
  onCleanup,
  onSettled,
  runWithOwner,
  untrack,
  useContext,
} from "solid-js"
import { Dynamic, Portal as SolidPortal, isServer } from "@solidjs/web"
import type { JSX } from "@solidjs/web"

/** A core signal as a Solid accessor: tracked by whatever calls it. */
export function fromSignal<T>(source: ReadonlySignal<T>): () => T {
  // The core changes inside Solid's own work too (a prop it hears, a mount): the write is this
  // bridge's, so it is allowed wherever it happens.
  // Boxed: Solid takes a function given to a signal as a computation.
  const [read, write] = createSignal({ value: source.peek() }, { equals: false, ownedWrite: true })
  if (!isServer) onCleanup(source.subscribe(() => write({ value: source.peek() })))
  return () => read().value
}

/** Hands `write` each value of `read`, before the page's own bindings run. */
export function follow<T>(read: () => T, write: (value: T) => void): void {
  createRenderEffect(read, (value) => {
    write(value)
  })
}

/** A core signal that follows Solid state: the core hears a changed prop before anything renders. */
export function toSignal<T extends Record<string, unknown>>(read: () => T): ReadonlySignal<T> {
  const source = signal(untrack(read), sameProps as (a: T, b: T) => boolean)
  follow(read, (value) => source.set(value))
  return source
}

/**
 * `keys` of a component's props, and the rest of them: both follow the props as they change,
 * and neither reads a prop before it is asked for.
 */
export function split<T extends object, K extends keyof T>(
  props: T,
  keys: readonly K[]
): [Pick<T, K>, Omit<T, K>] {
  const local = {} as Pick<T, K>
  for (const key of keys) {
    Object.defineProperty(local, key, { get: () => props[key], enumerable: true })
  }
  return [
    local,
    omit(props as Record<PropertyKey, unknown>, ...(keys as readonly PropertyKey[])) as Omit<T, K>,
  ]
}

/** A component's controller, made once, following its props. */
export function controller<P extends Record<string, unknown>, C extends { mount(): () => void }>(
  create: (props: ReadonlySignal<P>) => C,
  read: () => P
): C {
  const made = create(toSignal(read))
  onSettled(() => made.mount())
  return made
}

// HTML's boolean attributes, which Solid sets as properties: a part's `""` means "present".
const BOOLEAN = new Set([
  "hidden",
  "disabled",
  "inert",
  "required",
  "readonly",
  "multiple",
  "checked",
  "novalidate",
])

function toSolid(props: PartProps): PartProps {
  const out: PartProps = {}
  for (const key in props) {
    const value = props[key]
    // Solid's `onFocus` and `onBlur` do not bubble; the core's are the ones that do.
    if (key === "onFocus") out.onFocusIn = value
    else if (key === "onBlur") out.onFocusOut = value
    else out[key] = BOOLEAN.has(key) ? value === "" || value === true : value
  }
  return out
}

/** The elements a part can be drawn as: every tag Solid's JSX knows. */
export type PartTag = keyof JSX.IntrinsicElements

/** What every part takes besides its element's own props. */
type Composition<State> = {
  /**
   * Renders the part as the caller's own element, which spreads the props it is given: what
   * the element writes after the spread wins, so the caller decides. The props carry the
   * part's `ref` and, as `children`, what the part holds: the children it was given, then
   * anything of its own (a control's hidden input), so an element that writes no children of
   * its own holds them, and one that does draws `props().children` among them. `state` reads
   * the part's state (`open`, `side` …, from its `data-*` attributes).
   */
  render?: (props: () => PartProps, state: () => State) => JSX.Element
  /** Another tag for the part's element. */
  as?: PartTag | (string & {})
}

export type { PartEvent }

// A handler takes the event with its `preventKiranaHandler()`; anything else is as it was.
type Hearing<Prop> = Prop extends (event: infer Heard) => infer Answer
  ? Heard extends Event
    ? (event: PartEvent<Heard>) => Answer
    : Prop
  : Prop

/**
 * A part's props: its element's own (`Tag`'s attributes, its events with the element as their
 * `currentTarget` and `preventKiranaHandler()` to keep the part's own handler out, a `ref` to
 * that element), `render` and `as`, and the part's `Own` props, which come before the
 * element's of the same name. `State` is what `render` reads: the part's state as the
 * vocabulary defines it.
 */
export type PartComponentProps<Tag extends PartTag = "div", State = PartState, Own = {}> = Own & {
  [
    Name in keyof JSX.IntrinsicElements[Tag] as Name extends keyof Own | keyof Composition<State>
      ? never
      : Name
  ]: Hearing<JSX.IntrinsicElements[Tag][Name]>
} & Omit<Composition<State>, keyof Own>

/** What `<Part>` reads of the props it is given; the rest is the element's. */
type Drawn = {
  of: CorePart
  tag: string
  as?: string
  // Whatever state a part's `render` is typed to read, it is given the part's own.
  render?: (props: () => PartProps, state: () => never) => JSX.Element
  children?: JSX.Element
  [attribute: string]: unknown
}

function handOver(ref: unknown, element: HTMLElement): void {
  if (typeof ref === "function") (ref as (element: HTMLElement) => void)(element)
  else if (Array.isArray(ref)) for (const each of ref) handOver(each, element)
}

/**
 * The element of a part (`of`), or the caller's through `render`, with the caller's props merged under the
 * part's and the part's DOM work attached once the element is in the page. What the part holds
 * is its children here: with `as` they are the element's, and with `render` they are handed to
 * the caller's function as the `children` of its props, so a control drawn as another element
 * keeps the native input a form and a label reach.
 */
export function Part(props: { of: CorePart; tag: string } & Record<string, unknown>): JSX.Element {
  const [local, caller] = split(props as Drawn, ["of", "tag", "as", "render", "children"])
  const own = fromSignal(untrack(() => local.of).props)
  // Solid hands over an element before it is in the page: the part's DOM work (focus, measures,
  // the starting style) waits until the page has settled. It belongs to this component: attached
  // once per element, detached when the component goes. The wait is made here, as the component
  // is drawn, never in the ref: a server hands no element over, and a computation the client
  // alone made would shift the keys hydration finds the server's elements by.
  const owner = getOwner()
  const part = untrack(() => local.of)
  const detach: (() => void)[] = []
  let attached: HTMLElement | undefined
  let settled = false
  const begin = (element: HTMLElement) => {
    untype(element)
    detach.push(part.attach(element))
  }
  onSettled(() => {
    settled = true
    if (attached) begin(attached)
    return () => {
      for (const each of detach.splice(0)) each()
    }
  })
  const attach = (element: HTMLElement) => {
    if (element === attached) return
    attached = element
    // Another element once the page is up (`as` or `render` changed): it waits for the next
    // settling, when it is in the page.
    if (settled) runWithOwner(owner, () => onSettled(() => begin(element)))
    // The caller's own `ref`: a function, or several in an array (Solid hands a component a
    // function, whatever was written).
    handOver(
      untrack(() => caller.ref),
      element
    )
  }
  const merged = createMemo(() => {
    const theirs: PartProps = {}
    for (const key of Object.keys(caller)) theirs[key] = caller[key]
    // The element's tag, where it is known before it is drawn: `render` draws its own.
    const tag = local.render ? undefined : (local.as ?? local.tag)
    return { ...mergeProps(theirs, toSolid(forElement(own(), theirs, tag))), ref: attach }
  })
  const state = () => stateOf(own())
  return (
    <Show
      when={local.render}
      // Keyed: another function draws the part afresh.
      keyed
      fallback={
        <Dynamic component={local.as ?? local.tag} {...merged()}>
          {local.children}
        </Dynamic>
      }
    >
      {(render) => {
        // Resolved once: a change of the part's props hands the same nodes over again, and
        // the element keeps them.
        const held = children(() => local.children)
        const handed = createMemo(() => ({ ...merged(), children: held() }))
        return render(handed, state as () => never)
      }}
    </Show>
  )
}

/**
 * Its children as children of `target`, an element drawn elsewhere: with nothing of its own
 * around them (Solid's `Portal` adds marks), so the page is the same as on the other adapters.
 */
export function Into(props: { target: HTMLElement; children?: JSX.Element }): JSX.Element {
  const resolved = children(() => props.children)
  // Before any mount work of the children: their elements are in the page by then.
  createRenderEffect(
    () => [props.target, resolved.toArray()] as const,
    ([target, all]) => {
      const nodes = all.filter((each): each is Node => each instanceof Node)
      for (const node of nodes) target.appendChild(node)
      return () => {
        for (const node of nodes) if (node.parentNode === target) target.removeChild(node)
      }
    }
  )
  return null
}

const PortalContainer = createContext<(() => HTMLElement | null | undefined) | null>(null)

/** What `PortalProvider` takes. */
export interface PortalProviderProps {
  /** Where the popups inside are drawn; the end of `<body>` while it is not given. */
  container?: HTMLElement | null | undefined
  children?: JSX.Element
}

/**
 * Says where every popup inside it is drawn, the popups those open included: an element of
 * the page (a shadow root's host, a full-screen element) in place of `<body>`.
 */
export function PortalProvider(props: PortalProviderProps): JSX.Element {
  return <PortalContainer value={() => props.container}>{props.children}</PortalContainer>
}

/** Its children in a container at the end of the page, while `mounted`. */
export function Portal(props: { mounted: ReadonlySignal<boolean>; children?: JSX.Element }) {
  const shown = fromSignal(untrack(() => props.mounted))
  const container = useContext(PortalContainer)
  return (
    <Show when={shown()}>
      {/* Solid's portal draws no element of its own: the outlet is the same as on the others. */}
      <SolidPortal mount={container?.() ?? undefined}>
        <div data-kirana-portal="">{props.children}</div>
      </SolidPortal>
    </Show>
  )
}
