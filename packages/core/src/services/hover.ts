import { details } from "../part.ts"
import type { ChangeDetails } from "../part.ts"
import { effect, signal } from "../reactivity.ts"
import type { ReadonlySignal } from "../reactivity.ts"

/** Why a popup opened or closed without its usual wait, for a design that skips the motion then. */
export type Instant = "delay" | "focus" | "dismiss" | undefined

export interface HoverOptions {
  /** How long the pointer rests on the trigger before the popup opens, in milliseconds. */
  delay: number
  /** How long after the pointer leaves the popup closes, in milliseconds. */
  closeDelay: number
  disabled: boolean
}

export interface Hover {
  readonly instant: ReadonlySignal<Instant>
  /** The trigger's handlers. */
  handlers(): Record<string, (event: never) => void>
  /** Follows the pointer while the popup is open. Returns the stop. */
  start(): () => void
}

// One popup closing makes the next open at once, for a moment: a person reading a row of them
// does not wait at each. Shared by every popup of the page, with no provider.
const GROUP = 400
let closedAt = 0
// The one that is open, as a way to close it: the pointer reaching another's trigger closes this
// one and opens that one at once, so two are never open together.
let current: { close(): void } | undefined

const inside = (box: DOMRect, x: number, y: number) =>
  x >= box.left && x <= box.right && y >= box.top && y <= box.bottom

/**
 * A popup that opens when the pointer rests on its trigger or the keyboard focuses it: a tooltip,
 * a hover card. The pointer may travel from the trigger to the popup without closing it: the
 * popup stays while the pointer is on either, or in the strip between them.
 */
export function createHover(config: {
  open: ReadonlySignal<boolean>
  setOpen(open: boolean, details: ChangeDetails): void
  options(): HoverOptions
  trigger(): HTMLElement | undefined
  popup(): HTMLElement | undefined
}): Hover {
  const instant = signal<Instant>(undefined)
  let opening: ReturnType<typeof setTimeout> | undefined
  let closing: ReturnType<typeof setTimeout> | undefined
  let focused = false

  const clear = () => {
    clearTimeout(opening)
    clearTimeout(closing)
    opening = closing = undefined
  }

  const self = { close: () => close(undefined, details("sibling-open")) }

  function open(why: Instant, by: ChangeDetails) {
    clear()
    instant.set(why)
    config.setOpen(true, by)
    current = self
  }

  function close(why: Instant, by: ChangeDetails) {
    clear()
    if (current === self) current = undefined
    if (!config.open.peek()) return
    instant.set(why)
    config.setOpen(false, by)
    closedAt = Date.now()
  }

  /** Whether the pointer is on the trigger, the popup, or the strip between the two. */
  function over(x: number, y: number): boolean {
    const a = config.trigger()?.getBoundingClientRect()
    const b = config.popup()?.getBoundingClientRect()
    if (!a) return false
    if (inside(a, x, y)) return true
    if (!b) return false
    if (inside(b, x, y)) return true
    const bridge = new DOMRect(
      Math.min(a.left, b.left),
      Math.min(a.top, b.top),
      Math.max(a.right, b.right) - Math.min(a.left, b.left),
      Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top)
    )
    // Between them only: beside both, the strip would be the whole box around the two.
    const between =
      a.bottom <= b.top || b.bottom <= a.top
        ? y > Math.min(a.bottom, b.bottom) && y < Math.max(a.top, b.top)
        : x > Math.min(a.right, b.right) && x < Math.max(a.left, b.left)
    return between && inside(bridge, x, y)
  }

  return {
    instant,
    handlers: () => ({
      onPointerEnter(event: PointerEvent) {
        const options = config.options()
        if (options.disabled || event.pointerType === "touch") return
        clearTimeout(closing)
        closing = undefined
        if (config.open.peek() || opening) return
        const other = current !== undefined && current !== self
        if (other) current?.close()
        const grouped = other || Date.now() - closedAt < GROUP
        const wait = grouped ? 0 : options.delay
        if (wait === 0) return open(grouped ? "delay" : undefined, details("trigger-hover", event))
        opening = setTimeout(() => {
          opening = undefined
          open(undefined, details("trigger-hover", event))
        }, wait)
      },
      onPointerLeave() {
        // Before it opened: the pointer only passed over.
        clearTimeout(opening)
        opening = undefined
      },
      onFocus(event: FocusEvent) {
        if (config.options().disabled) return
        // The keyboard's focus only: a press focuses too, and a press closes.
        if (!(event.target as Element).matches(":focus-visible")) return
        focused = true
        open("focus", details("trigger-focus", event))
      },
      onBlur(event: FocusEvent) {
        if (!focused) return
        focused = false
        close("focus", details("trigger-focus", event))
      },
      onPointerDown(event: PointerEvent) {
        close("dismiss", details("trigger-press", event))
      },
    }),
    start() {
      let unwatch: (() => void) | undefined
      const stop = effect(() => {
        if (!config.open.get()) return
        const document = config.trigger()?.ownerDocument
        if (!document) return
        const onMove = (event: PointerEvent) => {
          if (focused) return
          if (over(event.clientX, event.clientY)) {
            clearTimeout(closing)
            closing = undefined
            return
          }
          if (closing) return
          const wait = config.options().closeDelay
          if (wait === 0) return close(undefined, details("trigger-hover", event))
          closing = setTimeout(() => {
            closing = undefined
            close(undefined, details("trigger-hover", event))
          }, wait)
        }
        document.addEventListener("pointermove", onMove)
        unwatch = () => document.removeEventListener("pointermove", onMove)
        return unwatch
      })
      return () => {
        stop()
        clear()
      }
    },
  }
}
