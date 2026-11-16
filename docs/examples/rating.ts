import { bindable, computed, details, flag } from "../../packages/core/src/index.ts"
import type { ChangeDetails, Part, ReadonlySignal } from "../../packages/core/src/index.ts"
import {
  DISABLED,
  createFormControl,
  createRoving,
  defineComponent,
  state,
} from "../../packages/core/src/authoring.ts"

export interface RatingProps {
  /** How many stars are filled; 0 for none. */
  value?: number | undefined
  defaultValue?: number | undefined
  onValueChange?: ((value: number, details: ChangeDetails) => void) | undefined
  /** How many stars there are. Default 5. */
  count?: number | undefined
  disabled?: boolean | undefined
  /** With a name, the value is submitted with the form around it. */
  name?: string | undefined
}

export interface Rating {
  readonly value: ReadonlySignal<number>
  mount(): () => void
  readonly root: Part
  /** The star at `place`, from 1. */
  item(place: number): Part
  /** The hidden input that submits the value. */
  readonly input: Part
}

// Its parts as data: what a design system styles by, and what a test holds the parts to.
export const ratingVocabulary = defineComponent({
  root: { description: "The stars, as one choice.", states: { disabled: DISABLED } },
  item: {
    description: "One star.",
    states: {
      checked: state("data-checked", "Present on the chosen star and every star before it."),
      disabled: DISABLED,
    },
  },
})

const NOTHING = () => {}

/** A choice of one to `count` stars: radios, moved between with the arrows. */
export function createRating(props: ReadonlySignal<RatingProps>): Rating {
  // Held by the caller when they give `value`, by the component when they do not.
  const value = bindable<number>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? 0,
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  const initial = value.peek()
  // Back to where it began when its form is reset, and off inside a disabled fieldset.
  const inForm = createFormControl((event) => value.set(initial, details("form-reset", event)))
  const disabled = computed(() => Boolean(props.get().disabled) || inForm.disabled.get())
  // The arrows move between the stars that registered, in the page's order.
  const roving = createRoving()
  const places = new WeakMap<HTMLElement, number>()
  const items = new Map<number, Part>()

  function choose(place: number, by: ChangeDetails) {
    if (!disabled.peek() && place !== value.peek()) value.set(place, by)
  }

  return {
    value,
    // Nothing runs while it is in the page but what its parts attach.
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        role: "radiogroup",
        "aria-disabled": disabled.get() ? "true" : undefined,
        "data-disabled": flag(disabled.get()),
      })),
      attach: () => NOTHING,
    },
    item(place) {
      let part = items.get(place)
      if (part) return part
      part = {
        // Attributes by their HTML names; a boolean state is present or absent.
        props: computed(() => {
          const now = value.get()
          const chosen = now === place
          return {
            role: "radio",
            "aria-checked": String(chosen),
            "aria-label": `${place} of ${props.get().count ?? 5}`,
            // One stop for Tab: the chosen star, or the first while none is.
            tabindex: chosen || (now === 0 && place === 1) ? "0" : "-1",
            "data-checked": flag(place <= now),
            "data-disabled": flag(disabled.get()),
            onClick: (event: Event) => choose(place, details("item-press", event)),
            onKeyDown(event: KeyboardEvent) {
              const to = roving.move(event, { orientation: "both", loop: true })
              // A radio that takes focus is the one chosen.
              if (to) choose(places.get(to) ?? place, details("keyboard", event))
            },
          }
        }),
        // DOM work starts when the element is in the page, and is undone when it leaves.
        attach(element) {
          places.set(element, place)
          return roving.register(element)
        },
      }
      items.set(place, part)
      return part
    },
    input: {
      props: computed(() => ({
        type: "hidden",
        name: props.get().name,
        value: String(value.get()),
        disabled: flag(disabled.get()),
      })),
      attach: (element) => inForm.attach(element),
    },
  }
}
