# Building a component of your own

Every component here is made the same way: a **controller** in plain TypeScript that holds the
behaviour, and a few lines per framework that draw its parts. What the components are built
from is public, so a component of your own is built the same way and behaves the same on
React, Vue, Svelte, Solid and Angular.

- `@kirana-ui/core`: the signals, `bindable`, `details`, `flag`, `mergeProps`, `bind`.
- `@kirana-ui/core/authoring`: the services (presence, popups, placement, lists, roving
  focus, typeahead, forms, geometry, direction) and what a vocabulary is defined with.
- `@kirana-ui/react/runtime` (and `vue`, `svelte`, `solid`; Angular's are in its one entry):
  what a part's component is made with.

These entries change only as the components do: a release that breaks one says so.

## The shape of a controller

```ts
createX(props: ReadonlySignal<XProps>, around?) => { ...signals, ...parts, mount() }
```

- **`props` is a signal.** The adapter keeps it up to date; the controller reads it with
  `.get()` where a change should be followed and `.peek()` where it should not. A default
  (`defaultValue`) is read once.
- **A part is `{ props, attach }`.** `props` is a signal of what goes on its element:
  attributes by their HTML names (`tabindex`, `aria-checked`, `data-checked`), handlers by
  camel-cased event names (`onClick`, `onKeyDown`). A boolean state is `""` or absent, never
  `"false"`: write it with `flag()`. `attach(element)` does the DOM work and returns its undo.
- **Nothing touches the DOM when the controller is made.** A server makes one and reads its
  parts. DOM work starts in `attach`, and anything that runs while the component is in the
  page starts in `mount()`.
- **A value is a `bindable`.** It is the caller's when they give `value` and the component's
  own when they do not, and its `set(value, details)` calls `onValueChange` itself. A caller
  may `details.cancel()`: decide from `details.canceled`, never by reading the value back,
  which a caller who holds it gives back in their framework's own time.
- **A change says why.** `details(reason, event)` carries the reason, the event and what
  made it (`source`: mouse, touch, pen, keyboard, virtual, programmatic).

## A rating, end to end

Five stars, one chosen: a radio group that is one stop for Tab, moved through with the
arrows, submitted with a form and put back by its reset.

```ts
import { bindable, computed, details, flag } from "@kirana-ui/core"
import type { ChangeDetails, Part, ReadonlySignal } from "@kirana-ui/core"
import {
  DISABLED,
  createFormControl,
  createRoving,
  defineComponent,
  state,
} from "@kirana-ui/core/authoring"

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
```

What it took from the library, and what that bought:

- `bindable`: controlled and uncontrolled use, and a caller who can refuse a change.
- `createRoving`: the arrows, Home and End, in the page's order and the reading direction,
  whatever order a framework attached the stars in.
- `createFormControl`: the form's reset, and a `<fieldset disabled>` around it.
- `defineComponent`, `state`: its attributes as data. The components' own vocabulary is
  published as `@kirana-ui/vocabulary`; a design system's keys can be read from yours the
  same way.

## Drawing it

With no framework, `bind` puts a part on an element: its attributes, its listeners, its
`attach`. It returns the undo.

```ts
import { bind, signal } from "@kirana-ui/core"

const rating = createRating(signal({ defaultValue: 3, name: "stars" }))
const stops = [
  bind(root, rating.root),
  ...stars.map((star, at) => bind(star, rating.item(at + 1))),
  bind(hidden, rating.input),
  rating.mount(),
]
```

In React, `useController` makes the controller once and keeps its props current, and
`usePart` draws a part: the caller's props merged under the part's (its attributes win, its
handlers run after the caller's unless the caller calls `event.preventKiranaHandler()`), a
`render` prop for another element, and `attach` called once the element is in the page.

```tsx
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { useController, usePart } from "@kirana-ui/react/runtime"
import type { PartComponentProps } from "@kirana-ui/react/runtime"
import { createRating } from "./rating.ts"
import type { Rating as Controller, RatingProps } from "./rating.ts"

const Context = createContext<Controller | null>(null)

function useRating(): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error("A Rating part must be inside <Rating.Root>")
  return controller
}

function Root({
  value,
  defaultValue,
  onValueChange,
  count,
  disabled,
  name,
  children,
  ...rest
}: RatingProps & PartComponentProps): ReactElement {
  // Made once; it follows the props of each render, and runs its `mount` while in the page.
  const controller = useController<RatingProps, Controller>(createRating, {
    value,
    defaultValue,
    onValueChange,
    count,
    disabled,
    name,
  })
  return (
    <Context.Provider value={controller}>
      <RootElement {...rest}>
        {children}
        {name === undefined ? null : <HiddenInput />}
      </RootElement>
    </Context.Provider>
  )
}

// A part's element: the caller's props under the part's, `render` for another element, and the
// part's DOM work attached once the element is in the page.
const RootElement = (props: PartComponentProps) => usePart(useRating().root, "div", props)
const HiddenInput = () => usePart(useRating().input, "input", {})

function Item({ place, ...props }: PartComponentProps & { place: number }): ReactElement {
  return usePart(useRating().item(place), "button", { type: "button", ...props })
}

export const Rating = { Root, Item }
```

The other adapters have the same two pieces under their own names: `controller` and
`partComponent` in Vue, `controller` and `<Part>` in Svelte and Solid, `inputsSignal` and
`hostPart` in Angular. A part's file in this repository is the example for each
(`packages/<adapter>/src/toggle.*` is the smallest).

## Testing it

A controller needs no framework to test: bind its parts to elements in a real browser and
press them. `tests/core/authoring.test.ts` does that for the rating above, and holds this
page to the files it quotes.

## What to keep to

`docs/pitfalls.md` lists what building these components taught. The ones a new component
meets first:

- Never wait for a value the caller holds; decide from `details.canceled`.
- Measure a popup as it is laid out, not as its entrance draws it.
- A part that writes an `id` renames its element: find the element before binding it.
- Focus is the core's and at once; an attribute is the framework's next render.
