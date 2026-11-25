import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { clearGeometry, setGeometry } from "./services/geometry.ts"
import { whenSettled, whenWritten } from "./services/presence.ts"

/** A button a toast offers: what it says, and what pressing it does. */
export interface ToastActionOptions<Content = string> {
  /** What the button says: `Toast.Action` draws it when it is given nothing else. Needed. */
  label: Content
  /**
   * Heard when the button is pressed, before the toast closes with the reason
   * `"action-press"`: `details.cancel()` keeps the toast open. Needed.
   */
  onAction(details: ChangeDetails): void
}

/**
 * What a toast is added with. `Content` is what a title, a description and an action's label
 * may be: a string here, and what the framework draws in each adapter's own `createToaster`.
 * The toaster hands it on as it was given, and never reads it.
 */
export interface ToastOptions<Content = string> {
  /**
   * What the toast is called: `Toast.Title` draws it when it is given nothing else.
   * Default: none.
   */
  title?: Content | undefined
  /**
   * What the toast says: `Toast.Description` draws it when it is given nothing else.
   * Default: none.
   */
  description?: Content | undefined
  /**
   * What kind it is, for the design (`"success"`, `"error"`, anything): the toast's
   * `data-type`. Default: none.
   */
  type?: string | undefined
  /**
   * How long it stays, in milliseconds; `0` (or `Infinity`) until it is closed. Default: the
   * toaster's `timeout`.
   */
  timeout?: number | undefined
  /**
   * How long it stays, in milliseconds; `Infinity` until it is closed.
   * @deprecated Base UI's name is `timeout`, which wins when both are given. Here `0` is no
   * time at all; there it is no end.
   */
  duration?: number | undefined
  /**
   * How it is announced: `"polite"` when assistive technology is next idle, `"assertive"` as
   * an alert that interrupts what is being read. Default: `"polite"`.
   */
  priority?: "polite" | "assertive" | undefined
  /** A button of the toast's own, which `Toast.Action` draws and presses. Default: none. */
  action?: ToastActionOptions<Content> | undefined
  /** Anything else the caller draws it with; the toaster never reads it. Default: none. */
  data?: unknown
  /** Heard when it starts to leave, with why (`details.reason`). Default: none. */
  onClose?: ((details: ChangeDetails) => void) | undefined
}

/** A toast as its toaster holds it: what it was added with, and where it stands. */
export interface ToastRecord<Content = string> extends ToastOptions<Content> {
  /** What it is known by: the one it was added with, or one the toaster made. */
  readonly id: string
  /**
   * How long it stays, in milliseconds: its own, or the toaster's when it gave none;
   * `Infinity` until it is closed.
   */
  readonly timeout: number
  /**
   * How long it stays, in milliseconds.
   * @deprecated The same as `timeout`.
   */
  readonly duration: number
  /** How it is announced: its own, or `"polite"` when it gave none. */
  readonly priority: "polite" | "assertive"
  /** It has been closed and is on its way out. `false` until then. */
  readonly closing: boolean
}

/**
 * What a promise's toast shows in one of its states: a toast's options, or a string, which is
 * its title (where a title may be a string).
 */
export type ToastState<Content = string> =
  | ToastOptions<Content>
  | (string extends Content ? string : never)

/** What a toaster is made with. */
export interface ToasterOptions {
  /**
   * How long a toast stays when it does not say, in milliseconds; `0` until it is closed.
   * Default: `5000`.
   */
  timeout?: number | undefined
  /**
   * How long a toast stays when it does not say, in milliseconds.
   * @deprecated Base UI's name is `timeout`, which wins when both are given.
   */
  duration?: number | undefined
  /** How many toasts are shown at once; the rest wait behind, `data-limited`. Default: `3`. */
  limit?: number | undefined
}

/** The toasts of a page and what changes them: what `createToaster()` gives. */
export interface Toaster<Content = string> {
  /** Every toast that is in the page, the newest first. Empty to begin with. */
  readonly toasts: ReadonlySignal<readonly ToastRecord<Content>[]>
  /** How many are shown at once; the rest wait behind. Default: `3`. */
  readonly limit: number
  /**
   * Shows a toast, and gives the id it is known by: `id` when one is given (the same id again
   * is the same toast, changed), `toast-1`, `toast-2` … otherwise.
   */
  add(options: ToastOptions<Content> & { id?: string }): string
  /**
   * Changes one that is showing: what is given replaces what it had, the rest stays, and its
   * time starts again.
   */
  update(id: string, options: ToastOptions<Content>): void
  /**
   * Closes one, or every one when no id is given: it leaves once its motion has ended.
   * `details` is what `onClose` hears. Default: the reason `"dismiss"`.
   */
  dismiss(id?: string, details?: ChangeDetails): void
  /**
   * Takes one out at once, with no exit: what draws the toasts calls it when the motion has
   * ended.
   */
  remove(id: string): void
  /**
   * One toast for something that takes time: `loading` (type `"loading"`, staying until the
   * promise settles), then `success` or `error` in its place, each a title, a toast's options,
   * or a function of what the promise gave. Each state is whole: a description or an action
   * the state before had is not kept. Answers the promise itself.
   */
  promise<Value>(
    promise: Promise<Value>,
    states: {
      loading: ToastState<Content>
      success: ToastState<Content> | ((value: Value) => ToastState<Content>)
      error: ToastState<Content> | ((error: unknown) => ToastState<Content>)
    }
  ): Promise<Value>
}

const said = <Content>(given: ToastState<Content>): ToastOptions<Content> =>
  (typeof given === "string" ? { title: given } : given) as ToastOptions<Content>

/** How long a toast stays when it does not say. */
export const TOAST_DURATION = 5000
/** How far a toast is dragged before letting go closes it, in pixels. */
export const TOAST_SWIPE = 40

/**
 * The toasts of a page, apart from any framework and from what draws them: made once, in a
 * module, and called from anywhere (`toaster.add({ title })`), a component or not. `Content`
 * is what a title, a description and an action's label may be; it is handed on untouched.
 */
/**
 * How long a toast stays by what it was given: Base UI's `timeout` first, whose `0` is no end,
 * then the older `duration`.
 */
const timeOf = (given: { timeout?: number | undefined; duration?: number | undefined }) =>
  given.timeout === 0 ? Infinity : (given.timeout ?? given.duration)

export function createToaster<Content = string>(options: ToasterOptions = {}): Toaster<Content> {
  const toasts = signal<readonly ToastRecord<Content>[]>([])
  let made = 0
  const change = (id: string, to: (toast: ToastRecord<Content>) => ToastRecord<Content>) =>
    toasts.set(toasts.peek().map((each) => (each.id === id ? to(each) : each)))

  const toaster: Toaster<Content> = {
    toasts,
    limit: options.limit ?? 3,
    add({ id = `toast-${++made}`, ...given }) {
      const time = timeOf(given) ?? timeOf(options) ?? TOAST_DURATION
      const toast: ToastRecord<Content> = {
        ...given,
        id,
        timeout: time,
        duration: time,
        priority: given.priority ?? "polite",
        closing: false,
      }
      // The same id again is the same toast, changed.
      const rest = toasts.peek().filter((each) => each.id !== id)
      toasts.set([toast, ...rest])
      return id
    },
    update(id, given) {
      change(id, (toast) => {
        const time = timeOf(given) ?? toast.timeout
        return {
          ...toast,
          ...given,
          timeout: time,
          duration: time,
          priority: given.priority ?? toast.priority,
          closing: false,
        }
      })
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
    promise(promise, states) {
      // It stays for as long as the work does.
      const id = toaster.add({ type: "loading", ...said(states.loading), timeout: Infinity })
      const settle = <Given>(
        type: string,
        state: ToastState<Content> | ((given: Given) => ToastState<Content>),
        given: Given
      ) => {
        // Closed while it waited: what came of it is not shown.
        const waiting = toasts.peek().find((each) => each.id === id)
        if (!waiting || waiting.closing) return
        const next = said(typeof state === "function" ? state(given) : state)
        toaster.update(id, {
          // A state is whole: what the one before it said and offered is not this one's.
          description: undefined,
          action: undefined,
          type,
          ...next,
          // What the state says, read as `add` reads it; `timeout` is then that time.
          timeout: undefined,
          duration: timeOf(next) ?? timeOf(options) ?? TOAST_DURATION,
        })
      }
      promise.then(
        (value) => settle("success", states.success, value),
        (error: unknown) => settle("error", states.error, error)
      )
      return promise
    },
  }
  return toaster
}

export interface ToastProps<Content = string> {
  id: string
  /** The toaster whose toasts are drawn: one made with `createToaster()`. Needed. */
  toaster: Toaster<Content>
  /** What the region of toasts is called, for assistive technology. Default: `"Notifications"`. */
  label?: string | undefined
  /** The key that takes focus to the toasts. Default: `"F6"`. */
  hotkey?: string | undefined
  /** The way a toast is dragged to close it. Default: `"right"`. */
  swipeDirection?: "left" | "right" | "up" | "down" | undefined
}

export interface ToastParts<Content = string> {
  /** The toast as its toaster holds it now: what a part with nothing of its own to say draws. */
  readonly record: ReadonlySignal<ToastRecord<Content> | undefined>
  readonly root: Part
  /**
   * What holds the toast's contents, when a design sizes the toast itself (one behind the
   * frontmost is as tall as the frontmost): it says whether it is behind, and the toast is
   * measured again when what it holds changes.
   */
  readonly content: Part
  /** What the toast is called: the record's `title`, unless the caller draws another. */
  readonly title: Part
  /** What the toast says: the record's `description`, unless the caller draws another. */
  readonly description: Part
  /** Closes the toast. */
  readonly close: Part
  /**
   * A button of the toast's own: the record's `action`, unless the caller draws another.
   * A press tells the action, and closes the toast unless the action refused.
   */
  readonly action: Part
}

export interface Toast<Content = string> {
  readonly toasts: ReadonlySignal<readonly ToastRecord<Content>[]>
  /** Whether the stack is spread out: the pointer or focus is on it. */
  readonly expanded: ReadonlySignal<boolean>
  mount(): () => void
  /** Where the toasts are drawn: a region that is always in the page. */
  readonly viewport: Part
  /** The parts of one toast. */
  toast(id: string): ToastParts<Content>
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
export function createToast<Content = string>(
  props: ReadonlySignal<ToastProps<Content>>
): Toast<Content> {
  const { id, toaster } = props.peek()
  const toasts = toaster.toasts
  const hovered = signal(false)
  const focused = signal(false)
  const hidden = signal(false)
  const expanded = computed(() => hovered.get() || focused.get())
  const elements = new Map<string, HTMLElement>()
  const parts = new Map<string, ToastParts<Content>>()
  let region: HTMLElement | undefined

  /** Each toast's height, and the height of the toasts in front of it. */
  function measure() {
    let front = 0
    let frontmost: number | undefined
    for (const toast of toasts.peek()) {
      const element = elements.get(toast.id)
      if (!element) continue
      // Its own height, whatever the design has made it for its place in the stack.
      const given = element.style.height
      element.style.height = "auto"
      const height = element.offsetHeight
      element.style.height = given
      setGeometry(element, "--toast-height", `${height}px`)
      setGeometry(element, "--toast-offset-y", `${front}px`)
      if (toast.closing) continue
      frontmost ??= height
      front += height
    }
    if (!region) return
    if (frontmost === undefined) clearGeometry(region, "--toast-frontmost-height")
    else setGeometry(region, "--toast-frontmost-height", `${frontmost}px`)
  }

  function make(toastId: string): ToastParts<Content> {
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
      record,
      root: {
        props: computed(() => {
          const toast = record.get()
          const way = props.get().swipeDirection ?? "right"
          // One that interrupts is an alert, read whole and at once, whatever the region around
          // it says of the rest.
          const alert = toast?.priority === "assertive"
          return {
            id: `${id}-${toastId}`,
            role: alert ? "alertdialog" : "dialog",
            "aria-modal": "false",
            "aria-live": alert ? "assertive" : undefined,
            "aria-atomic": alert ? "true" : undefined,
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
      content: {
        props: computed(() => ({
          "data-behind": flag(index.get() > 0),
          "data-expanded": flag(expanded.get()),
        })),
        attach(element) {
          measure()
          if (typeof ResizeObserver === "undefined") return NOTHING
          // Its text changed, or it wraps another way: the toast is as tall as it now is.
          const resized = new ResizeObserver(measure)
          const changed = new MutationObserver(measure)
          resized.observe(element)
          changed.observe(element, { childList: true, subtree: true, characterData: true })
          return () => {
            resized.disconnect()
            changed.disconnect()
          }
        },
      },
      title: {
        props: computed(() => ({ id: `${id}-${toastId}-title`, "data-type": record.get()?.type })),
        attach: named(titled),
      },
      description: {
        props: computed(() => ({
          id: `${id}-${toastId}-description`,
          "data-type": record.get()?.type,
        })),
        attach: named(described),
      },
      close: {
        props: computed(() => ({
          type: "button",
          "data-type": record.get()?.type,
          onClick: (event: Event) => close("close-press", event),
        })),
        attach: NONE,
      },
      action: {
        props: computed(() => ({
          type: "button",
          "data-type": record.get()?.type,
          onClick(event: Event) {
            const by = details("action-press", event)
            record.peek()?.action?.onAction(by)
            // What the action refused stays: it has more to do, or asked and was told no.
            if (!by.canceled) toaster.dismiss(toastId, by)
          },
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
          if (toast && !toast.closing && toast.timeout === timer.of) continue
          clearTimeout(timer.handle)
          timers.delete(key)
        }
        for (const toast of all) {
          if (toast.closing || !Number.isFinite(toast.timeout)) continue
          let timer = timers.get(toast.id)
          if (!timer) timers.set(toast.id, (timer = { left: toast.timeout, of: toast.timeout }))
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
        measure()
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
