import { createDialog } from "./dialog.ts"
import type { Dialog, DialogProps } from "./dialog.ts"
import { details, flag } from "./part.ts"
import { computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { clearGeometry, setGeometry } from "./services/geometry.ts"

export type DrawerSide = "up" | "down" | "left" | "right"

export interface DrawerProps extends DialogProps {
  /** The way it is dragged to close it: the edge it came from. Default: `"down"`. */
  swipeDirection?: DrawerSide | undefined
}

export type Drawer = Dialog

/** How far a press moves before it is a drag, in pixels. */
export const DRAWER_SLOP = 4
/** The part of the drawer's size a drag passes to close it when let go. */
export const DRAWER_CLOSE = 0.25
/** The speed, in pixels a millisecond, at which letting go closes it whatever the distance. */
export const DRAWER_FLICK = 0.5

/** How long a pointer is still before letting go is no flick, in milliseconds. */
export const DRAWER_REST = 80

const CONTROLS = "input, textarea, select, [contenteditable], [data-drawer-no-drag]"

/**
 * A dialog that comes from an edge and is dragged back to it. Everything a dialog does, it
 * does: the same focus (its first tabbable element), the same press outside on its backdrop,
 * the same stack. The drag only says how far it has gone (`--drawer-swipe-movement-x/y`,
 * `--drawer-swipe-progress`); moving the drawer by it is the design's, so nothing is written
 * that a design has to beat.
 */
export function createDrawer(props: ReadonlySignal<DrawerProps>): Drawer {
  const dialog = createDialog(props)
  const way = computed(() => props.get().swipeDirection ?? "down")
  const swiping = signal(false)
  let popup: HTMLElement | undefined
  let backdrop: HTMLElement | undefined
  let drag:
    | { x: number; y: number; by: number; at: number; speed: number; size: number; held: boolean }
    | undefined

  /** Whether a drag from `target` would take a scroll from what it is in. */
  function scrolls(target: Element | null, direction: DrawerSide): boolean {
    for (let each = target; each && each !== popup; each = each.parentElement) {
      if (!(each instanceof HTMLElement)) continue
      const across = direction === "left" || direction === "right"
      const room = across
        ? each.scrollWidth - each.clientWidth
        : each.scrollHeight - each.clientHeight
      if (room <= 0) continue
      const overflow = getComputedStyle(each)[across ? "overflowX" : "overflowY"]
      if (overflow !== "auto" && overflow !== "scroll") continue
      const at = Math.abs(across ? each.scrollLeft : each.scrollTop)
      // Towards the edge it closes at, what is inside scrolls first unless it is at its end.
      const forward = direction === "down" || direction === "right"
      if (forward ? at > 0 : at < room - 1) return true
    }
    return false
  }

  function write(by: number, size: number) {
    const direction = way.peek()
    const across = direction === "left" || direction === "right"
    const sign = direction === "up" || direction === "left" ? -1 : 1
    const progress = String(Math.round(Math.min(1, size > 0 ? by / size : 0) * 1000) / 1000)
    for (const each of [popup, backdrop]) {
      if (!each) continue
      setGeometry(each, "--drawer-swipe-movement-x", `${across ? by * sign : 0}px`)
      setGeometry(each, "--drawer-swipe-movement-y", `${across ? 0 : by * sign}px`)
      setGeometry(each, "--drawer-swipe-progress", progress)
    }
  }

  function clear() {
    for (const each of [popup, backdrop]) {
      if (!each) continue
      clearGeometry(each, "--drawer-swipe-movement-x")
      clearGeometry(each, "--drawer-swipe-movement-y")
      clearGeometry(each, "--drawer-swipe-progress")
    }
  }

  // A drag has just ended: the click the browser makes of it is not a press.
  let dragged = false
  const end = () => {
    dragged = Boolean(drag?.held)
    drag = undefined
    swiping.set(false)
  }

  return {
    ...dialog,
    backdrop: {
      props: computed(() => ({
        ...dialog.backdrop.props.get(),
        "data-swiping": flag(swiping.get()),
      })),
      attach(element) {
        backdrop = element
        const stop = dialog.backdrop.attach(element)
        return () => {
          stop()
          if (backdrop === element) backdrop = undefined
        }
      },
    },
    popup: {
      props: computed(() => ({
        ...dialog.popup.props.get(),
        "data-swipe-direction": way.get(),
        "data-swiping": flag(swiping.get()),
        onPointerDown(event: PointerEvent) {
          if (event.button !== 0 || !popup) return
          const target = event.target as Element | null
          // Text is typed and selected in a field, not dragged; and what scrolls, scrolls.
          dragged = false
          if (target?.closest(CONTROLS) || scrolls(target, way.peek())) return
          const box = popup.getBoundingClientRect()
          const across = way.peek() === "left" || way.peek() === "right"
          drag = {
            x: event.clientX,
            y: event.clientY,
            by: 0,
            at: performance.now(),
            speed: 0,
            size: across ? box.width : box.height,
            held: false,
          }
        },
        onPointerMove(event: PointerEvent) {
          if (!drag) return
          const direction = way.peek()
          const across = direction === "left" || direction === "right"
          const sign = direction === "up" || direction === "left" ? -1 : 1
          const moved = (across ? event.clientX - drag.x : event.clientY - drag.y) * sign
          const by = Math.max(0, moved)
          if (!drag.held) {
            if (by < DRAWER_SLOP) return
            drag.held = true
            swiping.set(true)
            try {
              ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
            } catch {
              // A pointer the browser no longer has: the drag goes on while its moves reach.
            }
          }
          const now = performance.now()
          if (now > drag.at) drag.speed = (by - drag.by) / (now - drag.at)
          drag.at = now
          drag.by = by
          write(by, drag.size)
        },
        onPointerUp(event: PointerEvent) {
          const ended = drag
          end()
          if (!ended?.held) return
          const far = ended.size > 0 && ended.by / ended.size >= DRAWER_CLOSE
          // A pointer that rested before it was let go was not flicked, however it got there.
          const flicked = performance.now() - ended.at <= DRAWER_REST && ended.speed >= DRAWER_FLICK
          if (far || flicked) {
            const by = details("swipe", event)
            dialog.setOpen(false, by)
            // It leaves from where it was let go: how far stays written through its exit.
            if (!by.canceled) return
          }
          clear()
        },
        onPointerCancel() {
          if (drag?.held) clear()
          end()
        },
      })),
      attach(element) {
        popup = element
        const stop = dialog.popup.attach(element)
        // Its size, for a design that stacks drawers or moves the page behind one.
        const size = () => {
          setGeometry(element, "--drawer-height", `${element.offsetHeight}px`)
          setGeometry(element, "--drawer-width", `${element.offsetWidth}px`)
        }
        size()
        let later: ReturnType<typeof setTimeout> | undefined
        // Written a task later: a size written while sizes are reported cannot be delivered.
        const observer = new ResizeObserver(() => {
          clearTimeout(later)
          later = setTimeout(size)
        })
        observer.observe(element)
        // Opened again, it begins where it lies, not where it was last let go.
        const reopened = effect(() => {
          if (dialog.open.get()) clear()
        })
        // Before anything inside hears it, a framework's own listeners included.
        const pressed = (event: Event) => {
          if (!dragged) return
          dragged = false
          event.stopPropagation()
          event.preventDefault()
        }
        element.addEventListener("click", pressed, true)
        return () => {
          stop()
          reopened()
          element.removeEventListener("click", pressed, true)
          observer.disconnect()
          clearTimeout(later)
          if (popup === element) popup = undefined
        }
      },
    },
  }
}
