import type { DirectionAround } from "./direction.ts"
import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createRoving } from "./services/roving.ts"
import type { Orientation } from "./services/roving.ts"

export interface StepsProps {
  id: string
  /** The step shown, from 0. Equal to `count`, every step is done. */
  step?: number | undefined
  /** The step it starts at, when the caller does not hold `step`. Read once. */
  defaultStep?: number | undefined
  /** Heard as another step is about to be shown: `details.cancel()` keeps it as it was. */
  onStepChange?: ((step: number, details: ChangeDetails) => void) | undefined
  /**
   * How many steps there are. Left out, the items in the page, counted once they are there:
   * until then (and on a server) no step is the last, so none is all done. Give it where only
   * some of the steps are drawn.
   */
  count?: number | undefined
  /** In order only: a step that is not done yet cannot be gone to by its trigger. */
  linear?: boolean | undefined
  /** Whether the steps are laid out across (the default) or down: the arrows follow. */
  orientation?: Orientation | undefined
}

export interface Steps {
  readonly step: ReadonlySignal<number>
  readonly count: ReadonlySignal<number>
  setStep(step: number, details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  /** The row of steps. */
  readonly list: Part
  /**
   * One step of the row, around its trigger and its separator. `index` is which step it is,
   * from 0; left out, its place among the items in the page, read from the page once it is
   * there. Until then (and on a server) it is no step: a page a server draws gives it.
   */
  item(index?: number): StepsItem
  /** What names a step and goes to it: by its index, or its item's. */
  trigger(index: number | ReadonlySignal<number>): Part
  /** A step's mark: its number, or a tick once it is done. */
  indicator(index: number | ReadonlySignal<number>): Part
  /** The line from a step to the next. */
  separator(index: number | ReadonlySignal<number>): Part
  /** What a step shows: in the page always, hidden unless its step is the one shown. */
  content(index: number): Part
  /** What is shown once every step is done. */
  readonly completed: Part
  readonly previous: Part
  readonly next: Part
}

/** One step of the row, and which step it is, which the parts inside it are asked for by. */
export interface StepsItem extends Part {
  /** The index given, or its place among the items in the page; `-1` until it is there. */
  readonly index: ReadonlySignal<number>
}

const NOTHING = () => {}
const before = (a: Node, b: Node) =>
  a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1

/**
 * A task in steps taken in order: which is shown, which are done, and the way between them.
 * The steps are tabs to assistive technology, each with its panel.
 */
export function createSteps(
  props: ReadonlySignal<StepsProps>,
  around: DirectionAround = {}
): Steps {
  const id = props.peek().id
  // The items in the page, in its order: what a step with no index is placed by, and what
  // is counted when no count is given.
  const items = new Set<{ element: HTMLElement | undefined }>()
  const changed = signal(0)
  const ordered = () =>
    [...items]
      .map((each) => each.element)
      .filter((each): each is HTMLElement => each !== undefined)
      .sort(before)
  const count = computed(() => {
    const given = props.get().count
    if (given !== undefined) return Math.max(0, Math.round(given))
    changed.get()
    return items.size
  })
  // How many steps it goes up to: with no count given and none in the page yet (a server),
  // as many as there may be, so that none is the last and the task is not done.
  const total = computed(() =>
    props.get().count === undefined && count.get() === 0 ? Infinity : count.get()
  )
  const held = bindable<number>({
    value: () => props.get().step,
    defaultValue: props.peek().defaultStep ?? 0,
    onChange: (next, by) => props.peek().onStepChange?.(next, by),
  })
  // A caller's step that is no step is the nearest that is.
  const step = computed(() => Math.min(total.get(), Math.max(0, Math.round(held.get()))))
  const orientation = computed<Orientation>(() => props.get().orientation ?? "horizontal")
  const roving = createRoving()
  const made = new Map<string, Part>()

  function setStep(next: number, by: ChangeDetails) {
    const to = Math.min(total.peek(), Math.max(0, Math.round(next)))
    if (to !== step.peek()) held.set(to, by)
  }

  // The parts asked for by an item's index, by that index signal.
  const byItem = new WeakMap<ReadonlySignal<number>, Map<string, Part>>()

  /** A part made once for an index: asked for again, the same. */
  function once<Made extends Part>(
    name: string,
    index: number | ReadonlySignal<number>,
    make: (at: () => number) => Made
  ): Made {
    let parts = made
    let key = `${name}:${String(index)}`
    if (typeof index !== "number") {
      parts = byItem.get(index) ?? new Map()
      byItem.set(index, parts)
      key = name
    }
    let part = parts.get(key) as Made | undefined
    if (!part)
      parts.set(key, (part = make(typeof index === "number" ? () => index : () => index.get())))
    return part
  }

  function item(index: number | undefined): StepsItem {
    const own: { element: HTMLElement | undefined } = { element: undefined }
    // The index given, or its place in the page: never the order the items were made in,
    // which a framework that draws twice, or a list that changes, would get wrong.
    const at = computed(() => {
      if (index !== undefined) return index
      changed.get()
      return own.element ? ordered().indexOf(own.element) : -1
    })
    return {
      index: at,
      props: computed(() => where(at.get())),
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
  }

  const where = (index: number) => {
    // No step yet: an item with no index that is not in the page says nothing of where it is.
    if (index < 0) return { "data-orientation": orientation.get() }
    const now = step.get()
    return {
      "data-current": flag(index === now),
      "data-complete": flag(index < now),
      "data-incomplete": flag(index > now),
      "data-orientation": orientation.get(),
    }
  }

  function move(by: 1 | -1, reason: string): Part {
    return {
      props: computed(() => {
        const off = by > 0 ? step.get() >= total.get() : step.get() <= 0
        return {
          type: "button",
          disabled: flag(off),
          "data-disabled": flag(off),
          onClick: (event: Event) => setStep(step.peek() + by, details(reason, event)),
        }
      }),
      attach: () => NOTHING,
    }
  }

  return {
    step,
    count,
    setStep,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        "data-orientation": orientation.get(),
        "data-complete": flag(step.get() >= total.get()),
      })),
      attach: () => NOTHING,
    },
    list: {
      props: computed(() => ({
        role: "tablist",
        "aria-orientation": orientation.get(),
        "data-orientation": orientation.get(),
        onKeyDown(event: KeyboardEvent) {
          // The arrows move focus between the steps; a press goes to one.
          roving.move(event, {
            orientation: orientation.peek(),
            loop: false,
            direction: around.direction,
          })
        },
      })),
      attach: () => NOTHING,
    },
    // An item with no index is made each time it is asked for: its adapter keeps the one.
    item: (index) =>
      index === undefined ? item(undefined) : once("item", index, () => item(index)),
    trigger: (of) =>
      once("trigger", of, (at) => ({
        props: computed(() => {
          const index = at()
          const now = step.get()
          if (index < 0) {
            return {
              type: "button",
              role: "tab",
              tabindex: "-1",
              "aria-selected": "false",
              ...where(index),
            }
          }
          // With all of them done, the last step is where Tab stops.
          const stop = index === Math.min(now, total.get() - 1)
          const off = Boolean(props.get().linear) && index > now
          return {
            type: "button",
            role: "tab",
            id: `${id}-trigger-${index}`,
            tabindex: stop ? "0" : "-1",
            "aria-selected": String(index === now),
            "aria-controls": `${id}-content-${index}`,
            "aria-disabled": off ? "true" : undefined,
            ...where(index),
            "data-disabled": flag(off),
            onClick(event: Event) {
              if (off) return
              setStep(index, details("trigger-press", event))
            },
          }
        }),
        attach: (element) => roving.register(element),
      })),
    indicator: (of) =>
      once("indicator", of, (at) => ({
        props: computed(() => ({ "aria-hidden": "true", ...where(at()) })),
        attach: () => NOTHING,
      })),
    separator: (of) =>
      once("separator", of, (at) => ({
        props: computed(() => ({ "aria-hidden": "true", ...where(at()) })),
        attach: () => NOTHING,
      })),
    content: (index) =>
      once("content", index, () => ({
        props: computed(() => ({
          role: "tabpanel",
          id: `${id}-content-${index}`,
          "aria-labelledby": `${id}-trigger-${index}`,
          tabindex: "0",
          hidden: flag(index !== step.get()),
          ...where(index),
        })),
        attach: () => NOTHING,
      })),
    completed: {
      props: computed(() => ({
        hidden: flag(step.get() < total.get()),
        "data-orientation": orientation.get(),
      })),
      attach: () => NOTHING,
    },
    previous: move(-1, "previous-press"),
    next: move(1, "next-press"),
  }
}
