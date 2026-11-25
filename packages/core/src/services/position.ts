import {
  arrow,
  autoUpdate,
  computePosition,
  detectOverflow,
  flip,
  limitShift,
  offset,
  shift,
  size,
} from "@floating-ui/dom"
import type { Middleware, MiddlewareState, Placement, VirtualElement } from "@floating-ui/dom"

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

/** What an offset given as a function is told: where the popup is, and the two sizes. */
export interface OffsetData {
  /** The side of the anchor the popup is on, in the words it was asked for in. */
  side: Side
  /** Where along that side the popup is. */
  align: Align
  /** The anchor's size, in pixels. */
  anchor: { width: number; height: number }
  /** The positioner's size, in pixels. */
  positioner: { width: number; height: number }
}

/** A gap worked out from what was measured: `({ side, align, anchor, positioner }) => number`. */
export type OffsetFunction = (data: OffsetData) => number

/** The room kept between a popup and the edges it is held inside: one number, or one a side. */
export type CollisionPadding = number | Partial<Record<PhysicalSide, number>>

/**
 * What a popup is held inside: the ancestors that clip it (`"clipping-ancestors"`), an element,
 * several, or a rectangle of the viewport.
 */
export type CollisionBoundary =
  | "clipping-ancestors"
  | Element
  | Element[]
  | { x: number; y: number; width: number; height: number }

/** What a popup does when it does not fit where it was asked to be. */
export interface CollisionAvoidance {
  /**
   * Across from the anchor: `"flip"` goes to the opposite side, `"shift"` keeps the side and
   * moves over the anchor to stay in view, `"none"` lets it overflow. Default `"flip"`.
   */
  side?: "flip" | "shift" | "none" | undefined
  /**
   * Along its side: `"flip"` swaps `start` and `end`, `"shift"` moves the popup along the side
   * to stay in view, `"none"` lets it overflow. Default `"flip"`. With `side: "shift"` it is
   * `"shift"` or `"none"`.
   */
  align?: "flip" | "shift" | "none" | undefined
  /**
   * Where it goes when neither the side asked for nor its opposite fits: to the other axis,
   * its `"start"` or its `"end"` first, or nowhere (`"none"`). Default `"end"`.
   */
  fallbackAxisSide?: "start" | "end" | "none" | undefined
}

/** How a popup is placed against its anchor: what every positioner takes. */
export interface PositionOptions {
  /**
   * The side of the anchor the popup is on. `inline-start` and `inline-end` follow the reading
   * direction the popup is placed in, and `data-side` then says the side in the same words.
   */
  side: Side
  /** Where along that side the popup is: at the anchor's start, its centre or its end. */
  align: Align
  /**
   * The gap between the anchor and the popup, measured without any arrow: a number of pixels,
   * or a function of what was measured (`({ side, align, anchor, positioner }) => number`).
   */
  sideOffset: number | OffsetFunction
  /**
   * How far the popup is moved along the side from where `align` puts it: a number of pixels,
   * or a function of what was measured (`({ side, align, anchor, positioner }) => number`).
   */
  alignOffset: number | OffsetFunction
  /**
   * Kept between the popup and the edges it is held inside: one number, or one for each side
   * (`{ top, right, bottom, left }`, a side left out is 0).
   */
  collisionPadding: CollisionPadding
  /**
   * What the popup is held inside: an element, several, or a rectangle of the viewport. Left
   * out or `"clipping-ancestors"`: the ancestors that clip it, and the viewport.
   */
  collisionBoundary?: CollisionBoundary | undefined
  /**
   * What the popup does when it does not fit: `side` and `align` each `"flip"`, `"shift"` or
   * `"none"`, and `fallbackAxisSide`. Left out: it flips to the opposite side and is moved
   * along its side.
   */
  collisionAvoidance?: CollisionAvoidance | undefined
  /**
   * Keeps the popup in view once its anchor has been scrolled out of it. Otherwise the popup
   * leaves with its anchor.
   */
  sticky: boolean
  /**
   * Kept between an arrow and the ends of the popup's edge, so the arrow does not stand on a
   * rounded corner.
   */
  arrowPadding: number
  /** The CSS `position` the positioner is given: `"absolute"` or `"fixed"`. */
  positionMethod: "absolute" | "fixed"
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
  sticky: false,
  arrowPadding: 5,
  positionMethod: "absolute",
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
  /** Whether the anchor is out of view: scrolled away, clipped by a box around it, or not drawn. */
  readonly anchorHidden: ReadonlySignal<boolean>
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

/**
 * Says whether the anchor is out of view: wholly past an edge of what clips it, or drawn
 * nowhere (a box of no size at the page's corner, which is what an element that is not
 * displayed measures). Base UI's own test, so `data-anchor-hidden` comes and goes when it does.
 */
const hidden: Middleware = {
  name: "hide",
  async fn(state) {
    const { width, height, x, y } = state.rects.reference
    const nowhere = width === 0 && height === 0 && x === 0 && y === 0
    const overflow = await detectOverflow(state, { elementContext: "reference" })
    const clipped =
      overflow.top - height >= 0 ||
      overflow.right - width >= 0 ||
      overflow.bottom - height >= 0 ||
      overflow.left - width >= 0
    return { data: { referenceHidden: clipped || nowhere } }
  },
}

/** Whether two anchors are followed the same way: one element, or places read from one element. */
function same(a: Anchor | undefined, b: Anchor | undefined): boolean {
  if (a === b) return true
  if (!a || !b || a instanceof Element || b instanceof Element) return false
  return a.contextElement === b.contextElement
}

/** Whether two options say the same: themselves, or lists or records of the same things. */
function alike(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false
  if (a instanceof Element || b instanceof Element) return false
  const [mine, theirs] = [a as Record<string, unknown>, b as Record<string, unknown>]
  const keys = Object.keys(mine)
  return (
    keys.length === Object.keys(theirs).length && keys.every((key) => mine[key] === theirs[key])
  )
}

const SIDES = ["top", "right", "bottom", "left"] as const

/** The room kept at each side, a side left out being none. */
function paddingOf(given: CollisionPadding): Record<PhysicalSide, number> {
  const each = {} as Record<PhysicalSide, number>
  for (const side of SIDES) each[side] = typeof given === "number" ? given : (given[side] ?? 0)
  return each
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
  const anchorHidden = signal(false)
  let pointer: HTMLElement | undefined
  let replace: (() => void) | undefined

  return {
    side,
    align,
    placed,
    uncentered,
    anchorHidden,
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
      setGeometry(positioner, "position", options.peek().positionMethod)
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
        setGeometry(positioner, "position", wanted.positionMethod)
        const padding = paddingOf(wanted.collisionPadding)
        const within = wanted.collisionBoundary
        const held = {
          padding,
          ...(within && within !== "clipping-ancestors" ? { boundary: within } : {}),
        }
        /** What an offset given as a function is told. */
        const measured = (state: MiddlewareState): OffsetData => {
          const [onSide, along = "center"] = state.placement.split("-") as [PhysicalSide, Align?]
          const { reference: against, floating } = state.rects
          return {
            side: landed(wanted.side, onSide, rtl),
            align: along,
            anchor: { width: against.width, height: against.height },
            positioner: { width: floating.width, height: floating.height },
          }
        }
        const gap = (wide: number | OffsetFunction, state: MiddlewareState) =>
          typeof wide === "function" ? wide(measured(state)) : wide
        // Kept in view only while its anchor is: past that it leaves with it, by half an
        // arrow and the padding, so an arrow still points at something. `sticky` keeps it.
        const limiter = wanted.sticky
          ? {}
          : {
              limiter: limitShift((state) => {
                if (!pointer) return {}
                const box = pointer.getBoundingClientRect()
                const upright = /^(top|bottom)/.test(state.placement)
                return {
                  offset: upright
                    ? (box.width + padding.left + padding.right) / 2
                    : (box.height + padding.top + padding.bottom) / 2,
                }
              }),
            }
        const avoid = wanted.collisionAvoidance
        let avoiding: (Middleware | null)[]
        if (!avoid) {
          // Nothing said: to the opposite side, then along its own.
          avoiding = [flip(held), shift({ ...held, crossAxis: wanted.sticky, ...limiter })]
        } else {
          const { side: across = "flip", align: along = "flip", fallbackAxisSide = "end" } = avoid
          const still = along === "none" && across !== "shift"
          const turned =
            across === "none"
              ? null
              : flip({
                  ...held,
                  mainAxis: across === "flip",
                  crossAxis: along === "flip" ? "alignment" : false,
                  fallbackAxisSideDirection: fallbackAxisSide,
                })
          const moved = still
            ? null
            : shift({
                ...held,
                mainAxis: along !== "none",
                crossAxis: wanted.sticky || across === "shift",
                ...limiter,
              })
          // Moved first where moving is what was asked for, or there is no start or end to swap.
          avoiding =
            across === "shift" || along === "shift" || wanted.align === "center"
              ? [moved, turned]
              : [turned, moved]
        }
        void computePosition(anchor, positioner, {
          placement: placement(physical(wanted.side, rtl), wanted.align),
          strategy: wanted.positionMethod,
          middleware: [
            offset((state) => ({
              mainAxis: gap(wanted.sideOffset, state),
              crossAxis: gap(wanted.alignOffset, state),
            })),
            ...avoiding,
            size({
              ...held,
              apply({ availableWidth, availableHeight, rects }) {
                reference = rects.reference
                setGeometry(positioner, "--available-width", `${Math.max(0, availableWidth)}px`)
                setGeometry(positioner, "--available-height", `${Math.max(0, availableHeight)}px`)
                setGeometry(positioner, "--anchor-width", `${rects.reference.width}px`)
                setGeometry(positioner, "--anchor-height", `${rects.reference.height}px`)
              },
            }),
            ...(pointer ? [arrow({ element: pointer, padding: wanted.arrowPadding })] : []),
            hidden,
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
            anchorHidden.set(Boolean(result.middlewareData.hide?.referenceHidden))
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
        anchorHidden.set(false)
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
    alike(a.collisionPadding, b.collisionPadding) &&
    alike(a.collisionBoundary, b.collisionBoundary) &&
    alike(a.collisionAvoidance, b.collisionAvoidance) &&
    a.sticky === b.sticky &&
    a.arrowPadding === b.arrowPadding &&
    a.positionMethod === b.positionMethod &&
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
