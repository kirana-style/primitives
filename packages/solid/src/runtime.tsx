import { mergeProps, sameProps, signal } from "@kirana-ui/core"
import type { Part as CorePart, PartProps, ReadonlySignal } from "@kirana-ui/core"
import {
  Show,
  children,
  createComputed,
  createRenderEffect,
  createMemo,
  createSignal,
  getOwner,
  onCleanup,
  onMount,
  runWithOwner,
  splitProps,
  untrack,
} from "solid-js"
import type { JSX } from "solid-js"
import { Dynamic, Portal as SolidPortal, isServer } from "solid-js/web"

/** A core signal as a Solid accessor: tracked by whatever calls it. */
export function fromSignal<T>(source: ReadonlySignal<T>): () => T {
  const [read, write] = createSignal(source.peek(), { equals: false })
  if (!isServer) onCleanup(source.subscribe(() => write(() => source.peek())))
  return read
}

/** A core signal that follows Solid state: the core hears a changed prop before anything renders. */
export function toSignal<T extends Record<string, unknown>>(read: () => T): ReadonlySignal<T> {
  const source = signal(untrack(read), sameProps as (a: T, b: T) => boolean)
  createComputed(() => source.set(read()))
  return source
}

/** A component's controller, made once, following its props. */
export function controller<P extends Record<string, unknown>, C extends { mount(): () => void }>(
  create: (props: ReadonlySignal<P>) => C,
  read: () => P
): C {
  const made = create(toSignal(read))
  onMount(() => onCleanup(made.mount()))
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

export type PartComponentProps = {
  /** Renders the part as the caller's own element, which spreads the props it is given. */
  render?: (props: () => PartProps) => JSX.Element
  /** Another tag for the part's element. */
  as?: string
  children?: JSX.Element
  [attribute: string]: unknown
}

/**
 * A part's element (or the caller's, through `render`), with the caller's props merged under the
 * part's and the part's DOM work attached once the element is in the page.
 */
export function Part(props: PartComponentProps & { part: CorePart; tag: string }): JSX.Element {
  const [local, caller] = splitProps(props, ["part", "tag", "as", "render", "children"])
  const own = fromSignal(untrack(() => local.part).props)
  // Solid hands over an element before it is in the page: the part's DOM work (focus, measures,
  // the starting style) waits for the mount that follows. It belongs to this component, not to
  // the effect that spreads the props (which hands the ref over again, and is torn down, each time
  // they change): attached once per element, detached when the component goes.
  const owner = getOwner()
  let attached: HTMLElement | undefined
  const attach = (element: HTMLElement) => {
    if (element === attached) return
    attached = element
    const part = untrack(() => local.part)
    runWithOwner(owner, () => onMount(() => onCleanup(part.attach(element))))
  }
  const merged = createMemo(() => {
    const theirs: PartProps = {}
    for (const key of Object.keys(caller)) theirs[key] = caller[key]
    return { ...mergeProps(theirs, toSolid(own())), ref: attach }
  })
  return (
    <Show
      when={local.render}
      fallback={
        <Dynamic component={local.as ?? local.tag} {...merged()}>
          {local.children}
        </Dynamic>
      }
    >
      {(render) => render()(merged)}
    </Show>
  )
}

/**
 * Its children as children of `target`, an element drawn elsewhere: with no element of its own
 * around them (Solid's `Portal` adds one), so the page is the same as on the other adapters.
 */
export function Into(props: { target: HTMLElement; children?: JSX.Element }): JSX.Element {
  const resolved = children(() => props.children)
  // Before any mount work of the children: their elements are in the page by then.
  createRenderEffect(() => {
    const target = props.target
    const nodes = resolved.toArray().filter((each): each is Node => each instanceof Node)
    for (const node of nodes) target.appendChild(node)
    onCleanup(() => {
      for (const node of nodes) if (node.parentNode === target) target.removeChild(node)
    })
  })
  return null
}

/** Its children in a container at the end of the page, while `mounted`. */
export function Portal(props: { mounted: ReadonlySignal<boolean>; children?: JSX.Element }) {
  const shown = fromSignal(untrack(() => props.mounted))
  return (
    <Show when={shown()}>
      <SolidPortal ref={(container) => container.setAttribute("data-kirana-portal", "")}>
        {props.children}
      </SolidPortal>
    </Show>
  )
}
