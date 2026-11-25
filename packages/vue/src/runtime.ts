import { sameProps, signal, stateOf, untype } from "@kirana-ui/core"
import type {
  ChangeDetails,
  Part,
  PartDefinition,
  PartEvent,
  PartProps,
  PartState,
  ReadonlySignal,
  StateOf,
} from "@kirana-ui/core"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import {
  Teleport,
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
import type {
  DefineSetupFnComponent,
  HTMLAttributes,
  InjectionKey,
  IntrinsicElementAttributes,
  ObjectEmitsOptions,
  PropType,
  PublicProps,
  ShallowRef,
  SlotsType,
  VNode,
} from "vue"

import { draw } from "./element.ts"
import type { Hold } from "./element.ts"

export { written } from "./element.ts"
// The reading direction a `DirectionProvider` around a component states, as the signal a
// controller takes (`{ direction }`); `undefined` outside one. The library's parts read the same.
export { useDirectionAround } from "./direction-context.ts"
export type { Hold } from "./element.ts"

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
  // What is not an attribute (a default id's mark) goes on to `forElement` as it is.
  for (const mark of Object.getOwnPropertySymbols(props))
    (out as Record<symbol, unknown>)[mark] = (props as Record<symbol, unknown>)[mark]
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

/**
 * The state of each part of a component, by their names in the vocabulary: what a part's
 * `data-*` attributes say, and what its default slot is given as `state`.
 */
export type StatesOf<Name extends keyof Vocabulary> = {
  [Each in keyof Vocabulary[Name]]: Vocabulary[Name][Each] extends infer Definition extends
    PartDefinition
    ? StateOf<Definition>
    : never
}

/** What every part takes besides its own props and its element's attributes. */
export interface PartComponentProps {
  /** Another tag for the part's element (`as="a"`): its attributes are then that tag's. */
  as?: string | undefined
  /** Draws the element in the part's slot in place of the part's own: it takes the part's props. */
  asChild?: boolean | undefined
}

export type { PartEvent }

// A listener takes the event with its `preventKiranaHandler()`; anything else is as it was.
type Hearing<Prop> = Prop extends (event: infer Heard) => infer Answer
  ? Heard extends Event
    ? (event: PartEvent<Heard>) => Answer
    : Prop
  : Prop

type Heard<Attributes> = { [Name in keyof Attributes]: Hearing<Attributes[Name]> }

/**
 * What the element of a tag takes, listeners included (`onClick` is `@click`, its event a
 * `MouseEvent` with `preventKiranaHandler()`, which keeps the part's own listener out of it):
 * Vue's own attributes for the tag, a plain element's for a tag Vue does not know, and any
 * `data-*` attribute.
 */
export type ElementAttributes<Tag extends string> = Heard<
  Tag extends keyof IntrinsicElementAttributes ? IntrinsicElementAttributes[Tag] : HTMLAttributes
> & { [name: `data${string}`]: unknown }

/** A component's events as the listeners among its props: `openChange` is `onOpenChange`. */
export type Listeners<Emits> = {
  [Name in keyof Emits & string as `on${Capitalize<Name>}`]?: Emits[Name]
}

/**
 * The two events of a value its caller may hold: `update:open`, which `v-model:open` hears,
 * and `openChange`, which also carries the details and may cancel the change.
 */
export type Changes<Name extends string, Value, Details = ChangeDetails> = {
  [Event in `update:${Name}`]: (value: Value) => void
} & { [Event in `${Name}Change`]: (value: Value, details: Details) => void }

/**
 * What a caller may hand a part drawn as `Tag`: the part's own props, a listener for each of
 * its events, and what the element takes. A prop or an event of the part's that an attribute
 * of the element shares a name with (`value`, `disabled`, `onSelect`) is the part's.
 */
export type PartGiven<Tag extends string, Props, Emits = {}> = Props & {
  as?: Tag | undefined
} & Listeners<Emits> &
  Omit<ElementAttributes<Tag>, keyof Props | keyof Listeners<Emits>>

/** A component's default slot, given `Slot`. */
export type DefaultSlot<Slot> = SlotsType<{ default?: (props: Slot) => VNode[] }>

/** A part's instance, as Vue's own tools read a component: its props, its events, its slot. */
export type PartInstance<
  Tag extends string,
  Props,
  Emits extends ObjectEmitsOptions,
  Slot,
> = InstanceType<
  // Its listeners are the ones `PartGiven` names, each once.
  DefineSetupFnComponent<
    PartGiven<Tag, Props, Emits>,
    Emits,
    DefaultSlot<Slot>,
    PartGiven<Tag, Props, Emits>
  >
>

/**
 * A part as its callers see it. `Tag` is the element it draws, and `as` another: the part
 * takes the attributes and listeners of whichever it is. `State` is what its default slot is
 * given as `state` (`StateOf` its entry in the vocabulary), with `Given` beside it when the
 * part hands its slot more. `Props` are the part's own, `Emits` its events with their payloads.
 *
 * A part whose value has a type of its caller's (a root with `value`) writes the same
 * signature out with that type as a parameter: `new <Value, As extends string = "div">(props:
 * PartGiven<As, RootProps<Value>, RootEmits<Value>> & PublicProps) => PartInstance<…>`.
 */
export type PartComponent<
  Tag extends string,
  State = PartState,
  Props = PartComponentProps,
  Emits extends ObjectEmitsOptions = {},
  Given = unknown,
> = new <As extends string = Tag>(
  props: PartGiven<As, Props, Emits> & PublicProps
) => PartInstance<As, Props, Emits, { state: State } & Given>

/**
 * A component that draws no element of its own (a root that only provides, a portal, a list
 * that draws its slot once for each entry): its props, its events, what its slot is given.
 */
export type PlainComponent<
  Props = {},
  Emits extends ObjectEmitsOptions = {},
  Slot = {},
> = DefineSetupFnComponent<
  Props & Listeners<Emits>,
  Emits,
  DefaultSlot<Slot>,
  Props & Listeners<Emits>
>

/** The instance of a `PlainComponent`, for one whose value has a type of its caller's. */
export type PlainInstance<Props, Emits extends ObjectEmitsOptions, Slot> = InstanceType<
  PlainComponent<Props, Emits, Slot>
>

/**
 * A component's instance as its element: its root, or with several roots the first element
 * after the fragment's own mark.
 */
export function elementOf(instance: unknown): Element | null {
  let found = (instance as { $el?: Node | null } | null)?.$el ?? null
  while (found && found.nodeType !== 1) found = found.nextSibling
  return found as Element | null
}

/**
 * A part as a component: its element (`as`, the part's own tag by default), or with `as-child`
 * the caller's own element in its slot, which takes the part's props, and the part's DOM work
 * attached to the element. Three layers of props, lowest first: the attributes on the part,
 * the slotted element's own, the part's. A higher layer wins an attribute; classes join;
 * styles are merged; every listener of an event runs, lowest first, and
 * `event.preventKiranaHandler()` in a caller's stops the part's. The default slot is given the
 * part's state (`{ state }`: `open`, `side` …, read from its `data-*` attributes), typed by
 * `State`. `hold` is for a part that keeps something of its own in its element (a hidden
 * input, the text it writes: `written`): it is given the content and returns what the element
 * holds, whoever drew the element.
 */
export function partComponent<Tag extends string, State = PartState>(
  name: string,
  tag: Tag,
  resolve: () => Part,
  hold?: Hold
): PartComponent<Tag, State> {
  return defineComponent({
    name,
    inheritAttrs: false,
    props: { as: { type: String, default: tag as string }, asChild: Boolean },
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
        if (wanted) untype(wanted)
        detach = wanted ? part.attach(wanted) : undefined
      }
      const attach = (target: unknown) => {
        // On a component (`as-child` over one), the ref is its instance.
        const found = target instanceof HTMLElement ? target : elementOf(target)
        wanted = found instanceof HTMLElement ? found : null
        if (wanted) queuePostFlushCb(sync)
        else sync()
      }

      return () =>
        draw(
          props.as,
          props.asChild,
          attrs,
          slots.default?.({ state: stateOf(own.value) }),
          toVue(own.value),
          attach,
          hold
        )
    },
  }) as unknown as PartComponent<Tag, State>
}

const PORTAL_CONTAINER: InjectionKey<() => HTMLElement | null | undefined> =
  Symbol("PortalContainer")

/** What `PortalProvider` takes. */
export interface PortalProviderProps {
  /** Where the popups are drawn; `<body>` when left out, or while there is none. */
  container?: HTMLElement | null | undefined
}

/**
 * Says where every popup inside it is drawn, the popups those open included: an element of
 * the page (a shadow root's host, a full-screen element) in place of `<body>`.
 */
export const PortalProvider = defineComponent({
  name: "PortalProvider",
  props: {
    container: { type: null as unknown as PropType<HTMLElement | null>, default: undefined },
  },
  setup(props, { slots }) {
    provide(PORTAL_CONTAINER, () => props.container)
    return () => slots.default?.()
  },
}) as unknown as PlainComponent<PortalProviderProps>

/** A portal takes nothing: where it is drawn is its `PortalProvider`'s to say. */
export type PortalProps = Record<never, never>

/** Its slot in a container at the end of the page, while `mounted`. */
export function portalComponent(
  name: string,
  mounted: () => ReadonlySignal<boolean>
): PlainComponent<PortalProps> {
  return defineComponent({
    name,
    setup(_props, { slots }) {
      const shown = fromSignal(mounted())
      const container = inject(PORTAL_CONTAINER, undefined)
      // Only in a browser, once the page is in it: a server draws no portal, so hydration must
      // find none either. One that opens later is drawn at once.
      const ready = shallowRef(false)
      onMounted(() => {
        ready.value = true
      })
      return () =>
        shown.value && ready.value
          ? h(
              Teleport,
              { to: container?.() ?? "body" },
              h("div", { "data-kirana-portal": "" }, slots.default?.())
            )
          : null
    },
  }) as unknown as PlainComponent<PortalProps>
}

/** A prop that is "not given" when absent, where Vue would make a boolean `false`. */
export const optional = <T>(type: T) => ({ type, default: undefined })
