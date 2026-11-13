/** How long the pointer may rest on its way before the way is no longer kept, in milliseconds. */
export const SAFE_AREA_REST = 300

export interface SafeArea {
  /** The pointer left the trigger here, on its way to the popup. */
  leave(x: number, y: number): void
  /** Whether a point is on the way from where the pointer left to `box`. */
  holds(x: number, y: number, box: DOMRect): boolean
  clear(): void
}

type Point = readonly [number, number]

const cross = (a: Point, b: Point, c: Point) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

function inTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
  const d1 = cross(a, b, p)
  const d2 = cross(b, c, p)
  const d3 = cross(c, a, p)
  const negative = d1 < 0 || d2 < 0 || d3 < 0
  const positive = d1 > 0 || d2 > 0 || d3 > 0
  return !(negative && positive)
}

/**
 * The way from a submenu's trigger to its popup. A pointer going to the popup crosses the rows
 * between the two; those rows must not take the highlight, or the submenu closes under the
 * pointer. The way is the triangle from where the pointer left the trigger to the popup's near
 * edge, kept while the pointer keeps moving in it.
 */
export function createSafeArea(): SafeArea {
  let from: Point | undefined
  let at = 0

  return {
    leave(x, y) {
      from = [x, y]
      at = Date.now()
    },
    holds(x, y, box) {
      if (!from) return false
      const now = Date.now()
      if (now - at > SAFE_AREA_REST) {
        from = undefined
        return false
      }
      // The popup's edge nearest where the pointer left, a little taller than the popup.
      const edge = from[0] <= box.left ? box.left : from[0] >= box.right ? box.right : undefined
      if (edge === undefined) return false
      const inside = inTriangle([x, y], from, [edge, box.top - 4], [edge, box.bottom + 4])
      if (inside) at = now
      else from = undefined
      return inside
    },
    clear() {
      from = undefined
    },
  }
}
