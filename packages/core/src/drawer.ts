import { createDialog } from "./dialog.ts"
import type { Dialog, DialogProps } from "./dialog.ts"
import type { DirectionAround } from "./direction.ts"
import { bindable } from "./bindable.ts"
import { flag } from "./part.ts"
import type { ChangeDetails } from "./part.ts"
import { computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { clearGeometry, setGeometry } from "./services/geometry.ts"
import { createSwipe, dragging } from "./services/swipe.ts"

/** The way a drawer is swiped to close it: towards the edge it came from. */
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
  /**
   * Heard as it is about to rest at another snap point: `details.cancel()` keeps it where it was.
   */
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

export { DRAWER_CLOSE, DRAWER_FLICK, DRAWER_REST, DRAWER_SLOP } from "./services/swipe.ts"

// The drawers that are open, in the order they opened: one that opens over another is drawn
// by what the one under it says of it (how many there are, how tall the frontmost is).
const stack = signal<readonly HTMLElement[]>([])

/**
 * A dialog that comes from an edge and is dragged back to it. Everything a dialog does, it
 * does: the same focus (its first tabbable element), the same press outside on its backdrop,
 * the same stack. The drag only says how far it has gone (`--drawer-swipe-movement-x/y`,
 * `--drawer-swipe-progress`), and a snap point how far from whole it rests
 * (`--drawer-snap-point-offset`); moving the drawer by them is the design's, so nothing is
 * written that a design has to beat.
 */
export function createDrawer(
  props: ReadonlySignal<DrawerProps>,
  around: DirectionAround = {}
): Drawer {
  const dialog = createDialog(props, around)
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
  const swipe = createSwipe({
    way: () => way.peek(),
    points: () => points.peek(),
    resting: () => resting.peek(),
    settle: (share, by) => snap.set(givenOf(share), by),
    close(by) {
      dialog.setOpen(false, by)
      return !by.canceled
    },
  })
  const { swiping, dismissed } = swipe
  const own = signal<HTMLElement | undefined>(undefined)
  /** How many drawers are open over this one, and whether one of them is being dragged. */
  const over = computed(() => {
    const all = stack.get()
    const at = own.get() ? all.indexOf(own.get()!) : -1
    const above = at < 0 ? [] : all.slice(at + 1)
    const held = dragging.get()
    return { count: above.length, swiping: Boolean(held && above.includes(held)) }
  })
  /** Where it rests, as how far it lies from whole towards the edge it closes at. */
  function rest() {
    const sign = way.peek() === "up" || way.peek() === "left" ? -1 : 1
    const offset = Math.round((1 - resting.peek()) * swipe.length() * 100) / 100
    for (const each of swipe.written()) {
      setGeometry(each, "--drawer-snap-point-offset", `${offset * sign}px`)
    }
  }

  return {
    ...dialog,
    snapPoint: resting,
    setSnapPoint: (value, by) => snap.set(value, by),
    backdrop: {
      props: computed(() => ({
        ...dialog.backdrop.props.get(),
        "data-swiping": flag(swiping.get()),
        "data-swipe-dismiss": flag(dismissed.get()),
      })),
      attach(element) {
        // Base UI's backdrop always says 1: a design times the backdrop's exit by it, as the
        // drawer's, and the drawer alone is thrown.
        setGeometry(element, "--drawer-swipe-strength", "1")
        const stops = [
          swipe.also(element),
          dialog.backdrop.attach(element),
          // While the drawer is dragged, how tall the frontmost drawer is: a design fades the
          // backdrop by how much of that the drag has uncovered.
          effect(() => {
            const front = swiping.get() ? (stack.get().at(-1) ?? own.get()) : undefined
            if (front) setGeometry(element, "--drawer-height", `${front.offsetHeight}px`)
            else clearGeometry(element, "--drawer-height")
          }),
        ]
        rest()
        return () => {
          for (const stop of stops.reverse()) stop()
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
        onPointerDown: swipe.press,
      })),
      attach(element) {
        own.set(element)
        const held = swipe.attach(element)
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
          extent.set(swipe.length())
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
          swipe.clear()
          dismissed.set(false)
          clearGeometry(element, "--drawer-swipe-strength")
        })
        const rested = effect(() => {
          resting.get()
          way.get()
          rest()
        })
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
          held()
          observer.disconnect()
          clearTimeout(later)
        }
      },
    },
  }
}
