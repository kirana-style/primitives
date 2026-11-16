---
name: kirana-ui-primitives
description: Use and build headless UI components with Kirana UI Primitives (@kirana-ui/core, /react, /vue, /svelte, /solid, /angular). Use when adding a dialog, menu, select, combobox, form control, date picker or any other component from these packages, when styling one by its data attributes and CSS variables, when a component "does nothing" or looks wrong, or when building a component of your own on the library's services.
---

# Kirana UI Primitives

Headless components: behaviour, accessibility and state, with no styles. The same components,
parts, attributes and behaviour on React, Vue, Svelte, Solid and Angular, from one core.

## Read first

- **`node_modules/@kirana-ui/<framework>/llms.txt`**: every component of the installed
  version, its parts, its root's props with what they mean, and each part's attributes and
  CSS variables. Read the section for the component before writing it. Never guess a part
  or a prop: what is not in that file is not in the package.
- **`node_modules/@kirana-ui/vocabulary`**: the same attributes and variables as data
  (`vocabulary.json`) and as typed selectors (`keys`), for a design system.

## Using a component

1. Import it from its own entry: `@kirana-ui/react/dialog`, not the package root, unless
   the bundler shakes trees well.
2. Compose its parts as its `llms.txt` section lists them. A popup is
   `Portal > Positioner > Popup`; the `Positioner` takes `side`, `align`, `sideOffset`.
3. Style by attributes and variables, never by guessing class names:
   - a boolean state is present or absent: `[data-open]`, never `[data-open="true"]`;
   - an entrance starts from `[data-starting-style]`, an exit ends at
     `[data-ending-style]`: write the hidden style under both and add a `transition`;
   - a popup's measures are on its positioner: `--anchor-width`, `--available-height`,
     `--transform-origin`.
4. A value is controlled when given (`value` + `onValueChange`) and the component's own
   otherwise (`defaultValue`). A change callback is `(value, details)`; `details.cancel()`
   keeps the value as it was.
5. A control with a `name` is submitted with its form and follows the form's reset. Wrap it
   in `Field` for a label, a description and validation.

Per framework: React takes `render` for another element; Vue takes `as` / `as-child`, binds
with `v-model:value` and names props in kebab case; Svelte takes a `child` snippet and
`bind:value`; Solid takes `as`; Angular's parts are directives on your own elements
(`<button kuiDialogTrigger>`), bound with `[(value)]`, with `[kuiId]` for an id.

## When something is wrong

- **A group label throws or names nothing**: it is valid alone here; inside a `Group` it
  names the group.
- **A popup is unstyled or misplaced**: it is in a portal at the end of `<body>`, outside
  the styles of where its trigger is. Style the popup itself.
- **An exit never finishes**: the part waits for its own transitions and animations to end.
  An animation that never ends on the part itself keeps it in the page.
- **A controlled value does not change**: the callback must write the value back.
- **Nothing happens on a server**: nothing should. A controller touches no DOM until its
  element exists; popups appear once the page has hydrated.

## Building a component of your own

Use the library's own services rather than writing focus, dismissal or form handling again:
`@kirana-ui/core/authoring` (presence, popups, placement, lists, roving focus, typeahead,
form controls, direction, `defineComponent`) and the adapter's `runtime` entry
(`@kirana-ui/react/runtime` …).

The shape: `createX(props: ReadonlySignal<Props>) => { ...signals, ...parts, mount() }`. A
part is `{ props, attach }`: `props` a signal of attributes (HTML names) and handlers
(`onClick`); `attach(element)` does DOM work and returns its undo. Make no DOM call when the
controller is made. Hold a value in `bindable`, and decide from `details.canceled`, never by
reading the value back.

## Checking the result

`@kirana-ui/core/testing`, in a real browser test:

```ts
import { faults, known, recorder, serialize, settled } from "@kirana-ui/core/testing"

await settled() // nothing is moving
expect(faults(document.body)).toEqual([]) // no attribute, variable, reference or id fault
```

Add `known(yourVocabulary)` for a component of your own, and `recorder()` to read what a
callback heard or to refuse a change. Test with the keyboard, not only the pointer.
