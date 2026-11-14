import { bindable } from "./bindable.ts"
import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import type { Orientation } from "./services/roving.ts"

export interface CarouselProps {
  id: string
  /** Which slide is at the start of the view, from 0. */
  index?: number | undefined
  defaultIndex?: number | undefined
  onIndexChange?: ((index: number, details: ChangeDetails) => void) | undefined
  /** Whether the slides go across (the default) or down. */
  orientation?: Orientation | undefined
  /** Whether going on from the last slide comes round to the first. */
  loop?: boolean | undefined
}

export interface Carousel {
  readonly index: ReadonlySignal<number>
  /** How many slides are in the page. */
  readonly count: ReadonlySignal<number>
  goTo(index: number, details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  /** What scrolls: the slides are its children, snapped by the design's CSS. */
  readonly viewport: Part
  /** One slide, by its place from 0. */
  item(index: number): Part
  readonly previous: Part
  readonly next: Part
  /** A button for one slide. */
  indicator(index: number): Part
}

/** How long a scroll is still before where it stopped is read. */
export const CAROUSEL_SETTLE = 100

const NOTHING = () => {}
const before = (a: Node, b: Node) =>
  a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1

/**
 * Slides in a box that scrolls. The scrolling is the browser's: a finger, a wheel, a trackpad
 * and the keyboard move it as they move any scrolling box, CSS snaps it, and CSS says whether
 * a step glides (`scroll-behavior`). The component names the slide the view is at and moves
 * to another by scrolling there; nothing is transformed, so nothing is lost to a reader that
 * looks at what is in view.
 */
export function createCarousel(
  props: ReadonlySignal<CarouselProps>,
  around: DirectionAround = {}
): Carousel {
  const id = props.peek().id
  const orientation = computed(() => props.get().orientation ?? "horizontal")
  const index = bindable<number>({
    value: () => props.get().index,
    defaultValue: props.peek().defaultIndex ?? 0,
    onChange: (value, by) => props.peek().onIndexChange?.(value, by),
  })
  const items = new Set<{ element: HTMLElement | undefined }>()
  const changed = signal(0)
  // Where the scroll is, of its whole run: nothing before it, nothing after it.
  const atStart = signal(true)
  const atEnd = signal(false)
  let view: HTMLElement | undefined

  const ordered = () =>
    [...items]
      .map((each) => each.element)
      .filter((each): each is HTMLElement => each !== undefined)
      .sort(before)
  const count = computed(() => {
    changed.get()
    return ordered().length
  })
  const horizontal = () => orientation.peek() === "horizontal"

  /** How far a slide's start is from the view's, along the way the slides go. */
  function offset(slide: HTMLElement): number {
    if (!view) return 0
    const box = view.getBoundingClientRect()
    const at = slide.getBoundingClientRect()
    if (!horizontal()) return at.top - box.top - view.clientTop
    return directionOf(view, around.direction) === "rtl"
      ? at.right - box.right + view.clientLeft
      : at.left - box.left - view.clientLeft
  }

  function ends() {
    if (!view) return
    const across = horizontal()
    const at = Math.abs(across ? view.scrollLeft : view.scrollTop)
    const run = across ? view.scrollWidth - view.clientWidth : view.scrollHeight - view.clientHeight
    atStart.set(at <= 1)
    atEnd.set(at >= run - 1)
  }

  function scrollTo(slide: number) {
    const target = ordered()[slide]
    if (!view || !target) return
    const by = offset(target)
    // How it gets there is the design's (`scroll-behavior`), and the person's (reduced motion).
    view.scrollBy(horizontal() ? { left: by } : { top: by })
  }

  function goTo(to: number, by: ChangeDetails) {
    const all = count.peek()
    if (all === 0) return
    const loop = Boolean(props.peek().loop)
    const next = loop ? ((to % all) + all) % all : Math.max(0, Math.min(all - 1, to))
    if (next === index.peek()) return scrollTo(next)
    index.set(next, by)
    if (!by.canceled) scrollTo(next)
  }

  /** The slide whose start is nearest the view's, once a scroll has come to rest. */
  function settled(event?: Event) {
    ends()
    const all = ordered()
    if (all.length === 0) return
    let nearest = 0
    let least = Infinity
    all.forEach((each, at) => {
      const far = Math.abs(offset(each))
      if (far < least - 0.5) {
        least = far
        nearest = at
      }
    })
    const current = index.peek()
    if (nearest === current) return
    // At the end of its run the last slides never reach the start: the one asked for stays.
    if (atEnd.peek() && current > nearest) return
    index.set(nearest, details("scroll", event))
  }

  const step = (delta: 1 | -1, event: Event) => {
    const all = count.peek()
    const loop = Boolean(props.peek().loop)
    // From the end of the run, on is round to the first, whatever slide the view is named for.
    if (loop && delta === 1 && atEnd.peek()) return goTo(0, details("next", event))
    if (loop && delta === -1 && atStart.peek()) return goTo(all - 1, details("previous", event))
    goTo(index.peek() + delta, details(delta === 1 ? "next" : "previous", event))
  }

  const button = (delta: 1 | -1): Part => ({
    props: computed(() => {
      count.get()
      const off = !props.get().loop && (delta === 1 ? atEnd.get() : atStart.get())
      return {
        type: "button",
        "aria-controls": `${id}-viewport`,
        disabled: off ? "" : undefined,
        "data-disabled": flag(off),
        onClick: (event: Event) => step(delta, event),
      }
    }),
    attach: () => NOTHING,
  })

  return {
    index,
    count,
    goTo,
    mount() {
      let first = true
      // A caller who holds the index moves the view by changing it.
      return effect(() => {
        const to = index.get()
        if (first) {
          first = false
          return
        }
        scrollTo(to)
      })
    },
    root: {
      props: computed(() => ({
        id,
        role: "region",
        "aria-roledescription": "carousel",
        "data-orientation": orientation.get(),
      })),
      attach: () => NOTHING,
    },
    viewport: {
      props: computed(() => ({
        id: `${id}-viewport`,
        // A box that scrolls is reached by the keyboard, which then scrolls it.
        tabindex: "0",
        "data-orientation": orientation.get(),
        onKeyDown(event: KeyboardEvent) {
          if (event.target !== event.currentTarget || !view) return
          const rtl = directionOf(view, around.direction) === "rtl"
          const across = horizontal()
          const forward = across ? (rtl ? "ArrowLeft" : "ArrowRight") : "ArrowDown"
          const back = across ? (rtl ? "ArrowRight" : "ArrowLeft") : "ArrowUp"
          if (event.key === forward) step(1, event)
          else if (event.key === back) step(-1, event)
          else if (event.key === "Home") goTo(0, details("keyboard", event))
          else if (event.key === "End") goTo(count.peek() - 1, details("keyboard", event))
          else return
          event.preventDefault()
        },
      })),
      attach(element) {
        view = element
        let rest: ReturnType<typeof setTimeout> | undefined
        const scrolled = (event: Event) => {
          ends()
          clearTimeout(rest)
          rest = setTimeout(() => settled(event), CAROUSEL_SETTLE)
        }
        element.addEventListener("scroll", scrolled, { passive: true })
        // Its slides are in the page a moment after it: where it begins is read then, and it
        // begins at its index with no glide.
        const begin = setTimeout(() => {
          const target = ordered()[index.peek()]
          if (target && index.peek() > 0) {
            const by = offset(target)
            element.scrollBy({
              ...(horizontal() ? { left: by } : { top: by }),
              behavior: "instant",
            })
          }
          ends()
        })
        // Wider or narrower, its run is another: a task later than the report.
        let later: ReturnType<typeof setTimeout> | undefined
        const observer = new ResizeObserver(() => {
          clearTimeout(later)
          later = setTimeout(ends)
        })
        observer.observe(element)
        return () => {
          element.removeEventListener("scroll", scrolled)
          observer.disconnect()
          clearTimeout(rest)
          clearTimeout(begin)
          clearTimeout(later)
          if (view === element) view = undefined
        }
      },
    },
    item(slide) {
      const own: { element: HTMLElement | undefined } = { element: undefined }
      return {
        props: computed(() => ({
          role: "group",
          "aria-roledescription": "slide",
          "data-orientation": orientation.get(),
          // By the place it is given, so a server says it as a browser does.
          "data-current": flag(index.get() === slide),
        })),
        attach(element) {
          own.element = element
          items.add(own)
          changed.set(changed.peek() + 1)
          return () => {
            own.element = undefined
            items.delete(own)
            changed.set(changed.peek() + 1)
          }
        },
      }
    },
    previous: button(-1),
    next: button(1),
    indicator(slide) {
      return {
        props: computed(() => {
          const current = index.get() === slide
          return {
            type: "button",
            "aria-controls": `${id}-viewport`,
            "aria-current": current ? "true" : undefined,
            "data-current": flag(current),
            onClick: (event: Event) => goTo(slide, details("indicator", event)),
          }
        }),
        attach: () => NOTHING,
      }
    },
  }
}
