import { arrow, autoUpdate, computePosition, flip, offset, shift, size } from "@floating-ui/dom"
import type { Placement, VirtualElement } from "@floating-ui/dom"

import { carryDirection } from "../direction.ts"
import { batch, computed, effect, signal } from "../reactivity.ts"
import { setGeometry } from "./geometry.ts"
import type { ReadonlySignal, Signal } from "../reactivity.ts"

export type Side = "top" | "right" | "bottom" | "left"
export type Align = "start" | "center" | "end"

export interface PositionOptions {
  side: Side
  align: Align
  /** The gap between the anchor and the popup, measured without any arrow. */
  sideOffset: number
  alignOffset: number
  /** Kept between the popup and the viewport's edges. */
  collisionPadding: number
}

export const POSITION_DEFAULTS: PositionOptions = {
  side: "bottom",
  align: "center",
  sideOffset: 0,
  alignOffset: 0,
  collisionPadding: 5,
}

/** What a popup is placed against: an element, or a place in the viewport that is none. */
export type Anchor = Element | VirtualElement

/** A point of the viewport as an anchor; `from` is the element it was pressed in. */
export function pointAnchor(read: () => { x: number; y: number }, from?: Element): Anchor {
  return {
    getBoundingClientRect() {
      const { x, y } = read()
      return new DOMRect(x, y, 0, 0)
    },
    ...(from ? { contextElement: from } : {}),
  }
}

export interface Position {
  /** The side the popup ended on, which a flip can change. */
  readonly side: ReadonlySignal<Side>
  readonly align: ReadonlySignal<Align>
  /** Whether the first placement has been written. */
  readonly placed: ReadonlySignal<boolean>
  /** Whether the arrow could not sit at the anchor's centre: the popup was pushed along its edge. */
  readonly uncentered: ReadonlySignal<boolean>
  /**
   * Places `positioner` against `anchor` and keeps it placed, while `following` holds (always,
   * when left out): a popup on its way out stays where it was. Returns the stop.
   */
  attach(positioner: HTMLElement, anchor: Anchor, following?: ReadonlySignal<boolean>): () => void
  /** Places it again now: its anchor is a point that moved. */
  refresh(): void
  /**
   * An element that points at the anchor. It is placed along the popup's edge (`left` or `top`);
   * which edge it sits on is the design's, from `data-side`. Returns the removal.
   */
  arrow(element: HTMLElement): () => void
}

function placement(side: Side, align: Align): Placement {
  return (align === "center" ? side : `${side}-${align}`) as Placement
}

const ORIGIN: Record<Side, (x: string, y: string) => string> = {
  top: (x) => `${x} 100%`,
  bottom: (x) => `${x} 0%`,
  left: (_x, y) => `100% ${y}`,
  right: (_x, y) => `0% ${y}`,
}

/**
 * Places a popup's positioner with Floating UI and writes Base UI's geometry on it:
 * `--anchor-width`, `--anchor-height`, `--available-width`, `--available-height`,
 * `--transform-origin`, and the position itself. These are the only inline styles the library
 * writes. The side and alignment are state, for the parts' `data-side` and `data-align`.
 */
export function createPosition(options: ReadonlySignal<PositionOptions>): Position {
  const side = signal<Side>(options.peek().side)
  const align = signal<Align>(options.peek().align)
  const placed = signal(false)
  const uncentered = signal(false)
  let pointer: HTMLElement | undefined
  let replace: (() => void) | undefined

  return {
    side,
    align,
    placed,
    uncentered,
    arrow(element) {
      pointer = element
      setGeometry(element, "position", "absolute")
      replace?.()
      return () => {
        if (pointer === element) pointer = undefined
      }
    },
    refresh: () => replace?.(),
    attach(positioner, anchor, following) {
      setGeometry(positioner, "position", "absolute")
      setGeometry(positioner, "left", "0px")
      setGeometry(positioner, "top", "0px")
      // Before it is placed: `start` and `end` are read in the popup's own direction.
      const from = anchor instanceof Element ? anchor : anchor.contextElement
      const forget = from ? carryDirection(positioner, from) : () => {}
      // The first placement resolves in a microtask, before anything is drawn: the positioner is
      // never hidden for it, so the popup inside can take focus as soon as it attaches.

      let reference = { x: 0, y: 0, width: 0, height: 0 }

      const update = () => {
        const wanted = options.peek()
        void computePosition(anchor, positioner, {
          placement: placement(wanted.side, wanted.align),
          strategy: "absolute",
          middleware: [
            offset({ mainAxis: wanted.sideOffset, crossAxis: wanted.alignOffset }),
            flip({ padding: wanted.collisionPadding }),
            shift({ padding: wanted.collisionPadding }),
            size({
              padding: wanted.collisionPadding,
              apply({ availableWidth, availableHeight, rects }) {
                reference = rects.reference
                setGeometry(positioner, "--available-width", `${Math.max(0, availableWidth)}px`)
                setGeometry(positioner, "--available-height", `${Math.max(0, availableHeight)}px`)
                setGeometry(positioner, "--anchor-width", `${rects.reference.width}px`)
                setGeometry(positioner, "--anchor-height", `${rects.reference.height}px`)
              },
            }),
            ...(pointer ? [arrow({ element: pointer, padding: 4 })] : []),
          ],
        }).then((result) => {
          const [nextSide, nextAlign = "center"] = result.placement.split("-") as [Side, Align?]
          // Whole device pixels: a popup on a half pixel is drawn blurred.
          const ratio = positioner.ownerDocument.defaultView?.devicePixelRatio ?? 1
          const x = Math.round(result.x * ratio) / ratio
          const y = Math.round(result.y * ratio) / ratio
          setGeometry(positioner, "transform", `translate(${x}px, ${y}px)`)
          const anchorX = reference.x + reference.width / 2 - result.x
          const anchorY = reference.y + reference.height / 2 - result.y
          setGeometry(
            positioner,
            "--transform-origin",
            ORIGIN[nextSide](`${anchorX}px`, `${anchorY}px`)
          )
          const point = result.middlewareData.arrow
          if (pointer && point) {
            // Along the edge only: across it, the arrow sits where the design puts it.
            if (point.x !== undefined) setGeometry(pointer, "left", `${point.x}px`)
            if (point.y !== undefined) setGeometry(pointer, "top", `${point.y}px`)
          }
          batch(() => {
            side.set(nextSide)
            align.set(nextAlign)
            uncentered.set(Boolean(point && point.centerOffset !== 0))
            placed.set(true)
          })
        })
      }

      // Followed only while the popup is open. On its way out it keeps its place: its anchor may
      // be moving or shrinking by then (a submenu's trigger, in a menu that is scaling away),
      // and a popup sized from its anchor would be resized on every frame of that, inside the
      // observer that watches its size.
      let stop: (() => void) | undefined
      const follow = (on: boolean) => {
        if (on && !stop) {
          const unwatch = autoUpdate(anchor, positioner, update)
          // An arrow that attaches after its positioner is placed with it from then on.
          replace = update
          // Placed again when the caller asks for another side or gap.
          const unsubscribe = options.subscribe(update)
          stop = () => {
            unwatch()
            unsubscribe()
            replace = undefined
          }
        } else if (!on && stop) {
          stop()
          stop = undefined
        }
      }
      const unfollow = following ? effect(() => follow(following.get())) : (follow(true), undefined)
      return () => {
        unfollow?.()
        follow(false)
        forget()
        placed.set(false)
      }
    },
  }
}

export function sameOptions(a: PositionOptions, b: PositionOptions): boolean {
  return (
    a.side === b.side &&
    a.align === b.align &&
    a.sideOffset === b.sideOffset &&
    a.alignOffset === b.alignOffset &&
    a.collisionPadding === b.collisionPadding
  )
}

/** A popup's place: the service, and where its positioner part's adapter writes its own props. */
export interface PopupPlacement {
  readonly position: Position
  readonly positioning: Signal<Partial<PositionOptions>>
}

/**
 * A place against a trigger, with a kind's own defaults under what its positioner asks for. The
 * defaults may be read from signals: a submenu's side follows the reading direction.
 */
export function createPlacement(
  defaults: Partial<PositionOptions> | (() => Partial<PositionOptions>) = {}
): PopupPlacement {
  const positioning = signal<Partial<PositionOptions>>({})
  const own = typeof defaults === "function" ? defaults : () => defaults
  const position = createPosition(
    computed(() => ({ ...POSITION_DEFAULTS, ...own(), ...positioning.get() }), sameOptions)
  )
  return { position, positioning }
}
