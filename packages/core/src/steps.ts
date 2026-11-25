import type { DirectionAround } from "./direction.ts"
import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed } from "./reactivity.ts"
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
  /** How many steps there are. */
  count: number
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
  /** One step of the row, around its trigger and its separator. */
  item(index: number): Part
  /** What names a step and goes to it. */
  trigger(index: number): Part
  /** A step's mark: its number, or a tick once it is done. */
  indicator(index: number): Part
  /** The line from a step to the next. */
  separator(index: number): Part
  /** What a step shows: in the page always, hidden unless its step is the one shown. */
  content(index: number): Part
  /** What is shown once every step is done. */
  readonly completed: Part
  readonly previous: Part
  readonly next: Part
}

const NOTHING = () => {}

/**
 * A task in steps taken in order: which is shown, which are done, and the way between them.
 * The steps are tabs to assistive technology, each with its panel.
 */
export function createSteps(
  props: ReadonlySignal<StepsProps>,
  around: DirectionAround = {}
): Steps {
  const id = props.peek().id
  const count = computed(() => Math.max(0, Math.round(props.get().count)))
  const held = bindable<number>({
    value: () => props.get().step,
    defaultValue: props.peek().defaultStep ?? 0,
    onChange: (next, by) => props.peek().onStepChange?.(next, by),
  })
  // A caller's step that is no step is the nearest that is.
  const step = computed(() => Math.min(count.get(), Math.max(0, Math.round(held.get()))))
  const orientation = computed<Orientation>(() => props.get().orientation ?? "horizontal")
  const roving = createRoving()
  const made = new Map<string, Part>()

  function setStep(next: number, by: ChangeDetails) {
    const to = Math.min(count.peek(), Math.max(0, Math.round(next)))
    if (to !== step.peek()) held.set(to, by)
  }

  /** A part made once for an index: asked for again, the same. */
  function once(name: string, index: number, make: () => Part): Part {
    const key = `${name}:${index}`
    let part = made.get(key)
    if (!part) made.set(key, (part = make()))
    return part
  }

  const where = (index: number) => {
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
        const off = by > 0 ? step.get() >= count.get() : step.get() <= 0
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
        "data-complete": flag(step.get() >= count.get()),
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
    item: (index) =>
      once("item", index, () => ({ props: computed(() => where(index)), attach: () => NOTHING })),
    trigger: (index) =>
      once("trigger", index, () => ({
        props: computed(() => {
          const now = step.get()
          // With all of them done, the last step is where Tab stops.
          const stop = index === Math.min(now, count.get() - 1)
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
    indicator: (index) =>
      once("indicator", index, () => ({
        props: computed(() => ({ "aria-hidden": "true", ...where(index) })),
        attach: () => NOTHING,
      })),
    separator: (index) =>
      once("separator", index, () => ({
        props: computed(() => ({ "aria-hidden": "true", ...where(index) })),
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
        hidden: flag(step.get() < count.get()),
        "data-orientation": orientation.get(),
      })),
      attach: () => NOTHING,
    },
    previous: move(-1, "previous-press"),
    next: move(1, "next-press"),
  }
}
