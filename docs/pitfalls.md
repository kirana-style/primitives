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

## Lists and menus

- **A label needs no group.** A menu's label outside a group is plain text that names
  nothing; inside one, the group is named by it. Nothing throws either way.
- **Rows are read from the page, in its order, when a key needs them.** Nothing registers
  in an order a framework chooses, and a list inside a row keeps its own rows.
- **A press on a row is a click.** Enter and Space click the highlighted row, so a caller's
  `onClick` hears the keyboard as it hears the pointer, and a row drawn as a link follows it.
- **A checkbox or radio item leaves the menu open**; whether choosing closes is the item's
  `closeOnClick`.
- **Focus is on the row**, not `aria-activedescendant`: a phone's screen reader does not
  follow the second.
- **A filtered item is `hidden`, and a row's own `display` shows it again.** `.item { display:
  flex }` beats the `hidden` attribute. A design that gives rows a display also writes
  `[hidden] { display: none !important }` (most resets do).
- **A combobox's highlight follows what is shown, not the key that was typed.** Where the
  caller holds the input's text, the list is still filtered by the old text when the key is
  heard: the first "shown" row was one about to be hidden, it stayed highlighted, and Enter
  pressed it. The highlight is moved by an effect on the filter, and Enter presses only a row
  that is shown. While the list is open, Enter is never the form's.
- **A combobox's text is the core's to write.** A framework that held the input's `value`
  would write it in its own time, over what was typed since.
- **A menu opened as the button goes down asks, and does not read back.** One press opens it,
  and the click that ends the press must not close it. Whether it opened is what was asked
  for (unless cancelled), not `open` read back: on a framework that answers later the press
  looked refused, and its click closed the menu it had opened.
- **The pressed button is kept from taking focus** for a press that opens a menu
  (`mousedown` is prevented): the browser gives the button focus after the handlers, which
  is before or after the menu took it depending on when the framework drew.
- **A modal menu is not an inert page.** Its trigger must stay live, so the page keeps its
  scroll locked and a press outside is swallowed (it closes the menu and reaches nothing,
  its click included); nothing is made inert.
- **A context menu that is asked to move is not closed first.** A second secondary press in
  its area begins outside the popup; closing for it and opening again depends on when a
  caller who holds `open` answers, and the menu ended closed on some frameworks. The press
  is not an outside press: the menu stays open, moves, and takes focus back (the press took
  it to the page). A plain press in the area still closes it.
- **A context menu is named by its caller.** It has no trigger to be `aria-labelledby`, and
  a reference to an id that is not in the page is a fault: give the popup an `aria-label`.
- **A touch screen may not send `contextmenu`** for a finger that rests. The area times the
  rest itself, and lets go when the finger moves (a scroll) or lifts.
- **A press counts from inside the border.** A test that presses at a point of an element
  and reads a rectangle back adds the border, and allows a pixel: popups are put on whole
  pixels, the page may not be.
- **In a menubar an arrow belongs to the innermost thing that answers it**: a submenu's
  trigger opens with it, a submenu closes with the other, and only an item that does neither
  sends it across to the next menu. A key a row answered is `defaultPrevented` by the time
  the menu hears it.
- **A bar is one stop for Tab, and a server cannot know which trigger is first.** Until
  focus has been in the bar every trigger can take it; after, only the one it was last on.
- **White space between a row's parts is drawn by some frameworks and not others.** A row is
  a flex box, or its parts are elements with nothing between them.

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
- **React hands an event in a portal to the components around the portal**, not the elements:
  a key pressed in a submenu reached the handler of the menu it was drawn inside, which then
  moved its own highlight. A handler on a popup checks the event came from its own element.
  The other four follow the page, where a portal is elsewhere.
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
  written once, with no listeners. An input's options are written where the input is: its
  compiler does not follow a constant (`NG1010`), and only the fixture's build says so.
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
- **A list scrolls itself, never the page.** `scrollIntoView` scrolls every ancestor, and a
  list that has just opened is not placed yet: highlighting its first row took the page to
  the top, where the list stood before its place was known. Five adapters did the same, so
  comparing them said nothing; no scenario read the page's scroll. A row is now brought into
  view inside the list's own scrolling box only. Held by `tests/core/list.test.ts`,
  `tests/core/menu.test.ts` ("does not move the page") and the select's and the menu's
  scenarios, which read `scrollY` around an opening.
- **A popup and one opened from it close in either order.** A caller who holds both `open`
  values gives them back in their framework's order: Svelte closed the menu before its
  submenu, focus was in the submenu, so the menu gave nothing back and the submenu's trigger
  was already inert. Focus in a popup opened from this one (its trigger is inside this one)
  counts as inside it. Held by `tests/core/menu.test.ts` ("whichever of the two closes
  first") and the menu's scenario on five adapters.
- **A popup on its way out is not placed again.** It follows its anchor only while it is
  open. A submenu's trigger is inside a menu that scales away as both close: measured again
  on each frame, the trigger's shrinking width (`--anchor-width`) resized the submenu inside
  the observer that watches its size, and the browser reported "ResizeObserver loop
  completed with undelivered notifications" on every frame of the exit. Held by
  `tests/core/position.test.ts` and `tests/core/menu.test.ts` ("on their way out").
- **Where the pointer left is not in the `pointerleave`.** Its coordinates are where the
  pointer is by then, already on the next row. The way from a submenu's trigger to its popup
  starts from the pointer's last move on the trigger.
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
- **Several pages at once is for Chromium.** The conformance run plays six subjects at a time
  there (352 s one at a time, 120 s with six and its timed scenarios alone, the same results). Firefox gained nothing from
  three and failed one run in two, each time on a scenario that times a press or looks for
  one frame: it and WebKit play one at a time. Scenarios that measure a wait (`hover`,
  `dialog`) are played with nothing else running, in any engine. A check that fails one run
  in two is not a check.
- **Tasks a task `dependsOn` run side by side; a `&&` chain runs in order.** The gates that
  read nothing another writes are dependencies of one task (35 s together, 57 s in a row);
  the rehearsal `dependsOn` the packing, which it reads.
- **A git hook holds the push's connection open.** The pre-push hook is the quick checks
  only; the full `vp run prepush` is run by hand, and by CI.
- **A browser reports some faults to the window, not as an exception** (a resize observer
  that could not deliver within a frame). Whether a test runner's "page error" hears them
  varied between this machine and CI: the conformance page listens for the window's `error`
  itself, so the two fail alike.
- **CI's fonts and speed are not this machine's.** `bun tests/conformance/run.ts react
  --only menu --slow 6` plays one scenario with the processor slowed.
- **A probe that reads layout can hide the fault it looks for.** A scroll jump disappeared
  under a logger that read `scrollY`.
- **Stop what you start, by its process id.** A server left running holds a port and memory
  for the next run.
- **A dependency change is checked in a fresh clone** with a frozen lockfile: links of removed
  packages stay in `node_modules`.
