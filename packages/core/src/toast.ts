import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { clearGeometry, setGeometry } from "./services/geometry.ts"
import { whenSettled, whenWritten } from "./services/presence.ts"

export interface ToastOptions {
  title?: string | undefined
  description?: string | undefined
  /** What kind it is, for the design: `"success"`, `"error"`, anything. */
  type?: string | undefined
  /** How long it stays, in milliseconds; `Infinity` until it is closed. */
  duration?: number | undefined
  /** Anything else the caller draws it with. */
  data?: unknown
  /** Heard when it starts to leave, with why. */
  onClose?: ((details: ChangeDetails) => void) | undefined
}

export interface ToastRecord extends ToastOptions {
  readonly id: string
  readonly duration: number
  /** It has been closed and is on its way out. */
  readonly closing: boolean
}

export interface Toaster {
  /** Every toast that is in the page, the newest first. */
  readonly toasts: ReadonlySignal<readonly ToastRecord[]>
  /** How many are shown at once; the rest wait behind. */
  readonly limit: number
  /** Shows a toast, and gives the id it is known by. */
  add(options: ToastOptions & { id?: string }): string
  /** Changes one that is showing; its time starts again. */
  update(id: string, options: ToastOptions): void
  /** Closes one, or every one: it leaves once its motion has ended. */
  dismiss(id?: string, details?: ChangeDetails): void
  /** Takes one out at once. What draws the toasts calls it when the motion has ended. */
  remove(id: string): void
}

/** How long a toast stays when it does not say. */
export const TOAST_DURATION = 5000
/** How far a toast is dragged before letting go closes it, in pixels. */
export const TOAST_SWIPE = 40

/**
 * The toasts of a page, apart from any framework and from what draws them: made once, in a
 * module, and called from anywhere (`toaster.add({ title })`), a component or not.
 */
export function createToaster(options: { duration?: number; limit?: number } = {}): Toaster {
  const toasts = signal<readonly ToastRecord[]>([])
  let made = 0
  const change = (id: string, to: (toast: ToastRecord) => ToastRecord) =>
    toasts.set(toasts.peek().map((each) => (each.id === id ? to(each) : each)))

  return {
    toasts,
    limit: options.limit ?? 3,
    add({ id = `toast-${++made}`, ...given }) {
      const toast: ToastRecord = {
        ...given,
        id,
        duration: given.duration ?? options.duration ?? TOAST_DURATION,
        closing: false,
      }
      // The same id again is the same toast, changed.
      const rest = toasts.peek().filter((each) => each.id !== id)
      toasts.set([toast, ...rest])
      return id
    },
    update(id, given) {
      change(id, (toast) => ({
        ...toast,
        ...given,
        duration: given.duration ?? toast.duration,
        closing: false,
      }))
    },
    dismiss(id, by = details("dismiss")) {
      for (const toast of toasts.peek()) {
        if (toast.closing || (id !== undefined && toast.id !== id)) continue
        toast.onClose?.(by)
        change(toast.id, (each) => ({ ...each, closing: true }))
      }
    },
    remove(id) {
      toasts.set(toasts.peek().filter((each) => each.id !== id))
    },
  }
}

export interface ToastProps {
  id: string
  toaster: Toaster
  /** What the region of toasts is called, for assistive technology. */
  label?: string | undefined
  /** The key that takes focus to the toasts. Default: `"F6"`. */
  hotkey?: string | undefined
  /** The way a toast is dragged to close it. Default: `"right"`. */
  swipeDirection?: "left" | "right" | "up" | "down" | undefined
}

export interface ToastParts {
  readonly root: Part
  readonly title: Part
  readonly description: Part
  /** Closes the toast. */
  readonly close: Part
  /** A button of the toast's own; pressing it closes the toast too. */
  readonly action: Part
}

export interface Toast {
  readonly toasts: ReadonlySignal<readonly ToastRecord[]>
  /** Whether the stack is spread out: the pointer or focus is on it. */
  readonly expanded: ReadonlySignal<boolean>
  mount(): () => void
  /** Where the toasts are drawn: a region that is always in the page. */
  readonly viewport: Part
  /** The parts of one toast. */
  toast(id: string): ToastParts
}

const NOTHING = () => {}
const NONE = () => NOTHING

/**
 * What draws a toaster's toasts. A toast stays in the page through its exit (`data-ending-style`
 * until its own motion has ended), waits while the pointer or focus is on the stack or the page
 * is hidden, and is closed by its button, by Escape, by a drag, or by its time.
 *
 * Where each toast lies is the design's, from what the parts say: its place in the stack, its
 * height, and the height of what is in front of it.
 */
export function createToast(props: ReadonlySignal<ToastProps>): Toast {
  const { id, toaster } = props.peek()
  const toasts = toaster.toasts
  const hovered = signal(false)
  const focused = signal(false)
  const hidden = signal(false)
  const expanded = computed(() => hovered.get() || focused.get())
  const elements = new Map<string, HTMLElement>()
  const parts = new Map<string, ToastParts>()
  let region: HTMLElement | undefined

  /** Each toast's height, and the height of the toasts in front of it. */
  function measure() {
    let front = 0
    for (const toast of toasts.peek()) {
      const element = elements.get(toast.id)
      if (!element) continue
      const height = element.offsetHeight
      setGeometry(element, "--toast-height", `${height}px`)
      setGeometry(element, "--toast-offset-y", `${front}px`)
      if (!toast.closing) front += height
    }
  }

  function make(toastId: string): ToastParts {
    const record = computed(() => toasts.get().find((each) => each.id === toastId))
    const index = computed(() => {
      const open = toasts.get().filter((each) => !each.closing || each.id === toastId)
      return open.findIndex((each) => each.id === toastId)
    })
    // The first style of its entrance, until it is in the page.
    const starting = signal(true)
    const swiping = signal(false)
    const swiped = signal<string | undefined>(undefined)
    let drag: { x: number; y: number; by: number } | undefined
    const close = (reason: string, event?: Event) =>
      toaster.dismiss(toastId, details(reason, event))
    const titled = signal(false)
    const described = signal(false)
    const named =
      (has: typeof titled): Part["attach"] =>
      () => {
        has.set(true)
        return () => has.set(false)
      }

    return {
      root: {
        props: computed(() => {
          const toast = record.get()
          const way = props.get().swipeDirection ?? "right"
          return {
            id: `${id}-${toastId}`,
            role: "dialog",
            "aria-modal": "false",
            "aria-labelledby": titled.get() ? `${id}-${toastId}-title` : undefined,
            "aria-describedby": described.get() ? `${id}-${toastId}-description` : undefined,
            tabindex: "0",
            "data-type": toast?.type,
            "data-expanded": flag(expanded.get()),
            "data-limited": flag(index.get() >= toaster.limit),
            "data-swiping": flag(swiping.get()),
            "data-swipe-direction": swiped.get(),
            "data-starting-style": flag(starting.get()),
            "data-ending-style": flag(toast?.closing),
            style: { "--toast-index": String(Math.max(0, index.get())) },
            onKeyDown(event: KeyboardEvent) {
              if (event.key !== "Escape") return
              close("escape-key", event)
              // Focus goes with it: to the region, where the next toast is a Tab away.
              region?.focus({ preventScroll: true })
            },
            onPointerDown(event: PointerEvent) {
              if (event.button !== 0) return
              const target = event.target as Element | null
              // A press on what the toast holds is that thing's.
              if (target?.closest("button, a, input, textarea, select")) return
              drag = { x: event.clientX, y: event.clientY, by: 0 }
            },
            onPointerMove(event: PointerEvent) {
              if (!drag) return
              const across = way === "left" || way === "right"
              const sign = way === "left" || way === "up" ? -1 : 1
              const moved = (across ? event.clientX - drag.x : event.clientY - drag.y) * sign
              drag.by = Math.max(0, moved)
              const element = event.currentTarget as HTMLElement
              if (drag.by > 0 && !swiping.peek()) {
                swiping.set(true)
                try {
                  element.setPointerCapture(event.pointerId)
                } catch {
                  // A pointer the browser no longer has: the drag goes on while its moves reach.
                }
              }
              setGeometry(element, "--toast-swipe-movement-x", `${across ? drag.by * sign : 0}px`)
              setGeometry(element, "--toast-swipe-movement-y", `${across ? 0 : drag.by * sign}px`)
            },
            onPointerUp(event: PointerEvent) {
              const ended = drag
              drag = undefined
              if (!ended) return
              swiping.set(false)
              if (ended.by >= TOAST_SWIPE) {
                // Where it was let go is where it leaves from.
                swiped.set(way)
                return close("swipe", event)
              }
              const element = event.currentTarget as HTMLElement
              clearGeometry(element, "--toast-swipe-movement-x")
              clearGeometry(element, "--toast-swipe-movement-y")
            },
            onPointerCancel() {
              drag = undefined
              swiping.set(false)
            },
          }
        }),
        attach(element) {
          elements.set(toastId, element)
          // Computes its first style, so what follows is a transition from it.
          void element.ownerDocument.defaultView?.getComputedStyle(element).opacity
          starting.set(false)
          measure()
          // Out of the page once its exit's own motion has ended.
          const stop = effect(() => {
            if (!record.get()?.closing) return
            untracked(() =>
              whenWritten(element, "data-ending-style", true, () =>
                whenSettled(element, () => {
                  if (toasts.peek().find((each) => each.id === toastId)?.closing)
                    toaster.remove(toastId)
                })
              )
            )
          })
          return () => {
            stop()
            if (elements.get(toastId) === element) elements.delete(toastId)
          }
        },
      },
      title: {
        props: computed(() => ({ id: `${id}-${toastId}-title` })),
        attach: named(titled),
      },
      description: {
        props: computed(() => ({ id: `${id}-${toastId}-description` })),
        attach: named(described),
      },
      close: {
        props: computed(() => ({
          type: "button",
          onClick: (event: Event) => close("close-press", event),
        })),
        attach: NONE,
      },
      action: {
        props: computed(() => ({
          type: "button",
          onClick: (event: Event) => close("action-press", event),
        })),
        attach: NONE,
      },
    }
  }

  return {
    toasts,
    expanded,
    mount() {
      // Each toast's time: it runs while nothing holds the stack, and waits otherwise.
      const timers = new Map<
        string,
        { left: number; of: number; since?: number; handle?: ReturnType<typeof setTimeout> }
      >()
      const stopTimers = effect(() => {
        const all = toasts.get()
        const held = expanded.get() || hidden.get()
        const now = performance.now()
        for (const [key, timer] of timers) {
          const toast = all.find((each) => each.id === key)
          if (toast && !toast.closing && toast.duration === timer.of) continue
          clearTimeout(timer.handle)
          timers.delete(key)
        }
        for (const toast of all) {
          if (toast.closing || !Number.isFinite(toast.duration)) continue
          let timer = timers.get(toast.id)
          if (!timer) timers.set(toast.id, (timer = { left: toast.duration, of: toast.duration }))
          if (held && timer.handle !== undefined) {
            clearTimeout(timer.handle)
            timer.left -= now - (timer.since ?? now)
            timer.handle = undefined
          } else if (!held && timer.handle === undefined) {
            timer.since = now
            timer.handle = setTimeout(
              () => toaster.dismiss(toast.id, details("timeout")),
              Math.max(0, timer.left)
            )
          }
        }
      })
      // What a toast says can change its height, and one that leaves moves the rest.
      const stopMeasure = effect(() => {
        toasts.get()
        queueMicrotask(measure)
      })
      const page = typeof document === "undefined" ? undefined : document
      const seen = () => hidden.set(page?.visibilityState === "hidden")
      const key = (event: KeyboardEvent) => {
        if (event.key !== (props.peek().hotkey ?? "F6") || !region) return
        event.preventDefault()
        region.focus({ preventScroll: true })
      }
      // Whether the pointer is on the stack is asked of each move, not of a leave: a toast
      // that is closed under the pointer is gone before any leave is sent, and a framework
      // that makes its own leave from what was under the pointer never makes that one.
      const moved = (event: PointerEvent) => {
        const on = Boolean(region && event.target instanceof Node && region.contains(event.target))
        hovered.set(on && event.pointerType !== "touch")
      }
      // And of focus the same: nothing says focus left when what had it is taken out.
      const within = () =>
        focused.set(Boolean(region && page && region.contains(page.activeElement)))
      const stopFocus = effect(() => {
        toasts.get()
        queueMicrotask(within)
      })
      page?.addEventListener("focusin", within, true)
      const left = () => queueMicrotask(within)
      page?.addEventListener("focusout", left, true)
      page?.addEventListener("visibilitychange", seen)
      page?.addEventListener("keydown", key)
      page?.addEventListener("pointermove", moved, true)
      return () => {
        stopTimers()
        stopMeasure()
        stopFocus()
        page?.removeEventListener("focusin", within, true)
        page?.removeEventListener("focusout", left, true)
        for (const timer of timers.values()) clearTimeout(timer.handle)
        page?.removeEventListener("visibilitychange", seen)
        page?.removeEventListener("keydown", key)
        page?.removeEventListener("pointermove", moved, true)
      }
    },
    viewport: {
      props: computed(() => ({
        id,
        role: "region",
        "aria-live": "polite",
        "aria-label": props.get().label ?? "Notifications",
        tabindex: "-1",
        "data-expanded": flag(expanded.get()),
      })),
      attach(element) {
        region = element
        return () => {
          if (region === element) region = undefined
        }
      },
    },
    toast(toastId) {
      let made = parts.get(toastId)
      if (!made) parts.set(toastId, (made = make(toastId)))
      return made
    },
  }
}
