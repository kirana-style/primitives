import { details } from "../part.ts"
import type { ChangeDetails } from "../part.ts"
import { signal } from "../reactivity.ts"
import type { ReadonlySignal, Signal } from "../reactivity.ts"
import { clearGeometry, setGeometry } from "./geometry.ts"

/** The way a sheet is swiped to close it: towards the edge it came from. */
export type SwipeSide = "up" | "down" | "left" | "right"

/** How far a press moves before it is a drag, in pixels. */
export const DRAWER_SLOP = 4
/** The part of the sheet's size a drag passes to close it when let go. */
export const DRAWER_CLOSE = 0.25
/** The speed, in pixels a millisecond, at which letting go closes it whatever the distance. */
export const DRAWER_FLICK = 0.5
/** How long a pointer is still before letting go is no flick, in milliseconds. */
export const DRAWER_REST = 80

/** The sheet that is being dragged, while one is. */
export const dragging = signal<HTMLElement | undefined>(undefined)

/**
 * How long a sheet let go takes to come to rest, as a share of the design's own time: one
 * thrown hard arrives sooner. Base UI's measure.
 */
function strength(speed: number, remaining: number): number {
  if (speed <= 0.2) return 1
  const time = Math.min(360, Math.max(80, remaining / Math.min(4, speed)))
  return Math.round((0.1 + ((time - 80) / 280) * 0.9) * 1000) / 1000
}

const CONTROLS = "input, textarea, select, [contenteditable], [data-drawer-no-drag]"

export interface SwipeOptions {
  /** The way it is dragged to close it. */
  way(): SwipeSide
  /** The shares of itself it rests at, the smallest first: `[1]` for one that is only whole. */
  points(): readonly number[]
  /** The share of itself it rests at now. */
  resting(): number
  /** Let go nearer another of its places: it rests there. */
  settle(share: number, by: ChangeDetails): void
  /** Let go past the smallest of them: it closes. Says whether it did. */
  close(by: ChangeDetails): boolean
}

export interface Swipe {
  readonly swiping: ReadonlySignal<boolean>
  /** Whether a drag closed it: it then leaves from where it was let go. */
  readonly dismissed: Signal<boolean>
  /** The dragged element's `onPointerDown`. */
  press(event: PointerEvent): void
  /** The dragged element: what is measured, and whose click after a drag is no press. */
  attach(element: HTMLElement): () => void
  /** Another element the drag is written on: a backdrop. */
  also(element: HTMLElement): () => void
  /** Its length along the way it is dragged, once it is in the page. */
  length(): number
  /** The elements the drag is written on. */
  written(): HTMLElement[]
  /** Takes how far it was dragged off: opened again, it begins where it lies. */
  clear(): void
}

/**
 * A sheet dragged back to the edge it came from, by a drawer or a list opened as a sheet. The
 * drag only says how far it has gone (`--drawer-swipe-movement-x/y`, `--drawer-swipe-progress`)
 * and, once let go, how soon it should be at rest (`--drawer-swipe-strength`); moving the sheet
 * by them is the design's. A drag's moves are heard on the document from the press on.
 */
export function createSwipe(options: SwipeOptions): Swipe {
  const swiping = signal(false)
  const dismissed = signal(false)
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
  function scrolls(target: Element | null, direction: SwipeSide): boolean {
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
    const across = options.way() === "left" || options.way() === "right"
    return across ? popup.offsetWidth : popup.offsetHeight
  }

  const written = () => [popup, backdrop].filter((each): each is HTMLElement => Boolean(each))

  function write(by: number, size: number) {
    const direction = options.way()
    const across = direction === "left" || direction === "right"
    const sign = direction === "up" || direction === "left" ? -1 : 1
    const progress = String(
      Math.round(Math.min(1, Math.max(0, size > 0 ? by / size : 0)) * 1000) / 1000
    )
    for (const each of written()) {
      setGeometry(each, "--drawer-swipe-movement-x", `${across ? by * sign : 0}px`)
      setGeometry(each, "--drawer-swipe-movement-y", `${across ? 0 : by * sign}px`)
      setGeometry(each, "--drawer-swipe-progress", progress)
    }
  }

  function clear() {
    for (const each of written()) {
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

  // Heard on the page from the press on: a pointer pressed near the sheet's edge is off the
  // sheet before the drag has taken hold, and the sheet would hear none of it.
  function move(event: PointerEvent) {
    if (!drag) return
    const direction = options.way()
    const across = direction === "left" || direction === "right"
    const sign = direction === "up" || direction === "left" ? -1 : 1
    const moved = (across ? event.clientX - drag.x : event.clientY - drag.y) * sign
    // Away from its edge, only as far as the largest of its places.
    const most = drag.from - (1 - options.points().at(-1)!) * drag.size
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
    const all = options.points()
    const at = all.indexOf(options.resting())
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
      // It leaves from where it was let go: how far stays written through its exit.
      if (options.close(by)) return dismissed.set(true)
    } else {
      options.settle(to, by)
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
    swiping,
    dismissed,
    length,
    written,
    clear,
    press(event) {
      if (event.button !== 0 || !popup) return
      const target = event.target as Element | null
      // Text is typed and selected in a field, not dragged; and what scrolls, scrolls.
      dragged = false
      if (target?.closest(CONTROLS) || scrolls(target, options.way())) return
      const size = length()
      drag = {
        x: event.clientX,
        y: event.clientY,
        by: 0,
        at: performance.now(),
        speed: 0,
        size,
        from: (1 - options.resting()) * size,
        held: false,
      }
      listen(popup.ownerDocument, true)
    },
    attach(element) {
      popup = element
      // Before anything inside hears it, a framework's own listeners included.
      const pressed = (event: Event) => {
        if (!dragged) return
        dragged = false
        event.stopPropagation()
        event.preventDefault()
      }
      element.addEventListener("click", pressed, true)
      return () => {
        element.removeEventListener("click", pressed, true)
        if (drag && popup === element) canceled()
        if (popup === element) popup = undefined
      }
    },
    also(element) {
      backdrop = element
      return () => {
        if (backdrop === element) backdrop = undefined
      }
    },
  }
}
