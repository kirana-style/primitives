# Kirana UI Primitives

Headless components for React, Vue, Svelte, Solid and Angular: one framework-free core that holds
every behaviour, and a thin adapter per framework that renders it in that framework's idiom.

> **Status: 0.1, before 1.0.** On npm as `@kirana-ui/*`. Forty-eight components on all five adapters:
> Accordion, Alert Dialog, Autocomplete, Autosize (a text area), Avatar, Button, Calendar, Carousel, Checkbox, Collapsible, Combobox, Command, Context Menu, Date Field, Date Picker, Dialog, Drawer, Field, Fieldset, Form, Hover Card, Input, Label, Listbox, Menu, Menubar, Message Scroller, Meter, Navigation Menu, Number Field, One-Time Code (`Otp`), Pagination,
> Popover, Progress, QR Code, Radio Group, Resizable, Select, Scroll Area, Separator, Slider, Switch, Tabs, Toast, Toggle, Toggle Group, Toolbar, Tooltip; and the
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
  submits it and a `<label>` reaches it, with no extra wiring. A form's `reset` takes every
  control back to the value it began with, a `<fieldset disabled>` disables what is inside it,
  and `form="id"` puts a control in a form it is not inside, as each does for a native control.
- **Faults are held out by checks, not by care.** Every state of every component, on every
  framework, is read for the faults this library and others have had: a state written as
  `="false"`, a reference to an id that is not in the page, an id used twice, an attribute the
  vocabulary does not name. What each one cost is in [docs/pitfalls.md](docs/pitfalls.md).
- **Yours to build on.** What the components are made from is public
  (`@kirana-ui/core/authoring`, and each adapter's `runtime`): presence, popups, placement,
  lists, roving focus, forms. [docs/authoring.md](docs/authoring.md) builds a component with
  them end to end, and its example is one of the tests.
- **Written down for models too.** Each package ships an `llms.txt`: every component, part,
  prop, attribute and CSS variable, generated from the library's own definitions.
  The core ships a skill for an agent (`skills/kirana-ui-primitives`).
- **An agent can use what you build.** `@kirana-ui/core/agent` is a bridge: it lists a
  page's components (what each is, is called, holds and can be asked to do) and asks through
  each component's own handlers, so its change callback runs with `details.source ===
  "agent"` and may refuse. It reads what every part writes on its element, so one bridge
  serves every adapter. `allow`, `data-agent-confirm`, `data-agent-hidden` and
  `data-agent-secret` say what an agent may do and see; `registerTools` gives it to a
  browser's own agent (WebMCP) where there is one. `history()`, `undo()` and `redo()` keep
  what an agent changed, and take it back through the same handlers.
- **Its checks are yours.** `@kirana-ui/core/testing` reads a page for the faults every
  component here is held out of, writes it as text two frameworks can be compared by, and
  waits for motion to end: for a design system built on these, or a component of your own.
- **Right to left without setup.** Arrow keys and a slider follow the `dir` the element is laid
  out in, and a popup moved to the end of the page keeps the direction of its trigger. A
  Direction provider states it where no page can be asked, on a server.
- **With no framework too.** `@kirana-ui/web` is the components as custom elements. The
  element (`<kui-dialog>`) holds the component and draws nothing; its parts are the page's
  own elements (`<button kui-part="trigger">`), with no shadow root, so the page is the page
  the other adapters draw. 43 of the 48, held to the same scenarios and the same DOM as the
  five frameworks; the five whose parts draw a list the page did not write (Calendar, Date
  Field, Date Picker, Pagination, Toast) follow.
- **Small.** The core has one dependency (`@floating-ui/dom`), and the calendar a second of its own
  (`@internationalized/date`): a page that draws no calendar carries none of it.
- **Renders on a server.** A controller touches no DOM until its element exists, so the page a
  server sends is the page at rest, and hydration finds nothing to correct (tested on all five).
  Ids nobody gave are the same on the server and in the browser, and a popup that is open from
  the start appears once the page is in the browser.

## Layout

| Path                                                  | Holds                                                                                                                                                                                                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core`                                       | `@kirana-ui/core`: reactivity, services (presence, the popup layer over layers, focus, scroll lock and position, hover, roving focus, list navigation, typeahead, form control), a controller per component, the vocabulary, a plain-DOM binder |
| `packages/react`, `vue`, `svelte`, `solid`, `angular` | the adapters: a signal bridge, the framework's composition, a few lines per part                                                                                                                                                                |
| `packages/vocabulary`                                 | `@kirana-ui/vocabulary`: every part's states and CSS variables as data and as typed selector keys, generated from the core ([REFERENCE.md](packages/vocabulary/REFERENCE.md))                                                                   |
| `fixtures/<adapter>`                                  | the page every adapter draws, element for element, the same page rendered on a server and hydrated, and a bench page; `fixtures/shared/styles.css` styles them all with plain CSS                                                               |
| `tests/conformance`                                   | the scenarios and the cross-adapter comparison                                                                                                                                                                                                  |
| `docs/pitfalls.md`                                    | what cost debugging time, and the check that now holds each one out                                                                                                                                                                             |
| `docs/authoring.md`                                   | how a component is built, with one built end to end from the public services                                                                                                                                                                    |
| `packages/*/llms.txt`                                 | each package for a model to read: generated (`bun scripts/llms.ts`), and held current by `vp run llms`                                                                                                                                          |
| `tests/core`                                          | the core's services on their own, with no framework, in a browser                                                                                                                                                                               |
| `bench`, `scripts/budgets.ts`, `budgets.json`         | mount time, memory and interaction; gzip per component                                                                                                                                                                                          |

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
vp run types          # Vue's and Svelte's templates: vue-tsc and svelte-check
vp run test           # the core's reactivity; the React adapter on the server
vp run browser        # the core's services with no framework, in Chromium and Firefox (BROWSERS=… for others)
vp run vocabulary     # packages/vocabulary from the core's part definitions
vp run build          # each adapter's fixture, with its server-rendered page
vp run conformance    # the scenarios on every adapter (Chromium), the DOM compared across them
bun tests/conformance/run.ts --browser firefox   # or chromium,firefox,webkit: once in each
vp run bench          # mount, memory, interaction against Base UI, Ark UI and ng-primitives
vp run budgets        # gzip per component, against the limits in budgets.json
vp run parity         # every adapter exports the same components, parts and entries
vp run rehearse       # the release path against a registry of its own; nothing reaches npm
vp run pack           # the packages as published (dist-packages/), then used from an empty project
```

## Licence

MIT.
