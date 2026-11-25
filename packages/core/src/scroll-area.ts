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
  /** The area: what its scrollbars and its corner are placed against. */
  readonly root: Part
  /** The element that scrolls. Its own scrollbars are hidden; it still scrolls as any does. */
  readonly viewport: Part
  /**
   * A box around what is scrolled, as wide as what it holds. Not needed for what is measured:
   * the viewport's children are watched in any case. It is for content whose own box does not
   * follow what is in it (a block narrower than a wide table it holds, or bare text), which
   * it wraps in a box that does.
   */
  readonly content: Part
  /**
   * A scrollbar and its thumb. The scrollbar is placed along its edge of the area, short of
   * the corner; the thumb is given its length, and moved as the viewport scrolls.
   */
  scrollbar(orientation: Orientation): ScrollAreaScrollbar
  /** The square where the two scrollbars meet, placed there, in the page while both are. */
  readonly corner: { readonly shown: ReadonlySignal<boolean>; readonly part: Part }
}

/** How long after the last movement the area still says it is scrolling, in milliseconds. */
export const SCROLLING_FOR = 500
/** The shortest a thumb is drawn, in pixels: a long page's would be too small to take. */
const THUMB_MIN = 16

interface Bar {
  readonly vertical: boolean
  element: HTMLElement | undefined
  thumb: HTMLElement | undefined
  /** As last measured: how far the thumb can go, how far it has gone, how far there is to scroll. */
  travel: number
  offset: number
  range: number
}

/**
 * A distance scrolled from the start, held to the range, as at an edge when it is within a
 * pixel of it: a fractional size is rounded both ways.
 */
function atEdge(value: number, max: number): number {
  if (max <= 0) return 0
  const at = Math.min(max, Math.max(0, value))
  const nearStart = at <= 1
  const nearEnd = max - at <= 1
  if (nearStart && nearEnd) return at <= max - at ? 0 : max
  if (nearStart) return 0
  if (nearEnd) return max
  return at
}

/**
 * The room an element keeps along a scrollbar's way: the scrollbar's padding, which its thumb
 * stays inside, or the thumb's own margin.
 */
function room(element: HTMLElement | undefined, name: "padding" | "margin", vertical: boolean) {
  if (!element) return 0
  const style = getComputedStyle(element)
  const key = `${name}${vertical ? "Block" : "Inline"}` as "paddingBlock"
  const start = parseFloat(style[`${key}Start`]) || 0
  // A margin across is read from its start alone: an engine misreports its end in a
  // right-to-left row, and the two are the same in every design that centres a thumb.
  if (!vertical && name === "margin") return start * 2
  return start + (parseFloat(style[`${key}End`]) || 0)
}

/**
 * A scrolling area with scrollbars the design draws. The viewport scrolls natively (wheel,
 * touch, keys, find-in-page all work as in any scroller); the thumbs follow it and can be
 * dragged, and a press on a track jumps there.
 *
 * The library places the parts, as Base UI does, in each part's `style`, which a server
 * writes too: the root is what the others are placed against (`position: relative`), each
 * scrollbar lies along its edge of it (the end of a line, the bottom) and stops short of the
 * corner, the corner sits where they meet, and a thumb is as long as its scrollbar's
 * `--scroll-area-thumb-height` or `-width` says. A design gives a scrollbar its thickness
 * (and any padding, which the thumb stays inside), lays the thumb out inside it, and draws
 * them; it places nothing.
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
  // Whether there is more to scroll to past each edge of the view: start and end along each way.
  const edges = signal(
    { xStart: false, xEnd: false, yStart: false, yEnd: false },
    (a, b) =>
      a.xStart === b.xStart && a.xEnd === b.xEnd && a.yStart === b.yStart && a.yEnd === b.yEnd
  )
  // What is measured and written in a part's `style`, where a server writes its nothing.
  const measured = signal(false)
  const cornerWidth = signal(0)
  const cornerHeight = signal(0)
  const thumbWidth = signal(0)
  const thumbHeight = signal(0)
  const bars: Record<Orientation, Bar> = {
    horizontal: {
      vertical: false,
      element: undefined,
      thumb: undefined,
      travel: 0,
      offset: 0,
      range: 0,
    },
    vertical: {
      vertical: true,
      element: undefined,
      thumb: undefined,
      travel: 0,
      offset: 0,
      range: 0,
    },
  }
  let root: HTMLElement | undefined
  let viewport: HTMLElement | undefined
  let corner: HTMLElement | undefined
  let observer: ResizeObserver | undefined
  let last = { left: 0, top: 0 }
  let settle: ReturnType<typeof setTimeout> | undefined

  const rtl = () => (viewport ? directionOf(viewport, around.direction) === "rtl" : false)

  /** Reads the viewport and writes what follows from it: overflow, and each thumb's size and place. */
  function measure() {
    if (!viewport) return
    const view = viewport
    batch(() => {
      // A pixel of slack: a fractional size is rounded both ways.
      overflowX.set(view.scrollWidth - view.clientWidth > 1)
      overflowY.set(view.scrollHeight - view.clientHeight > 1)
      measured.set(true)
    })
    // Not laid out (inside something hidden): there is nothing to size by.
    if (view.scrollWidth === 0 || view.scrollHeight === 0) return
    // How far the view is from each edge, as Base UI reads it: from the start of a line, so a
    // right-to-left row's negative `scrollLeft` reads the same, and a pixel from an edge is at it.
    const maxX = Math.max(0, view.scrollWidth - view.clientWidth)
    const maxY = Math.max(0, view.scrollHeight - view.clientHeight)
    const fromStartX = overflowX.peek()
      ? atEdge(rtl() ? -view.scrollLeft : view.scrollLeft, maxX)
      : 0
    const fromStartY = overflowY.peek() ? atEdge(view.scrollTop, maxY) : 0
    const fromEndX = overflowX.peek() ? maxX - fromStartX : 0
    const fromEndY = overflowY.peek() ? maxY - fromStartY : 0
    setGeometry(view, "--scroll-area-overflow-x-start", `${fromStartX}px`)
    setGeometry(view, "--scroll-area-overflow-x-end", `${fromEndX}px`)
    setGeometry(view, "--scroll-area-overflow-y-start", `${fromStartY}px`)
    setGeometry(view, "--scroll-area-overflow-y-end", `${fromEndY}px`)
    edges.set({
      xStart: fromStartX > 0,
      xEnd: fromEndX > 0,
      yStart: fromStartY > 0,
      yEnd: fromEndY > 0,
    })
    // The corner is as wide as the scrollbar down the side and as tall as the one along the
    // bottom, while both are in the page.
    const both = overflowX.peek() && overflowY.peek()
    const across = both ? (bars.vertical.element?.offsetWidth ?? 0) : 0
    const along = both ? (bars.horizontal.element?.offsetHeight ?? 0) : 0
    batch(() => {
      cornerWidth.set(corner ? across : 0)
      cornerHeight.set(corner ? along : 0)
    })
    for (const bar of Object.values(bars)) {
      const { vertical } = bar
      const seen = vertical ? view.clientHeight : view.clientWidth
      const whole = vertical ? view.scrollHeight : view.scrollWidth
      const shown = (vertical ? overflowY : overflowX).peek()
      const kept = room(bar.element, "padding", vertical) + room(bar.thumb, "margin", vertical)
      // As Base UI sizes it: the share that is seen, of what the viewport shows less the
      // room the scrollbar keeps, and of no more than the scrollbar's own length.
      let longest = (shown ? seen : 0) - kept
      const track = bar.element && (vertical ? bar.element.offsetHeight : bar.element.offsetWidth)
      if (track !== undefined) {
        // A scrollbar stops short of the corner once the corner's size is written on the
        // root. Until a framework has written it, the scrollbar is still laid out whole.
        const taken = vertical ? along : across
        const name = vertical ? "height" : "width"
        const written = root?.style.getPropertyValue(`--scroll-area-corner-${name}`)
        longest = Math.min(track - (written === `${taken}px` ? 0 : taken), longest)
      }
      const size = Math.max(THUMB_MIN, longest * (seen / whole))
      ;(vertical ? thumbHeight : thumbWidth).set(size)
      bar.range = Math.max(0, whole - seen)
      bar.travel = track === undefined ? 0 : Math.max(0, track - size - kept)
      const at = Math.min(bar.range, vertical ? view.scrollTop : Math.abs(view.scrollLeft))
      bar.offset = bar.range > 0 ? (at / bar.range) * bar.travel : 0
      if (!bar.thumb) continue
      // From where the thumb lies by itself: the start of its track, which is the right in
      // a right-to-left row.
      const move = vertical
        ? `0px, ${bar.offset}px, 0px`
        : `${rtl() ? -bar.offset : bar.offset}px, 0px, 0px`
      setGeometry(bar.thumb, "transform", `translate3d(${move})`)
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

  const overflow = () => {
    const now = edges.get()
    return {
      "data-has-overflow-x": flag(overflowX.get()),
      "data-has-overflow-y": flag(overflowY.get()),
      "data-overflow-x-start": flag(now.xStart),
      "data-overflow-x-end": flag(now.xEnd),
      "data-overflow-y-start": flag(now.yStart),
      "data-overflow-y-end": flag(now.yEnd),
    }
  }
  const states = () => ({
    ...overflow(),
    "data-scrolling": flag(scrollingX.get() || scrollingY.get()),
  })

  function scrollbar(orientation: Orientation): ScrollAreaScrollbar {
    const bar = bars[orientation]
    const scrolling = bar.vertical ? scrollingY : scrollingX
    let drag: { from: number; offset: number } | undefined
    const along = (event: PointerEvent) => (bar.vertical ? event.clientY : event.clientX)

    /** Scrolls to where a thumb `offset` pixels along its track shows. */
    function scrollToOffset(offset: number) {
      if (!viewport || bar.travel <= 0) return
      const to = (Math.min(bar.travel, Math.max(0, offset)) / bar.travel) * bar.range
      if (bar.vertical) viewport.scrollTop = to
      else viewport.scrollLeft = rtl() ? -to : to
    }

    return {
      shown: bar.vertical ? overflowY : overflowX,
      part: {
        props: computed(() => ({
          ...overflow(),
          "data-orientation": orientation,
          "data-hovering": flag(hovering.get()),
          "data-scrolling": flag(scrolling.get()),
          // Along its edge of the area, short of the corner; a finger on it scrolls the area
          // and not the page, and a drag selects no text.
          style: {
            position: "absolute",
            "touch-action": "none",
            "-webkit-user-select": "none",
            "user-select": "none",
            ...(bar.vertical
              ? {
                  top: "0px",
                  bottom: "var(--scroll-area-corner-height)",
                  "inset-inline-end": "0px",
                  "--scroll-area-thumb-height": `${thumbHeight.get()}px`,
                }
              : {
                  "inset-inline-start": "0px",
                  "inset-inline-end": "var(--scroll-area-corner-width)",
                  bottom: "0px",
                  "--scroll-area-thumb-width": `${thumbWidth.get()}px`,
                }),
          },
          onPointerDown(event: PointerEvent) {
            // A press on the track, not on the thumb: the thumb's middle goes there.
            if (event.button !== 0 || event.target !== event.currentTarget || !bar.thumb) return
            const box = bar.thumb.getBoundingClientRect()
            const size = bar.vertical ? box.height : box.width
            // Where the thumb starts when nothing is scrolled, wherever the design laid it.
            const pressed = bar.vertical
              ? along(event) - (box.top - bar.offset)
              : rtl()
                ? box.right + bar.offset - along(event)
                : along(event) - (box.left - bar.offset)
            event.preventDefault()
            scrollToOffset(pressed - size / 2)
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
          "data-scrolling": flag(scrolling.get()),
          // As long as its scrollbar says, and out of sight until that has been measured.
          style: {
            ...(measured.get() ? {} : { visibility: "hidden" }),
            ...(bar.vertical
              ? { height: "var(--scroll-area-thumb-height)" }
              : { width: "var(--scroll-area-thumb-width)" }),
          },
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
            drag = { from: along(event), offset: bar.offset }
          },
          onPointerMove(event: PointerEvent) {
            if (!drag || bar.travel <= 0) return
            let moved = along(event) - drag.from
            if (!bar.vertical && rtl()) moved = -moved
            scrollToOffset(drag.offset + moved)
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
        // What the scrollbars and the corner are placed against, and how much of each
        // scrollbar's edge the corner takes.
        style: {
          position: "relative",
          "--scroll-area-corner-height": `${cornerHeight.get()}px`,
          "--scroll-area-corner-width": `${cornerWidth.get()}px`,
        },
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
        // What it holds, with or without the content part: the viewport keeps its size while
        // pictures in it load or a row in it grows, and only its children say so. Each child is
        // watched, and the children are followed as they come and go.
        const held = new Map<Element, () => void>()
        const follow = () => {
          const now = new Set(element.children)
          for (const [child, stop] of held) {
            if (now.has(child)) continue
            stop()
            held.delete(child)
          }
          for (const child of now) {
            if (!held.has(child) && child instanceof HTMLElement) held.set(child, watch(child))
          }
          measure()
        }
        const children =
          typeof MutationObserver === "undefined" ? undefined : new MutationObserver(follow)
        children?.observe(element, { childList: true })
        follow()
        return () => {
          children?.disconnect()
          for (const stop of held.values()) stop()
          unwatch()
          if (viewport === element) viewport = undefined
        }
      },
    },
    content: {
      // As wide as what it holds, so what is wider than the viewport is measured, and seen
      // when it changes.
      props: computed(() => ({ ...states(), style: { "min-width": "fit-content" } })),
      // Its size is what there is to scroll: content that arrives or lays out late is seen.
      attach: (element) => watch(element),
    },
    corner: {
      shown: computed(() => overflowX.get() && overflowY.get()),
      part: {
        props: computed(() => ({
          style: {
            position: "absolute",
            bottom: "0px",
            "inset-inline-end": "0px",
            width: `${cornerWidth.get()}px`,
            height: `${cornerHeight.get()}px`,
          },
        })),
        // Only with a corner in the page do the scrollbars stop short of it.
        attach(element) {
          corner = element
          measure()
          return () => {
            if (corner !== element) return
            corner = undefined
            measure()
          }
        },
      },
    },
  }
}
