import { arrow, autoUpdate, computePosition, flip, offset, shift, size } from "@floating-ui/dom"
import type { Placement, VirtualElement } from "@floating-ui/dom"

import { carryDirection, directionOf } from "../direction.ts"
import type { Direction } from "../direction.ts"
import { batch, computed, effect, signal } from "../reactivity.ts"
import { setGeometry } from "./geometry.ts"
import type { ReadonlySignal, Signal } from "../reactivity.ts"

/** A side of the anchor as the page is drawn. */
export type PhysicalSide = "top" | "right" | "bottom" | "left"
/**
 * The side of its anchor a popup is on. `inline-start` and `inline-end` turn with the reading
 * direction: `inline-end` is the right in English and the left in Arabic.
 */
export type Side = PhysicalSide | "inline-start" | "inline-end"
/** Where along its side a popup is: at the anchor's start, its centre or its end. */
export type Align = "start" | "center" | "end"

/** What a popup is placed against: an element, or a place in the viewport that is none. */
export type Anchor = Element | VirtualElement

/**
 * A positioner's own anchor: an element, a place in the viewport (`getBoundingClientRect`), or
 * a function that gives one, asked each time the popup is placed. `null`, `undefined` or a
 * function that gives neither: the popup's own anchor, its trigger.
 */
export type AnchorOption = Anchor | null | undefined | (() => Anchor | null | undefined)

/** How a popup is placed against its anchor: what every positioner takes. */
export interface PositionOptions {
  /**
   * The side of the anchor the popup is on. `inline-start` and `inline-end` follow the reading
   * direction the popup is placed in, and `data-side` then says the side in the same words.
   */
  side: Side
  /** Where along that side the popup is: at the anchor's start, its centre or its end. */
  align: Align
  /** The gap between the anchor and the popup, measured without any arrow. */
  sideOffset: number
  /** How far the popup is moved along the side from where `align` puts it, in pixels. */
  alignOffset: number
  /** Kept between the popup and the viewport's edges. */
  collisionPadding: number
  /**
   * What the popup is placed against, when that is not its trigger. It may change while the
   * popup is open: the popup then follows the new one.
   */
  anchor?: AnchorOption
}

export const POSITION_DEFAULTS: PositionOptions = {
  side: "bottom",
  align: "center",
  sideOffset: 0,
  alignOffset: 0,
  collisionPadding: 5,
}

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
   * when left out): a popup on its way out stays where it was. The anchor may be a function,
   * asked each time the popup is placed; the options' own `anchor` comes before it. Returns
   * the stop.
   */
  attach(
    positioner: HTMLElement,
    anchor: Anchor | (() => Anchor | undefined),
    following?: ReadonlySignal<boolean>
  ): () => void
  /** Places it again now: its anchor is a point that moved, or another element. */
  refresh(): void
  /**
   * An element that points at the anchor. It is placed along the popup's edge (`left` or `top`);
   * which edge it sits on is the design's, from `data-side`. Returns the removal.
   */
  arrow(element: HTMLElement): () => void
}

function placement(side: PhysicalSide, align: Align): Placement {
  return (align === "center" ? side : `${side}-${align}`) as Placement
}

/** The side of the page a side is, in a reading direction. */
function physical(side: Side, rtl: boolean): PhysicalSide {
  if (side === "inline-end") return rtl ? "left" : "right"
  if (side === "inline-start") return rtl ? "right" : "left"
  return side
}

/** The side a popup landed on, in the words it was asked for in: a logical side stays logical. */
function landed(asked: Side, side: PhysicalSide, rtl: boolean): Side {
  if (asked !== "inline-start" && asked !== "inline-end") return side
  if (side === "top" || side === "bottom") return side
  return (side === "right") === rtl ? "inline-start" : "inline-end"
}

const NOTHING = () => {}

/** Whether two anchors are followed the same way: one element, or places read from one element. */
function same(a: Anchor | undefined, b: Anchor | undefined): boolean {
  if (a === b) return true
  if (!a || !b || a instanceof Element || b instanceof Element) return false
  return a.contextElement === b.contextElement
}

const ORIGIN: Record<PhysicalSide, (x: string, y: string) => string> = {
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
 *
 * A logical side is read in `direction` (a provider's) when it is given, and in the direction
 * the anchor is laid out in otherwise.
 */
export function createPosition(
  options: ReadonlySignal<PositionOptions>,
  direction?: ReadonlySignal<Direction>
): Position {
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
    attach(positioner, given, following) {
      setGeometry(positioner, "position", "absolute")
      setGeometry(positioner, "left", "0px")
      setGeometry(positioner, "top", "0px")
      // The first placement resolves in a microtask, before anything is drawn: the positioner is
      // never hidden for it, so the popup inside can take focus as soon as it attaches.

      let reference = { x: 0, y: 0, width: 0, height: 0 }
      const own = typeof given === "function" ? given : () => given
      // The anchor that is followed now, and the element whose direction the positioner took.
      let watched: Anchor | undefined
      // Which anchor an answer was asked for: counted, since a place in the viewport may be a
      // new object each time it is asked for.
      let round = 0
      let unwatch: (() => void) | undefined
      let carried: Element | undefined
      let forget = NOTHING
      // A function that gave nothing is asked once more.
      let again: unknown

      /** The positioner's own anchor, then the popup's. */
      const resolve = (): Anchor | undefined => {
        const asked = options.peek().anchor
        const found = typeof asked === "function" ? asked() : asked
        if (found) return found
        if (typeof asked === "function" && again !== asked) {
          // A framework hands an element over in its own time: the popup may be in the page a
          // moment before what it is to be placed against.
          again = asked
          queueMicrotask(() => {
            if (stop && options.peek().anchor === asked) update()
          })
        }
        return own()
      }

      /** Follows another anchor, or none: its scrolling, its size, where the page puts it. */
      const watch = (anchor: Anchor | undefined) => {
        unwatch?.()
        unwatch = undefined
        watched = anchor
        round++
        if (!anchor) return
        // Before it is placed: `start` and `end` are read in the popup's own direction.
        const from: Element | undefined = anchor instanceof Element ? anchor : anchor.contextElement
        if (from !== carried) {
          forget()
          carried = from
          forget = from ? carryDirection(positioner, from) : NOTHING
        }
        unwatch = autoUpdate(anchor, positioner, update)
      }

      const update = () => {
        const anchor = resolve()
        // Another anchor than the one followed: following it places the popup.
        if (!same(anchor, watched)) return watch(anchor)
        if (!anchor) return
        const asked = round
        const wanted = options.peek()
        // Read on the positioner, which took its anchor's direction: `start` and `end` are read
        // there too.
        const rtl = directionOf(positioner, direction) === "rtl"
        void computePosition(anchor, positioner, {
          placement: placement(physical(wanted.side, rtl), wanted.align),
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
          // No longer followed, or against another anchor by now: an answer that comes late
          // must not move it.
          if (!stop || asked !== round) return
          const [nextSide, nextAlign = "center"] = result.placement.split("-") as [
            PhysicalSide,
            Align?,
          ]
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
            // Asked for by a logical side, it says a logical side: on whichever it landed.
            side.set(landed(wanted.side, nextSide, rtl))
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
          // An arrow that attaches after its positioner is placed with it from then on.
          replace = update
          const unsubscribes = [
            // Placed again when the caller asks for another side, gap or anchor.
            options.subscribe(update),
            // And when the page is said to read the other way.
            direction?.subscribe(update) ?? NOTHING,
          ]
          stop = () => {
            unwatch?.()
            unwatch = undefined
            watched = undefined
            round++
            for (const each of unsubscribes) each()
            replace = undefined
          }
          watch(resolve())
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
    a.collisionPadding === b.collisionPadding &&
    a.anchor === b.anchor
  )
}

/** A popup's place: the service, and where its positioner part's adapter writes its own props. */
export interface PopupPlacement {
  readonly position: Position
  readonly positioning: Signal<Partial<PositionOptions>>
}

/**
 * A place against a trigger, with a kind's own defaults under what its positioner asks for. The
 * defaults may be read from signals: a menu in a bar that is a column opens beside its trigger.
 * `direction` is the provider's the component is inside, when it is inside one: what a logical
 * side is read in.
 */
export function createPlacement(
  defaults: Partial<PositionOptions> | (() => Partial<PositionOptions>) = {},
  direction?: ReadonlySignal<Direction>
): PopupPlacement {
  const positioning = signal<Partial<PositionOptions>>({})
  const own = typeof defaults === "function" ? defaults : () => defaults
  const position = createPosition(
    computed(() => ({ ...POSITION_DEFAULTS, ...own(), ...positioning.get() }), sameOptions),
    direction
  )
  return { position, positioning }
}
