import {
  composeProps,
  computed,
  defined,
  mergeProps,
  sameProps,
  signal,
  stateOf,
} from "@kirana-ui/core"
import type {
  Anchor,
  Part,
  PartEvent,
  PartProps,
  PartState,
  PositionOptions,
  ReadonlySignal,
  Signal,
} from "@kirana-ui/core"
import {
  cloneElement,
  createContext,
  createElement,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import type {
  ClassAttributes,
  ComponentPropsWithoutRef,
  HTMLAttributes,
  JSX,
  ReactElement,
  ReactNode,
  Ref,
  RefCallback,
  RefObject,
  SyntheticEvent,
} from "react"
import { createPortal } from "react-dom"

import { REF_IS_A_PROP, give, refOf } from "./element.ts"

/** A layout effect in the browser, an effect (which never runs) on a server. */
export const useIsomorphicLayoutEffect =
  typeof document === "undefined" ? useEffect : useLayoutEffect

/** A core signal's value, re-rendering when it changes. */
export function useSignal<T>(source: ReadonlySignal<T>): T {
  const subscribe = useCallback((listener: () => void) => source.subscribe(listener), [source])
  const read = useCallback(() => source.peek(), [source])
  return useSyncExternalStore(subscribe, read, read)
}

/**
 * A component's controller, made once, following the props of each render. The props reach the
 * core after the render commits (a layout effect), never during it: another part that reads the
 * controller is another component, and React forbids updating it mid-render.
 */
export function useController<P extends object, C extends { mount(): () => void }>(
  create: (props: ReadonlySignal<P>) => C,
  props: Omit<P, "id"> & { id?: string | undefined }
): C {
  const generated = useId()
  const next = { ...props, id: props.id ?? generated } as P
  const latest = useRef(next)
  latest.current = next
  const [state] = useState(() => {
    // The callbacks the core holds always call the latest render's.
    const stable = {} as Record<string, unknown>
    for (const key in next) {
      stable[key] =
        typeof next[key] === "function"
          ? (...args: unknown[]) =>
              (latest.current[key] as ((...args: unknown[]) => unknown) | undefined)?.(...args)
          : next[key]
    }
    const source: Signal<P> = signal(stable as P, sameProps as (a: P, b: P) => boolean)
    return { source, controller: create(source) }
  })
  useIsomorphicLayoutEffect(() => {
    const stable = { ...state.source.peek() } as Record<string, unknown>
    for (const key in next) {
      if (typeof next[key] !== "function") stable[key] = next[key]
    }
    state.source.set(stable as P)
  })
  useMount(state.controller)
  return state.controller
}

/**
 * Starts what a controller (or an item of one) runs while it is in the page. StrictMode runs an
 * effect, undoes it and runs it again in one commit, to find effects that cannot be run twice:
 * a mount is not undone for that. The cleanup waits a moment, and a mount that comes back in
 * the meantime keeps what is running.
 */
export function useMount(mounted: { mount(): () => void }): void {
  const [state] = useState(() => ({
    of: mounted,
    unmount: undefined as (() => void) | undefined,
    leaving: false,
  }))
  useEffect(() => {
    if (state.of !== mounted) {
      state.unmount?.()
      state.unmount = undefined
      state.of = mounted
    }
    state.leaving = false
    state.unmount ??= mounted.mount()
    return () => {
      state.leaving = true
      queueMicrotask(() => {
        if (!state.leaving) return
        state.unmount?.()
        state.unmount = undefined
      })
    }
  }, [state, mounted])
}

/** A part's own options as a core signal that follows each render, after it commits. */
export function useOptions<T extends Record<string, unknown>>(options: T): ReadonlySignal<T> {
  const [source] = useState(() => signal(options, sameProps as (a: T, b: T) => boolean))
  useIsomorphicLayoutEffect(() => source.set(options))
  return source
}

// HTML's boolean attributes, which React takes as booleans: a part's `""` means "present".
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
const RENAMED: Record<string, string> = {
  tabindex: "tabIndex",
  for: "htmlFor",
  readonly: "readOnly",
  novalidate: "noValidate",
  autocomplete: "autoComplete",
  inputmode: "inputMode",
  maxlength: "maxLength",
  contenteditable: "contentEditable",
  spellcheck: "spellCheck",
  autocapitalize: "autoCapitalize",
  enterkeyhint: "enterKeyHint",
}

/** A style as React takes it: `inset-inline-start` is `insetInlineStart`, `--x` stays as it is. */
function reactStyle(style: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const name in style) {
    const key = name.startsWith("--")
      ? name
      : name.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
    out[key] = style[name]!
  }
  return out
}

function toReact(props: PartProps): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key in props) {
    const value = props[key]
    if (BOOLEAN.has(key)) {
      const name = RENAMED[key] ?? key
      // Always a boolean, never left out: an input whose `checked` comes and goes is, to React,
      // one that changes from controlled to not. But a part with nothing to say leaves what a
      // caller wrote under React's own name (`readOnly`).
      if (value !== undefined || !(name in out)) {
        const present = value === "" || value === true
        // React 19 knows `inert` as a boolean, and takes `""` for false with a warning. Before,
        // it is an attribute React does not know: `true` is dropped with a warning, and `""`
        // is written.
        out[name] = key === "inert" && !REF_IS_A_PROP ? (present ? "" : undefined) : present
      }
    } else if (key === "style" && value) out.style = reactStyle(value as Record<string, string>)
    else if (value !== undefined) out[RENAMED[key] ?? key] = value
  }
  return out
}

/** The elements a part is drawn as, by their tag: `"button"`, `"div"`, `"svg"`. */
export type PartTag = keyof JSX.IntrinsicElements

/** The element a tag draws: an `HTMLButtonElement` for `"button"`. */
export type ElementOf<Tag extends PartTag> =
  JSX.IntrinsicElements[Tag] extends ClassAttributes<infer Drawn> ? Drawn : Element

export type { PartEvent }

// A handler takes the event with its `preventKiranaHandler()`; anything else is as it was.
type Hearing<Prop> = Prop extends (event: infer Heard) => infer Answer
  ? Heard extends SyntheticEvent
    ? (event: PartEvent<Heard>) => Answer
    : Prop
  : Prop

/**
 * The props a `render` function is handed, to spread on what it draws: the part's attributes,
 * its handlers and its ref, with the caller's under them. An attribute of one kind of element
 * (`href`, `type`) is among them unnamed, as `unknown`.
 */
export type RenderedProps = HTMLAttributes<HTMLElement> & {
  ref?: RefCallback<HTMLElement> | undefined
} & Record<string, unknown>

/**
 * What `render` takes: an element, drawn with the part's props merged over its own, or a
 * function given the part's props and its state.
 */
export type RenderProp<State = PartState> =
  | ReactElement<Record<string, unknown>>
  | ((props: RenderedProps, state: State) => ReactElement)

/**
 * A part's props: its element's own (`Tag`'s attributes and handlers, a `ref` to that
 * element), `render`, and the part's own props (`Own`) in place of the element's of the same
 * name. `State` is what a `render` function is told of the part.
 */
export type PartComponentProps<Tag extends PartTag = "div", State = PartState, Own = unknown> = {
  [Name in keyof ComponentPropsWithoutRef<Tag> as Name extends keyof Own ? never : Name]: Hearing<
    ComponentPropsWithoutRef<Tag>[Name]
  >
} & Own & {
    /**
     * Renders the part as another element or component. An element's own props lie over the
     * props handed to the part, and the part's own (its role, its state, its handlers) over
     * both; a function is given the part's props and its state (`open`, `side` …, read from
     * its `data-*` attributes).
     */
    render?: RenderProp<State> | undefined
    ref?: Ref<ElementOf<Tag>> | undefined
  }

// A part's props as `usePart` reads them, whatever element they are typed for.
interface Handed {
  render?: RenderProp<never> | undefined
  ref?: Ref<never> | undefined
  [attribute: string]: unknown
}

/** A part's DOM work on the element it is on. */
interface Attached {
  element: HTMLElement
  part: Part
  detach(): void
  leaving: boolean
}

/**
 * Renders a part: its element (or the caller's `render`), and the part's DOM work attached to
 * the element. Three layers of props, lowest first: what was handed to the part, the `render`
 * element's own, the part's. A higher layer wins an attribute; classes join; styles are merged
 * property by property; every handler of an event runs, lowest first, and
 * `event.preventKiranaHandler()` in a caller's stops the part's. The `render` element's own
 * children are drawn when it has any, and both its ref and the part's `ref` get the element.
 * `hold` is for a part that keeps something of its own in its element (a hidden input): it is
 * given the content and returns what the element holds, whoever drew the element.
 */
export function usePart<Tag extends PartTag, State = PartState>(
  part: Part,
  tag: Tag,
  props: PartComponentProps<Tag, State>,
  state?: State,
  hold?: (content: ReactNode) => ReactNode
): ReactElement {
  const { render: asRender, ref: asRef, ...caller } = props as Handed
  const render = asRender as RenderProp<State> | undefined
  const ref = asRef as Ref<HTMLElement> | undefined
  const own = useSignal(part.props)
  const asked = isValidElement(render) ? render : undefined
  const theirs = asked ? refOf(asked) : undefined
  const held = useRef<Attached | undefined>(undefined)
  const attach = useCallback(
    (element: HTMLElement | null) => {
      const now = held.current
      if (!element) {
        // React takes a ref away and hands it straight back when the caller's `ref` is a new
        // function, and in StrictMode when the element is first drawn. The part's DOM work is
        // not undone for that (a popup would close its layer and give focus back): it is
        // undone a moment later, if the element has not come back.
        if (now) {
          now.leaving = true
          queueMicrotask(() => {
            if (!now.leaving) return
            now.detach()
            if (held.current === now) held.current = undefined
          })
        }
      } else if (now && now.element === element && now.part === part) {
        now.leaving = false
      } else {
        if (now) {
          now.leaving = false
          now.detach()
        }
        held.current = { element, part, detach: part.attach(element), leaving: false }
      }
      give(ref, element)
      give(theirs, element)
    },
    [part, ref, theirs]
  )
  let under: PartProps = caller
  if (asked) {
    // React 19 keeps an element's ref among its props: it is given the element above. Before,
    // the props have none, and reading it there warns.
    const { ref: _ref, ...element } = REF_IS_A_PROP ? asked.props : { ...asked.props }
    under = composeProps(caller, element)
  }
  const drawn: Record<string, unknown> = { ...toReact(mergeProps(under, own)), ref: attach }
  if (hold) drawn.children = hold(drawn.children as ReactNode)
  if (asked) return cloneElement(asked, drawn)
  if (typeof render === "function") return render(drawn, state ?? (stateOf(own) as State))
  return createElement(tag, drawn)
}

const forwarded = new WeakMap<object, unknown>()

/**
 * A component that is handed its caller's `ref` on every React the package takes, under the
 * name DevTools shows it by. React 19 gives a component its `ref` among its props, which is
 * where a part reads it; before, only a `forwardRef` component was given one, so there the
 * component is drawn by one that puts the ref back among the props. Its type is its own
 * either way, so one that is generic stays generic. One that already has a name keeps it.
 */
export function component<Drawn extends (props: never) => ReactNode>(
  name: string,
  draw: Drawn
): Drawn {
  const named = draw as Drawn & { displayName?: string }
  if (REF_IS_A_PROP) {
    named.displayName ??= name
    return draw
  }
  let made = forwarded.get(draw)
  if (!made) {
    const drawing = draw as unknown as (props: object) => ReactElement | null
    const forwards = forwardRef<unknown, object>((props, ref) =>
      drawing(ref === null ? props : { ...props, ref })
    )
    forwards.displayName = name
    forwarded.set(draw, (made = forwards))
  }
  return made as Drawn
}

/**
 * A component's parts, each one a `component` named `Name.Part`. A part that is another
 * component's (a date picker's trigger is a popover's) is the same component there and here.
 */
export function parts<const Parts extends Record<string, unknown>>(
  name: string,
  all: Parts
): Parts {
  const made: Record<string, unknown> = {}
  for (const key in all) {
    const part: unknown = all[key]
    made[key] =
      typeof part === "function"
        ? component(`${name}.${key}`, part as (props: never) => ReactNode)
        : part
  }
  return made as Parts
}

/**
 * A part's element as a component of its own, for a part that is not always in the page: the
 * part decides, and draws this when it is. It takes the part's props, with the part it is the
 * element `of`, its tag, and what the element holds of the part's own (`hold`, as `usePart`'s).
 */
export const PartElement = /* @__PURE__ */ component(
  "PartElement",
  function PartElement<Tag extends PartTag, State = PartState>({
    of,
    tag,
    hold,
    ...props
  }: PartComponentProps<Tag, State> & {
    of: Part
    tag: Tag
    hold?: ((content: ReactNode) => ReactNode) | undefined
  }): ReactElement {
    return usePart(of, tag, props as unknown as PartComponentProps<Tag, State>, undefined, hold)
  }
)

/** A positioner's own props: where its popup goes, and what it is placed against. */
export type PositionerOptions = Partial<Omit<PositionOptions, "anchor">> & {
  /**
   * What the popup is placed against, when that is not its trigger: an element, a ref to one,
   * a place in the viewport (an object with `getBoundingClientRect`), or a function that gives
   * one. It may change while the popup is open: the popup follows.
   */
  anchor?: Anchor | RefObject<Element | null> | (() => Anchor | null | undefined) | null | undefined
}

/** A positioner's props: where its popup goes and what it is placed against, and its element's. */
export type PositionerProps<State = PartState> = PartComponentProps<"div", State, PositionerOptions>

// A ref's reader, the same function for the same ref: a render that changes nothing asks for
// no new placement.
const readers = new WeakMap<object, () => Element | null>()

function anchorOf(anchor: PositionerOptions["anchor"]): PositionOptions["anchor"] {
  if (!anchor || typeof anchor === "function") return anchor
  if (!("current" in anchor) || "getBoundingClientRect" in anchor) return anchor as Anchor
  let read = readers.get(anchor)
  if (!read) readers.set(anchor, (read = () => anchor.current))
  return read
}

/**
 * A positioner's own props, written where its placement reads them: the one place they are
 * named. Gives back what is left, for the part's element.
 */
export function usePositioning<Props extends PositionerOptions>(
  positioning: Signal<Partial<PositionOptions>>,
  { side, align, sideOffset, alignOffset, collisionPadding, anchor, ...rest }: Props
): Omit<Props, keyof PositionerOptions> {
  // Written while rendering, so the first placement (made when the element attaches, before
  // this component's effects) reads them. Nothing re-renders for it: the core compares.
  positioning.set(
    defined({ side, align, sideOffset, alignOffset, collisionPadding, anchor: anchorOf(anchor) })
  )
  return rest
}

/**
 * A text input whose text is the core's own (a combobox's, a number field's): its `value` is
 * given to React as the input's default. To React a `value` with no `onChange` is an input
 * that cannot be typed in; the core writes the text itself, as it changes.
 */
export function useOwnText(part: Part): Part {
  return useMemo(
    () => ({
      props: computed(() => {
        const { value, ...rest } = part.props.get()
        return { ...rest, defaultValue: value }
      }),
      attach: (element) => part.attach(element),
    }),
    [part]
  )
}

const PortalContainer = createContext<HTMLElement | null | undefined>(undefined)

/** What `PortalProvider` takes. */
export interface PortalProviderProps {
  /** Where the popups inside are drawn; the end of `<body>` while it is not given. */
  container?: HTMLElement | null | undefined
  children?: ReactNode
}

/**
 * Says where every popup inside it is drawn, the popups those open included: an element of
 * the page (a shadow root's host, a full-screen element, a frame) in place of `<body>`.
 */
export function PortalProvider({ container, children }: PortalProviderProps): ReactElement {
  return <PortalContainer.Provider value={container}>{children}</PortalContainer.Provider>
}

/** Draws no element of its own: its children at the end of `<body>`, or where a `PortalProvider` says. */
export interface PortalProps {
  children?: ReactNode
}

/** Its children in a container at the end of the page, once the page has hydrated. */
export function Portal({ children }: PortalProps): ReactElement | null {
  const container = useContext(PortalContainer)
  const [ready, setReady] = useState(false)
  useIsomorphicLayoutEffect(() => setReady(true), [])
  if (!ready) return null
  return createPortal(<div data-kirana-portal="">{children}</div>, container ?? document.body)
}
