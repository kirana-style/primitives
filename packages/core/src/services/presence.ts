import { batch, effect, signal, untracked } from "../reactivity.ts"
import type { ReadonlySignal } from "../reactivity.ts"

export type TransitionStatus = "starting" | "ending" | undefined

export interface Presence {
  /** Whether the element is in the page. It stays `true` through the exit's motion. */
  readonly mounted: ReadonlySignal<boolean>
  /** `"starting"` for the first style of an entrance, `"ending"` through an exit. */
  readonly status: ReadonlySignal<TransitionStatus>
  /** Follows the element from the moment it is in the page. Returns the cleanup. */
  attach(element: HTMLElement): () => void
  /** Starts following `open`. Returns the stop. */
  start(): () => void
}

export interface PresenceHooks {
  /** The element is in the page with its starting style, before the entrance runs. */
  onEnter?(element: HTMLElement): void
  /** The entrance's motion has finished. */
  onEntered?(element: HTMLElement): void
  /** The exit is about to start: the last moment the element has its open style. */
  onExit?(element: HTMLElement): void
}

/**
 * Mounts an element for its entrance and keeps it for its exit, with Base UI's two frames:
 * `data-starting-style` while the entrance has not begun, `data-ending-style` through the exit.
 * So a design animates with plain CSS transitions, which reverse when interrupted, and keyframe
 * animations work too: the exit ends when the element's own animations have all finished, and at
 * once when it has none.
 *
 * No step waits for an animation frame. The starting style is computed by reading the style
 * while the attribute is on the element, and the exit's animations are read when the ending
 * attribute lands (a mutation observer), so a page that draws no frames behaves the same.
 */
export function createPresence(open: ReadonlySignal<boolean>, hooks: PresenceHooks = {}): Presence {
  const mounted = signal(open.peek())
  const status = signal<TransitionStatus>(undefined)
  let element: HTMLElement | undefined
  // Bumped on every change of direction: a wait that finishes late knows it is stale.
  let run = 0

  function entered(token: number) {
    if (token !== run || !element) return
    hooks.onEntered?.(element)
  }

  function exited(token: number) {
    if (token !== run) return
    batch(() => {
      status.set(undefined)
      mounted.set(false)
    })
  }

  function settle(target: HTMLElement, then: () => void) {
    // Only what ends, on the page's clock: a scroll-driven animation and an endless one never do.
    const timeline = target.ownerDocument.timeline
    const animations = target
      .getAnimations()
      .filter(
        (each) =>
          each.timeline === timeline && each.effect?.getComputedTiming().endTime !== Infinity
      )
    if (animations.length === 0) return then()
    void Promise.allSettled(animations.map((each) => each.finished)).then(then)
  }

  function begin(target: HTMLElement) {
    if (status.peek() !== "starting") return
    const token = run
    hooks.onEnter?.(target)
    // Computes the starting style, so the change that follows is a transition from it. A style
    // read, not a layout one: the page is not laid out for it.
    void target.ownerDocument.defaultView?.getComputedStyle(target).opacity
    status.set(undefined)
    // The attribute leaves with the framework's next write; the motion is read after it.
    queueMicrotask(() => {
      if (token !== run) return
      whenWritten(target, "data-starting-style", false, () => settle(target, () => entered(token)))
    })
  }

  return {
    mounted,
    status,
    attach(target) {
      element = target
      begin(target)
      return () => {
        if (element === target) element = undefined
      }
    },
    start() {
      let first = true
      return effect(() => {
        const next = open.get()
        if (first) {
          first = false
          return
        }
        untracked(() => {
          const token = ++run
          if (next) {
            if (mounted.peek()) {
              // Reopened during its exit: the transition reverses from where it is.
              status.set(undefined)
              if (element) {
                const target = element
                whenWritten(target, "data-ending-style", false, () =>
                  settle(target, () => entered(token))
                )
              }
              return
            }
            batch(() => {
              status.set("starting")
              mounted.set(true)
            })
            // An element kept in the page (`keepMounted`) is attached already.
            if (element) begin(element)
            return
          }
          if (!mounted.peek()) return
          const target = element
          if (!target) return exited(token)
          hooks.onExit?.(target)
          status.set("ending")
          whenWritten(target, "data-ending-style", true, () => settle(target, () => exited(token)))
        })
      })
    },
  }
}

/**
 * Calls `then` once `attribute` is on the element (or off it), which is when the framework has
 * written the state the core just set. At once when it is so already.
 */
function whenWritten(
  element: HTMLElement,
  attribute: string,
  present: boolean,
  then: () => void
): void {
  if (element.hasAttribute(attribute) === present) return then()
  const observer = new MutationObserver(() => {
    if (element.hasAttribute(attribute) !== present) return
    observer.disconnect()
    then()
  })
  observer.observe(element, { attributes: true, attributeFilter: [attribute] })
  // An element taken out before the write never reports it.
  queueMicrotask(() => {
    if (!element.isConnected) observer.disconnect()
  })
}
