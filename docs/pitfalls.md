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
- **A control's own id wins over the one its field gives it.** The field named its control by
  writing its own id over the caller's, so a caller who named the element lost the name. The
  field's id is now a default (`defaultId`): `forElement` drops it where the caller gives an
  `id`, and the field reads what the element is called once it is in the page, which its
  label is then `for`. A server writes the label before the control and cannot know it, so
  the label follows after the page mounts. Vue's adapter turned a part's props into its own
  form before `forElement`, and the default's mark was lost on the way: a mark that is not an
  attribute goes through every adapter's conversion. Held by `tests/core/field.test.ts` ("a
  control's own id inside a field") and the `field` scenario ("a control keeps its own id").
- **Outside a field too, an id the caller gives is the element's.** A tags input, an editable,
  a number field and a one-time code named their input after the root wherever no field was
  around, over the caller's own `id`, so a `<label for>` that named it pointed at nothing. The
  root's id is a default there as well. A number field's buttons are `aria-controls` the input
  by what it is called once it is in the page; a server, which writes them before the input,
  names it by the id it makes. Held by `tests/core/tags-input.test.ts`,
  `tests/core/editable.test.ts`, `tests/core/number-field.test.ts` and
  `tests/core/otp.test.ts` ("keeps the id its caller gives the input"), and the `tagging`, `editing`,
  `widgets` and `entry` scenarios ("its input keeps the page's id").
- **A name the library writes in English is a default.** A password input's toggle wrote
  "Show password" over the caller's `aria-label`, so a page in another language could not name
  it. Such a label goes through `defaultLabel`, which the caller's own `aria-label` wins over
  (`forElement`), and its words are a prop (`toggleLabels`). The plain-DOM binder takes an
  element's `aria-label` for the caller's, but not one that already says what the part says:
  that one a server wrote, and the part goes on changing it. Held by
  `tests/core/password-input.test.ts` ("is named in the page's words", "follows the state with
  the label a server wrote for it").
- **A state is told once.** A password input's toggle changed its name with the state ("Show
  password", "Hide password") and wrote `aria-pressed` too, so a screen reader said the state
  twice ("Hide password, pressed"). A name that says what a press does is the state: the toggle
  is a plain button, and the agent bridge reads it as one. Held by
  `tests/core/password-input.test.ts` ("tells its state by its name alone"),
  `tests/core/agent.test.ts` ("reads a password's toggle as a button") and the `editing`
  scenario.
- **A control is never drawn inside a control.** A file upload's dropzone was a button, and the
  trigger drawn in it a second one: read as one control, reached twice. The dropzone is a
  group (a pointer's press on it still opens the picker), the trigger is the control, and the
  hidden file input is the root's, so a trigger works with no dropzone at all. Held by
  `tests/core/file-upload.test.ts` ("is a group around its trigger", "opens the picker from a
  trigger with no dropzone") and the `tagging` scenario.
- **Two messages shown at once are two ids.** Every `Field.Error` was written with the
  field's one error id, which the control's `aria-describedby` could not tell apart. A
  message's id is made from what it shows (`-error`, `-error-valueMissing`,
  `-error-always`), which a server knows too, and the control names every message in the
  page in the page's order. Held by `tests/core/field.test.ts` ("a field's messages") and the
  `field` scenario ("two messages").
- **A label must not press a button it names.** A `<label for>` clicks its control. For a
  select's trigger that would open the list, where a native `<select>` only takes focus. The
  field's label prevents the click and moves focus.
- **Ids nobody gave come from the framework**, so the server's and the browser's agree. The
  second fixture page gives no id anywhere and is compared before and after hydration.
- **Every `<button>` a part draws says `type="button"`.** One with no type submits the form it
  sits in. Met in the tooltip's trigger, whose props came from the controller it shares with
  the hover card, whose trigger is a link and takes no type. Held by
  `packages/react/src/buttons.test.tsx`, which catches every element React's parts make on both
  fixture pages and in open popups, and fails on a button with no type.
- **A part's `type="button"` is a default, not its identity, and only a button takes it.**
  Merged as one of the part's attributes, it won over a caller's `type="submit"`, so a submit
  button built on `Button` could not submit; and a trigger drawn on a link wrote
  `type="button"` there, where `type` is a MIME type. A part's `type` now goes through
  `forElement` (`part.ts`) before the merge: left out where the caller gave a type, or where
  the adapter knows the element is not a `<button>` or an `<input>`. `bind` and `write` read
  the element itself (its own `type`, its tag). Where the element cannot be known before it is
  drawn (a `render` function, a `child` snippet, a component), the props keep it and each
  runtime calls `untype` once the element is in the page; a server draws it there unless the
  caller leaves it out (Svelte: `type={undefined}` after the spread; Solid: out of the spread,
  since its `mergeProps` passes over a later `undefined`). Held by `packages/react/src/buttons.test.tsx` (a submit
  button, a reset button, triggers rendered as links), `tests/core/bind.test.ts` ("a part's
  button type") and the conformance run (`simple`: `b4` submits its form; `hover`: `h3`'s link
  has no type).
- **A button drawn as a link that navigates stays a link.** `nativeButton={false}` gave every
  element a button's role, a `tabindex="0"` and keys: on an `<a href>` that hid the link from
  assistive technology, and Enter followed it twice, once by the browser and once by the part's
  `click()`. A link that navigates (an `<a>` or `<area>` with an `href`, `isLink` in `part.ts`)
  is now given no role and no tab stop, and the button's keys ask the element they are heard on
  and leave a link's alone (its Enter is its own; Space does not press it); disabled, it keeps
  `tabindex="-1"`, `aria-disabled` and a blocked click. The role goes through `forElement` as
  `type` does, where the adapter knows the tag and the caller's `href`, and through `bind` and
  `write`, which read the element; where it cannot be known before it is drawn, the button
  learns it in `attach` and draws itself again, which also holds when it is disabled and
  enabled again. A server draws the role there unless the caller leaves it out, as `type`.
  This is not a rule that a caller's `role` beats a part's: on any other element the part's
  role still wins. Held by `tests/core/button.test.ts` and the conformance run (`simple`: `bl1`
  has no role, no `tabindex` and its `href`, Enter follows it once and Space does not press it;
  `b3`, a `<span>`, keeps the role).
- **A control's `id` is its native input's.** A `<label for>` reaches only a labelable element,
  so a radio item's `id` goes on its hidden radio, as a checkbox's and a switch's do. Held by
  the `controls` scenario, which presses a label `for` a radio item.

- **A popup's size is measured once it is placed.** `--positioner-width` was first measured as
  the popup attached. React and Vue attach a child before its parent, so the positioner was
  still a block in the flow and the popup was measured as wide as the page; measured a moment
  later on the other adapters, after the place had written `--anchor-width`, a popup whose
  `min-width` reads it was a few pixels wider there. The size now waits for the first
  placement (`popupSize`, given to `createPopup` as `size`), whichever part attached first.
  Held by the `popover`, `popover-more` and `hover` scenarios, which compare it across the
  adapters, and `tests/core/popover.test.ts` ("writes its size on the positioner").
- **Base UI's `data-pressed` is not a press.** On a menu's, a select's, a combobox's, a
  navigation menu's and a context menu's trigger it is written with `data-popup-open`, for as
  long as the popup is open; on a popover's, while the popover a press on that trigger opened
  is open. A flag that followed the pointer would differ from Base UI's at every snapshot of
  an open popup. Held by each component's "in Base UI's words" tests.

## Lists and menus

- **A highlight the list keeps by itself is derived, not set.** A command highlights its first
  shown item from the start (`autoHighlight`): set once from the page, it would be the first of
  the rows the text left behind, before a caller drawing its rows from data had drawn the new
  ones, and a server, which has no rows, would draw none. It is computed from the items in the
  order they were made, then from the page's order once the list is there, so the server draws
  it and it follows each row that comes or goes. Held by `tests/core/command.test.ts` ("the
  rows a caller draws", "as a server does") and the run's server-against-rest comparison.
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
- **A list of which only some rows are in the page is moved through by place.** With
  `virtualized` (how many rows, their names, how to bring one into the page) the keys count
  places, not elements: End asks the virtualizer for the last row, the list itself holds
  focus while it is drawn, and the row takes focus as it arrives. Each row says its place
  (`aria-setsize`, `aria-posinset`): assistive technology cannot count what is not there.
- **A list that holds focus for a row must know its own focus from someone arriving.** A test
  tool focuses an element twice; the second focus on the list looked like its own, and focus
  stayed on the list. It asks whether it is waiting for a row, not where focus came from.
- **A space is a letter of a name that is being typed.** "New file" is typed with one; Space
  presses the highlighted row only when no word is being typed.
- **A server draws a list before its items.** It cannot say a list is empty: `data-empty`
  and the empty message wait until the list is in a page.
- **A named listbox's hidden inputs are the core's to draw**, inside the list, once it has
  mounted: a server sends none, and a virtualizer that clears the list's children should
  clear a container inside it, not the list.
- **A form's reset puts a text input back to its default after the listener runs.** A
  combobox writes the text it goes back to as the input's `defaultValue`, which the browser
  then reads.
- **A combobox of several values has its own props** (`multiple`, `values`, `onValuesChange`):
  one prop that is a value or a list of them, by a flag, is a type every adapter has to
  narrow. An item chosen is added and the list stays open; chosen again, taken away; what was
  typed is used up. A chip's remove button is not a stop: the input is, and keeps focus.
- **A chip is reached by the arrows, with real focus, as a tag of a tags input is.** Backspace
  in the empty input took the last value away unseen, and a held key ate them one after
  another. From the start of the input, Backspace or the arrow that points back in the reading
  direction goes onto the last chip; the arrows move between chips (read from the page, in its
  order), forward from the last is the input, and Backspace or Delete on a chip takes it away,
  focus going to the chip that takes its place. Focus is real, not a highlight the input
  names: `aria-activedescendant` names a row of the listbox the input controls, and a chip is
  not one. Moving onto a chip closes the list and keeps what was typed (`combobox.test.ts`,
  "goes between its chips by the arrows" and "Backspace in the empty input goes onto the last
  chip"; scenario `combobox`).
- **A select of several values is the combobox's, without the input.** The same props
  (`multiple`, `values`, `onValuesChange`); a press adds or takes away and the list stays
  open; one hidden input for each value, the first its adapter's and the rest the core's
  (`services/hidden-inputs.ts`, which both use). Its trigger names what is chosen in the
  items' order, not the order chosen: the order of `items` where they are given, else the
  rows' as the page has them, read while the list is in it. Closed, a letter chooses nothing:
  it would have to add or take away. Held by `tests/core/select.test.ts` ("a select of
  several values") and the `select-multiple` scenario.
- **A list laid over its trigger is placed once, so what moves the trigger must not happen.**
  It is `fixed` where it was measured, and does not follow its anchor as a list beside it
  does: a page scrolled while it was open took the trigger away and left the list where it
  was. While it is open over its trigger the page's scroll is held (the counted
  `lockScroll`, so a modal dialog underneath keeps its own hold when the select closes), and
  a box around the trigger that scrolls, which that hold does not reach, closes it
  (`"ancestor-scroll"`), as a resize does; the list's own scroll is not around the trigger.
  Held by `tests/core/select.test.ts` ("a select's list over its trigger, in a page that
  scrolls") and the `measures` scenario.
- **Labels by value are looked up by own keys of a text.** `items` given as a record names
  only values that are text and its own: `toString` is not a label, and `1` is not `"1"`
  (`services/items.ts`; "a select's items given as a record").
- **Moving by place is given to a list, not built into it.** A menu is never virtualized and
  does not carry the code (`byPlace` from `list-places.ts`, passed as `places`).
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
- **Tab from an input inside a popup goes on from the button.** The popup is drawn at the
  end of `<body>`: from its input the browser's Tab went on from there and left the page, the
  popup closing for the focus that left. The input's Tab now puts focus on the button and
  closes the popup, and leaves the key's default to the browser, which goes on from the button
  either way (`combobox.test.ts`, "Tab from its input goes on from its button"; scenario
  `placing`, `pl3`).
- **A completion written into the input must not be taken back while the caller answers.**
  With `mode: "both"` or `"inline"` the rest of an item's label is written after what was
  typed, selected. The text the caller holds is still the typed text, and arrives later: what
  the input part says (`value`) changes only when that text changes or a completion is made
  for it, never as a key is heard, or each framework writes the text before the key over the
  completion. And the plain binder wrote `value` again on every pass, for any attribute's
  change: it now writes a text as it changes, as a framework does (`bind.test.ts`, "writes a
  text as it changes"; `autocomplete.test.ts`, "completes for a caller who holds the text and
  answers later"). A completion is written only for a key that wrote a letter
  (`inputType` `insertText`, not composing), so Backspace does not bring back what it removed
  and an input method's word is not written into.
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
- **A day drawn in two months is one day.** With several months side by side, the days that
  fill a month's last week are the next month's own days too. Given one part per date, both
  elements were the stop for Tab and both said they were chosen. A day is now a part per
  month it is drawn in (`calendar.day(date, index)`): where it is a copy (its own month is
  shown beside), it is never the stop for Tab and never said to be chosen, and a press on it
  sends focus to the day in its own month (`calendar.test.ts`, "has one stop for Tab, and a
  day of another month shown is a copy"; scenario `calendars`).
- **Not said to be chosen is not drawn as not chosen.** Taking a copy's `aria-selected` away
  took its `data-selected` and `data-range-*` with it, so a range across two months lost its
  look on every copy, and a design had to work the copy's place in the range out of the value
  itself. What a cell says to assistive technology and what it says to a stylesheet are two
  things: a copy writes the day's `data-selected`, `data-range-start` and `data-range-end`,
  and only the day itself writes `aria-selected` (`calendar.test.ts`, "chooses a range across
  them"; scenario `calendars`).
- **A month that turns on focus moves the day being pressed.** A day of another month,
  pressed, takes focus on the pointer's press, before its click: turning the month then
  redraws the grid under the pointer, and the click lands on whatever day is there now. The
  month turns on the click (`calendar.test.ts`, "hears why the month changed": its reason is
  the press, not the focus).
- **A caller who holds the month answers later.** Which element a key's focus goes to is
  decided from the month asked for, not from the month read back after asking: until the
  caller gives it, the old month is still the one shown (`calendar.test.ts`, "follows the
  keys into a month the caller has not shown yet").
- **A list laid out again is a list drawn again.** The months and weeks were laid out anew
  whenever any prop changed, so a caller who held the value and gave it back after a press
  handed every list new entries. A list kept by entry (Solid's `<For>`) then replaced every
  row, and the day just pressed lost focus to the page; adapters that key by date kept their
  elements, and a comparison of the DOM state by state cannot see an element replaced by its
  twin. The months are laid out only when what they show changes, and a month or a week that
  comes out the same is the entry it was (`calendar.test.ts`, "keeps its weeks when the
  value its caller holds changes" and "keeps its months when the range its caller holds
  changes"; scenarios `calendar` and `calendars` hold the pressed element itself across the
  press, on calendars whose caller holds the value).

## Toolbars, toggle groups and scroll areas

- **One stop for Tab, and a server cannot know which element is first.** Until focus has
  been in a toolbar or a toggle group every item can take it; after, only the one it was last
  on (`createTabStop`, the same rule as the menubar's).
- **A toggle group in a toolbar is the toolbar's.** It has no stop and no arrows of its own:
  two rovings, one inside the other, each answer the same key.
- **A text input in a toolbar keeps its arrows** until the caret is at that end of its text.
- **A disabled control that keeps focus is still in the arrows' way, and takes no keys.** A
  toolbar's button and input stay focusable while disabled by default, as Base UI's
  (`focusableWhenDisabled`): `aria-disabled`, no `disabled`. The roving set left out every
  `aria-disabled` element, so the arrows passed them; and a disabled input whose keys were
  stopped still kept the arrows as its text's, so focus could not leave it by them. The roving
  set keeps an element marked `data-focusable`, and a disabled input's arrows are the
  toolbar's. Held by `tests/core/toolbar.test.ts` ("keeps a disabled control focusable by
  default, as Base UI's, and lets it do nothing").
- **An element first watched while a resize observer is reporting is an error.** Content that
  grows is reported; measuring it shows there is something to scroll; the framework draws a
  scrollbar, at once or a microtask later but still inside that report; the scrollbar is
  nearer the root than the content, and the browser cannot deliver its size in that frame
  ("ResizeObserver loop completed with undelivered notifications"). What asks to be watched
  during a report is watched a task later. Held by `tests/core/scroll-area.test.ts`.
- **A scroll area's viewport scrolls natively.** Only its own scrollbars are hidden
  (`scrollbar-width: none`, written inline with `overflow: scroll`, since the component is
  nothing without it). Wheel, touch, keys and find-in-page work as in any scroller, and the
  viewport is a stop for Tab while there is something to scroll.
- **Where a scroll area's parts lie is the library's to write, not the design's to know.**
  A scrollbar with nothing said of its place is in the flow: it sat under the viewport,
  outside the area, and no part's description said the design had to place it with the
  corner's variables. Each part's `style` now says it, as Base UI's does, so a server writes
  it too: the root is what the others are placed against, a scrollbar lies along its edge
  (the end of a line, the bottom) and stops short of the corner, the corner sits where they
  meet, a thumb is as long as its scrollbar's `--scroll-area-thumb-height` or `-width`. A
  design gives a scrollbar its thickness and draws it. Held by
  `tests/core/scroll-area.test.ts` ("places its scrollbars and its corner itself", "places
  them at the other side where lines run right to left", "says where its parts lie before
  there is a page"), `packages/react/src/server.test.tsx` ("places a scroll area's
  scrollbars and corner in what it writes"), and the conformance run, whose stylesheet
  places none of them.
- **A thumb is sized by what its scrollbar leaves it, not by the scrollbar.** Sized as a
  share of the track with its padding in, a thumb at the end of its travel stood outside
  the padding by as much, and was longer than Base UI's for the same page. It is the share
  that is seen, of what the viewport shows less the scrollbar's padding and the thumb's own
  margin, and of no more than the scrollbar's length; it travels what is left. Held by
  `tests/core/scroll-area.test.ts` ("keeps its thumb inside its scrollbar's padding").
- **What is written on one part and laid out on another arrives a render later.** The
  corner's size is the root's to say and the scrollbars' to be shortened by: measured in
  the moment between, a scrollbar is still whole. It is taken off by hand until the root
  says it, read from the root's own style, and the scrollbars are measured again when they
  change length.
- **Pointer capture is best effort.** `setPointerCapture` throws for a pointer the browser
  no longer has; a drag goes on without it.
- **What a viewport holds grows without the viewport growing.** Pictures in a row that load
  after the area is measured make the row wider and leave the viewport its size, so with no
  content part (as shadcn/ui's examples write it) nothing watched said so, and the thumb kept
  the length the row had before. A page rendered on a server hid it: its pictures had loaded
  before it hydrated, and the first measure was already right. The viewport's children are
  watched, and followed as they come and go; the content part is only for content whose own
  box does not grow with what is in it. Held by `tests/core/scroll-area.test.ts` ("measures
  again when what it holds grows late, with no content part", "measures what is put into it
  later, with no content part") and the conformance run's `scroll-area` scenario (pictures
  loaded late, the thumb against the arithmetic).

## Navigation menu

- **One popup for every item.** Each item's content is drawn in a viewport they share, as a
  child of it with nothing around it (React's portal, Vue's teleport, a mount in Svelte, the
  nodes themselves in Solid, whose own portal adds marks around them, and in Angular). The popup is
  placed against the open item's trigger and given the open content's size
  (`--popup-width`, `--popup-height`).
- **Content drawn elsewhere is still next in Tab's order.** Tab on an open trigger goes to
  the content's first stop; Shift+Tab on that stop goes back; Tab on the last stop gives
  focus to the trigger and lets the key go on from there, so it lands on what follows the
  trigger in the page.
- **Another trigger of the list is not outside.** A press on it shows its content in the same
  popup; closing first and opening again would depend on when a caller who holds the value
  answers.
- **A size written while a resize observer reports it is written a task later.** The popup is
  nearer the root than the content whose size it takes.
- **The press that follows a pointer's opening is not a wish to close.** A pointer resting on
  a trigger opens it; the click that comes a moment after is the same intent.
- **Content is not in what a server sends**: it is drawn while shown. A site that needs its
  links read without scripts also writes them in the page.
- **What a type calls optional must work when it is left out.** An item's `value` was
  optional "for an item that is only a link", and an item with a trigger and no value gave
  its parts nothing to stand in: the trigger threw as it rendered, on a server and in a
  page. An item that is given no value makes its own, from the id its framework gave it
  (an accordion's item too). Nothing is made for an item until one of its parts is read, so
  an item that is only a link still costs nothing. Held by
  `packages/react/src/server.test.tsx` ("renders a navigation item that was given no value,
  with its trigger", "renders accordion items that were given no value, each with a value of its own"),
  `tests/core/navigation-menu.test.ts` ("makes nothing for an item that is only a link",
  "runs an item whose parts are first drawn once it is in the page"),
  `tests/core/web.test.ts`, the navigation menu's scenario, whose second item has no value
  on every adapter, and the second page's accordion, whose items have none (their ids must
  be the same before and after hydration).

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
- **Read-only locks the value, not the control.** A read-only control keeps its place in Tab's
  order, is submitted with its form and goes back with the form's reset; only a change is
  refused. A select's list still opens and is moved through, so what could be chosen can be
  read, and no press, Enter or letter chooses; a slider's thumb takes focus from a press and
  moves for no key and no pointer. Each says `aria-readonly` where its role may (the thumb,
  the select's trigger and its listbox) and `data-readonly` for a style. Held by
  `tests/core/select.test.ts` ("a read-only select"), `tests/core/slider.test.ts` ("a
  read-only slider") and the `read-only` scenario.
- **An agent is not offered what a read-only control refuses.** The bridge listed `setValue`
  for a control that would do nothing with it, and the step "succeeded". What changes a value
  is left out of a control's `actions` while it says it is read-only; a read-only select keeps
  `open` and `close`. Held by `tests/core/agent.test.ts` ("offers nothing a read-only control
  refuses").
- **A group of boxes hears one reset.** Each box's native input is in the form, and each is
  told of the reset: the group answers the first and gives the others the same answer, so its
  caller hears one change, and each box writes its own input's `defaultChecked` from it.
  Held by `tests/core/checkbox-group.test.ts` ("goes back to the values it began with").
- **A parent box names its boxes before any of them is drawn.** A server writes the parent
  first, and what it controls cannot wait for the boxes to say they are there: a box's id is
  made from its group's id and its place in `allValues`, which both sides know. Once the
  group is in a page, a value of `allValues` with no box drawn is left out, so nothing that
  is not in the page is named. Held by `tests/core/checkbox-group.test.ts` ("names every box
  before there is a page") and the `checkbox-group` scenario, where each server's page is
  compared with the page at rest.
- **In a group, the group is the field's control.** Its boxes share one label and one value:
  a box that also joined the field took the id the label is `for`, on every box. The group
  joins, is named by the label and says the checked values; its boxes take the field's name
  and state and nothing else of it.

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
- **Angular's template checker gives a directive's type parameter it cannot infer `any`**, not
  its default. A select's value typed `[Multiple] extends [true] ? Value[] : Value | null` took
  `any` for a select with no `[multiple]` and typed every one-value select's change as a list;
  inferring `Value` through that type also took the whole list for `Value`. The value is typed
  `Multiple extends true ? readonly Value[] : Value | null` (inferred from the binding, either
  shape when `Multiple` is `any`) and the change `true extends Multiple ? (false extends
  Multiple ? one : list) : one`, which is one value for `any`. Held by
  `fixtures/angular/src/typed.ts`, which the fixture's build type-checks with `ngc`.
- **A part counted from the page has no place on a server.** A carousel's slide or a step with
  no `index` is placed by where its element is, read once it is in the page: a server draws it
  as no place (no `data-current`, a step's trigger with no id), and the page then marks it. A
  page a server draws gives `index`. The core never counts the order parts were made in, which
  React's StrictMode doubles and a list that changes reorders (`tests/core/carousel.test.ts`,
  `tests/core/steps.test.ts`, "count an item with no index").
- **Svelte warns on a void element given a content block**, children or not:
  `<svelte:element this="input">{@render children?.()}</svelte:element>` warned on every
  render of every hidden input. `Part.svelte` draws a void tag without one. Held by
  `packages/svelte/src/server.test.ts` ("in a development build"), which renders each part
  drawn as an `input` or an `img` with Svelte's warnings as failures. React throws on a void
  element with children, Solid's server leaves them out and Vue passes none, so the fault is
  Svelte's alone.
- **Solid hydrates by keys made from its owner tree**, so the client must make exactly the
  computations the server made, in the same order. A ref runs on the client alone: a wait for
  the page to settle, made inside a part's ref, shifted every key after it, and most parts of
  the hydrated page were drawn as new elements that never reached it, while the server's
  stayed with no listener and no attach. The wait is made as the part's component is drawn;
  only an element handed over once the page is up makes its own. Held by the conformance run
  on `solid+ssr`: the panel of `collapsible` that is open from the start has its size written
  only once it is attached.
- **Solid 2 shows a write on the next microtask**, and refuses a write inside its own
  computations. The core's signals stay the source of truth: the adapter's bridge signal is
  boxed (Solid takes a function given to a signal as a computation) and allowed to be written
  wherever the core changes. A context with no provider throws, so the adapter's contexts start
  at `null`.
- **A list an adapter draws keeps an entry by what it is, not by the object.** Solid 1 drew a
  caller's held month in the same turn, so a calendar's weeks kept by reference were already
  the new month's when focus moved; Solid 2 draws it a microtask later, and the day focus had
  just moved to (the next month's first day, shown outside the old month) was drawn afresh and
  focus fell to the page. `Calendar.Weeks` keeps a week by its first day, as the other adapters
  key it, and hands its child days that read the week now there. Held by the conformance run's
  `calendars` scenario ("and focus follows into it").
- **Angular's hydration finds each node by walking from the one before it.** An element a
  directive adds by hand between Angular's own nodes, the select's hidden input after its
  trigger, is taken for the node Angular looks for next, and hydration fails. A view container
  on an `<ng-container>` that has children of its own does not help either: its anchor is found
  by counting only the container's views. An element the adapter draws in place is a view of
  Angular's, in the view container of a real element (`inputAfter` in `runtime.ts`), which a
  server draws and hydration takes over; one drawn as an element's last child stays
  `innerPart`'s. Held by the conformance run's `select` scenario on `angular+ssr`, whose
  selects write no hidden input.
- **Angular's template is told a part's state too.** React's `render` and Vue's slot are given
  a part's state, while an Angular directive wrote `data-*` attributes and gave its template
  nothing to draw by: an indicator could not show an open eye or a tick. A part a template
  draws by (an indicator, a step, an item, a dropzone) keeps its state as an Angular signal
  (`statePart` in `runtime.ts`, read with `stateOf`) under an `exportAs`. Held by the `editing`
  scenario, where every page draws the password's indicator from its state.

## Composition

- **A length a part writes keeps its meaning whatever the part holds.** A resizable panel's
  share is its `flex`; a flex item's minimum is its content's unless told otherwise, so a wide
  table held a 25 panel at 108 px in a 350 px group. The panel writes `min-width: 0` and
  `min-height: 0` beside its `flex`, as part of the share. The core test's page had given the
  panels both itself, which hid it. Held by `tests/core/resizable.test.ts` ("keep their share
  whatever they hold").
- **A type that names a state is told by its value, not by the `render` beside it.** React's
  `useRender` inferred its state's type from `render`, typed as a part's (`string | true`), so a
  plain element's state with `false` or `null` in it, which the docs say are absent, did not
  check. The state is inferred from `state` (`NoInfer` on `render`), and `PartComponentProps`
  with no state named takes any `string | boolean | null | undefined`. Held by
  `packages/react/src/types.test.tsx` (`Badge`).
- **The element a caller asks for is the caller's last word.** A part drawn as another element
  (`render`, `as-child`) has three layers of props, lowest first: what was handed to the
  part, the element's own, the part's. Merged the other way round, a design system's wrapper
  that names its slot on the part overwrote the slot its own caller wrote on the element.
  Classes join, styles are merged property by property, every handler runs lowest first, and
  `preventKiranaHandler()` in a caller's stops only the part's (`composeProps` under
  `mergeProps`, in the core). Held by `packages/core/src/part.test.ts`, the adapters'
  `server.test` files and the conformance run's `composition` scenario.
- **A part with nothing to say about an attribute leaves it.** React is given every boolean
  attribute as a boolean, so "not disabled by the part" was written as `disabled={false}`
  over the `disabled` of the element the part was drawn as. The layers are merged before the
  props are turned into a framework's form, where `undefined` still means "nothing to say".
- **An attribute nobody has a value for is not handed on.** The merge kept a part's
  `undefined` as a key, and wherever the props met an element's own attribute after it, it took
  that attribute away: a Vue component's attributes fall through over its root's own, and a
  spread written after an attribute in Svelte or Solid replaces it. A design system's day cell
  lost the `data-disabled` it wrote, though the part had nothing to say about it. React's adapter
  had dropped them all along (a boolean the part has a key for it still gives React as `false`,
  or `checked` would come and go). The merge leaves such a key out, on every adapter, and a
  component's own root is the component's: what it writes after the props it is given wins, as
  in React. Solid writes a literal attribute before a spread into the element's template, so
  one the part has given and stops giving does not come back there: give it to the part
  instead. Held by `packages/core/src/part.test.ts`, the adapters' `server.test` files (a
  calendar cell drawn onto a component or an element writing its own) and the conformance
  run's `own-attributes` scenario.
- **A part that binds the element itself gives back what it wrote over.** Angular's and the
  custom elements' parts write on an element the page draws, with its own attributes:
  `aria-controls="note"` written over by a trigger whose panel opened was gone once the panel
  closed, where a framework that draws the element from both layers shows the element's again.
  `bind` keeps the element's own value of an attribute it writes over and puts it back; one
  that already says what the part says is the part's (a server wrote it). Held by
  `tests/core/bind.test.ts` and the `own-attributes` scenario.
- **On Angular, the text a part writes is not the element's content.** A calendar's heading
  wrote its month's name before whatever its element held, and a meter's, a progress bar's, a
  slider's, a select's and a combobox's value replaced it, where every other adapter lets the
  caller's content stand in. They write only into an element with no content of its own
  (`ownText` in the adapter's runtime), and a server marks the text it wrote with a comment,
  since the page it hydrates cannot tell its text node from a caller's. Held by the
  `own-attributes` scenario (`k6`).
- **A cloned element already has its props.** Vue lays the props given to a clone over the
  element's own: handed the merged props, it joined the element's class to itself and ran its
  listener twice. The clone is made with the element's props taken off. Several listeners of
  one event are a list in Vue, which is not a function: they are made one before a merge, or
  the part's listener replaced them.
- **Every part goes through the adapter's one way of drawing a part**, a part with nothing
  of its own included (a list item, an indicator). One drawn as a plain element took none of
  `render`, `ref`, `as`, `as-child` or `child`, and in two adapters no attribute at all.
- **What a part keeps in its element is not its content.** A control's native input and a
  code cell's character are the part's own: in React they are given apart from the children
  (`usePart`'s last argument), so the children of the element a caller asked for do not
  replace them.
- **The text a part writes goes with it to the caller's element.** A meter's value, a
  select's chosen label, a calendar's heading, a date field's piece, a field's error and a
  toast's title, description and action write their own text. Drawn as the caller's element
  they wrote nothing on two adapters: Svelte's `child` snippet was given only the props, and
  Vue's `as-child` took the slot for the element and had no place for the text. Each adapter
  now hands it over the way it hands a hidden input: the children of the props in React and
  Solid (drawn unless the caller's element has its own), the slotted element's content in Vue
  while it has none of its own, and a `text` snippet beside `props` and `state` in Svelte,
  which the caller renders inside its element. Held by each adapter's `server.test`.
- **`part` is the element's attribute.** Solid's and Svelte's component for a part's element
  read the core's part from a prop named `part`, so a caller's `part="thumb"`, written for
  `::part()`, would have replaced the part. The prop is `of`, as in React, and `part`
  reaches the element on every adapter. Held by each adapter's `server.test`.
- **React 18 does not know `inert` as a boolean.** Given `inert={true}` it warns and writes
  nothing, so a popup on its way out stayed live; React 19 takes `""` for false, with a
  warning. The adapter writes `""` or nothing before 19 and a boolean from 19 on
  (`packages/react/src/refs-forwarded.test.tsx`).
- **A part's state is its attributes.** What a caller is given to read (`state.open`,
  `state.side`) is taken from the part's own `data-*` attributes, so no part can say one
  thing to a stylesheet and another to a function. A test holds every state's name in the
  vocabulary to the name its attribute reads as.
- **A design system's own element is composed by the same rule, on every framework.** React
  had `useRender` and Vue `Primitive`; on Solid and Svelte a badge drawn as a link had to
  write its own `render` or `child` and its own merge, where solid-js's `merge` and a
  Svelte spread let a later class replace an earlier one and run one handler of two. Each
  now has `Primitive` and `mergeProps` (`@kirana-ui/solid/primitive`,
  `@kirana-ui/svelte/primitive`); Solid's `mergeProps` reads its sets as each prop is read,
  or the component's props would stop following its caller, and Svelte's keeps the
  attachments a spread carries under symbols. Held by the two adapters' `server.test` files
  and type tests, and the conformance run's `composition` scenario (`k4`).
- **Angular: a host directive's inputs are bound only from the element.** A design system's
  directive that hosts a primitive could not give it a default (a tooltip's `delay`) or a
  value worked out from its own inputs (a command's `filter`), and subclassed the primitive
  to redeclare the input, standing in for it through `useExisting`. `hostInputs` gives them:
  the primitive reads them where the element binds nothing, which it learns from
  `ngOnChanges` (an input never bound never appears there), and the values are functions so
  a `computed` follows. Held by the fixtures' `design` section and scenario, and by `ngc`
  over `fixtures/angular/src/typed.ts`.
- **Svelte: a design system's own element is reached as a part is, by an attachment.**
  `Primitive` had no `bind:ref`, and its docs did not say how its element is reached; no part
  has `bind:ref` either. `{@attach}` on a `Primitive` or a part goes on the element it draws,
  or through `child`'s `props` to the caller's own, and a wrapper that spreads its props
  passes its caller's attachments on. Held by the Svelte page's `k3` and `k4` (the count goes
  up only when both elements were reached) and the type test in `fixtures/svelte/src/Types.svelte`.
- **Angular: a required input cannot be given by a host.** Angular makes a host expose a
  host directive's required input, and every caller of the host then binds it, so a design
  system could not work a command item's `value` out of its own inputs: it drew the primitive
  on an inner element instead. Where something honest stands in for an input, it is not
  required: a command item given no `value` is named by its `label`, or its text, on every
  adapter. Held by `tests/core/command.test.ts`, the `command` scenario (`cm1-copy` has no
  value) and `ngc` over `typed.ts` (`kuiCommandItem` gives `value` without exposing it).
- **Angular: hosts inside hosts gave one input in the order they were called.** The last
  `hostInputs` call won, `undefined` included, so an outer host that meant "nothing to say"
  wiped the inner one's default. Angular makes a host directive before the directive that
  hosts it, so the outermost now wins by rule, and a host that gives `undefined` leaves the
  input to the one inside it, then to the primitive's own. Held by the `design` scenario
  (`ds3c`, `ds3d`: `kuiPin` hosting `kuiCode`).
- **Angular: two directives with one selector both match, and say nothing.** The primitives'
  directives were `kui…`, the prefix a design system built on them takes for its own brand.
  Its `[kuiDialog]` hosting the primitive's `[kuiDialog]`, both in one template's `imports`,
  made the part twice on the same element; a component whose own selector was the primitive's
  matched again on the element its template wrote the primitive on, and recursed. A design
  system had to write `:not(…)` selectors and a marker attribute to get out of the way. A base
  layer takes a prefix of its own, as other headless Angular libraries do: the primitives are
  `kp…` (`[kpDialog]`, `KpDialog`, `KP_FIELD`, `[kpId]`), and a design system names its own
  as it likes, `kui…` included. Held by the fixtures' `design` section and scenario, where the
  Angular page's design system is `kui…` (`kuiDialog` hosting `kpDialog`, both imported by
  the page), and by `ngc` over the fixture.

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
  anchor's direction onto the positioner. A dialog has no anchor, and one opened by its state
  alone has no trigger either: inside a direction provider its popup takes the provider's
  direction (`carryDirection` given a direction), and with none the page decides. Held by
  `tests/core/dialog.test.ts` ("a dialog's reading direction") and the `direction` scenario.
- **`overflow: hidden` on the page does not stop `scrollTo`.** A test of the scroll lock reads
  the computed style, not whether a script can scroll.

## Tests and tooling

- **Run the task, not the script, when a build stands between them.** `bun
  tests/conformance/run.ts` plays whatever the fixtures were last built from; `vp run
  conformance` builds them first. Three identical failures in a row were a stale build.
- **Never stop apt from outside.** CI's browser install was one command under a three-minute
  limit, tried four times. The limit stopped the try, not the `apt-get` it had started as root,
  which went on holding the package lock: every later try failed on that lock, and the job
  with it. The libraries (`playwright install-deps`) are now a step of their own that nothing
  stops, with apt told to time out a silent mirror, fetch again and wait for the lock; only
  the browser's download, the job's own process, is stopped and tried again.
- **Several pages at once is for Chromium.** The conformance run plays six subjects at a time
  there (352 s one at a time, 120 s with six and its timed scenarios alone, the same results). Firefox gained nothing from
  three and failed one run in two, each time on a scenario that times a press or looks for
  one frame: it and WebKit play one at a time. Scenarios that measure a wait (`hover`,
  `dialog`) are played with nothing else running, in any engine. A check that fails one run
  in two is not a check.
- **Time between two events is measured on the clock that only goes forward**
  (`performance.now()`), never the wall clock (`Date.now()`), which the system sets back and
  forth: a typed name, a hover's grouping and a pointer's rest were each any length when it
  stepped. A "never" is `-Infinity`, not `0`: the forward clock is near zero on a new page.
  A test that fakes timers fakes `performance` too.
- **A pointer move is not always the pointer moving.** A browser sends one to whatever comes
  to lie under a pointer at rest (a list that opens there, a list that scrolls under it). A
  row takes the highlight only when `pointerMoved(event)` (`services/list.ts`) says the
  pointer has gone somewhere since a row last answered, or since the last press or key: on
  the screen or in the page, either. A pointer that moved to where a row then arrives is
  owed that row; compared only with the move before, a popup placed a moment late never
  took the highlight. Read from the
  screen alone, no row followed the pointer in WebKit under its test driver, where every
  move's `screenX` and `screenY` were the same.
- **A one-time code is one input.** The cells are drawn; the input lies over them, so a
  phone's code from a message, a password manager, a paste and a screen reader meet a text
  field. What it refuses, it refuses in `beforeinput`; what a paste keeps is put back with
  `insertText`, so undo still works. A cell's character is a text node of its own before
  whatever the caller put in the cell, never the cell's whole content.
- **A property written two ways is two different pages.** A server wrote `flex-grow`,
  `flex-shrink` and `flex-basis` where a browser wrote `flex`; a panel's size is the one
  shorthand and a `--panel-size` variable.
- **What a part says of a neighbour must be sayable before the page exists.** A bar's
  `aria-valuenow` is the panel before it: on a server that is the panel made just before the
  bar, since no element can be asked.
- **A framework renames attributes** (React's `inputMode`, `maxLength`, `autoComplete`): the
  core writes HTML's names and the adapter's table renames them, or React warns and drops it.
- **Tasks a task `dependsOn` run side by side; a `&&` chain runs in order.** The gates that
  read nothing another writes are dependencies of one task (35 s together, 57 s in a row);
  the rehearsal `dependsOn` the packing, which it reads.
- **A task's cache inputs are the folders it reads, not the repository.** With every source
  as every task's input, any change (a line of docs) reran everything, and the cache restored
  in CI never hit. The fixture build reads `fixtures`, `packages` and `scripts`; the core's
  browser tests `packages/core` and `tests/core` (`sourcesIn` in `vite.config.ts`). A task
  that starts reading somewhere new gets that folder added, or it replays a stale result.
- **A task is given only the environment it names** (`cache.env`). `BROWSERS` was set in CI
  and never reached the test configuration: the core's tests ran in Chromium and Firefox
  whatever was asked, and never in WebKit. It showed the day each CI job installed one
  browser only. A variable a task reads is listed in its `cache.env`.
- **A git hook holds the push's connection open.** The pre-push hook is the quick checks
  only; the full `vp run prepush` is run by hand, and by CI.
- **A browser reports some faults to the window, not as an exception** (a resize observer
  that could not deliver within a frame). Whether a test runner's "page error" hears them
  varied between this machine and CI: the conformance page listens for the window's `error`
  itself, so the two fail alike.
- **Nothing says the pointer or focus left an element that was taken out.** A toast closed
  under the pointer is gone before any leave is sent, and a framework that makes its own
  leave from what was under the pointer (React) never makes that one; a button that had
  focus and is removed sends no blur. The toasts stayed "held" and no timed toast ever
  closed. Whether the pointer or focus is on the stack is asked of the page (each pointer
  move, each focus change, each change of the list), never of an enter and a leave.
- **A text area's content is its text.** A shared element component that leaves a marker
  between an element's tags (Svelte's, on a server) made a text area whose text was
  `<!---->`. The text area is its own element in that adapter.
- **A part that is told its place says it on a server.** A slide that found its place from
  the page had none on a server, so the current one was marked only after hydration. A
  carousel's slide takes its `index`, like a code's cell.
- **A scroll is the browser's.** The carousel scrolls a real box (`scrollBy`, with the
  design's `scroll-behavior` and `scroll-snap`) and reads where it came to rest; nothing is
  transformed. Where a scroll ends is read after it has been still a moment, and a test
  waits for that, never for a fixed time.
- **A QR encoder is checked against another, module for module**, once, across every
  version's edge and every correction level (192 cases); the tests keep known answers from
  that check, so no decoder ships as a dependency.
- **vue-tsc trips on `//` in a plain attribute of a component** (`value="https://…"`): every
  component after it is reported as lacking `.value`. Bind it (`:value="LINK"`).
- **Asserting "still closed" right after a hover is a race.** A busy browser takes longer
  to say the pointer arrived than a rest delay lasts.
- **A component that is another one, dragged, is that one.** A drawer is the dialog's
  controller with two of its parts wrapped: the same focus (its first control, not the
  drawer), the same press outside on its backdrop (there is no viewport over the page to
  take it), the same stack. Each adapter gives it a root and the dialog's own parts.
- **A drag says how far; the design moves the thing.** The drawer writes
  `--drawer-swipe-movement-x/y` and `--drawer-swipe-progress` and never a `transform`, so a
  design never needs `!important`. How far stays written through a swipe's exit, so the
  drawer leaves from where it was let go, and is cleared when it opens again.
- **The click a drag ends with is stopped in the capture phase, on the element**: a
  framework that listens at the root never hears it, so a button a drag ends on is not
  pressed in any adapter.
- **What scrolls inside a dragged thing scrolls first.** A drag towards the closing edge
  from inside a scrolling box moves the drawer only when the box is at that end; a field's
  text is never a drag.
- **Following is decided by which way the reader went, not by where they are.** A
  conversation follows what is written until a scroll goes up and away from the end;
  judged by "is it at the end now", a glide to the end (its button) stopped following
  whenever a message came mid-glide.
- **A browser reports a new size only when it next draws.** A conversation that followed
  on a resize alone was a frame behind what was written, and in a page that draws nothing
  (WebKit under the test runner) it never followed. What is written is heard as a mutation,
  at once; the resize observer stays for what grows with nothing written.
- **A flick is asked at the moment of letting go.** Speed from the last move alone called a
  drag a flick when the pointer had then rested: a drawer dragged a little, held and let go
  closed. A pointer still for 80 ms was not flicked.
- **A drag is heard on the page from the press on, not on the thing dragged.** A pointer
  pressed near a drawer's edge and moved away is off the drawer before the drag has taken
  hold (capture comes only once it has, so a press on a button inside stays a press): the
  drawer heard none of it, and could not be dragged up to its next snap point. Tests that
  dispatch on the element never see this; the conformance scenario's real mouse did.
- **A snap point is a share of the thing, written as how far from whole it rests**
  (`--drawer-snap-point-offset`), beside how far it is dragged: the design adds the two.
  Let go, it goes to the nearest place, one place on for a flick, and out past a quarter of
  what shows at its smallest.
- **An id a part takes is not the test's.** A part that writes `id` (a viewport, a drawer's
  popup) renames the element: a test finds it before binding, and styles it by class.
- **A date in and out is an ISO string; the calendar it is drawn in is not the caller's
  concern.** `value="2026-03-15"` whatever the locale; a Persian month is laid out from the
  same value. A date library's own objects never cross the API, so a form, a URL and a
  database take the value as it is.
- **A calendar system is given, not found from the locale.** Finding it (`createCalendar`
  by identifier) carries every calendar there is: 13.3 KB gzip against 9.4 with the
  Gregorian alone. `calendarSystem={new PersianCalendar()}` brings the one a page uses.
- **A computed that makes a new object each time is new each time.** The month shown was a
  fresh date whenever focus moved, so every week was laid out again for every arrow key,
  and a test's click landed on a button that had just been replaced. A computed of an
  object is given what "the same" means.
- **A day that cannot be chosen is still reached.** `aria-disabled`, not `disabled`: the
  arrows would fall into the hole a disabled button leaves. A test's own click waits for
  such a day to be "enabled"; it presses with `element.click()`.
- **The locale is given to a calendar a server draws.** A server does not know the
  reader's; a month named in one language and hydrated in another is two pages.
- **What a server wrote is kept when the page wakes.** Angular's heading wrote the month's
  name beside the one the server had sent: `March 2026March 2026`. A directive that writes
  text takes the text node that is there.
- **A framework's event is not always the browser's.** React makes a `beforeinput` of its
  own, with no `inputType` and none for a deletion. A part that needs the browser's event
  listens for it on the element, in `attach`, and every adapter gets the same one.
- **A typed date is parts, not text.** Each part is a spin button that takes digits, so
  nothing is parsed and nothing typed can fail to be a date. A value is said once a part is
  whole (a year is not 2, then 20, then 202), and when a part is left half typed.
- **A calendar system is the same calendar however often it is made.** A caller who writes
  `calendarSystem={new PersianCalendar()}` in a render hands a new instance each time, and a
  field that took a new instance for a new calendar laid its parts out again from its value,
  dropping the digit just typed. The field compares calendars by `identifier`
  (`date-field.test.ts`, "keeps what is half typed when its caller makes the same calendar
  again").
- **A calendar of one era writes it anyway.** `Intl.DateTimeFormat` with a Persian, Buddhist or
  Hebrew calendar adds the era (`1378 AP`) where none was asked for; a part for an era nobody
  can change is noise. The era is a part only where the calendar has several (Japanese, Minguo,
  Ethiopic), and the field leaves the other out with what stood beside it
  (`date-field.test.ts`, "lays its parts out and holds their ranges in the calendar given").
- **The date field takes a calendar's arithmetic from the instance it is given.** Its days,
  months, years and eras come from the calendar's own methods and dates from its
  `fromJulianDay`, so the field imports nothing of the date library: a page that gives no
  calendar carries none of it. A date the calendar holds inside an era (a May in Heisei 31,
  which ended in April) is what the calendar makes of it, and the parts show that
  (`date-field.test.ts`, "has a part for the era where the calendar has several").
- **A part that is typed is `contenteditable` with `inputmode="numeric"`, and every write to
  it is refused.** That is what brings a phone's digits up; the text is the field's own.
  React needs `suppressContentEditableWarning` for it.
- **Every change says what made it** (`details.source`: mouse, touch, pen, keyboard,
  virtual, programmatic), read from the event when it is asked for. Nothing is remembered
  between events to know it.
- **A text input's value is its framework's to hold.** `Input` keeps none: React's `value`,
  `v-model`, `bind:value` and Angular's forms each write an input in their own time, and a
  second holder would fight them. It says the input's state and tells the caller what was
  typed. Where the core must write the text (a command list a caller filters), it writes the
  element's `value` itself, from an effect.
- **A command list keeps nothing chosen.** Its `aria-selected` is the highlight, which the
  input names; the first command is highlighted when the input takes focus, not when the list
  is drawn, so a server and a page at rest say the same.
- **A heading with no group around it is a line of text**, never an error that waits for the
  list to be drawn (`command.test.ts`, "lets a heading stand with no group around it").
- **An output is not named after an event that comes up through it.** A text input's own
  `select` event bubbles: Angular's command says `itemSelected`.
- **A popup is measured as it is laid out, not as its entrance draws it.** A list that comes
  in scaled to 95% was placed 6px off on four adapters and right on the fifth, which had
  attached a moment later. Its rectangles are divided by its drawn size over its laid-out
  size. Nothing is written to undo the transform for the measure: that starts the design's
  transition over (`select.test.ts`, "is measured as it lies").
- **A placement that answers late must not move what is no longer followed.** Positioning
  resolves in a promise; a popup that has taken its place another way since (a select over
  its trigger) drops the answer.
- **A toast's height is its own, whatever the design has made it.** A stacked toast is drawn
  as tall as the newest: it is measured with its height let go for the read, and what holds
  its contents is watched, so `--toast-height` is still true (`toast.test.ts`, "is measured
  as tall as it is").
- **What a toast says is its framework's to draw, and the core never reads it.** A title that
  may be an element cannot be told from a toast's options by looking at it: in a promise's
  states only a string is a title, and anything else is written as options (`{ title }`)
  (`toast.test.ts`, "hands on what a toast says as it was given").
- **Each state of a promise's toast is whole.** A "Cancel" kept from `loading` on a toast
  that now says "Saved" cancels nothing: the description and the action a state does not
  give are not kept from the state before (`toast.test.ts`, "gives each state of a promise
  its own action").
- **A part with nothing to say is not in the page.** One template draws every toast, and
  most have no action and many no description: an empty button has no name, and an empty
  description is still what its toast is described by. A title, a description and an action
  with no content of their own draw what the toast was added with, or no element at all.
  Angular's are the caller's own elements: its template leaves one out (`@if`). Held by the
  toast scenario on six adapters.
- **A toast that interrupts says so itself.** The region stays polite, for the toasts that
  are; an urgent one is an `alertdialog` with its own `aria-live="assertive"` and
  `aria-atomic`, so nothing is drawn twice and no hidden copy is needed (`toast.test.ts`,
  "are read when the reader is idle, or at once when they say so").
- **A thumb that stays inside its track needs no measuring to be in the right place**: its
  value's share from the start, moved back by that share of itself, which CSS knows. So a
  server draws it where it will be, and it is never hidden for a measure. Once measured, its
  centre is written as `--position`, as Base UI writes it; a design that animates a thumb's
  `translate` would see that change.
- **A part's place among its like is the page's order; before there is a page, the order it
  was asked for in.** A thumb with no `index` was the first value's, so the two thumbs of a
  range were drawn on top of each other. It is now the value at its place among the
  slider's thumbs. The place is kept under an id the framework gives the thumb, which is
  the same on every render (a counter bumped while rendering counts a thumb twice in
  React's StrictMode, and again on every later render); a thumb asked for a second time is
  the same thumb. Once the thumbs are in the page their order is read from it, so one that
  leaves moves the others up and one that is added takes its place where it is written.
  Where the slider holds one value, every such thumb is that value's, as in Base UI. Held
  by `tests/core/slider.test.ts` ("a slider's thumbs that are given no index"),
  `packages/react/src/server.test.tsx` ("places each thumb of a range that was given no
  index at its own value"), `tests/core/web.test.ts`, and the slider's scenario, which
  takes a thumb away and puts it back on every adapter and reads what each server wrote.
- **Angular makes what is inside an `@if` after what is written beside it.** On a server,
  where a part is written once, the order parts are made in is then not the order they are
  written in: a thumb inside an `@if` before two others was placed last. The slider's
  thumbs wait there until all are made, and are asked for in their elements' order. Held by
  the conformance run's check of what each server wrote ("the server placed each thumb of
  a range").
- **A thumb that stays inside is measured again when its control changes length.** Its
  centre is a share of the control that depends on both lengths; kept from the first
  measure, it drifts from the edge as the page is resized (0.5px at a tenth of the way,
  1.2px on a narrow page, for a thumb of 12px). Held by `tests/core/slider.test.ts` ("keeps
  to the edge when its control changes length").
- **A number is typed as text and held as a number.** While it is typed the input says what
  was typed (`1234.50` is not rewritten to `1,234.5` under the caret); the number follows
  where the text is one, and is written out whole when focus leaves. A step from two
  decimals is rounded to the decimals of its step: `0.2 + 0.1` is `0.3`.
- **A form's reset writes an input's default after the event.** A control that writes its
  own text on reset sets the input's `defaultValue` first, or the browser blanks it a moment
  later (`number-field.test.ts`, "goes back to the number it began with").
- **Typing highlights nothing unless asked to** (`autoHighlight`, off by default, on a
  combobox and an autocomplete alike). In an autocomplete, Enter is then the typed text's
  until an arrow has gone to a suggestion, and the form is submitted with what the input
  says; in a combobox Enter chooses nothing until an arrow or the pointer has gone to an
  item. Asked to, the first item shown is highlighted as the text changes, and Enter takes
  it (`combobox.test.ts`, "what a combobox highlights as one types").
- **A side asked for in the text's own words is said in them.** `inline-end` is the right
  where the text runs to the right and the left where it runs to the left, read from the
  provider when there is one and from the positioner otherwise (which took its anchor's
  direction); `data-side` then says `inline-end`, or `inline-start` once flipped, never
  `left` or `right`. A design that keys on `data-side` writes both words, or asks for the
  side by the word it styles (`position.test.ts`, "says the other logical side once
  flipped").
- **What a popup is placed against may not be there yet when the popup is.** Each framework
  fills a ref in its own time, and a popup that is open when the page is first drawn can be
  in the page a moment before the element it was told to be placed against. An anchor given
  as a function (or a ref, which an adapter reads through one) that has nothing yet is
  asked once more a moment later, and the popup's own anchor is used until then
  (`position.test.ts`, "asks a function that gave nothing once more").
- **A place in the viewport is a new object each time it is asked for.** Following "another
  anchor" by identity started over on every placement. Two places read from the same
  element are followed the same way; only an answer for an anchor that is no longer the
  one followed is dropped.
- **A popup cannot be placed against what it holds.** A combobox whose input is inside its
  popup was placed against that input: the popup's `min-width: var(--anchor-width)`
  followed the input, which was as wide as the popup, and the popup grew to thousands of
  pixels. With the input inside, the popup is placed against the button, the input has
  focus while the popup is open and the button after, and the input's text is only what is
  looked for (`combobox.test.ts`, "a combobox whose input is inside its popup").
- **Where a combobox's input is, is known once the page has mounted.** A server draws the
  button as the one beside an input (`tabindex="-1"`); a page that shows no input beside
  it makes the button the combobox, a stop for Tab that says it opens a dialog. With the
  input in the popup the items go in `Combobox.List`, which is then the listbox: a listbox
  may hold only options.
- **Scroll arrows need the list to be its own box.** An element placed in what scrolls goes
  with what scrolls: with arrows, the items are in `Select.List`, which is then the listbox
  and what scrolls, and the popup holds the list and the arrows.
- **A drawer over a drawer is said by the one under it** (`--nested-drawers`,
  `--drawer-frontmost-height`, `data-nested-drawer-open`), from the order they opened in:
  no provider, and no drawer needs to be drawn inside another.
- **A component made of others gives their parts their roots.** A date picker is a date
  field, a popover and a calendar with one value between them: its root makes the three
  controllers and provides each to that component's own parts, which are then the picker's
  parts. Nothing is written twice, and a fix to a calendar is a fix to the picker's.
- **A range a date picker holds begins in its value.** Its calendar's first press is the
  picker's to hold (`around.range`): one end, typed or picked, is a range begun, so the fields
  and the calendar never say two things, and the next press is the other end. Escape is then
  not the grid's to take for giving the range up: it goes on to the popover, which closes
  (`date-picker.test.ts`, "takes a range begun from its end, and gives its own Escape to the
  popover"; scenario `picking`).
- **A calendar shows the month of a value that came from elsewhere.** A day typed in the
  picker's field was the calendar's chosen day, in a month it was not showing
  (`date-picker.test.ts`, "is one value").
- **A list that is drawn by key moves nothing that stays.** A row of pages only ever
  ascends: what leaves is taken out and what is new goes in at its place. A kept element
  that is taken out and put back, to "move" it, loses focus (Angular's
  `ViewContainerRef.move`).
- **A row of pages keeps its length.** The pages around the one shown shift, a mark stands
  for two pages or more and a page for one: a button never moves from under a pointer
  (`pagination.test.ts`, "keeps the row one length").
- **A text the core owns is in its part's props, or a server draws an empty input.** A
  combobox, a command list and a number field write their input's text themselves in a
  page, when it changes; `value` in the part's props is what a server writes. React is given
  it as `defaultValue` (`useOwnText`): a `value` with no `onChange` is, to React, an input
  nobody can type in. Conformance compares what each server sent with the page at rest.
- **What a guide quotes is a file a test runs.** `docs/authoring.md` is held to the example
  it shows: the test reads both, and fails when they part.
- **A generated file is checked where it is generated.** `llms.txt` and the vocabulary are
  written by scripts and compared byte for byte in the gate: edit the definitions, never
  the file.
- **A ref on a component is not an element.** Vue hands a ref on a component its instance:
  its root element is `$el`, and with several roots `$el` is the fragment's own mark, with
  the first element after it. A part drawn onto a component (`as-child`) takes that element.
- **An empty state is a status.** What a combobox or a command list says when nothing
  matches has `role="status"`, so software that follows one reads it. It is in the page only
  while nothing matches: a design's padding on it takes no room otherwise.
- **Read only locks the value, not the list.** A read-only combobox or autocomplete still
  opens (its button, a press, the arrows) and is gone through; what is refused is whatever
  would change the value: an item pressed, Enter on one (which is not the form's either),
  the clear button, a chip's button, Backspace on a chip, and any text, which a read-only
  native input does not take and a script's write is put back from. An agent is offered no
  action on it (`combobox-data.test.ts`, "a combobox that is only to be read").
- **A status that arrives with its text is not said.** Software that reads the page says a
  status when its text changes, not when it comes into the page: one drawn inside a popup,
  with "3 results" already in it, was silent the first time. `Combobox.Status` stays in the
  page while its text changes, and where it does come in with text (inside the popup) the
  core changes that text once by a mark that draws nothing and puts it back
  (`combobox-data.test.ts`, "a combobox's status"). Not on iOS, where a status is said as it
  appears.
- **A list drawn from data is filtered once.** With `items` on the root and a `Collection`,
  the root filters and the items left are the ones in the page: an item that also hid itself
  by its own text disagreed with the data's label, and a list with one match said it was
  empty. Whether a list drawn from data is empty is the data's to say, never a count of the
  items made: a render that is thrown away (React's StrictMode) makes an item that never
  comes into the page (`combobox-data.test.ts`, "a combobox whose items are data").
- **A label may come after its value.** Items that are loaded, or given to a custom element
  as a property once it is in the page, arrive after the input has been written with the
  value itself for want of a label. A text that still says what was written for the value
  is written again with the label; one that was typed is left
  (`combobox-data.test.ts`, "names its value once the items that name it have come").
- **A popup that grows the page moves what it is placed against.** A list at the page's end
  that is filtered longer makes the page taller, the page's scrollbar comes and goes, and
  everything is measured again inside the report of the first measure ("ResizeObserver loop
  completed with undelivered notifications"). The fixtures' last sections keep room under
  them (`fixtures/shared/styles.css`).
- **An agent asks the way a person presses.** The bridge clicks, types and sends keys to
  the parts' own elements, inside `asAgent`, so a change goes through the component's
  handlers and callback like any other and only its `source` differs. Whether a change is
  the agent's is known when its details are made, not when they are read: a callback may
  read them after the agent's turn is over.
- **A label names the input, and focus lands on the box.** A switch, a checkbox and a radio
  hold a hidden native input, and a `<label for>` (or a label around the control) is that
  input's: a press on it works, and the element with the role, the one focus lands on, had no
  name for a screen reader or for an agent. The control reads its input's `labels` when the
  input is in the page, and again as focus lands, and writes `aria-labelledby` on itself
  (`services/labels.ts`), giving a label an id where it has none; a control the page named
  itself, or one in a `Field`, is left as it is. A slider's name is on its root, and each
  thumb takes it. Held by `tests/core/agent.test.ts` ("names a switch by the label of its
  hidden input", "leaves a switch the page named itself", "reads a radio group's choices").
- **A step that reports `ok` must have done what it was asked.** The bridge set a slider by
  pressing an arrow and reading `aria-valuenow` in the same turn: a framework that draws
  later had not moved it yet, so the loop stopped after one key and the step said `ok`. A
  thumb's input now takes a value written on it and told with `change`, the bridge waits for
  each key to show before the next, and a slider that does not hold the value asked for
  fails the step with what it holds ("sets a slider at once through its thumb's input").
- **A mark that hides is asked of every kind.** `data-agent-secret` redacted what an input
  held and left a select's value, a slider's and a switch's state readable. It is applied
  after a control is read, whatever its kind, and a change over a value that was not read is
  not offered to `undo`, which would have typed the word "redacted" ("hides whatever is
  inside a secret mark").
- **An empty name is nobody's.** A step whose `ref` was empty matched the one control with
  no label, since both normalised to nothing, and pressed it ("refuses a step that names
  nothing").
- **What a root opened is the root's, wherever it is drawn.** A bridge given a `root` read
  under it only: a modal dialog opened from inside is drawn at the end of the page and makes
  the root inert, so the snapshot came back empty. The bridge follows the `aria-controls` of
  what is expanded under its root, and of what is expanded in those ("sees what a narrowed
  root opened").
- **The press made the change, not the input it went through.** A checkbox, a switch and a
  radio change through their hidden input's `change`, and their callback was given that
  event: a mouse's press said `source: "virtual"`. The press on the box is what the details
  are made from. A press through a `<label>` still reaches the input with no pointer of its
  own; the agent bridge, which says who changed a control, then goes by what the person last
  used (`tests/core/agent.test.ts`, "says of each change which state").
- **A change is told with who made it, and kept apart by who did.** The bridge's `subscribe`
  gave the changed components and nothing of the change; its history held the agent's steps
  only, so "undo what the agent did" after a person had gone on working either could not be
  asked or undid theirs. Each change now says its state, its value before and after, its
  source and, from a part of this library, its reason; `record()` keeps a person's changes
  too, typing as one, and `undoSource` leaves a control someone else changed since ("keeps a
  person's changes beside its own", "takes back what one source did").
- **A step of the bridge's own is not a change the recorder sees.** A slider moved by its keys,
  each waiting for its caller to hand the value back, took longer than the recorder's wait for
  the page to be still: it kept the step's change as well as `act`'s own entry, `undo` took
  back the copy, and `seek(0)` went to the wrong value. While a step, a menu opened to find an
  item or a list opened to read it is moving a control, the page is compared once, at its end,
  as the agent's ("keeps a step that takes many events once while recording").
- **A signal may be aborted before the wait for it begins.** The wait for `allow` and
  `confirm` heard the signal's `abort` event only: one aborted inside `confirm`, or by the
  policy itself, was never heard and `act` never ended. The wait now looks at `aborted` first
  ("stops at a signal aborted before the wait for an answer begins").
- **Asking for a secret control's choices reads none.** `query({ within })` opened a select
  inside `data-agent-secret` and read its options from the popup, drawn outside the mark. A
  marked control is given back as `snapshot` gives it, and nothing is opened ("lists no
  choices of a secret control when asked for them").
- **A name that two controls answer to is never guessed.** A step finds its control by its
  label whole, then by the label's words, the text of its row, a choice of one group, its
  kind: the next way is tried only when the one before found nothing, and two matches at any
  of them fail the step with both ("finds a control by a word of its label").
- **A list a select opens is the select's.** Read by its role, a closed select's list kept
  in the page was a second component, named by all its choices at once. A listbox something
  points at with `aria-controls`, or that says it is closed, is not listed, and a list is
  named only by a label.
- **Each value asked for is looked for by itself.** Setting several choices checked that
  every value asked for was in the list by asking whether any option matched any of them:
  `["Olives", "Anchovies"]` passed on Olives, and the step pressed what it could and said
  `ok`. Each value is now matched alone before anything is pressed
  (`tests/core/agent.test.ts`, "reads a list of several choices", "reads a select of several
  values once its list is read").
- **Focus cannot go to what is still hidden.** An editable's input is in the page always,
  hidden until it is edited, and a framework takes the `hidden` off in its own time: focus
  sent to the input as the edit starts went nowhere. The core shows the element itself, at
  once, as its props are about to say, and then focuses it; the same when focus goes back to
  the preview, whose own focus must then start no second edit
  (`tests/core/editable.test.ts`, "is edited as focus reaches it").
- **A button of an edit must not end the edit by being pressed.** A press on Cancel took
  focus from the input, and leaving the input keeps the edit: the text was kept before the
  cancel was heard. The edit's buttons keep the pointer's press from moving focus ("is kept
  and dropped by its buttons").
- **What a pointer rests on is not what the keys chose.** A rating draws the value under
  the pointer; after a press the pointer is still on the item, and an arrow's new value was
  drawn as the old one. A key ends the preview (conformance, `editing`: "the item it half
  fills says so").
- **A browser drops the caret when an input's type changes.** Showing a password turns its
  input to text: the selection is read first and put back after
  (`tests/core/password-input.test.ts`, "focus and the caret left where they are").
- **A part's attribute that depends on a list must follow the list.** A tag's `id` was built
  from its place and read the tags without following them: when a tag before it was taken
  away, its id kept the old place. React hid it, because its props are given anew on every
  render and every part computes again; four other adapters showed it at once. The id is gone
  (nothing pointed at it), and the rule stands: what a part writes from a signal reads the
  signal with `get()` (conformance, `tagging`).
- **A browser resets a form after the reset is heard.** An editable wrote its text back into
  its input as its form was reset, and the browser then put the input back to its default,
  which was empty wherever a framework sets `value` as a property. The text kept is also the
  input's `defaultValue`, which is what the browser reads next (conformance, `editing`,
  "after the form is reset").
- **What only a browser can draw is not in a server's page.** A control of several values
  sends a hidden input for each; the ones after the first are the core's to draw once the
  first is in the page, so a server sends one. The run that compares a server's page with the
  mounted one leaves them out, as it does a name known only once a label is in the page.
- **A scenario waits for the page before it reads what the page holds.** A press that the
  core answers at once is drawn by a framework in its own time: an output read straight after
  a pointer's press was the old one on the adapter that renders in a task of its own
  (conformance, `exploring`).
- **A length is a share once there is something to measure.** A drawer's snap point given
  as `"148px"` is whole until the drawer is in the page: so "the smallest of its places" is
  not decided when the controller is made, where a length looked like the largest.
- **A part that starts out of the page is hidden from the start.** An effect that only acts
  on a change of "mounted" did nothing for one that began unmounted: a custom element's
  panel stayed in view. Its first state is written before the effect runs.
- **A custom element is not a button.** It takes no focus and no key by itself. A
  component's root is the custom element; its parts are the page's own elements, named by
  an attribute, so a trigger is a `<button>` and nothing is wrapped.
- **Popups go where their provider says.** Each adapter has one place a portal is made:
  `PortalProvider` gives it another container than `<body>`, for every popup inside and the
  popups those open.
- **A part taken off an element takes what it wrote with it.** A framework draws a new
  element each time a part comes back; a custom element's parts are the page's own, bound
  again and again. One that came back still said `data-closed` beside `data-open`, and a
  trigger still named a panel that was gone: unbinding restores the element's own attributes.
- **A custom element holds a component; it is not one of its parts.** With the root as the
  custom element, the page was not the page the other adapters draw, and a part's attributes
  landed on an element a design did not write. It takes no room (`display: contents`) and
  the root is one of the parts inside it. A part that is out of the page is out of the page:
  hiding it left an element the others do not have.
- **Read the element a part is drawn on from the adapters, not from memory.** A checkbox, a
  switch and a radio are `<span>`s that take focus and keys themselves; the comparison with
  React's page said so in its first run.
- **Undo is a step like any other.** The bridge takes a change back by asking the component
  for what it held before, so the callback hears it and may refuse; a change a callback
  refused was never kept, and a press is not a state to return to.
- **A check that fails now and then is replayed with every processor busy**, not waited for:
  a dozen `(while :; do :; done) &` beside the scenario, stopped by their pids after. The
  virtual list's check failed four runs in six that way and never alone; it had read a row's
  `data-highlighted` the moment the row had focus, a render before the framework drew it.
  Focus is the core's and at once; an attribute is the framework's next render. A check
  waits for the page to settle after waiting for focus.
- **WebKit runs on this machine** once its system libraries are there
  (`sudo env "PATH=$PATH" bunx playwright install-deps webkit`): `--browser webkit`.
- **CI's fonts and speed are not this machine's.** `bun tests/conformance/run.ts react
  --only menu --slow 6` plays one scenario with the processor slowed.
- **A design's transition goes to the one part it is for.** The fixtures' rule for a switch's
  thumb (`transition: translate`) also matched every slider's thumb, which the library puts in
  its place with `translate`. Where a part's style is written on an element that is already in
  the page (Angular's directives, the custom elements), each thumb slid to its place for 120 ms
  as the page mounted. Firefox holds a page still by what is at the top of the view (scroll
  anchoring): asked for the end of the page in that moment, it took a sliding thumb for its
  mark, and at the next layout moved the page by what was left of the slide. A popup opened
  there had a pixel or two less room than on the other adapters, seven runs in eight. Held by
  the `placing` scenario, which reads the page's scroll around each opening.
- **A part's first style lands on an element the page already styled.** Where the page's
  markup is drawn before its components begin (the custom elements; a framework's element has
  its style before it is first drawn), a slider thumb's place is a change of style to the
  browser, and a design's `transition` on it runs as the page begins: each thumb glides to
  where it was all along. The custom elements end what a part's first style started before
  the page is drawn again, once for all the parts of a pass; Angular writes every part's
  props in the directives' turn and attaches after, and a slider's thumbs with no index wait
  for all of them, so none is first written at another's place. Held by
  `tests/core/web.test.ts` ("a part's first style starts no transition on markup the page
  had drawn") and the `placing` scenario.
- **A list of parts is not where they go.** The reference named every part and said of none
  what it is written inside: a reader with that file alone could not tell that a tab goes in
  the tab list, or that a select's item is five parts deep. Where a part goes is data now
  (`inside`, `optional`, `repeated` on each part of the vocabulary), drawn as a tree in every
  `llms.txt`, and held against the six fixture pages' own source, each read with its
  framework's parser: `packages/vocabulary/src/anatomy.test.ts` fails on a part written
  outside what the data says, and `bun scripts/llms.ts --check` (`anatomy`) on a part with no
  place.
- **A type a prop names must be the package's own to give.** `ChangeDetails`, `Side` and
  `IsoDate` were exported by the core only, which a strict installer keeps out of a
  project's reach: the one package a project installed could not type its own callbacks.
  Each adapter's root exports them, as types. Held by `bun scripts/llms.ts --check` (`types`),
  `vp run parity`, and `scripts/consume.ts`, which type-checks them in a project that has
  only the adapters, installed isolated.
- **One directive for several components takes all of their inputs.** Angular's dialog root
  was also the alert dialog's, so `[modal]="false"` on an alert dialog made one that is not
  modal. The alert dialog has a root of its own, with no such input; `vp run parity` compares
  each part's own props with React's and fails if it comes back.
- **An arrow is placed in what is its offset parent when it is measured.** A popup that
  comes in scaled is, through its entrance, what its arrow is placed in; at rest it is the
  positioner. Measured during the entrance and never again, an arrow in a popup with a
  border stood off its anchor's centre by half the border, on five adapters and not on the
  sixth, which had attached a moment later. A popup that holds an arrow is positioned by
  its design (`position: relative`), so the arrow is placed in it at every moment. Held by
  the `popover-more` scenario, which reads the arrow's centre against its trigger's on a
  popup with a border and an entrance.
- **A popup kept in view must be let go when its anchor leaves.** Moved along its side to
  stay in the viewport with no limit, a popup stayed at the edge of the page after its
  anchor had been scrolled away, pointing at nothing. It is moved only as far as its
  anchor reaches (less half an arrow and the padding), then leaves with it; `sticky` is
  the wish to keep it (`position.test.ts`, "leaves with an anchor that is scrolled out of
  view").
- **A function or an object given as an option is new on every render.** A padding written
  `{ left: 20 }` in a template placed the popup again each time anything was drawn. Options
  that are lists or records are compared by what they hold; a function is the caller's to
  keep (a constant, a memo) where being asked again matters (`position.test.ts`, "keeps a
  padding of its own at each side").
- **A popup the pointer opened is not yet the reader's.** A popover that opens on hover
  takes no focus, holds no page and locks no scroll, whatever its `modal` says, or a
  pointer crossing a trigger would take the keyboard away. Pressed, it becomes a pressed
  popover: the popup lets go of what it held as one and takes hold as the other
  (`mode` in `createPopup`), and the pointer leaving no longer closes it. A press within
  half a second of the pointer's opening keeps it (the press was on its way to open it);
  later, a press closes it. Held by `tests/core/popover.test.ts` ("a popover its trigger
  opens on hover").
- **A popup that was the pointer's and is someone else's now must be forgotten by the
  pointer.** One open popup is the page's "current" one, which the next trigger closes and
  opens after at once. A popover opened by hover and then pressed, or opened by a press
  while its wait ran, was still "current": the next tooltip skipped its wait for ever
  after, and the wait still running opened the popover a second time, as the pointer's
  (`hover.forget()`; `hover.test.ts`, "forgets a popup that was taken over").
- **A popup that leaves the page open gives up being the page's open one.** The "current"
  popup is module state, shared with no provider, and nothing closes a popup whose page or
  section is unmounted. A tooltip taken away while open stayed "current": the next page's
  hover card, reached by the pointer, closed the dead tooltip (telling a page that was gone)
  and opened at once with `data-instant="delay"`, before a press on its trigger could land;
  opened over its own trigger, it took that press and stayed open. Stopping a hover
  controller releases "current" without closing it (`createHover`'s `start()`). Held by
  `tests/core/hover-teardown.test.ts` (every pair of tooltip, hover card and popover on
  hover) and the `hover` scenario, which removes the open tooltip `h3` on each adapter.
- **A backdrop under a popup the pointer opened would take the pointer.** The trigger is
  under it: the pointer has "left", and a press cannot reach the trigger. While the
  pointer holds the popover its backdrop lets the pointer through (`pointer-events: none`
  on the backdrop, never on the page).
- **A custom element's part is out of the page while its popup is closed.** A property on
  the positioner's element could not be set by a page that cannot find the element. What a
  positioner takes that no attribute can say is a property of the custom element
  (`positioning`), read as the popup comes into the page (`web.test.ts`, "a popover: what
  its positioner, its trigger and its root are asked").
- **A press outside moves focus by itself.** After a press on a backdrop the browser gives
  focus to what was pressed, which is nothing: a scenario that expects the trigger to have
  it after such a press expects what no browser does.
- **A clock that is faked starts again with each test.** The forward clock was near zero
  in every test, and "one closed 400 ms ago", kept in a module, was in the future of the
  next test: its popup opened at once. Each test begins later on the faked clock than the
  one before ended (`popover.test.ts`).
- **What lies over the page on its way out takes no press.** A dialog's viewport covers the
  page for as long as the popup's exit lasts, and the popup inside it is already inert: the
  viewport is made inert with it, so a press in that moment reaches the page. The core writes
  that itself, before the popup follows `open`: left to a framework's next render, a dialog
  opened again during its exit asked for focus inside an element that was still inert. Held by
  `tests/core/dialog.test.ts` ("takes no press on its way out, and is live again when the
  dialog comes back").
- **A press on a scrollbar is not a press outside.** A long dialog scrolls in its viewport,
  and a press on that scrollbar lands on the viewport, beside the popup. It is told by where
  it lands: outside what the element shows of its content, on an element that has something
  to scroll. Test browsers are launched with their scrollbars hidden, so the test gives the
  viewport a border where the scrollbar's room would be (`dialog.test.ts`, "scrolls by its
  own scrollbar"); a real scrollbar was pressed by hand, in a Chromium launched with its
  scrollbars shown.
- **A locked pointer cannot be played by a test.** A browser gives the lock only for a press
  of the reader's own, answers a moment later, and under a test driver reports moves that are
  the driver's own (each one followed by its opposite). The number field's scrub area is
  played with a finger's pointer, which no engine locks, and with a stand-in for the lock
  that answers as a browser does (`number-field.test.ts`, "a scrub area whose pointer is
  locked"). A lock that is given after the pointer was let go, which a short press always
  is, is given straight back.
- **A free pointer says where it is; a locked one, how far it would have gone.** How far a
  drag went is read from where the pointer is while it is free, and from `movementX` and
  `movementY` only while it is locked: nothing promises those for a finger's pointer, or
  for an event a script dispatched. Which of the two it is, is asked of the page at each move
  (`pointerLockElement`), not remembered from the last `pointerlockchange`: an engine may say
  a locked pointer is at the lock's own place from the moment it locks, for every event. A
  lock one test left held made the next tests' drags go nowhere; a test that presses with a
  mouse gives the area a stand-in that refuses, so no real request outlives it.
- **A prefixed property beside its plain twin is two styles.** `-webkit-user-select` and
  `user-select` written together are one declaration once a browser has read them and two in
  what a server sent, and the page at rest no longer matched its server's. A part writes the
  plain property only.
- **A probe that reads layout can hide the fault it looks for.** A scroll jump disappeared
  under a logger that read `scrollY`.
- **A rehearsal installs from a cache of its own.** The rehearsal's registry holds a version
  for one run, and the next run publishes the same version with other files. Installed
  through the machine's package cache, the project was handed the files of an earlier run,
  and "the release installs and works" passed on packages nobody had just published: a new
  type-checked line found declarations that were days old. `scripts/consume.ts` gives an
  install from a registry that is not npm's its own cache.
- **Stop what you start, by its process id.** A server left running holds a port and memory
  for the next run.
- **A dependency change is checked in a fresh clone** with a frozen lockfile: links of removed
  packages stay in `node_modules`.
- **A trigger brought to the very top of the view is not wholly in it.** WebKit scrolls a page
  by whole pixels while its boxes lie on parts of one: after `scrollIntoView({ block: "start"
  })` a trigger was a quarter of a pixel above the view, and the press that followed scrolled
  it in, one pixel, before anything had opened. A scenario that asserts the page stays still
  leaves room over what it presses (`placing`). It showed once the section stopped being the
  page's last, where the page could not scroll that far.
- **A test's document may have no Web Animations.** `whenSettled` called `getAnimations()` on
  the element, which jsdom does not have: a dialog or a select closed in a jsdom test threw, and
  stayed in the page. With no such method nothing animates, and the element is settled at once
  (`tests/core/presence.test.ts`, "an element in a document with no Web Animations"). The
  testing kit's `settled()` did the same on the document, in a timer, so its promise never
  ended: it now takes such a document as still, and rejects when it cannot look
  (`tests/core/testing.test.ts`, "is settled in a document with no Web Animations").
