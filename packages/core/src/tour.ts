import { autoUpdate } from "@floating-ui/dom"
import type { VirtualElement } from "@floating-ui/dom"

import { bindable } from "./bindable.ts"
import type { Bindable } from "./bindable.ts"
import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import { defined, details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { batch, computed, effect, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { clearGeometry, setGeometry } from "./services/geometry.ts"
import { popupFocus } from "./services/popup-focus.ts"
import { createPopup } from "./services/popup.ts"
import { createPlacement, pointAnchor } from "./services/position.ts"
import type { Align, Anchor, OffsetData, PositionOptions, Side } from "./services/position.ts"

/**
 * What a step is about: an element, a CSS selector, or a function that gives an element, asked
 * when the step is shown, so it may be something the page draws late.
 */
export type TourTarget = Element | string | (() => Element | null | undefined)

/** One step of a tour. What it says is the page's to draw: the controller only shows it. */
export interface TourStep {
  /** Names the step, for the page's own use: a key, and what it draws the step's content by. */
  id: string
  /**
   * The element the step is about. Left out, or not in the page once `waitForTarget` has
   * passed, the step is shown in the middle of the viewport, as a dialog is.
   */
  target?: TourTarget | null | undefined
  /** The side of the target the popup is on. Default: the positioner's, else `"bottom"`. */
  side?: Side | undefined
  /** Where along that side the popup is. Default: the positioner's, else `"center"`. */
  align?: Align | undefined
}

export interface TourProps<Step extends TourStep = TourStep> {
  id: string
  /**
   * The steps, in order: each a `TourStep` (an `id`, and a `target`, `side` and `align` where it
   * has them) with whatever else the page draws it from, such as
   * `[{ id: "search", target: "#search", title: "Find anything" }]`.
   */
  steps: readonly Step[]
  /** Whether it is open, when the caller holds it. */
  open?: boolean | undefined
  /** Whether it starts open, when the caller does not hold `open`. Read once. */
  defaultOpen?: boolean | undefined
  /**
   * Heard as it is about to open or close: `details.cancel()` keeps it as it was. The reason is
   * `"finish"` for the last step's `next`, `"close-press"`, `"escape-key"` or `"outside-press"`.
   */
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  /** The index of the step shown, from 0, when the caller holds it. */
  step?: number | undefined
  /** The step it starts at, when the caller does not hold `step`. Read once. Default 0. */
  defaultStep?: number | undefined
  /**
   * Heard as another step is about to be shown: `details.cancel()` keeps it as it was. The reason
   * is `"next-press"`, `"previous-press"`, `"next-key"` or `"previous-key"`.
   */
  onStepChange?: ((step: number, details: ChangeDetails) => void) | undefined
  /**
   * How long a step whose target is not in the page waits for it, in milliseconds, before it is
   * shown in the middle of the viewport. Default 1000.
   */
  waitForTarget?: number | undefined
  /** The room between the target and the edge of the spotlight's hole, in pixels. Default 4. */
  spotlightPadding?: number | undefined
  /** Whether a press on the dimmed page ends the tour. Default `false`. */
  closeOnOutsidePress?: boolean | undefined
  /**
   * Whether the target can be used while its step is shown: pressed, focused, typed in. Default
   * `false`: the target is seen, not used, and the rest of the page is inert either way.
   */
  interactive?: boolean | undefined
  /** Whether ArrowRight and ArrowLeft go on and back a step. Default `true`. */
  keyboardNavigation?: boolean | undefined
}

export interface Tour<Step extends TourStep = TourStep> {
  readonly open: ReadonlySignal<boolean>
  /** Whether its popup is in the page: while a step is shown, and through its exit. */
  readonly mounted: ReadonlySignal<boolean>
  /** The index of the step asked for. */
  readonly step: ReadonlySignal<number>
  /**
   * The index of the step shown: the one asked for once its target is found, or once the wait
   * for it is over. The page draws the step's content from this, or from `shown`.
   */
  readonly index: ReadonlySignal<number>
  /** The step shown. */
  readonly shown: ReadonlySignal<Step | undefined>
  /** The place of the step shown, from 1: the "2" of "2 of 5". */
  readonly current: ReadonlySignal<number>
  /** How many steps there are: the "5" of "2 of 5". */
  readonly total: ReadonlySignal<number>
  /** The element the step shown is about; `undefined` for a step in the middle. */
  readonly target: ReadonlySignal<Element | undefined>
  setOpen(open: boolean, details: ChangeDetails): void
  setStep(index: number, details: ChangeDetails): void
  /** Where the positioner goes; its part's adapter writes its own props here. A step's own `side` and `align` come first. */
  readonly positioning: Signal<Partial<PositionOptions>>
  mount(): () => void
  /** A layer over the page with a hole over the target. */
  readonly spotlight: Part
  readonly positioner: Part
  readonly popup: Part
  /** An element that points at the target, placed along the popup's edge. */
  readonly arrow: Part
  readonly title: Part
  readonly description: Part
  readonly previous: Part
  /** Goes on a step; on the last, it finishes the tour. */
  readonly next: Part
  readonly close: Part
}

/** A step as it is shown: where it is, and what its popup is placed against. */
interface Shown {
  index: number
  target: Element | undefined
  anchor: Anchor
}

const NOTHING = () => {}
const WAIT = 1000
const PADDING = 4

/** A step with no target stands in the middle: its popup's top at the centre, less half its height. */
const halfUp = ({ positioner }: OffsetData) => -positioner.height / 2
const CENTRE: Anchor = pointAnchor(() => {
  const page = document.documentElement
  return { x: page.clientWidth / 2, y: page.clientHeight / 2 }
})

/** An element's box, grown by `padding` on each side. */
function grown(element: Element, padding: number): DOMRect {
  const box = element.getBoundingClientRect()
  return new DOMRect(
    box.left - padding,
    box.top - padding,
    box.width + padding * 2,
    box.height + padding * 2
  )
}

/** The element a target names, when it is in the page and drawn. */
function find(target: TourTarget | null | undefined): Element | undefined {
  if (!target) return undefined
  const found =
    typeof target === "string"
      ? document.querySelector(target)
      : typeof target === "function"
        ? target()
        : target
  return found?.isConnected && found.getClientRects().length > 0 ? found : undefined
}

/**
 * How far to scroll so that `start..end` is inside `from..to`: nothing when it is, its middle to
 * the middle when it fits, its start to the start when it does not.
 */
function distance(start: number, end: number, from: number, to: number): number {
  if (start >= from && end <= to) return 0
  if (end - start > to - from) return start - from
  return (start + end) / 2 - (from + to) / 2
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))

/**
 * Brings a target into view: each box around it that scrolls, from the nearest out, then the
 * page. `scrollIntoView` is not used: it scrolls every ancestor to its own idea of the place,
 * and a popup that is not placed yet is no part of that idea. Here each box is moved by the
 * least that shows the target in it, worked out from what was measured before any scroll, so
 * a box that scrolls smoothly (the design's `scroll-behavior`) is not read in the middle of its
 * motion. A target inside something `fixed` leaves the page where it is.
 */
function reveal(target: Element, padding: number): void {
  const document = target.ownerDocument
  const view = document.defaultView
  if (!view) return
  const box = grown(target, padding)
  let [left, top, right, bottom] = [box.left, box.top, box.right, box.bottom]
  let pinned = view.getComputedStyle(target).position === "fixed"
  for (
    let node = target.parentElement;
    node && !pinned && node !== document.body && node !== document.documentElement;
    node = node.parentElement
  ) {
    const style = view.getComputedStyle(node)
    if (style.position === "fixed") pinned = true
    if (!/auto|scroll|overlay|hidden/.test(style.overflowX + style.overflowY)) continue
    const tallest = node.scrollHeight - node.clientHeight
    const widest = node.scrollWidth - node.clientWidth
    if (tallest <= 0 && widest <= 0) continue
    const area = node.getBoundingClientRect()
    const x0 = area.left + node.clientLeft
    const y0 = area.top + node.clientTop
    // Where the box can go: in a box laid out right to left, `scrollLeft` runs from 0 down.
    const rtl = directionOf(node) === "rtl"
    const x = clamp(
      node.scrollLeft + distance(left, right, x0, x0 + node.clientWidth),
      rtl ? -widest : 0,
      rtl ? 0 : widest
    )
    const y = clamp(
      node.scrollTop + distance(top, bottom, y0, y0 + node.clientHeight),
      0,
      Math.max(0, tallest)
    )
    const dx = x - node.scrollLeft
    const dy = y - node.scrollTop
    if (dx === 0 && dy === 0) continue
    node.scrollTo({ left: x, top: y })
    // The target moves with what it is in: the boxes further out see it there.
    left -= dx
    right -= dx
    top -= dy
    bottom -= dy
  }
  if (pinned) return
  const page = document.documentElement
  const dx = distance(left, right, 0, page.clientWidth)
  const dy = distance(top, bottom, 0, page.clientHeight)
  if (dx !== 0 || dy !== 0) view.scrollTo({ left: view.scrollX + dx, top: view.scrollY + dy })
}

/**
 * Makes everything in the page inert but `kept` and what holds them. The popup service's own
 * modality (`isolate`) keeps one element; a tour whose target can be used keeps the target too,
 * deep in the page, and an inert ancestor cannot be undone by a descendant. What was inert
 * before is the page's own or another layer's, and is left as it is.
 */
function isolateAll(kept: readonly (Element | undefined)[]): () => void {
  const chain = new Set<Element>()
  for (const each of kept) {
    const body = each?.ownerDocument.body
    for (let node = each; node && node !== body; node = node.parentElement ?? undefined) {
      chain.add(node)
    }
  }
  const changed: Element[] = []
  for (const node of chain) {
    const parent = node.parentElement
    if (!parent) continue
    for (const sibling of parent.children) {
      if (chain.has(sibling) || sibling.hasAttribute("inert")) continue
      if (sibling.hasAttribute("aria-live") || sibling.tagName === "SCRIPT") continue
      sibling.setAttribute("inert", "")
      changed.push(sibling)
    }
  }
  return () => {
    for (const each of changed.splice(0)) each.removeAttribute("inert")
  }
}

const TEXT_ENTRY =
  /^(?:text|search|email|url|tel|password|number|date|time|datetime-local|month|week|range|radio)$/

/** Whether the element a key was pressed in answers arrows itself: text, a slider, a list. */
function takesArrows(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target instanceof HTMLInputElement) return TEXT_ENTRY.test(target.type)
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true
  if (target instanceof HTMLElement && target.isContentEditable) return true
  return Boolean(
    target.closest(
      "[role=slider],[role=spinbutton],[role=scrollbar],[role=listbox],[role=option],[role=menu],[role=menubar],[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=radiogroup],[role=radio],[role=tablist],[role=tab],[role=tree],[role=treeitem],[role=treegrid],[role=grid],[role=gridcell],[role=combobox],[role=textbox],[role=toolbar],[role=separator][tabindex]"
    )
  )
}

/**
 * A guided walk through a page, one step at a time: each step a popup placed against the element
 * it is about, with the rest of the page dimmed around that element and inert. The popup stays
 * in the page from the first step to the last and only moves.
 */
export function createTour<Step extends TourStep = TourStep>(
  props: ReadonlySignal<TourProps<Step>>,
  around: DirectionAround = {}
): Tour<Step> {
  const id = props.peek().id
  const popupId = `${id}-popup`
  const open = bindable({
    value: () => props.get().open,
    defaultValue: props.peek().defaultOpen ?? false,
    onChange: (value, by) => props.peek().onOpenChange?.(value, by),
  })
  const total = computed(() => props.get().steps.length)
  const held = bindable<number>({
    value: () => props.get().step,
    defaultValue: props.peek().defaultStep ?? 0,
    onChange: (next, by) => props.peek().onStepChange?.(next, by),
  })
  // A caller's step that is no step is the nearest that is.
  const step = computed(() => clamp(Math.round(held.get()), 0, Math.max(0, total.get() - 1)))
  const interactive = computed(() => Boolean(props.get().interactive))

  // The step shown, kept through the popup's exit so its content does not change as it leaves.
  const shown = signal<Shown | undefined>(undefined)
  // Whether the step asked for since it opened is shown: its target found, or waited for.
  const ready = signal(false)
  const visible = computed(() => open.get() && ready.get())
  const index = computed(() => shown.get()?.index ?? step.get())
  const target = computed(() => shown.get()?.target)
  const centred = computed(() => shown.get() !== undefined && !target.get())
  const titled = signal(false)
  const described = signal(false)
  const spotlightElement = signal<HTMLElement | undefined>(undefined)
  let popupElement: HTMLElement | undefined
  let nextElement: HTMLElement | undefined

  const setOpen = (next: boolean, by: ChangeDetails) => open.set(next, by)
  function setStep(next: number, by: ChangeDetails) {
    const to = clamp(Math.round(next), 0, Math.max(0, total.peek() - 1))
    if (to !== step.peek()) held.set(to, by)
  }

  // The positioner's own props, under a step's `side` and `align`; a step with no target is
  // placed in the middle whatever they say.
  const positioning = signal<Partial<PositionOptions>>({})
  const placement = createPlacement(() => {
    const { anchor: _ignored, ...given } = positioning.get()
    const at = shown.get()
    if (at && !at.target) {
      return {
        ...given,
        side: "bottom",
        align: "center",
        sideOffset: halfUp,
        alignOffset: 0,
        collisionAvoidance: { side: "none", align: "shift" },
      }
    }
    const own = at ? props.peek().steps[at.index] : undefined
    return { ...given, ...defined({ side: own?.side, align: own?.align }) }
  }, around.direction)

  // What the popup service follows: shown while open and a step is ready. Asked to change, it
  // asks the tour.
  const presence: Bindable<boolean> = {
    get: () => visible.get(),
    peek: () => visible.peek(),
    subscribe: (listener) => visible.subscribe(listener),
    set: setOpen,
  }
  const focusing = popupFocus(
    () => nextElement ?? popupElement,
    () => !interactive.peek()
  )
  const popup = createPopup({
    open: presence,
    setOpen,
    kind: "tour",
    placement,
    // The page is made inert here, not by the service: a target that can be used stays live.
    modal: () => false,
    mode: interactive,
    outsidePress: () => props.peek().closeOnOutsidePress === true,
    // A target that can be used is the tour's own: a press on it is not outside.
    branches: () => (interactive.peek() ? [target.peek()] : []),
    anchor: () => shown.peek()?.anchor ?? CENTRE,
    focus(element, context) {
      const free = effect(() =>
        isolateAll([element, spotlightElement.get(), interactive.get() ? target.get() : undefined])
      )
      const release = focusing(element, context)
      return () => {
        // The page first: it is no longer inert when focus goes back to it.
        free()
        release()
      }
    },
  })

  let waiting = NOTHING
  const stopWaiting = () => {
    waiting()
    waiting = NOTHING
  }

  /** Shows a step against `found`, or in the middle; brings the target into view first. */
  function show(at: number, found: Element | undefined) {
    stopWaiting()
    const padding = props.peek().spotlightPadding ?? PADDING
    if (found) reveal(found, padding)
    const before = ready.peek()
    const anchor: Anchor = found
      ? ({
          getBoundingClientRect: () => grown(found, props.peek().spotlightPadding ?? PADDING),
          contextElement: found,
        } satisfies VirtualElement)
      : CENTRE
    batch(() => {
      shown.set({ index: at, target: found, anchor })
      ready.set(true)
    })
    // Another anchor: the popup moves to it.
    placement.position.refresh()
    // Moved from a step to the next, with focus no longer in the tour (a key pressed in a target
    // that is inert now, a button gone): back into the popup.
    if (!before || !popupElement) return
    const active = popupElement.ownerDocument.activeElement
    const kept = interactive.peek() && found?.contains(active)
    if (!popupElement.contains(active) && !kept) {
      ;(nextElement ?? popupElement).focus({ preventScroll: true })
    }
  }

  /** Goes to a step: shown at once when its target is in the page, after a wait otherwise. */
  function go(at: number) {
    stopWaiting()
    const entry = props.peek().steps[at]
    if (!entry) return
    const found = find(entry.target)
    const wait = props.peek().waitForTarget ?? WAIT
    if (found || !entry.target || wait <= 0) return show(at, found)
    // Not drawn yet: each change to the page is a chance it now is.
    const observer = new MutationObserver(() => {
      const late = find(entry.target)
      if (late) show(at, late)
    })
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true })
    const timer = setTimeout(() => show(at, undefined), wait)
    waiting = () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }

  /** ArrowRight and ArrowLeft, in the reading direction, while focus is in the tour. */
  function keys(): () => void {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.shiftKey || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return
      if (props.peek().keyboardNavigation === false || takesArrows(event.target)) return
      const from = event.target instanceof Node ? event.target : undefined
      const body = document.body
      const inTour =
        !from ||
        from === body ||
        from === document.documentElement ||
        popupElement?.contains(from) ||
        (interactive.peek() && target.peek()?.contains(from))
      // A popup opened over the tour has the keys.
      if (!inTour) return
      const rtl = directionOf(popupElement ?? document.documentElement, around.direction) === "rtl"
      const forward = (event.key === "ArrowRight") !== rtl
      const to = index.peek() + (forward ? 1 : -1)
      if (to < 0 || to >= total.peek()) return
      event.preventDefault()
      setStep(to, details(forward ? "next-key" : "previous-key", event))
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }

  const last = computed(() => index.get() >= total.get() - 1)
  const first = computed(() => index.get() <= 0)

  return {
    open,
    mounted: popup.mounted,
    step,
    index,
    shown: computed(() => {
      const at = shown.get()
      return at ? props.get().steps[at.index] : undefined
    }),
    current: computed(() => (total.get() === 0 ? 0 : index.get() + 1)),
    total,
    target,
    setOpen,
    setStep,
    positioning,
    mount() {
      const stops = [
        popup.start(),
        // Open, a step is looked for and shown; closed, the next opening looks again.
        effect(() => {
          const now = open.get()
          const at = step.get()
          untracked(() => {
            if (now) return go(at)
            stopWaiting()
            ready.set(false)
          })
        }),
        effect(() => (visible.get() ? keys() : undefined)),
        // Gone from the page and closed: nothing is shown, and `index` is the step asked for.
        effect(() => {
          if (!open.get() && !popup.mounted.get()) shown.set(undefined)
        }),
      ]
      return () => {
        stopWaiting()
        for (const stop of stops.reverse()) stop()
      }
    },
    spotlight: {
      props: computed(() => ({
        role: "presentation",
        ...popup.state(),
        "data-centered": flag(centred.get()),
      })),
      attach(element) {
        spotlightElement.set(element)
        const stops = [
          popup.attachBackdrop(element),
          // A target that can be used is reached through the layer: the page around it is
          // inert, so a press there still does nothing.
          effect(() => {
            if (interactive.get()) setGeometry(element, "pointer-events", "none")
            else clearGeometry(element, "pointer-events")
          }),
          // The hole follows the target while the step is shown: it moves, scrolls or changes
          // size. Closed, it stays where it was through the exit.
          effect(() => {
            if (!visible.get()) return undefined
            const found = target.get()
            const write = () => {
              const own = element.getBoundingClientRect()
              const padding = props.peek().spotlightPadding ?? PADDING
              const hole = found
                ? grown(found, padding)
                : new DOMRect(own.left + own.width / 2, own.top + own.height / 2, 0, 0)
              setGeometry(element, "--spotlight-left", `${hole.left - own.left}px`)
              setGeometry(element, "--spotlight-top", `${hole.top - own.top}px`)
              setGeometry(element, "--spotlight-width", `${hole.width}px`)
              setGeometry(element, "--spotlight-height", `${hole.height}px`)
            }
            return autoUpdate(found ?? CENTRE, element, write)
          }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
          if (spotlightElement.peek() === element) spotlightElement.set(undefined)
        }
      },
    },
    positioner: {
      props: computed(() => ({
        ...popup.positioner.props.get(),
        "data-centered": flag(centred.get()),
      })),
      attach: (element) => popup.positioner.attach(element),
    },
    popup: {
      props: computed(() => ({
        id: popupId,
        role: "dialog",
        tabindex: "-1",
        "aria-modal": interactive.get() ? undefined : "true",
        "aria-labelledby": titled.get() ? `${id}-title` : undefined,
        "aria-describedby": described.get() ? `${id}-description` : undefined,
        ...popup.state(),
        ...popup.placed(),
        "data-centered": flag(centred.get()),
      })),
      attach(element) {
        popupElement = element
        const detach = popup.attach(element)
        return () => {
          detach()
          if (popupElement === element) popupElement = undefined
        }
      },
    },
    arrow: {
      props: computed(() => ({
        ...popup.arrow.props.get(),
        "data-centered": flag(centred.get()),
      })),
      attach: (element) => popup.arrow.attach(element),
    },
    title: {
      props: computed(() => ({ id: `${id}-title` })),
      attach() {
        titled.set(true)
        return () => titled.set(false)
      },
    },
    description: {
      props: computed(() => ({ id: `${id}-description` })),
      attach() {
        described.set(true)
        return () => described.set(false)
      },
    },
    previous: {
      props: computed(() => ({
        type: "button",
        // Said, not native: a button that becomes disabled drops focus to the page, and the
        // first step is reached by pressing this one.
        "aria-disabled": first.get() ? "true" : undefined,
        "data-disabled": flag(first.get()),
        onClick(event: Event) {
          if (first.peek()) return
          setStep(index.peek() - 1, details("previous-press", event))
        },
      })),
      attach: () => NOTHING,
    },
    next: {
      props: computed(() => ({
        type: "button",
        "data-last": flag(last.get()),
        onClick(event: Event) {
          if (last.peek()) return setOpen(false, details("finish", event))
          setStep(index.peek() + 1, details("next-press", event))
        },
      })),
      attach(element) {
        nextElement = element
        // Drawn after the popup took focus for itself, as some frameworks attach a parent first:
        // focus goes on to the button it was meant for.
        if (
          visible.peek() &&
          popupElement &&
          element.ownerDocument.activeElement === popupElement
        ) {
          element.focus({ preventScroll: true })
        }
        return () => {
          if (nextElement === element) nextElement = undefined
        }
      },
    },
    close: {
      props: computed(() => ({
        type: "button",
        onClick: (event: Event) => setOpen(false, details("close-press", event)),
      })),
      attach: () => NOTHING,
    },
  }
}
