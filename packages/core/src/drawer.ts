import { createDialog } from "./dialog.ts"
import type { Dialog, DialogProps } from "./dialog.ts"
import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails } from "./part.ts"
import { computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { clearGeometry, setGeometry } from "./services/geometry.ts"

export type DrawerSide = "up" | "down" | "left" | "right"

export interface DrawerProps extends DialogProps {
  /** The way it is dragged to close it: the edge it came from. Default: `"down"`. */
  swipeDirection?: DrawerSide | undefined
  /**
   * Places it rests at, each the share of itself that shows: `[0.4, 1]` is a drawer that
   * opens two fifths shown and is dragged up to the whole. Without any, it is whole.
   */
  snapPoints?: readonly number[] | undefined
  /** Which of them it rests at. */
  snapPoint?: number | undefined
  /** Where it opens. Default: the smallest. */
  defaultSnapPoint?: number | undefined
  onSnapPointChange?: ((snapPoint: number, details: ChangeDetails) => void) | undefined
}

export interface Drawer extends Dialog {
  /** The share of the drawer that shows where it rests: 1 without snap points. */
  readonly snapPoint: ReadonlySignal<number>
  /** Moves it to another of its snap points: what a button or a key of the caller's does. */
  setSnapPoint(snapPoint: number, details: ChangeDetails): void
}

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
 * `--drawer-swipe-progress`), and a snap point how far from whole it rests
 * (`--drawer-snap-point-offset`); moving the drawer by them is the design's, so nothing is
 * written that a design has to beat.
 */
export function createDrawer(props: ReadonlySignal<DrawerProps>): Drawer {
  const dialog = createDialog(props)
  const way = computed(() => props.get().swipeDirection ?? "down")
  /** The places it rests at, the smallest first; the whole drawer when none is given. */
  const points = computed(() => {
    const given = (props.get().snapPoints ?? []).filter((each) => each > 0 && each <= 1)
    return given.length > 0 ? given.toSorted((x, y) => x - y) : [1]
  })
  const snap = bindable<number>({
    value: () => props.get().snapPoint,
    defaultValue: props.peek().defaultSnapPoint ?? points.peek()[0]!,
    onChange: (value, by) => props.peek().onSnapPointChange?.(value, by),
  })
  /** The one of its places nearest what is asked: a caller may hold a value that is none. */
  const resting = computed(() => {
    const wanted = snap.get()
    return points
      .get()
      .reduce((best, each) => (Math.abs(each - wanted) < Math.abs(best - wanted) ? each : best))
  })
  const swiping = signal(false)
  let popup: HTMLElement | undefined
  let backdrop: HTMLElement | undefined
  let drag:
    | {
        x: number
        y: number
        /** How far it has gone towards the edge it closes at; less than nothing is away from it. */
        by: number
        at: number
        speed: number
        size: number
        /** How far it lay from whole when the drag began. */
        from: number
        held: boolean
      }
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

  const length = () => {
    if (!popup) return 0
    const across = way.peek() === "left" || way.peek() === "right"
    return across ? popup.offsetWidth : popup.offsetHeight
  }

  function write(by: number, size: number) {
    const direction = way.peek()
    const across = direction === "left" || direction === "right"
    const sign = direction === "up" || direction === "left" ? -1 : 1
    const progress = String(
      Math.round(Math.min(1, Math.max(0, size > 0 ? by / size : 0)) * 1000) / 1000
    )
    for (const each of [popup, backdrop]) {
      if (!each) continue
      setGeometry(each, "--drawer-swipe-movement-x", `${across ? by * sign : 0}px`)
      setGeometry(each, "--drawer-swipe-movement-y", `${across ? 0 : by * sign}px`)
      setGeometry(each, "--drawer-swipe-progress", progress)
    }
  }

  /** Where it rests, as how far it lies from whole towards the edge it closes at. */
  function rest() {
    const sign = way.peek() === "up" || way.peek() === "left" ? -1 : 1
    const offset = Math.round((1 - resting.peek()) * length() * 100) / 100
    for (const each of [popup, backdrop]) {
      if (each) setGeometry(each, "--drawer-snap-point-offset", `${offset * sign}px`)
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
    if (popup) listen(popup.ownerDocument, false)
  }

  // Heard on the page from the press on: a pointer pressed near the drawer's edge is off the
  // drawer before the drag has taken hold, and the drawer would hear none of it.
  function move(event: PointerEvent) {
    if (!drag) return
    const direction = way.peek()
    const across = direction === "left" || direction === "right"
    const sign = direction === "up" || direction === "left" ? -1 : 1
    const moved = (across ? event.clientX - drag.x : event.clientY - drag.y) * sign
    // Away from its edge, only as far as the largest of its places.
    const most = drag.from - (1 - points.peek().at(-1)!) * drag.size
    const by = Math.max(-most, moved)
    if (!drag.held) {
      if (Math.abs(by) < DRAWER_SLOP) return
      drag.held = true
      swiping.set(true)
      try {
        popup?.setPointerCapture(event.pointerId)
      } catch {
        // A pointer the browser no longer has: the drag goes on while its moves reach.
      }
    }
    const now = performance.now()
    if (now > drag.at) drag.speed = (by - drag.by) / (now - drag.at)
    drag.at = now
    drag.by = by
    write(by, drag.size)
  }

  function release(event: PointerEvent) {
    const ended = drag
    end()
    if (!ended?.held) return
    const all = points.peek()
    const at = all.indexOf(resting.peek())
    const offset = (share: number) => (1 - share) * ended.size
    const lies = ended.from + ended.by
    // A pointer that rested before it was let go was not flicked, however it got there.
    const flicked =
      performance.now() - ended.at <= DRAWER_REST && Math.abs(ended.speed) >= DRAWER_FLICK
    // Where it goes: one of its places, or out (`undefined`).
    let to: number | undefined
    if (flicked) {
      // A place on, the way it was thrown; from the smallest, out.
      to = ended.speed > 0 ? all[at - 1] : (all[at + 1] ?? all[at])
    } else if (lies < offset(all[0]!) + DRAWER_CLOSE * all[0]! * ended.size) {
      to = all.reduce((best, each) =>
        Math.abs(offset(each) - lies) < Math.abs(offset(best) - lies) ? each : best
      )
    }
    const by = details("swipe", event)
    if (to === undefined) {
      dialog.setOpen(false, by)
      // It leaves from where it was let go: how far stays written through its exit.
      if (!by.canceled) return
    } else {
      snap.set(to, by)
    }
    clear()
  }

  function canceled() {
    if (drag?.held) clear()
    end()
  }

  function listen(page: Document, on: boolean) {
    const change = on ? "addEventListener" : "removeEventListener"
    page[change]("pointermove", move as EventListener)
    page[change]("pointerup", release as EventListener)
    page[change]("pointercancel", canceled)
  }

  return {
    ...dialog,
    snapPoint: resting,
    setSnapPoint: (value, by) => snap.set(value, by),
    backdrop: {
      props: computed(() => ({
        ...dialog.backdrop.props.get(),
        "data-swiping": flag(swiping.get()),
      })),
      attach(element) {
        backdrop = element
        const stop = dialog.backdrop.attach(element)
        rest()
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
          const size = length()
          drag = {
            x: event.clientX,
            y: event.clientY,
            by: 0,
            at: performance.now(),
            speed: 0,
            size,
            from: (1 - resting.peek()) * size,
            held: false,
          }
          listen(popup.ownerDocument, true)
        },
      })),
      attach(element) {
        popup = element
        const stop = dialog.popup.attach(element)
        // Its size, for a design that stacks drawers or moves the page behind one; where it
        // rests is a share of it.
        const size = () => {
          setGeometry(element, "--drawer-height", `${element.offsetHeight}px`)
          setGeometry(element, "--drawer-width", `${element.offsetWidth}px`)
          rest()
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
        const rested = effect(() => {
          resting.get()
          way.get()
          rest()
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
          rested()
          element.removeEventListener("click", pressed, true)
          observer.disconnect()
          clearTimeout(later)
          if (popup === element) popup = undefined
        }
      },
    },
  }
}
