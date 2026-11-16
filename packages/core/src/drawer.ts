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
   * Places it rests at, each how much of itself shows: a share (`0.4`, or `"40%"`) or a
   * length (`"148px"`, `"20rem"`). `[0.4, 1]` is a drawer that opens two fifths shown and is
   * dragged up to the whole. Without any, it is whole.
   */
  snapPoints?: readonly DrawerSnapPoint[] | undefined
  /** Which of them it rests at, as it was given. */
  snapPoint?: DrawerSnapPoint | undefined
  /** Where it opens. Default: the smallest. */
  defaultSnapPoint?: DrawerSnapPoint | undefined
  onSnapPointChange?: ((snapPoint: DrawerSnapPoint, details: ChangeDetails) => void) | undefined
}

/** How much of a drawer shows at a place it rests: a share of it, or a length. */
export type DrawerSnapPoint = number | string

export interface Drawer extends Dialog {
  /** The share of the drawer that shows where it rests: 1 without snap points. */
  readonly snapPoint: ReadonlySignal<number>
  /** Moves it to another of its snap points: what a button or a key of the caller's does. */
  setSnapPoint(snapPoint: DrawerSnapPoint, details: ChangeDetails): void
}

/** How far a press moves before it is a drag, in pixels. */
export const DRAWER_SLOP = 4
/** The part of the drawer's size a drag passes to close it when let go. */
export const DRAWER_CLOSE = 0.25
/** The speed, in pixels a millisecond, at which letting go closes it whatever the distance. */
export const DRAWER_FLICK = 0.5

/** How long a pointer is still before letting go is no flick, in milliseconds. */
export const DRAWER_REST = 80

// The drawers that are open, in the order they opened: one that opens over another is drawn
// by what the one under it says of it (how many there are, how tall the frontmost is).
const stack = signal<readonly HTMLElement[]>([])
// The drawer that is being dragged, while one is.
const dragging = signal<HTMLElement | undefined>(undefined)

/**
 * How long a drawer let go takes to come to rest, as a share of the design's own time: a
 * drawer thrown hard arrives sooner. Base UI's measure.
 */
function strength(speed: number, remaining: number): number {
  if (speed <= 0.2) return 1
  const time = Math.min(360, Math.max(80, remaining / Math.min(4, speed)))
  return Math.round((0.1 + ((time - 80) / 280) * 0.9) * 1000) / 1000
}

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
  // Its length along the way it is dragged, once it is in the page: a length is a share of it.
  const extent = signal(0)
  /** A place as the share of the drawer that shows. A length is one once the drawer is measured. */
  function shareOf(given: DrawerSnapPoint): number {
    if (typeof given === "number") return given
    const amount = Number.parseFloat(given)
    if (!Number.isFinite(amount)) return 1
    if (given.endsWith("%")) return amount / 100
    const size = extent.get()
    // Not measured (a server, or before it is drawn): whole, and placed once it is.
    if (size <= 0) return 1
    const root =
      given.endsWith("rem") && typeof document !== "undefined"
        ? Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
        : 1
    return Math.min(1, (amount * root) / size)
  }
  /** The places it rests at as given, by their shares; the whole drawer when none is given. */
  const places = computed(() => {
    const given = (props.get().snapPoints ?? [])
      .map((each) => ({ given: each, share: shareOf(each) }))
      .filter((each) => each.share > 0 && each.share <= 1)
    return given.length > 0
      ? given.toSorted((x, y) => x.share - y.share)
      : [{ given: 1 as DrawerSnapPoint, share: 1 }]
  })
  /** Their shares, the smallest first. */
  const points = computed(() => places.get().map((each) => each.share))
  // With none asked for it rests at the smallest, which for a length is known once the
  // drawer has been measured: so "none" is kept, not answered early.
  const snap = bindable<DrawerSnapPoint | undefined>({
    value: () => props.get().snapPoint,
    defaultValue: props.peek().defaultSnapPoint,
    onChange: (value, by) => value !== undefined && props.peek().onSnapPointChange?.(value, by),
  })
  /** The one of its places nearest what is asked: a caller may hold a value that is none. */
  const resting = computed(() => {
    const asked = snap.get()
    if (asked === undefined) return points.get()[0]!
    const wanted = shareOf(asked)
    return points
      .get()
      .reduce((best, each) => (Math.abs(each - wanted) < Math.abs(best - wanted) ? each : best))
  })
  /** A place as the caller wrote it. */
  const givenOf = (share: number) =>
    places.peek().find((each) => each.share === share)?.given ?? share
  const swiping = signal(false)
  // Whether a drag closed it: it then leaves from where it was let go.
  const dismissed = signal(false)
  const own = signal<HTMLElement | undefined>(undefined)
  /** How many drawers are open over this one, and whether one of them is being dragged. */
  const over = computed(() => {
    const all = stack.get()
    const at = own.get() ? all.indexOf(own.get()!) : -1
    const above = at < 0 ? [] : all.slice(at + 1)
    const held = dragging.get()
    return { count: above.length, swiping: Boolean(held && above.includes(held)) }
  })
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
    if (dragging.peek() === popup) dragging.set(undefined)
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
      dragging.set(popup)
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
    const moving = performance.now() - ended.at <= DRAWER_REST
    const flicked = moving && Math.abs(ended.speed) >= DRAWER_FLICK
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
    // How far it has left to go, and so how soon it should be there.
    const left = to === undefined ? ended.size - lies : Math.abs(offset(to) - lies)
    if (popup) {
      // Let go at rest, it was not thrown, however fast it got there.
      const speed = moving ? Math.abs(ended.speed) : 0
      setGeometry(popup, "--drawer-swipe-strength", String(strength(speed, left)))
    }
    if (to === undefined) {
      dialog.setOpen(false, by)
      // It leaves from where it was let go: how far stays written through its exit.
      if (!by.canceled) return dismissed.set(true)
    } else {
      snap.set(givenOf(to), by)
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
        "data-swipe-dismiss": flag(dismissed.get()),
        "data-expanded": flag((props.get().snapPoints?.length ?? 0) > 0 && resting.get() === 1),
        "data-nested-drawer-open": flag(over.get().count > 0),
        "data-nested-drawer-swiping": flag(over.get().swiping),
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
        own.set(element)
        const stop = dialog.popup.attach(element)
        // In the stack while it is open: a drawer on its way out is no longer over another.
        const stacked = effect(() => {
          const on = dialog.open.get()
          const all = stack.peek()
          if (on === all.includes(element)) return
          stack.set(on ? [...all, element] : all.filter((each) => each !== element))
        })
        // What a design that stacks drawers reads on each: how many are over it, and how tall
        // the frontmost is (its own height, when it is the frontmost).
        const counted = effect(() => {
          const all = stack.get()
          setGeometry(element, "--nested-drawers", String(over.get().count))
          const front = all.includes(element) ? all.at(-1) : undefined
          if (front) setGeometry(element, "--drawer-frontmost-height", `${front.offsetHeight}px`)
          else clearGeometry(element, "--drawer-frontmost-height")
        })
        // Its size, for a design that stacks drawers or moves the page behind one; where it
        // rests is a share of it.
        const size = () => {
          extent.set(length())
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
          if (!dialog.open.get()) return
          clear()
          dismissed.set(false)
          clearGeometry(element, "--drawer-swipe-strength")
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
          stacked()
          counted()
          if (stack.peek().includes(element)) {
            stack.set(stack.peek().filter((each) => each !== element))
          }
          if (own.peek() === element) own.set(undefined)
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
