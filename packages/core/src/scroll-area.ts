import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import { flag } from "./part.ts"
import type { Part } from "./part.ts"
import { batch, computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { setGeometry } from "./services/geometry.ts"
import type { Orientation } from "./services/roving.ts"

// The area takes no props of its own yet; the shape is every controller's.
// oxlint-disable-next-line typescript/no-empty-object-type
export interface ScrollAreaProps {}

export interface ScrollAreaScrollbar {
  /** Whether there is anything to scroll this way: the scrollbar is in the page only then. */
  readonly shown: ReadonlySignal<boolean>
  readonly part: Part
  readonly thumb: Part
}

export interface ScrollArea {
  mount(): () => void
  readonly root: Part
  /** The element that scrolls. Its own scrollbars are hidden; it still scrolls as any does. */
  readonly viewport: Part
  /** What is scrolled: watched, so content that lays out late is measured again. */
  readonly content: Part
  scrollbar(orientation: Orientation): ScrollAreaScrollbar
  /** The square where the two scrollbars meet, in the page while both are. */
  readonly corner: { readonly shown: ReadonlySignal<boolean>; readonly part: Part }
}

/** How long after the last movement the area still says it is scrolling, in milliseconds. */
export const SCROLLING_FOR = 500
/** The shortest a thumb is drawn, in pixels: a long page's would be too small to take. */
const THUMB_MIN = 16
const NOTHING = () => {}

interface Bar {
  readonly vertical: boolean
  element: HTMLElement | undefined
  thumb: HTMLElement | undefined
}

/**
 * A scrolling area with scrollbars the design draws. The viewport scrolls natively (wheel,
 * touch, keys, find-in-page all work as in any scroller); the thumbs follow it and can be
 * dragged, and a press on a track jumps there.
 */
export function createScrollArea(
  _props: ReadonlySignal<ScrollAreaProps>,
  around: DirectionAround = {}
): ScrollArea {
  const overflowX = signal(false)
  const overflowY = signal(false)
  const hovering = signal(false)
  const scrollingX = signal(false)
  const scrollingY = signal(false)
  const bars: Record<Orientation, Bar> = {
    horizontal: { vertical: false, element: undefined, thumb: undefined },
    vertical: { vertical: true, element: undefined, thumb: undefined },
  }
  let root: HTMLElement | undefined
  let viewport: HTMLElement | undefined
  let observer: ResizeObserver | undefined
  let last = { left: 0, top: 0 }
  let settle: ReturnType<typeof setTimeout> | undefined

  const rtl = () => (viewport ? directionOf(viewport, around.direction) === "rtl" : false)

  /** A bar's numbers: how long its track and thumb are, and how far the thumb can travel. */
  function sizes(bar: Bar) {
    if (!viewport || !bar.element) return undefined
    const seen = bar.vertical ? viewport.clientHeight : viewport.clientWidth
    const whole = bar.vertical ? viewport.scrollHeight : viewport.scrollWidth
    const track = bar.vertical ? bar.element.clientHeight : bar.element.clientWidth
    const thumb = Math.min(track, Math.max(THUMB_MIN, (track * seen) / Math.max(whole, 1)))
    return { track, thumb, travel: track - thumb, range: whole - seen }
  }

  /** Reads the viewport and writes what follows from it: overflow, and each thumb's place. */
  function measure() {
    if (!viewport) return
    batch(() => {
      // A pixel of slack: a fractional size is rounded both ways.
      overflowX.set(viewport!.scrollWidth - viewport!.clientWidth > 1)
      overflowY.set(viewport!.scrollHeight - viewport!.clientHeight > 1)
    })
    for (const bar of Object.values(bars)) {
      const size = sizes(bar)
      if (!size || !bar.thumb) continue
      const at = bar.vertical ? viewport.scrollTop : Math.abs(viewport.scrollLeft)
      const offset = size.range > 0 ? (at / size.range) * size.travel : 0
      const name = bar.vertical ? "height" : "width"
      setGeometry(bar.thumb, `--scroll-area-thumb-${name}`, `${size.thumb}px`)
      setGeometry(bar.thumb, name, `${size.thumb}px`)
      // From where the thumb lies by itself: the start of its track, which is the right in
      // a right-to-left row.
      const move = bar.vertical ? `0px, ${offset}px` : `${rtl() ? -offset : offset}px, 0px`
      setGeometry(bar.thumb, "transform", `translate(${move})`)
    }
    if (root) {
      const across = bars.vertical.element?.offsetWidth ?? 0
      const along = bars.horizontal.element?.offsetHeight ?? 0
      setGeometry(root, "--scroll-area-corner-width", `${across}px`)
      setGeometry(root, "--scroll-area-corner-height", `${along}px`)
    }
  }

  // What asked to be watched while the observer was reporting. Content that grows is reported;
  // measuring it shows there is something to scroll; a framework then draws a scrollbar, at once
  // or a moment later but still inside that report, and the scrollbar asks to be watched. An
  // element first watched during a report, nearer the root than what was reported, is a size
  // the browser could not deliver in that frame, which it says as an error on the window. Such
  // an element is watched once the report is over.
  let reporting = false
  let late: HTMLElement[] = []
  const resized = () => {
    if (!reporting) {
      reporting = true
      setTimeout(() => {
        reporting = false
        for (const element of late.splice(0)) if (element.isConnected) observer?.observe(element)
      })
    }
    measure()
  }

  const watch = (element: HTMLElement) => {
    observer ??= typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(resized)
    if (reporting) late.push(element)
    else observer?.observe(element)
    measure()
    return () => {
      late = late.filter((each) => each !== element)
      observer?.unobserve(element)
    }
  }

  const states = () => ({
    "data-has-overflow-x": flag(overflowX.get()),
    "data-has-overflow-y": flag(overflowY.get()),
    "data-scrolling": flag(scrollingX.get() || scrollingY.get()),
  })

  function scrollbar(orientation: Orientation): ScrollAreaScrollbar {
    const bar = bars[orientation]
    const scrolling = bar.vertical ? scrollingY : scrollingX
    let drag: { from: number; scroll: number } | undefined
    const along = (event: PointerEvent) => (bar.vertical ? event.clientY : event.clientX)

    /** Scrolls to where a thumb `offset` pixels along its track shows. */
    function scrollToOffset(offset: number) {
      const size = sizes(bar)
      if (!size || !viewport || size.travel <= 0) return
      const to = (Math.min(size.travel, Math.max(0, offset)) / size.travel) * size.range
      if (bar.vertical) viewport.scrollTop = to
      else viewport.scrollLeft = rtl() ? -to : to
    }

    return {
      shown: bar.vertical ? overflowY : overflowX,
      part: {
        props: computed(() => ({
          "data-orientation": orientation,
          "data-hovering": flag(hovering.get()),
          "data-scrolling": flag(scrolling.get()),
          onPointerDown(event: PointerEvent) {
            // A press on the track, not on the thumb: the thumb's middle goes there.
            if (event.button !== 0 || event.target !== event.currentTarget) return
            const size = sizes(bar)
            if (!size) return
            const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
            const from = bar.vertical ? box.top : rtl() ? box.right : box.left
            const pressed = Math.abs(along(event) - from)
            event.preventDefault()
            scrollToOffset(pressed - size.thumb / 2)
          },
        })),
        attach(element) {
          bar.element = element
          const unwatch = watch(element)
          return () => {
            unwatch()
            if (bar.element === element) bar.element = undefined
          }
        },
      },
      thumb: {
        props: computed(() => ({
          "data-orientation": orientation,
          onPointerDown(event: PointerEvent) {
            if (event.button !== 0 || !viewport) return
            // Not a text selection, and the pointer stays the thumb's wherever it goes.
            event.preventDefault()
            try {
              ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
            } catch {
              // A pointer the browser no longer has (it was let go already): the drag goes on
              // for as long as its moves reach the thumb.
            }
            const at = bar.vertical ? viewport.scrollTop : Math.abs(viewport.scrollLeft)
            drag = { from: along(event), scroll: at }
          },
          onPointerMove(event: PointerEvent) {
            const size = sizes(bar)
            if (!drag || !size || size.travel <= 0) return
            let moved = along(event) - drag.from
            if (!bar.vertical && rtl()) moved = -moved
            const offset = (drag.scroll / Math.max(size.range, 1)) * size.travel + moved
            scrollToOffset(offset)
          },
          onPointerUp: () => void (drag = undefined),
          onPointerCancel: () => void (drag = undefined),
        })),
        attach(element) {
          bar.thumb = element
          measure()
          return () => {
            if (bar.thumb === element) bar.thumb = undefined
          }
        },
      },
    }
  }

  // One of each: asked for again, the same.
  const made: Partial<Record<Orientation, ScrollAreaScrollbar>> = {}

  return {
    mount: () => () => {
      clearTimeout(settle)
      observer?.disconnect()
      observer = undefined
    },
    scrollbar: (orientation) => (made[orientation] ??= scrollbar(orientation)),
    root: {
      props: computed(() => ({
        ...states(),
        "data-hovering": flag(hovering.get()),
        onPointerEnter: () => hovering.set(true),
        onPointerLeave: () => hovering.set(false),
      })),
      attach(element) {
        root = element
        return () => {
          if (root === element) root = undefined
        }
      },
    },
    viewport: {
      props: computed(() => ({
        role: "presentation",
        // A stop for Tab while there is something to scroll: the keys scroll it from there.
        tabindex: overflowX.get() || overflowY.get() ? "0" : undefined,
        ...states(),
        // It scrolls by itself; only its own scrollbars are not drawn.
        style: { overflow: "scroll", "scrollbar-width": "none" },
        onScroll(event: Event) {
          const target = event.currentTarget as HTMLElement
          batch(() => {
            if (target.scrollLeft !== last.left) scrollingX.set(true)
            if (target.scrollTop !== last.top) scrollingY.set(true)
          })
          last = { left: target.scrollLeft, top: target.scrollTop }
          measure()
          clearTimeout(settle)
          settle = setTimeout(() => {
            batch(() => {
              scrollingX.set(false)
              scrollingY.set(false)
            })
          }, SCROLLING_FOR)
        },
      })),
      attach(element) {
        viewport = element
        last = { left: element.scrollLeft, top: element.scrollTop }
        const unwatch = watch(element)
        return () => {
          unwatch()
          if (viewport === element) viewport = undefined
        }
      },
    },
    content: {
      props: computed(() => ({})),
      // Its size is what there is to scroll: content that arrives or lays out late is seen.
      attach: (element) => watch(element),
    },
    corner: {
      shown: computed(() => overflowX.get() && overflowY.get()),
      part: { props: computed(() => ({})), attach: () => NOTHING },
    },
  }
}
