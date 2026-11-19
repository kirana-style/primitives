import {
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  InjectionToken,
  Injector,
  PLATFORM_ID,
  TemplateRef,
  ViewContainerRef,
  afterNextRender,
  effect as angularEffect,
  inject,
  input,
  signal as angularSignal,
  untracked,
} from "@angular/core"
import type {
  EmbeddedViewRef,
  InputSignalWithTransform,
  OnChanges,
  OnInit,
  ProviderToken,
  SimpleChanges,
} from "@angular/core"
import { bind, defined, effect, sameProps, signal, write } from "@kirana-ui/core"
import type {
  Align,
  Anchor,
  CollisionAvoidance,
  CollisionBoundary,
  CollisionPadding,
  OffsetFunction,
  Part,
  PositionOptions,
  ReadonlySignal,
  Side,
  Signal,
} from "@kirana-ui/core"

/** Ids for parts whose caller gave none: one counter per application, so a server and its client agree. */
@Injectable({ providedIn: "root" })
export class KuiIds {
  private next = 0
  make(): string {
    return `kui-${this.next++}`
  }
}

/**
 * The inputs of a directive, by the name its class gives each, and the value each reads (after
 * its transform): `InputsOf<KuiTooltip>["delay"]` is `number | undefined`.
 */
export type InputsOf<Directive> = {
  // oxlint-disable-next-line typescript/no-explicit-any
  [
    Name in keyof Directive as Directive[Name] extends InputSignalWithTransform<any, any>
      ? Name
      : never
  ]: Directive[Name] extends InputSignalWithTransform<infer Read, infer _Write> ? Read : never
}

/**
 * What a directive hosting a primitive gives the primitive's inputs: each a function read like
 * a signal (a signal, a `computed`, `() => 0`), so a value worked out from the host's own
 * inputs follows them.
 */
export type HostInputs<Directive> = {
  [Name in keyof InputsOf<Directive>]?: () => InputsOf<Directive>[Name]
}

/** What a directive's hosts gave it, and which of its inputs the element binds. */
interface Hosted {
  given: Record<string, () => unknown>
  bound: ReturnType<typeof angularSignal<ReadonlySet<string>>>
}

const HOSTED = new WeakMap<object, Hosted>()

function hostedOf(owner: object): Hosted {
  let record = HOSTED.get(owner)
  if (!record) {
    record = { given: {}, bound: angularSignal<ReadonlySet<string>>(new Set()) }
    HOSTED.set(owner, record)
  }
  return record
}

/** A directive's own values with what its hosts gave laid over each the element does not bind. */
function withHosts<T extends Record<string, unknown>>(owner: object, own: T): T {
  const { given, bound } = hostedOf(owner)
  const names = Object.keys(given)
  if (names.length === 0) return own
  const binds = bound()
  const out: Record<string, unknown> = { ...own }
  for (const name of names) {
    if (binds.has(name)) continue
    // An id is given as `kuiId` and read as `id`; one given as nothing keeps the one made.
    const key = name === "kuiId" ? "id" : name
    if (!(key in own)) {
      throw new Error(
        `Kirana UI: \`${name}\` was given by a host directive, and this directive takes no such input from its host`
      )
    }
    const value = given[name]!()
    if (key === "id" && value === undefined) continue
    out[key] = value
  }
  return out as T
}

/**
 * Gives the inputs of a primitive this directive hosts (`hostDirectives: [KuiTooltip]`), as a
 * design system's directive gives its defaults: `hostInputs(KuiTooltip, { delay: () => 0 })`.
 * Each value is a function read like a signal, so one worked out from the host's own inputs
 * (`{ disabled: computed(() => !this.collapsed()) }`) follows them. An input the element binds
 * (one the host exposes through `hostDirectives`' `inputs`, written on the element) wins over
 * what is given here. Call it where injection works (a field initialiser or the constructor):
 * host directives are made before their host, and read their inputs after it is made.
 */
export function hostInputs<Directive extends object>(
  directive: ProviderToken<Directive>,
  given: NoInfer<HostInputs<Directive>>
): void {
  const target = inject(directive, { self: true })
  const own = HOSTED.get(target)
  if (!own) {
    throw new Error(
      "Kirana UI: hostInputs() names a directive that takes no inputs from its host (its inputs are not read through inputsSignal)"
    )
  }
  Object.assign(own.given, given)
}

/** What `inputsSignal` gives: the signal, and the two calls its directive makes. */
export type InputsSignal<T> = (() => Signal<T>) & {
  /**
   * Reads the inputs now. Angular's own effect runs a turn later, and a part that has just
   * written a model back (`this.open.set(open)`) must not spend that turn showing the old value.
   */
  sync(): void
  /**
   * Notes which inputs the element binds: call it from `ngOnChanges`. An input given by a host
   * directive (`hostInputs`) gives way to one the element binds.
   */
  bound(changes: SimpleChanges): void
}

/**
 * A core signal that follows a directive's inputs. Call it where injection works (a field
 * initialiser or the constructor); `read` first runs when the directive's inputs are set.
 * Given its directive (`inputsSignal(this, () => …)`), what a host gives it through
 * `hostInputs` is laid over the inputs the element does not bind: the directive then calls
 * `bound(changes)` from its `ngOnChanges`.
 */
export function inputsSignal<T extends Record<string, unknown>>(read: () => T): InputsSignal<T>
export function inputsSignal<T extends Record<string, unknown>>(
  owner: object,
  read: () => T
): InputsSignal<T>
export function inputsSignal<T extends Record<string, unknown>>(
  ...args: [read: () => T] | [owner: object, read: () => T]
): InputsSignal<T> {
  const owner = args.length === 2 ? args[0] : undefined
  const own = args.length === 2 ? args[1] : args[0]
  if (owner) hostedOf(owner)
  const read = owner ? () => withHosts(owner, own()) : own
  let source: Signal<T> | undefined
  angularEffect(() => {
    const next = read()
    untracked(() => source?.set(next))
  })
  // Made on first use, in `ngOnInit`: a default is read once, with the inputs in.
  const get = () => (source ??= signal(untracked(read), sameProps as (a: T, b: T) => boolean))
  return Object.assign(get, {
    sync: () => source?.set(untracked(read)),
    bound: (changes: SimpleChanges) => {
      if (!owner) return
      const { bound } = hostedOf(owner)
      const known = untracked(bound)
      const added = Object.keys(changes).filter((name) => !known.has(name))
      if (added.length > 0) bound.set(new Set([...known, ...added]))
    },
  })
}

/**
 * Puts a part on the directive's host element: the core writes its attributes and listens for its
 * events itself, so nothing waits for change detection. Returns a function to call in `ngOnInit`,
 * when the part's controller exists.
 */
export function hostPart(): (part: Part) => void {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  const destroy = inject(DestroyRef)
  const put = binder()
  return (part) => destroy.onDestroy(put(element, part))
}

/**
 * What a positioner's `anchor` may be: an element (a template variable, `#box`), an
 * `ElementRef`, a place in the viewport (an object with `getBoundingClientRect`), or a function
 * that gives one of those (a `viewChild` signal).
 */
export type PositionerAnchor =
  | Anchor
  | ElementRef<Element>
  | (() => Anchor | ElementRef<Element> | null | undefined)
  | null
  | undefined

const anchorElement = (named: Anchor | ElementRef<Element> | null | undefined) =>
  named && "nativeElement" in named ? named.nativeElement : named

function anchorOf(given: PositionerAnchor): PositionOptions["anchor"] {
  if (typeof given !== "function") return anchorElement(given)
  // A function is asked here, so a change of the signal it reads is followed; and given whole
  // while it has nothing, to be asked again as the popup is placed.
  return anchorElement(given()) ?? (() => anchorElement(given()))
}

/**
 * A positioner: where its popup goes, as inputs. The one place they are named: each
 * component's positioner extends this and says which controller it is a part of.
 */
@Directive()
export abstract class KuiPositioner implements OnInit, OnChanges {
  readonly side = input<Side>()
  readonly align = input<Align>()
  readonly sideOffset = input<number | OffsetFunction>()
  readonly alignOffset = input<number | OffsetFunction>()
  readonly collisionPadding = input<CollisionPadding>()
  readonly collisionBoundary = input<CollisionBoundary>()
  readonly collisionAvoidance = input<CollisionAvoidance>()
  readonly sticky = input<boolean>()
  readonly arrowPadding = input<number>()
  readonly positionMethod = input<"absolute" | "fixed">()
  /**
   * What the popup is placed against, when that is not its trigger. It may change while the
   * popup is open: the popup follows.
   */
  readonly anchor = input<PositionerAnchor>()
  private readonly host = hostPart()
  private readonly given = hostedOf(this)
  private readonly options = () => {
    const own = withHosts(this, {
      side: this.side(),
      align: this.align(),
      sideOffset: this.sideOffset(),
      alignOffset: this.alignOffset(),
      collisionPadding: this.collisionPadding(),
      collisionBoundary: this.collisionBoundary(),
      collisionAvoidance: this.collisionAvoidance(),
      sticky: this.sticky(),
      arrowPadding: this.arrowPadding(),
      positionMethod: this.positionMethod(),
      anchor: this.anchor(),
    })
    return defined({ ...own, anchor: anchorOf(own.anchor) })
  }

  /** The controller it is a part of, once its root has made one. */
  protected abstract placed():
    | { positioning: Signal<Partial<PositionOptions>>; positioner: Part }
    | undefined

  constructor() {
    angularEffect(() => {
      const next = this.options()
      untracked(() => this.placed()?.positioning.set(next))
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    const known = untracked(this.given.bound)
    this.given.bound.set(new Set([...known, ...Object.keys(changes)]))
  }

  ngOnInit(): void {
    const placed = this.placed()!
    // Before the element attaches: the first placement reads these.
    placed.positioning.set(untracked(this.options))
    this.host(placed.positioner)
  }
}

const NOTHING = () => {}

/** Whether this is a server's document: no layout, no observers, and nothing changes once written. */
// The platform's id is the word itself; `@angular/common` only wraps the comparison.
export const onServer = (): boolean => (inject(PLATFORM_ID) as unknown) === "server"

// The DOM work of the parts being made: what each attaches, and what each controller mounts, in
// the order they were asked for.
let pending: (() => void)[] | undefined

/** Does the work that waited, in its order; what one throws is thrown once the rest is done. */
function settle(): void {
  const waited = pending
  // Taken first: a view the work draws by hand is then a pass of its own, done before the
  // work after it, as it was when nothing waited.
  pending = undefined
  let failed: { error: unknown } | undefined
  for (const work of waited ?? []) {
    try {
      work()
    } catch (error) {
      failed ??= { error }
    }
  }
  if (failed) throw failed.error
}

/**
 * Puts DOM work off until every part made beside it has its props on its element, and gives
 * the way to call it off. Angular makes a view's elements, puts them in the page, and only
 * then hands each directive its turn: a part that measured in its turn would have the browser
 * style the parts after it before they had a style of their own, and a design's `transition`
 * would then run as the page mounts (each slider thumb gliding to its place). So a turn only
 * writes, as a render does on the other adapters, and the work follows once the turns are
 * over: when Angular has drawn, or in a microtask where nothing draws.
 */
function after(work: () => void, injector: Injector): () => void {
  let wanted = true
  if (!pending) {
    pending = []
    queueMicrotask(settle)
    try {
      afterNextRender(settle, { injector })
    } catch {
      // An injector that is gone has nothing left to draw: the microtask does it.
    }
  }
  pending.push(() => {
    if (wanted) work()
  })
  return () => {
    wanted = false
  }
}

/**
 * Draws a view by hand (`view.detectChanges()`), then does the DOM work of the parts in it:
 * at once when nothing else is being made, as a popup that opens is; with the rest of the page
 * when it is drawn as part of one.
 */
export function drawing<Drawn>(draw: () => Drawn): Drawn {
  if (pending) return draw()
  pending = []
  try {
    return draw()
  } finally {
    settle()
  }
}

/**
 * How a part goes on an element here: bound in a browser, written once on a server. Call it where
 * injection works.
 */
export function binder(): (element: HTMLElement, part: Part) => () => void {
  if (onServer()) {
    return (element, part) => {
      write(element, part)
      return NOTHING
    }
  }
  const injector = inject(Injector)
  return (element, part) => {
    // Its props and its listeners now; what it does with its element when the others have theirs.
    const unbind = bind(element, { props: part.props, attach: () => NOTHING })
    let detach: (() => void) | undefined
    const cancel = after(() => {
      detach = part.attach(element)
    }, injector)
    return () => {
      cancel()
      unbind()
      detach?.()
    }
  }
}

/**
 * A part the directive draws itself, as the last child of its host: the hidden native input of a
 * form control, which the caller does not write. Returns a function to call in `ngOnInit`.
 */
export function innerPart(tag: string): (part: Part) => void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  const destroy = inject(DestroyRef)
  const put = binder()
  return (part) => {
    // The one a server drew is taken over: it is the host's last child, with nothing shown.
    const sent = host.lastElementChild as HTMLInputElement | null
    const taken =
      sent?.localName === tag && (sent.hidden || sent.type === "hidden") ? sent : undefined
    const element = taken ?? host.ownerDocument.createElement(tag)
    if (!taken) host.appendChild(element)
    const unbind = put(element, part)
    destroy.onDestroy(() => {
      unbind()
      element.remove()
    })
  }
}

/** Runs a controller's own effects for the directive's life. */
export function mounted(): (controller: { mount(): () => void }) => void {
  const destroy = inject(DestroyRef)
  // A controller's own effects are a browser's work.
  if (onServer()) return NOTHING
  const injector = inject(Injector)
  return (controller) => {
    // In its place among the parts' own work: after its root's, before the parts inside it.
    let stop: (() => void) | undefined
    const cancel = after(() => {
      stop = controller.mount()
    }, injector)
    destroy.onDestroy(() => {
      cancel()
      stop?.()
    })
  }
}

/** Where the popups inside are drawn, when a `kuiPortalProvider` around them says. */
export const KUI_PORTAL_CONTAINER = new InjectionToken<() => HTMLElement | null | undefined>(
  "KuiPortalContainer"
)

/**
 * For a structural directive (`*kuiCollapsiblePanel`): its template is in the page only while
 * `show` holds, so a closed panel is really gone, its content with it. `part` goes on the
 * template's element. With `portal`, the template is drawn in a container at the end of the page.
 * Returns a function to call in `ngOnInit`.
 */
export function presentWhile(
  options: {
    portal?: boolean
    /** Drawn as children of this element instead, which is elsewhere in the page. */
    into?: () => HTMLElement | undefined
  } = {}
) {
  const template = inject(TemplateRef)
  const container = inject(ViewContainerRef)
  const destroy = inject(DestroyRef)
  const server = onServer()
  const put = binder()
  const injector = inject(Injector)
  const where = inject(KUI_PORTAL_CONTAINER, { optional: true })
  return (
    show: ReadonlySignal<boolean> | (() => boolean),
    part?: Part,
    /** Called with the template's element each time it is drawn; what it returns runs when it goes. */
    drawn?: (element: HTMLElement) => () => void
  ) => {
    let view: EmbeddedViewRef<unknown> | undefined
    let outlet: HTMLElement | undefined
    let unbind: (() => void) | undefined
    let gone: (() => void) | undefined

    const remove = () => {
      gone?.()
      gone = undefined
      unbind?.()
      unbind = undefined
      view?.destroy()
      view = undefined
      outlet?.remove()
      outlet = undefined
    }

    const stop = effect(() => {
      const wanted = typeof show === "function" ? show() : show.get()
      if (wanted === (view !== undefined)) return
      if (!wanted) return remove()
      // A portal is the browser's: a server draws none, as on the other adapters.
      if ((options.portal || options.into) && server) return
      untracked(() => {
        drawing(() => {
          view = container.createEmbeddedView(template)
          const nodes = view.rootNodes as Node[]
          const target = options.into?.()
          if (target) {
            target.append(...nodes)
          } else if (options.portal) {
            const document = (nodes[0] as Node).ownerDocument!
            outlet = document.createElement("div")
            outlet.setAttribute("data-kirana-portal", "")
            outlet.append(...nodes)
            ;(where?.() ?? document.body).appendChild(outlet)
          }
          // The content first, then the part: a panel is measured with its content in it.
          view.detectChanges()
          const element = nodes.find((each): each is HTMLElement => each.nodeType === 1)
          if (part && element) unbind = put(element, part)
          if (drawn && element && !server) {
            // After the part's own work, as it always was.
            const cancel = after(() => {
              gone = drawn(element)
            }, injector)
            gone = cancel
          }
        })
      })
    })
    destroy.onDestroy(() => {
      stop()
      remove()
    })
  }
}
