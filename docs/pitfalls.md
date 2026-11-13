# Pitfalls

What cost real debugging time while this library was built, and the rule each one left behind.
Read it before writing core or adapter code. Add an entry in the change that meets a new one,
with the test that now holds it.

## The rule behind the rules

A fault met once is held out for good by a check that runs on **every** component, not by a
note. Three places hold them:

- `tests/core/` runs each service of the core on its own, in real browsers, with no framework.
- `tests/conformance/run.ts` plays one set of scenarios on all five adapters and compares the
  DOM of every state across them. A fault that one framework shows and four hide fails there.
- Every snapshot of that run is also read for faults that need no scenario: an attribute the
  vocabulary does not name, a state written as `="false"`, a reference to an id that is not in
  the page, an id used twice, `pointer-events` on the page.

## State

- **A caller who holds a value gives it back later, each framework in its own time.** React
  renders in a later task, Svelte and Vue in a microtask, Angular a turn after a model is set.
  Right after `set()`, reading the value back gives the old one. Code that must act on the new
  value uses the value it asked for (and the old one only when `details.canceled`), never the
  value read back. Met in the form reset: three adapters wrote the stale value into the native
  input. Held by `tests/core/form-control.test.ts` ("answers a moment later") and the reset
  scenario in the conformance run.
- **A native input's live state is the core's to write.** Frameworks differ in when they write
  the `checked` property, and after a form's reset three of the five left the input saying
  something else than the control. The core follows its own signal with an effect on the
  element, so the input says what the control says whatever drew it.
- **Effects set inside a running effect run after it.** An exit or an entrance lands one report
  after the state is set. A test waits a task; it never asserts in the same tick.
- **Defaults are read once.** A default that follows live state reopens a panel the person
  closed.
- **State is never taken from an ancestor of the same kind.** A tab set inside another's panel
  has its own value. The conformance page nests one for this.

## Attributes

- **Never remove an attribute you did not write.** A part with no value for `id` must leave the
  caller's `id` alone on every pass, not only the first. Met in the plain-DOM binder, which
  Angular uses. Held by `tests/core/bind.test.ts`.
- **A boolean state is present or absent.** `data-active="false"` matches `[data-active]`. Every
  snapshot is checked against the vocabulary's values.
- **A reference names an element that is in the page.** `aria-controls`, `aria-labelledby`,
  `aria-describedby` and `for` are checked on every snapshot. Met in Field: its label was `for`
  an id that only a native control carried, so a radio group, a slider and a select left it
  pointing at nothing. Those now take the id.
- **A label must not press a button it names.** A `<label for>` clicks its control. For a
  select's trigger that would open the list, where a native `<select>` only takes focus. The
  field's label prevents the click and moves focus.
- **Ids nobody gave come from the framework**, so the server's and the browser's agree. The
  second fixture page gives no id anywhere and is compared before and after hydration.

## Forms

- **`reset` is told before it happens.** The event is fired, then the browser puts the native
  controls back. A listener therefore writes what the browser will read next (an input's
  `defaultChecked`), and anything that must see the result waits a task.
- **A cancelled reset does not happen.** A page's own `onreset="return confirm(…)"` runs on the
  form; the control listens at the end of the event's way up and reads `defaultPrevented`.
- **`reset` does not leave a shadow tree.** Inside one, the listener goes on the shadow root.
- **A control belongs to the form it names**, not only the one around it: read `input.form`.
- **A `<fieldset disabled>` disables a native control without setting its `disabled`.** A
  control that is not native reads its ancestor fieldsets (but for the first legend) and
  watches them, only when it has one. It knows once it is in the page: a server draws it
  enabled, and the browser corrects it as the page mounts.
- **A hidden input is never `required`.** A form could not show its message. The field checks
  the control and words the message as the browser does.
- **One path for a change.** A press on the box presses its native input, and so does a
  `<label>`: the input's `change` is the only place the value moves, so a label around the box
  does not toggle it twice.

## Frameworks

- **React** renders a caller's new state in a later task. Nothing the core needs may wait for
  a render, and nothing may assume one has happened.
- **React in StrictMode** hands every ref over, takes it away and hands it back when an element
  is first drawn, and does the same with every effect. A part's DOM work must not be undone
  for that: a panel lost its entrance and a select opened on the wrong side with nothing
  highlighted. The adapter undoes an attach or a mount a moment later, only if it has not come
  back (`usePart`, `useMount`). The same happens whenever a caller passes a new `ref` function
  on a render. A production build hides all of it, so the React fixture is built a second time
  as a development build in StrictMode and every scenario is played on it, with React's own
  warnings counted as failures.
- **React forbids updating one component while another renders.** Writing a core signal during
  render is exactly that when another part is drawn from it: the avatar wrote its image's
  address while rendering, which started the load and changed the status its fallback reads.
  A prop reaches the core after the render commits. Only the development build says so.
- **Vue** may hand over an element before it is in the page. Anything that reads where the
  element is (`getRootNode()`, `closest("fieldset")`, a measure) waits until it is connected.
  Its `Teleport` writes markers on a server that hydration then empties: no portal is drawn on
  a server or during hydration, on any adapter.
- **Vue and Svelte declarations**: a literal default types a prop as that literal (`null`,
  `undefined`), and an untyped `$props()` declares every prop required. `vp run types` and
  `vp run pack` (the packed declarations, used from an empty project) hold both.
- **Angular** renders in a task of its own without zones: a test waits before reading the page
  after a press. Its root element is inline unless styled (`display: block`), which lets
  Chrome's scroll anchoring move the page when a portal is removed. On a server a part is
  written once, with no listeners.
- **Solid and Svelte** attach children around their parent in an order of their own: a list
  reads its rows in the page's order at use time, never the order they registered in.

## Browsers

- **Chromium without a GPU never ends an animation** in a headless run. Launch it with
  `--disable-gpu --disable-software-rasterizer`.
- **A page that draws no frames must behave the same.** Nothing waits for an animation frame
  that can be decided at render or by reading a style.
- **A popup is live only while it is open.** As it starts to close it leaves the stack, gives
  focus back and lets the page go, and is inert through its exit. Before, a popup stayed in
  the stack and kept focus until its exit animation ended: Escape meant for the popup under
  it was swallowed, and Enter could press a button in a popup already on its way out. Held by
  `tests/core/popup.test.ts`.
- **A popup kept in the page while closed does nothing**: it is not in the stack and takes no
  focus until it opens.
- **Focus goes back along a chain, read as the popup closes**: the trigger; if it is gone or
  hidden, what had focus before; if that is gone too, the popup this one was opened from. A
  row that opens a dialog and is removed by what the dialog does is the usual case.
- **A popup carries only what it uses.** Focus, modality and placement are given to the popup
  layer, not imported by it: a tooltip does not carry a focus trap, a dialog does not carry
  the positioning code. A shared service that imports everything makes every component pay
  for the heaviest one; the size budgets caught it.
- **Layers close in any order.** What a layer makes inert is counted, and given back when the
  last layer that needs it lets go; a layer that was already in the page when another opened
  is lifted out of that one's isolation while it is open. Held by `tests/core/ledger.test.ts`.
- **A press outside is decided where it begins.** A press that starts inside a popup and is
  let go outside (a text selection, a thumb dragged past the edge) does not close it.
- **A row's name is the text a person reads.** A shortcut drawn beside it with `aria-hidden`,
  or anything `hidden`, is not part of what typing searches or a trigger shows (`textOf`).
- **A popup moved to the end of `<body>` loses its `dir`.** The position service carries the
  anchor's direction onto the positioner.
- **`overflow: hidden` on the page does not stop `scrollTo`.** A test of the scroll lock reads
  the computed style, not whether a script can scroll.

## Tests and tooling

- **Run the task, not the script, when a build stands between them.** `bun
  tests/conformance/run.ts` plays whatever the fixtures were last built from; `vp run
  conformance` builds them first. Three identical failures in a row were a stale build.
- **A probe that reads layout can hide the fault it looks for.** A scroll jump disappeared
  under a logger that read `scrollY`.
- **Stop what you start, by its process id.** A server left running holds a port and memory
  for the next run.
- **A dependency change is checked in a fresh clone** with a frozen lockfile: links of removed
  packages stay in `node_modules`.
