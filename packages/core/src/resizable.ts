import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { batch, computed, signal } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import type { Orientation } from "./services/roving.ts"

export interface ResizableProps {
  id: string
  /** Whether the panels are side by side (the default) or one over the other. */
  orientation?: Orientation | undefined
  /** Heard as the panels are resized: each panel's share, in the page's order, summing to 100. */
  onSizesChange?: ((sizes: number[], details: ChangeDetails) => void) | undefined
  /** How far an arrow key moves a handle, in hundredths of the group. Default: 10. */
  keyboardStep?: number | undefined
  disabled?: boolean | undefined
}

export interface ResizablePanelOptions {
  /**
   * Its share to begin with, in hundredths of the group. Either every panel gives one or none
   * does (they are then equal).
   */
  defaultSize?: number | undefined
  /** The least it can be made. Default: 0. */
  minSize?: number | undefined
  /** The most it can be made. Default: 100. */
  maxSize?: number | undefined
}

export interface Resizable {
  /** Each panel's share, in the page's order, once they are in the page. */
  readonly sizes: ReadonlySignal<readonly number[]>
  /** Gives every panel its share; they are made to sum to 100. */
  setSizes(sizes: readonly number[], details: ChangeDetails): void
  mount(): () => void
  readonly group: Part
  panel(options?: () => ResizablePanelOptions): Part
  /** The bar between two panels: dragged, or moved with the arrows. */
  handle(options?: () => { disabled?: boolean | undefined }): Part
}

interface Panel {
  readonly size: Signal<number>
  readonly options: () => ResizablePanelOptions
  element: HTMLElement | undefined
}

const NOTHING = () => {}
const before = (a: Node, b: Node) =>
  a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1

/**
 * Panels that share a space, with bars between them that give one panel what they take from the
 * next. The group says once which way the panels lie; a bar's own orientation follows from it.
 */
export function createResizable(
  props: ReadonlySignal<ResizableProps>,
  around: DirectionAround = {}
): Resizable {
  const id = props.peek().id
  const orientation = computed(() => props.get().orientation ?? "horizontal")
  const disabled = computed(() => Boolean(props.get().disabled))
  const panels = new Set<Panel>()
  const changed = signal(0)
  let group: HTMLElement | undefined

  /** The panels that are in the page, in its order. */
  const ordered = () =>
    [...panels]
      .filter((each): each is Panel & { element: HTMLElement } => each.element !== undefined)
      .sort((a, b) => before(a.element, b.element))

  const sizes = computed(() => {
    changed.get()
    return ordered().map((each) => each.size.get())
  })

  /** Shares that sum to 100, from whatever the panels began with. */
  function settle() {
    const all = ordered()
    if (all.length === 0) return
    const total = all.reduce((sum, each) => sum + each.size.peek(), 0)
    if (total <= 0) return
    batch(() => {
      for (const each of all) each.size.set((each.size.peek() / total) * 100)
    })
  }

  function setSizes(next: readonly number[], by: ChangeDetails) {
    const all = ordered()
    if (next.length !== all.length) return
    const total = next.reduce((sum, each) => sum + each, 0) || 1
    const shares = next.map((each) => (each / total) * 100)
    props.peek().onSizesChange?.(shares, by)
    if (by.canceled) return
    batch(() => all.forEach((each, at) => each.size.set(shares[at]!)))
  }

  /** Moves the bar after panel `at` by `delta` hundredths: one panel grows by what the next gives. */
  function shift(at: number, delta: number, by: ChangeDetails) {
    const all = ordered()
    const first = all[at]
    const second = all[at + 1]
    if (!first || !second) return
    const bounds = (panel: Panel) => ({
      least: panel.options().minSize ?? 0,
      most: panel.options().maxSize ?? 100,
    })
    const a = bounds(first)
    const b = bounds(second)
    const from = first.size.peek()
    const pair = from + second.size.peek()
    // Within what both allow.
    const to = Math.min(
      Math.min(a.most, pair - b.least),
      Math.max(Math.max(a.least, pair - b.most), from + delta)
    )
    if (to === from) return
    const next = all.map((each) => each.size.peek())
    next[at] = to
    next[at + 1] = pair - to
    setSizes(next, by)
  }

  return {
    sizes,
    setSizes,
    mount: () => NOTHING,
    group: {
      props: computed(() => ({
        id,
        "data-orientation": orientation.get(),
        "data-disabled": flag(disabled.get()),
      })),
      attach(element) {
        group = element
        return () => {
          if (group === element) group = undefined
        }
      },
    },
    panel(options = () => ({})) {
      const panel: Panel = { size: signal(options().defaultSize ?? 1), options, element: undefined }
      // Known from when it is made, so a server draws it at its share.
      panels.add(panel)
      return {
        props: computed(() => {
          const size = panel.size.get()
          return {
            "data-orientation": orientation.get(),
            // Its share of what the bars leave: the one length the component writes. As one
            // declaration, which a browser and a server write the same.
            style: {
              "--panel-size": String(Math.round(size * 1000) / 1000),
              flex: `${Math.round(size * 1000) / 1000} 1 0px`,
            },
          }
        }),
        attach(element) {
          panel.element = element
          changed.set(changed.peek() + 1)
          // Once its siblings are in the page too.
          queueMicrotask(settle)
          return () => {
            panel.element = undefined
            panels.delete(panel)
            changed.set(changed.peek() + 1)
            queueMicrotask(settle)
          }
        },
      }
    },
    handle(options = () => ({})) {
      // The panel made just before it: the one it follows, until the page says which it is.
      // A server has no page to ask.
      const made = [...panels].at(-1)
      const element = signal<HTMLElement | undefined>(undefined)
      const dragging = signal(false)
      let drag: { from: number; at: number } | undefined

      /** The place of the panel before this bar, among the panels in the page. */
      const index = () => {
        const own = element.peek()
        if (!own) return -1
        const all = ordered()
        let at = -1
        all.forEach((each, n) => {
          if (before(each.element, own) < 0) at = n
        })
        return at
      }
      const off = () => disabled.get() || Boolean(options().disabled)
      const along = (event: PointerEvent) =>
        orientation.peek() === "horizontal" ? event.clientX : event.clientY

      return {
        props: computed(() => {
          changed.get()
          element.get()
          const at = index()
          const panel = at < 0 ? made : ordered()[at]
          const horizontal = orientation.get() === "horizontal"
          return {
            role: "separator",
            // A bar between panels side by side stands.
            "aria-orientation": horizontal ? "vertical" : "horizontal",
            tabindex: off() ? undefined : "0",
            "aria-valuenow": panel ? String(Math.round(panel.size.get())) : undefined,
            "aria-valuemin": panel ? String(Math.round(panel.options().minSize ?? 0)) : undefined,
            "aria-valuemax": panel ? String(Math.round(panel.options().maxSize ?? 100)) : undefined,
            "aria-disabled": off() ? "true" : undefined,
            "data-orientation": orientation.get(),
            "data-dragging": flag(dragging.get()),
            "data-disabled": flag(off()),
            onPointerDown(event: PointerEvent) {
              if (event.button !== 0 || off()) return
              const place = index()
              if (place < 0) return
              // Not a text selection, and the pointer stays the bar's wherever it goes.
              event.preventDefault()
              const target = event.currentTarget as HTMLElement
              try {
                target.setPointerCapture(event.pointerId)
              } catch {
                // A pointer the browser no longer has: the drag goes on while its moves reach.
              }
              target.focus({ preventScroll: true })
              drag = { from: along(event), at: place }
              dragging.set(true)
            },
            onPointerMove(event: PointerEvent) {
              if (!drag || !group) return
              const box = group.getBoundingClientRect()
              const whole = orientation.peek() === "horizontal" ? box.width : box.height
              if (whole <= 0) return
              let moved = ((along(event) - drag.from) / whole) * 100
              if (
                orientation.peek() === "horizontal" &&
                directionOf(group, around.direction) === "rtl"
              )
                moved = -moved
              drag.from = along(event)
              shift(drag.at, moved, details("drag", event))
            },
            onPointerUp() {
              drag = undefined
              dragging.set(false)
            },
            onPointerCancel() {
              drag = undefined
              dragging.set(false)
            },
            onKeyDown(event: KeyboardEvent) {
              if (off()) return
              const place = index()
              if (place < 0 || !group) return
              const step = props.peek().keyboardStep ?? 10
              const rtl = directionOf(group, around.direction) === "rtl"
              const forward = horizontal ? (rtl ? "ArrowLeft" : "ArrowRight") : "ArrowDown"
              const back = horizontal ? (rtl ? "ArrowRight" : "ArrowLeft") : "ArrowUp"
              let delta: number | undefined
              if (event.key === forward) delta = step
              else if (event.key === back) delta = -step
              else if (event.key === "Home") delta = -100
              else if (event.key === "End") delta = 100
              if (delta === undefined) return
              event.preventDefault()
              shift(place, delta, details("keyboard", event))
            },
          }
        }),
        attach(target) {
          element.set(target)
          return () => element.set(undefined)
        },
      }
    },
  }
}
