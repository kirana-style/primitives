import { mergeProps, sameProps, signal } from "@kirana-ui/core"
import type { Part, PartProps, ReadonlySignal, Signal } from "@kirana-ui/core"
import {
  cloneElement,
  createElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import type { ReactElement, ReactNode, Ref } from "react"
import { createPortal } from "react-dom"

const useIsomorphicLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect

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
  useEffect(() => state.controller.mount(), [state.controller])
  return state.controller
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
    // Always a boolean, never left out: an input whose `checked` comes and goes is, to React,
    // one that changes from controlled to not.
    if (BOOLEAN.has(key)) out[RENAMED[key] ?? key] = value === "" || value === true
    else if (key === "style" && value) out.style = reactStyle(value as Record<string, string>)
    else if (value !== undefined) out[RENAMED[key] ?? key] = value
  }
  return out
}

export type RenderProp<State = undefined> =
  | ReactElement<Record<string, unknown>>
  | ((props: Record<string, unknown>, state: State) => ReactElement)

export interface PartComponentProps<State = undefined> {
  /** Renders the part as another element or component. The part's attributes still win. */
  render?: RenderProp<State> | undefined
  children?: ReactNode
  ref?: Ref<HTMLElement> | undefined
  [attribute: string]: unknown
}

/**
 * Renders a part: its element (or the caller's `render`), with the caller's props merged under
 * the part's, and the part's DOM work attached to the element.
 */
export function usePart<State = undefined>(
  part: Part,
  tag: string,
  { render, ref, ...caller }: PartComponentProps<State>,
  state?: State
): ReactElement {
  const own = useSignal(part.props)
  const detach = useRef<(() => void) | undefined>(undefined)
  const attach = useCallback(
    (element: HTMLElement | null) => {
      detach.current?.()
      detach.current = element ? part.attach(element) : undefined
      if (typeof ref === "function") ref(element)
      else if (ref) (ref as { current: HTMLElement | null }).current = element
    },
    [part, ref]
  )
  const props = { ...toReact(mergeProps(caller, own)), ref: attach }
  if (typeof render === "function") return render(props, state as State)
  if (isValidElement(render)) {
    return cloneElement(render, { ...toReact(mergeProps(render.props, props)), ref: attach })
  }
  return createElement(tag, props)
}

/** Its children in a container at the end of the page, once the page has hydrated. */
export function Portal({ children }: { children?: ReactNode }): ReactElement | null {
  const [ready, setReady] = useState(false)
  useIsomorphicLayoutEffect(() => setReady(true), [])
  if (!ready) return null
  return createPortal(<div data-kirana-portal="">{children}</div>, document.body)
}
