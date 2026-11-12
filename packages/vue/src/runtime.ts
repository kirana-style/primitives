import { mergeProps, sameProps, signal } from "@kirana-ui/core"
import type { Part, PartProps, ReadonlySignal } from "@kirana-ui/core"
import {
  Comment,
  Fragment,
  Teleport,
  cloneVNode,
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  onScopeDispose,
  provide,
  queuePostFlushCb,
  shallowRef,
  watchEffect,
} from "vue"
import type { Component, InjectionKey, ShallowRef, VNode } from "vue"

/** A core signal as a Vue ref, read-only: tracked by whatever reads `.value`. */
export function fromSignal<T>(source: ReadonlySignal<T>): Readonly<ShallowRef<T>> {
  const ref = shallowRef(source.peek())
  // On a server nothing changes after the first read, and no scope is disposed to unsubscribe.
  if (typeof window !== "undefined") {
    onScopeDispose(
      source.subscribe(() => {
        ref.value = source.peek()
      })
    )
  }
  return ref
}

/** A core signal that follows Vue state: the core hears a changed prop as it changes. */
export function toSignal<T extends Record<string, unknown>>(read: () => T): ReadonlySignal<T> {
  const source = signal(read(), sameProps as (a: T, b: T) => boolean)
  watchEffect(() => source.set(read()), { flush: "sync" })
  return source
}

/** A component's controller, made once, following its props. */
export function controller<P extends Record<string, unknown>, C extends { mount(): () => void }>(
  create: (props: ReadonlySignal<P>) => C,
  read: () => P
): C {
  const made = create(toSignal(read))
  let stop: (() => void) | undefined
  onMounted(() => {
    stop = made.mount()
  })
  onBeforeUnmount(() => stop?.())
  return made
}

/** A controller its parts find: `provide` in the root, `use` in a part. */
export function context<C>(name: string): { provide(controller: C): C; use(): C } {
  const key: InjectionKey<C> = Symbol(name)
  return {
    provide(made) {
      provide(key, made)
      return made
    },
    use() {
      const made = inject(key, undefined)
      if (!made) throw new Error(`A ${name} part must be inside <${name}.Root>`)
      return made
    },
  }
}

function toVue(props: PartProps): PartProps {
  const out: PartProps = {}
  for (const key in props) {
    const value = props[key]
    if (typeof value === "function") {
      // Vue names an event from the listener's key, so `onKeyDown` would listen for `key-down`:
      // it is `onKeydown`. Focus and blur are the bubbling ones, as in the core.
      const name = key.slice(2).toLowerCase()
      const event = name === "focus" ? "focusin" : name === "blur" ? "focusout" : name
      out[`on${event[0]!.toUpperCase()}${event.slice(1)}`] = value
    } else {
      out[key] = value
    }
  }
  return out
}

function firstElement(nodes: VNode[] | undefined): VNode | undefined {
  for (const node of nodes ?? []) {
    if (node.type === Comment) continue
    if (node.type === Fragment) return firstElement(node.children as VNode[])
    return node
  }
  return undefined
}

/**
 * A part as a component: its element (`as`, the part's own tag by default), or with `as-child`
 * the caller's own element in its slot, which takes the part's props. Either way the caller's
 * attributes are merged under the part's, and the part's DOM work is attached to the element.
 */
export function partComponent(name: string, tag: string, resolve: () => Part): Component {
  return defineComponent({
    name,
    inheritAttrs: false,
    props: { as: { type: String, default: tag }, asChild: Boolean },
    setup(props, { attrs, slots }) {
      const part = resolve()
      const own = fromSignal(part.props)
      let element: HTMLElement | null = null
      let detach: (() => void) | undefined

      // Vue calls a function ref as soon as the element exists, before the tree it is in reaches
      // the page: the part's DOM work (focus, measures, the starting style) waits for the flush
      // that follows the render, when it is there. An element that leaves detaches at once.
      let wanted: HTMLElement | null = null
      const sync = () => {
        if (wanted === element) return
        detach?.()
        element = wanted
        detach = wanted ? part.attach(wanted) : undefined
      }
      const attach = (target: unknown) => {
        wanted =
          target instanceof HTMLElement
            ? target
            : (((target as { $el?: unknown } | null)?.$el as HTMLElement | undefined) ?? null)
        if (wanted) queuePostFlushCb(sync)
        else sync()
      }

      return () => {
        const merged = { ...mergeProps(attrs, toVue(own.value)), ref: attach }
        if (props.asChild) {
          const child = firstElement(slots.default?.())
          return child ? cloneVNode(child, merged, true) : null
        }
        return h(props.as, merged, slots.default?.())
      }
    },
  })
}

/** Its slot in a container at the end of the page, while `mounted`. */
export function portalComponent(name: string, mounted: () => ReadonlySignal<boolean>): Component {
  return defineComponent({
    name,
    setup(_props, { slots }) {
      const shown = fromSignal(mounted())
      // Only in a browser, once the page is in it: a server draws no portal, so hydration must
      // find none either. One that opens later is drawn at once.
      const ready = shallowRef(false)
      onMounted(() => {
        ready.value = true
      })
      return () =>
        shown.value && ready.value
          ? h(Teleport, { to: "body" }, h("div", { "data-kirana-portal": "" }, slots.default?.()))
          : null
    },
  })
}

/** A prop that is "not given" when absent, where Vue would make a boolean `false`. */
export const optional = <T>(type: T) => ({ type, default: undefined })
