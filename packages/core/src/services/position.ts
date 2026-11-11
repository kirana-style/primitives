import { autoUpdate, computePosition, flip, offset, shift, size } from "@floating-ui/dom"
import type { Placement } from "@floating-ui/dom"

import { batch, signal } from "../reactivity.ts"
import { setGeometry } from "./geometry.ts"
import type { ReadonlySignal } from "../reactivity.ts"

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

export interface Position {
  /** The side the popup ended on, which a flip can change. */
  readonly side: ReadonlySignal<Side>
  readonly align: ReadonlySignal<Align>
  /** Whether the first placement has been written. */
  readonly placed: ReadonlySignal<boolean>
  /** Places `positioner` against `anchor` and keeps it placed. Returns the stop. */
  attach(positioner: HTMLElement, anchor: Element): () => void
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

  return {
    side,
    align,
    placed,
    attach(positioner, anchor) {
      setGeometry(positioner, "position", "absolute")
      setGeometry(positioner, "left", "0px")
      setGeometry(positioner, "top", "0px")
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
          batch(() => {
            side.set(nextSide)
            align.set(nextAlign)
            placed.set(true)
          })
        })
      }

      const stop = autoUpdate(anchor, positioner, update)
      // Placed again when the caller asks for another side or gap.
      const follow = options.subscribe(update)
      return () => {
        stop()
        follow()
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
