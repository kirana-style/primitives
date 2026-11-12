# Kirana UI Primitives

Headless components for React, Vue, Svelte, Solid and Angular: one framework-free core that holds
every behaviour, and a thin adapter per framework that renders it in that framework's idiom.

> **Status: pre-release.** Nothing is published. Twenty-two components on all five adapters:
> Accordion, Alert Dialog, Avatar, Button, Checkbox, Collapsible, Dialog, Field, Fieldset, Form, Hover Card, Meter,
> Popover, Progress, Radio Group, Select, Separator, Slider, Switch, Tabs, Toggle, Tooltip; and the
> Direction provider. The API will change.

- **The same on every framework.** One set of scenarios runs on every adapter in a real browser,
  and the DOM of every state is compared across them: the same attributes, the same variables,
  the same elements.
- **No styles, no lock-in.** Every state is a data attribute (`data-open`, `data-highlighted`,
  `data-starting-style`), every measure a CSS variable (`--anchor-width`,
  `--collapsible-panel-height`). Style it with plain CSS, Tailwind, Kirana or anything else. The
  vocabulary follows Base UI's, and is published as data (`packages/core/src/vocabulary.ts`).
- **Motion is CSS.** A panel or popup enters from its `data-starting-style` and leaves through its
  `data-ending-style`, so a design animates with transitions that reverse mid-flight. A closed
  panel leaves the page.
- **Forms work as forms.** A checkbox, a switch and a radio hold a hidden native input: a form
  submits it and a `<label>` reaches it, with no extra wiring.
- **Right to left without setup.** Arrow keys and a slider follow the `dir` the element is laid
  out in. A Direction provider states it where no page can be asked, on a server.
- **Small.** The core has one dependency (`@floating-ui/dom`).
- **Renders on a server.** A controller touches no DOM until its element exists, so the page a
  server sends is the page at rest, and hydration finds nothing to correct (tested on React, Vue,
  Svelte and Solid; Angular's is not yet).

## Layout

| Path                                                  | Holds                                                                                                                                                                             |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core`                                       | `@kirana-ui/core`: reactivity, services (presence, layers, focus, scroll lock, position), a controller per component, the vocabulary, a plain-DOM binder                          |
| `packages/react`, `vue`, `svelte`, `solid`, `angular` | the adapters: a signal bridge, the framework's composition, a few lines per part                                                                                                  |
| `packages/vocabulary`                                 | `@kirana-ui/vocabulary`: every part's states and CSS variables as data and as typed selector keys, generated from the core ([REFERENCE.md](packages/vocabulary/REFERENCE.md))     |
| `fixtures/<adapter>`                                  | the page every adapter draws, element for element, the same page rendered on a server and hydrated, and a bench page; `fixtures/shared/styles.css` styles them all with plain CSS |
| `tests/conformance`                                   | the scenarios and the cross-adapter comparison                                                                                                                                    |
| `bench`, `scripts/budgets.ts`                         | mount time, memory and interaction; gzip per component                                                                                                                            |

## How a component is built

```ts
import { createCollapsible } from "@kirana-ui/core/collapsible"

const collapsible = createCollapsible(props) // props: a signal of the caller's props
collapsible.open // a signal
collapsible.trigger.props // a signal of what goes on the element: attributes and handlers
collapsible.panel.attach(el) // DOM work for the element; returns the cleanup
```

An adapter reads `props` into its framework and calls `attach` when the element exists:

```tsx
// React
<Collapsible.Root>
  <Collapsible.Trigger>Details</Collapsible.Trigger>
  <Collapsible.Panel className="panel">…</Collapsible.Panel>
</Collapsible.Root>
```

```vue
<!-- Vue -->
<Collapsible.Root>
  <Collapsible.Trigger>Details</Collapsible.Trigger>
  <Collapsible.Panel class="panel">…</Collapsible.Panel>
</Collapsible.Root>
```

```svelte
<!-- Svelte -->
<Collapsible.Root>
  <Collapsible.Trigger>Details</Collapsible.Trigger>
  <Collapsible.Panel class="panel">…</Collapsible.Panel>
</Collapsible.Root>
```

```html
<!-- Angular -->
<div kuiCollapsible>
  <button kuiCollapsibleTrigger>Details</button>
  <div *kuiCollapsiblePanel class="panel">…</div>
</div>
```

A part renders as the caller's own element in each framework's idiom, and its attributes still
win: `render` on React and Solid, `as-child` on Vue, a `child` snippet on Svelte, and on Angular
the directive simply sits on the caller's element. A caller's handler runs first and can call
`event.preventKiranaHandler()` to keep the part's own out of that event.

```css
.panel {
  overflow: hidden;
  height: var(--collapsible-panel-height);
  transition: height 150ms ease-out;
}
.panel[data-starting-style],
.panel[data-ending-style] {
  height: 0;
}
```

## Commands

The toolchain is Vite+ (`vp`) with Bun as the package manager.

```bash
vp install            # first, and after bun.lock changes
vp run check          # format, lint with types, type check; warnings fail
vp run test           # the core's reactivity; the React adapter on the server
vp run vocabulary     # packages/vocabulary from the core's part definitions
vp run build          # each adapter's fixture, with its server-rendered page
vp run conformance    # the scenarios on every adapter (Chromium), the DOM compared across them
bun tests/conformance/run.ts --browser firefox   # or chromium,firefox,webkit: once in each
vp run bench          # mount, memory, interaction against Base UI, Ark UI and ng-primitives
vp run budgets        # gzip per component
```

## Licence

MIT.
