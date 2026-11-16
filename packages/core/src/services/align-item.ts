import { clearGeometry, setGeometry } from "./geometry.ts"

// How near an end of its scroll a list is taken to be at it, in pixels.
const NEAR = 1
// How near the viewport's top or bottom a trigger may be before the list is placed beside it.
const TOO_NEAR = 20
const SIDES = 5
const OWN = ["bottom", "height", "max-height", "margin-top", "margin-bottom"] as const

const clamp = (value: number, least: number, most: number) => Math.min(Math.max(value, least), most)
const near = (value: number) => Math.round(value * 100) / 100
const scrollEnd = (scroller: HTMLElement) =>
  Math.max(0, scroller.scrollHeight - scroller.clientHeight)

/** A popup's own greatest height, when its design gives one in pixels. */
function greatest(style: CSSStyleDeclaration): number {
  return style.maxHeight.endsWith("px") ? Number.parseFloat(style.maxHeight) || Infinity : Infinity
}

export interface ItemAlignment {
  /**
   * Places a list over its trigger, so the text of an item lies on the text the trigger shows:
   * the chosen item's, or the first when nothing is chosen. Call it once the list has been
   * placed the usual way. Says whether it did: near the viewport's top or bottom, or with too
   * little room, the usual place is kept.
   */
  place(given: {
    trigger: HTMLElement
    positioner: HTMLElement
    /** What scrolls: the list. */
    popup: HTMLElement
    /** The item's text and the trigger's, when both are in the page. */
    text?: HTMLElement | undefined
    value?: HTMLElement | undefined
    rtl: boolean
  }): boolean
  /** The list was scrolled: it grows towards the room it has before its rows move. */
  scrolled(): void
  /** Gives the positioner back to the usual placement. */
  clear(): void
}

/**
 * A select's list placed as a native one is: over its trigger, the chosen item where the
 * trigger's own text was. The list is as tall as the room between that place and the
 * viewport's edge lets it be, scrolled so the item is still there, and grows as it is scrolled.
 * The measures are Base UI's, so a design written for it lies the same.
 */
export function createItemAlignment(): ItemAlignment {
  let placed: { positioner: HTMLElement; popup: HTMLElement; transform: string } | undefined
  // Whether the list is as tall as it may be: from then on a scroll is only a scroll.
  let full = false

  function release(positioner: HTMLElement, popup: HTMLElement) {
    for (const name of OWN) clearGeometry(positioner, name)
    clearGeometry(popup, "height")
  }

  return {
    place({ trigger, positioner, popup, text, value, rtl }) {
      const page = trigger.ownerDocument
      const view = page.defaultView
      if (!view) return false
      // Pinched in, a browser's own viewport is not the page's: the usual place is kept.
      if ((view.visualViewport?.scale ?? 1) !== 1) return false
      full = false
      popup.scrollTop = 0
      {
        const own = view.getComputedStyle(positioner)
        const list = view.getComputedStyle(popup)
        const at = trigger.getBoundingClientRect()
        const box = positioner.getBoundingClientRect()
        const scrollHeight = popup.scrollHeight
        const border = Number.parseFloat(list.borderBottomWidth) || 0
        const marginTop = Number.parseFloat(own.marginTop) || 10
        const marginBottom = Number.parseFloat(own.marginBottom) || 10
        const least = Number.parseFloat(own.minHeight) || 100
        const viewport = page.documentElement.clientHeight - marginTop - marginBottom
        const under = viewport - at.bottom + at.height

        let left = rtl ? at.right - box.width : at.left
        let lift = 0
        // The middle of the item's text, from the positioner's top.
        let middle: number | undefined
        if (text?.isConnected && value?.isConnected) {
          const shown = value.getBoundingClientRect()
          const words = text.getBoundingClientRect()
          // Where the text lies in the list as it is laid out, not as its entrance draws it:
          // a list that comes in scaled is measured scaled, and nothing is written to undo
          // that, which would start the design's transition over.
          const drawn = popup.getBoundingClientRect()
          const across = drawn.width / popup.offsetWidth || 1
          const down = drawn.height / popup.offsetHeight || 1
          const inside = popup.offsetParent === positioner
          const fromLeft = (inside ? popup.offsetLeft : 0) - drawn.left / across
          const fromTop = (inside ? popup.offsetTop : 0) - drawn.top / down
          left = rtl
            ? shown.right - (fromLeft + words.right / across)
            : shown.left - (fromLeft + words.left / across)
          // To a hundredth: undoing a scale leaves a remainder that is not a measure.
          middle = near(fromTop + (words.top + words.height / 2) / down)
          left = near(left)
          lift = middle - (shown.top - at.top + shown.height / 2)
        }

        const ideal = under + lift + marginBottom + border
        let height = Math.min(viewport, ideal)
        const scrollTop = ideal - height
        setGeometry(positioner, "height", `${height}px`)
        // The height written is the height: a design's own limit does not hold it back.
        setGeometry(positioner, "max-height", "none")
        setGeometry(positioner, "margin-top", `${marginTop}px`)
        setGeometry(positioner, "margin-bottom", `${marginBottom}px`)
        setGeometry(popup, "height", "100%")

        const end = scrollEnd(popup)
        const fromTop = scrollTop >= end - NEAR
        if (fromTop) height = Math.min(viewport, box.height) - (scrollTop - end)
        if (
          at.top < TOO_NEAR ||
          at.bottom > viewport - TOO_NEAR ||
          Math.ceil(height) + NEAR < Math.min(scrollHeight, least)
        ) {
          release(positioner, popup)
          return false
        }

        placed = { positioner, popup, transform: positioner.style.transform }
        const width = page.documentElement.clientWidth
        setGeometry(positioner, "position", "fixed")
        setGeometry(positioner, "transform", "none")
        setGeometry(
          positioner,
          "left",
          `${clamp(left, SIDES, Math.max(SIDES, width - SIDES - box.width))}px`
        )
        if (fromTop) {
          const room = Math.max(0, viewport - ideal)
          setGeometry(
            positioner,
            "top",
            box.height >= viewport - marginTop - marginBottom ? "0px" : `${room}px`
          )
          setGeometry(positioner, "height", `${height}px`)
          popup.scrollTop = scrollEnd(popup)
        } else {
          setGeometry(positioner, "top", "auto")
          setGeometry(positioner, "bottom", "0px")
          popup.scrollTop = scrollTop
        }
        if (middle !== undefined) {
          // It grows from where the item is.
          const share = box.height > 0 ? near((middle / box.height) * 100) : 50
          setGeometry(popup, "--transform-origin", `50% ${clamp(share, 0, 100)}%`)
        }
        if (Math.max(least, height) === viewport || height >= greatest(list)) full = true
        return true
      }
    },
    scrolled() {
      if (!placed || full) return
      const { positioner, popup } = placed
      const view = positioner.ownerDocument.defaultView
      if (!view) return
      const fromTop = positioner.style.top === "0px"
      const fromBottom = positioner.style.bottom === "0px"
      if (!fromTop && !fromBottom) return
      const now = positioner.getBoundingClientRect().height
      const own = view.getComputedStyle(positioner)
      const room = Math.min(
        positioner.ownerDocument.documentElement.clientHeight -
          (Number.parseFloat(own.marginTop) || 0) -
          (Number.parseFloat(own.marginBottom) || 0),
        greatest(view.getComputedStyle(popup))
      )
      const end = scrollEnd(popup)
      // How far the list is from the end it grows away from.
      const left = fromTop ? end - popup.scrollTop : popup.scrollTop
      if (left <= NEAR) {
        const more = clamp(left, 0, room - now)
        if (more > 0) setGeometry(positioner, "height", `${now + more}px`)
        popup.scrollTop = fromTop ? scrollEnd(popup) : 0
        if (room - (now + more) <= NEAR) full = true
        return
      }
      const next = Math.min(now + left, room)
      let to: number | undefined
      if (room - next > NEAR) to = fromTop ? Infinity : 0
      else if (fromBottom && popup.scrollTop < end)
        to = popup.scrollTop - (left - (now + left - room))
      const tall = Math.ceil(next)
      if (tall !== 0) setGeometry(positioner, "height", `${tall}px`)
      if (to !== undefined) {
        // Its bounds changed with its height.
        const target = clamp(to, 0, scrollEnd(popup))
        // Nearly there is there: a write that changes nothing would be heard as a scroll.
        if (Math.abs(popup.scrollTop - target) > NEAR) popup.scrollTop = target
      }
      if (tall >= room - NEAR) full = true
    },
    clear() {
      if (!placed) return
      const { positioner, popup, transform } = placed
      placed = undefined
      full = false
      release(positioner, popup)
      clearGeometry(popup, "--transform-origin")
      setGeometry(positioner, "position", "absolute")
      setGeometry(positioner, "left", "0px")
      setGeometry(positioner, "top", "0px")
      setGeometry(positioner, "transform", transform)
    },
  }
}
