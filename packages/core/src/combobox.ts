import { bindable } from "./bindable.ts"
import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import type { Field, FieldMembership } from "./field.ts"
import { defaultId, details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { batch, computed, effect, keyed, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { byPlace } from "./services/list-places.ts"
import { createList, pointerMoved } from "./services/list.ts"
import { createFormControl } from "./services/form-control.ts"
import { restInputs } from "./services/hidden-inputs.ts"
import { formValue, itemsOf, labelIn, ownLabel, plainLabel } from "./services/items.ts"
import type { ItemLabels } from "./services/items.ts"
import type { ListCollection, ListRow } from "./services/list.ts"
import { lockPage, popupFocus } from "./services/popup-focus.ts"
import { createPopup } from "./services/popup.ts"
import { createPlacement } from "./services/position.ts"
import { createSheet } from "./services/sheet.ts"
import type { Presentation } from "./services/sheet.ts"
import { printable, textOf } from "./services/typeahead.ts"
import type { PositionOptions } from "./services/position.ts"

/** One item given as data: its value, and what it is called. */
export interface ComboboxItemData<Value = unknown> {
  value: Value
  label: string
  /** It cannot be chosen: its entry says so, for the item drawn for it. */
  disabled?: boolean | undefined
}

/** Items given as data that belong together: `value` is the group's name. */
export interface ComboboxGroupData<Value = unknown> {
  value: string
  items: readonly ComboboxItemData<Value>[]
}

/** One item left of the `items` given as data, as a `Collection` hands it to be drawn. */
export interface ComboboxItemEntry<Value = unknown> {
  readonly type: "item"
  /** What it is known by from one drawing to the next. */
  readonly key: string
  readonly value: Value
  readonly label: string
  readonly disabled: boolean
  /** The item as it was given, with whatever else it carries. */
  readonly item: ComboboxItemData<Value>
}

/** A group that has items left, with those items. */
export interface ComboboxGroupEntry<Value = unknown> {
  readonly type: "group"
  /** What it is known by from one drawing to the next. */
  readonly key: string
  /** The group's name, as it was given. */
  readonly value: string
  /** The same name: an entry of either kind has a `label`. */
  readonly label: string
  /** Never: an entry of either kind says whether it is disabled. */
  readonly disabled: false
  /** The items of the group that are left. */
  readonly items: readonly ComboboxItemEntry<Value>[]
}

/** What a `Collection` hands to be drawn: an item that is left, or a group that has items left. */
export type ComboboxEntry<Value = unknown> = ComboboxItemEntry<Value> | ComboboxGroupEntry<Value>

/** What a combobox's value part shows: what is chosen, and how it is named. */
export interface ComboboxShown<Value = unknown> {
  /** The chosen value; `null` while nothing is chosen, and with `multiple`. */
  readonly value: Value | null
  /**
   * The chosen value's label, or with `multiple` every chosen label with ", " between;
   * `undefined` while nothing is chosen.
   */
  readonly label: string | undefined
  /** Every chosen value, in the order they were chosen: one or none without `multiple`. */
  readonly values: readonly Value[]
  /** The label of each of `values`. */
  readonly labels: readonly string[]
}

export interface ComboboxProps<Value = unknown> {
  id: string
  /**
   * How the list opens. `"sheet"`: from the bottom edge, not placed against the input, modal
   * with a backdrop, swiped down or pressed outside to close; the input then goes in the
   * popup, at its head. `"auto"`: decided each time it opens, a sheet when the pointer is
   * coarse and the viewport narrower than `sheetBelow`. Default `"popup"`. Not with `inline`.
   */
  presentation?: Presentation | undefined
  /**
   * With `presentation: "auto"`: the viewport's width, in CSS pixels, under which a coarse
   * pointer opens a sheet. Default 640.
   */
  sheetBelow?: number | undefined
  /** The chosen value; `null` is "none". */
  value?: Value | null | undefined
  /** The value it starts with, when the caller does not hold `value`. Read once. */
  defaultValue?: Value | null | undefined
  /** Heard as a value is about to be chosen or cleared: `details.cancel()` keeps it as it was. */
  onValueChange?: ((value: Value | null, details: ChangeDetails) => void) | undefined
  /** What the input says. */
  inputValue?: string | undefined
  /** The text the input starts with, when the caller does not hold `inputValue`. Read once. */
  defaultInputValue?: string | undefined
  /** Heard as the input's text is about to change: `details.cancel()` keeps it as it was. */
  onInputValueChange?: ((value: string, details: ChangeDetails) => void) | undefined
  /** Whether the list is open, when the caller holds it. */
  open?: boolean | undefined
  /** Whether the list starts open, when the caller does not hold `open`. Read once. */
  defaultOpen?: boolean | undefined
  /** Heard as the list is about to open or close: `details.cancel()` keeps it as it was. */
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  /** Disabled: it cannot be changed. */
  disabled?: boolean | undefined
  /**
   * Its value can be read and not changed. The list still opens and can be gone through, by
   * the pointer and the arrows, but no press and no Enter chooses; nothing typed is taken,
   * and its clear and chip buttons do nothing. It keeps focus, and its value is still
   * submitted.
   */
  readOnly?: boolean | undefined
  /** With a name, the value is submitted with the form around it. */
  name?: string | undefined
  /** The id of the form the control belongs to, when it is not inside it. */
  form?: string | undefined
  /**
   * The values with their labels: a list of them, groups of them (`{ value, items }`, `value`
   * the group's name), or, for values that are text, the labels by value
   * (`{ apple: "Apple" }`). The input shows a value by its label from here before the list has
   * ever been opened. With the items written in the markup that is all it is for. With a
   * `Collection` it is the list itself: the combobox filters it by what is typed, and the
   * `Collection` draws what is left.
   */
  items?:
    | readonly ComboboxItemData<Value>[]
    | readonly ComboboxGroupData<Value>[]
    | Readonly<Record<string, string>>
    | undefined
  /**
   * For values that are objects: the text the input shows for one, and what an item drawn
   * with no text of its own is filtered by. Without it, an object's own `label` names it, then
   * the label `items` gives it, then the item's text in the markup.
   */
  itemToStringLabel?: ((value: Value) => string) | undefined
  /**
   * For values that are objects: the text the form is sent for one. Without it, the `value` of
   * an object shaped `{ value, label }` is sent, and any other object as JSON.
   */
  itemToStringValue?: ((value: Value) => string) | undefined
  /**
   * Whether an item is shown for what was typed. Default: its label holds the text, without
   * regard to case. `null`: every item is shown, and the caller draws the ones it wants (or
   * gives the `items` it wants, when they are loaded for what was typed).
   */
  filter?: ((label: string, query: string) => boolean) | null | undefined
  /**
   * Several values, each shown as a chip beside the input: an item chosen is added, chosen
   * again taken away, and the list stays open. The values are `values`, not `value`.
   */
  multiple?: boolean | undefined
  /** With `multiple`: the chosen values, in the order they were chosen. */
  values?: readonly Value[] | undefined
  /**
   * With `multiple`: the values it starts with, when the caller does not hold `values`. Read once.
   */
  defaultValues?: readonly Value[] | undefined
  /**
   * With `multiple`: heard as a value is about to be added or taken away, with the values there
   * would then be: `details.cancel()` keeps them as they were.
   */
  onValuesChange?: ((values: Value[], details: ChangeDetails) => void) | undefined
  /** In a field, "none" is then wrong. */
  required?: boolean | undefined
  /**
   * The list is always in the page, under the input, with no popup: a command palette. An item
   * chosen is told to the caller, and the input keeps what was typed.
   */
  inline?: boolean | undefined
  /**
   * Every row, when only some are in the page (a virtualizer draws the ones in view). The
   * caller then filters: the collection is what is left, and each item is given its `index`.
   */
  virtualized?: ListCollection | undefined
  /**
   * The first item shown for what was typed is highlighted as one types, so Enter chooses it.
   * Off by default: typing then highlights nothing, and Enter chooses once an arrow or the
   * pointer has gone to an item. Either way a list opened with nothing typed is on its chosen
   * item, if it has one.
   */
  autoHighlight?: boolean | undefined
}

export interface ComboboxItemOptions {
  /** The item's id: the input names the highlighted item by it. */
  id: string
  /** Disables this item: it cannot be chosen, and the arrows pass over it. */
  disabled?: boolean | undefined
  /** What is filtered and what the input shows; the item's text when left out. */
  label?: string | undefined
  /** Its place among all the rows, in a virtualized list. */
  index?: number | undefined
}

/** Items that belong together, named by their label. */
export interface ComboboxGroup {
  readonly root: Part
  readonly label: Part
}

export interface Combobox<Value = unknown> {
  readonly open: ReadonlySignal<boolean>
  readonly mounted: ReadonlySignal<boolean>
  readonly value: ReadonlySignal<Value | null>
  readonly inputValue: ReadonlySignal<string>
  /** Whether no item is shown for what was typed. */
  readonly empty: ReadonlySignal<boolean>
  /** Whether the combobox has a name: whether its hidden input is drawn. */
  readonly named: ReadonlySignal<boolean>
  /** Whether there is anything to clear: its clear button is in the page only then. */
  readonly clearable: ReadonlySignal<boolean>
  /** Whether it holds several values. Read once, when the combobox is made. */
  readonly multiple: boolean
  /** What is chosen and how it is named, for a value part its caller draws. */
  readonly shown: ReadonlySignal<ComboboxShown<Value>>
  /**
   * The `items` given as data that are left for what was typed, for a `Collection` to draw:
   * items, or the groups that have items left; given one of those groups, its items left. Asking
   * says the list is drawn from data: the combobox is then what filters, and no item hides
   * itself.
   */
  entries(of?: { readonly key: string }): ReadonlySignal<readonly ComboboxEntry<Value>[]>
  setOpen(open: boolean, details: ChangeDetails): void
  setValue(value: Value | null, details: ChangeDetails): void
  readonly positioning: Signal<Partial<PositionOptions>>
  mount(): () => void
  /**
   * The text input: what is typed filters the list. The list is placed against it, or against
   * the chips' box when it is in one. It may be inside the popup instead: the popup is then
   * placed against the button, and the input takes focus while the popup is open.
   */
  readonly input: Part
  /**
   * A button that opens and closes the list. With the input inside the popup it is the
   * combobox itself: a stop for Tab, what the popup is placed against, and where focus goes
   * back as the popup closes.
   */
  readonly trigger: Part
  /** A button that empties the input and the value. */
  readonly clear: Part
  /** With `multiple`: the chosen values. */
  readonly values: ReadonlySignal<readonly Value[]>
  /** With `multiple`: what holds the chips and the input. */
  readonly chips: Part
  /** With `multiple`: one chosen value, as a chip. */
  chip(value: Value): Part
  /** With `multiple`: a chip's button that takes its value away. */
  chipRemove(value: Value): Part
  readonly positioner: Part
  /** The list of items, or with a `list` inside what holds it: a dialog around an input and a list. */
  readonly popup: Part
  /** What lies over the page behind the list; a press on it closes the list. */
  readonly backdrop: Part
  /**
   * The items' own box inside the popup, when the popup holds more than items: an input, a
   * heading. It is then the listbox, and the popup is not.
   */
  readonly list: Part
  /** What is shown when no item is. */
  readonly emptyPart: Part
  /**
   * What says how the list stands ("3 results", "Loading"): software that reads the page says
   * its text as the text changes. It stays in the page, with its text changed or taken out.
   */
  readonly status: Part
  /** The hidden input that submits the value. Rendered only when the combobox has a name. */
  readonly hidden: Part
  item(value: Value, options: () => ComboboxItemOptions, group?: ComboboxGroup): Part
  /**
   * Items that belong together, named by their label: hidden while none of them is shown.
   * `id` is its element's, and what its label's is made from.
   */
  group(id: string): ComboboxGroup
  /** A label that is in no group: it names nothing, and is valid there. */
  readonly groupLabel: Part
  /** A line between groups. */
  readonly separator: Part
  /** Whether `value` is the chosen one, for an item's indicator. */
  selected(value: Value): ReadonlySignal<boolean>
  /** The mark an item shows while it is the chosen one. */
  itemIndicator(value: Value): Part
}

const NOTHING = () => {}
const NONE: readonly never[] = []
const INDICATOR = computed(() => ({ "aria-hidden": "true" }))
const EMPTY = computed(() => ({}))
const STATUS = computed(() => ({ role: "status", "aria-live": "polite", "aria-atomic": "true" }))
const holds = (label: string, query: string) => label.toLowerCase().includes(query.toLowerCase())

interface Shown {
  readonly shown: ReadonlySignal<boolean>
}

type Given<Value> = ComboboxProps<Value>["items"]
const grouped = <Value>(items: Given<Value>): items is readonly ComboboxGroupData<Value>[] =>
  Array.isArray(items) && Array.isArray((items[0] as ComboboxGroupData<Value> | undefined)?.items)

/** The items given, out of their groups, as values with their labels. */
function leaves<Value>(items: Given<Value>) {
  return grouped(items) ? items.flatMap((each) => each.items) : (items as ItemLabels<Value>)
}

/** `items` as entries: each with a key that is its own, by which a drawn item is kept. */
function arrange<Value>(
  items: Given<Value>,
  keyOf: (value: Value) => string
): readonly ComboboxEntry<Value>[] {
  const taken = new Set<string>()
  const own = (wanted: string) => {
    let key = wanted
    for (let again = 2; taken.has(key); again++) key = `${wanted}#${again}`
    taken.add(key)
    return key
  }
  const entry = (item: ComboboxItemData<Value>): ComboboxItemEntry<Value> => ({
    type: "item",
    key: own(keyOf(item.value)),
    value: item.value,
    label: item.label,
    disabled: Boolean(item.disabled),
    item,
  })
  if (!grouped(items)) return itemsOf(items as ItemLabels<Value>).map(entry)
  return items.map((group) => ({
    type: "group",
    key: own(`group ${group.value}`),
    value: group.value,
    label: group.value,
    disabled: false,
    items: group.items.map(entry),
  }))
}

/** A zero-width mark: adding it to a text is a change software that reads the page hears. */
const JOINER = "\u2060"

/**
 * A status that comes into the page with its text already in it is not said: only a change
 * is. So its text is changed once, by a mark that draws nothing, and put back. Not on iOS,
 * where a status is said as it appears.
 */
const STATUS_PART: Part = {
  props: STATUS,
  attach(element) {
    let live = true
    let undo = NOTHING
    // A framework may write the text after the element attaches.
    queueMicrotask(() => {
      const page = element.ownerDocument
      const { platform, maxTouchPoints } = page.defaultView?.navigator ?? { platform: "" }
      const ios =
        platform.startsWith("iP") || (platform === "MacIntel" && (maxTouchPoints ?? 0) > 1)
      if (!live || !element.isConnected || ios) return
      const walker = page.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      let last: Text | undefined
      while (walker.nextNode()) if (walker.currentNode.nodeValue) last = walker.currentNode as Text
      if (!last) return
      const node = last
      const text = node.data
      const marked = `${text}${JOINER}`
      node.data = marked
      const back = () => {
        if (node.data === marked) node.data = text
      }
      const timer = setTimeout(back, 200)
      undo = () => {
        clearTimeout(timer)
        back()
      }
    })
    return () => {
      live = false
      undo()
    }
  },
}

interface Members extends ComboboxGroup {
  readonly members: Set<Shown>
  readonly joined: Signal<number>
}

const LABEL: Part = { props: computed(() => ({ role: "presentation" })), attach: () => NOTHING }
const SEPARATOR: Part = {
  props: computed(() => ({ role: "separator", "aria-orientation": "horizontal" })),
  attach: () => NOTHING,
}

/**
 * A text input with a list under it: what is typed filters the list, and an item chosen from it
 * is the value. Focus stays in the input; the arrows move a highlight the input names.
 */
export function createCombobox<Value = unknown>(
  props: ReadonlySignal<ComboboxProps<Value>>,
  around: {
    field?: Field | undefined
    /**
     * The text is the value, and the list only suggests (an autocomplete): an item chosen is
     * written into the input, nothing stays chosen, and the input keeps what was typed when
     * the list closes. Its function says whether a press on the input opens the list.
     */
    free?: (() => boolean) | undefined
    /**
     * What the input says it does with what is typed (`aria-autocomplete`): `"list"` by
     * default. With `"inline"` or `"both"` the rest of the first item that begins with what
     * was typed is written after it in the input, selected.
     */
    completion?: (() => "list" | "inline" | "both") | undefined
  } & DirectionAround = {}
): Combobox<Value> {
  const { field, free } = around
  let member: FieldMembership | undefined
  const inline = Boolean(props.peek().inline)
  const id = props.peek().id
  const popupId = `${id}-popup`
  const listId = `${id}-list`
  // The labels learned from the markup, so the input still names a value once the list is gone.
  const labels = new Map<Value, string>()

  /** A value's name from what the caller gave: `itemToStringLabel`, an object's own, `items`. */
  function givenLabel(
    item: Value,
    { items, itemToStringLabel }: Pick<ComboboxProps<Value>, "items" | "itemToStringLabel">
  ): string | undefined {
    return ownLabel(item, itemToStringLabel) ?? labelIn(leaves(items), item)
  }

  function labelOf(item: Value | null): string {
    if (item === null) return ""
    return givenLabel(item, props.peek()) ?? labels.get(item) ?? plainLabel(item)
  }

  /** What the form is sent for a value. */
  const sent = (item: Value) => formValue(item, props.peek().itemToStringValue)

  const open = bindable({
    value: () => props.get().open,
    defaultValue: props.peek().defaultOpen ?? false,
    onChange: (next, by) => props.peek().onOpenChange?.(next, by),
  })
  // `undefined` means "not controlled", so "none" is `null` on the way in and out.
  const value = bindable<Value | null>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? null,
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  const inputValue = bindable<string>({
    value: () => props.get().inputValue,
    defaultValue: props.peek().defaultInputValue ?? labelOf(value.peek()),
    onChange: (next, by) => props.peek().onInputValueChange?.(next, by),
  })
  const initialText = inputValue.peek()
  const multiple = Boolean(props.peek().multiple)
  const values = bindable<readonly Value[]>({
    value: () => props.get().values,
    defaultValue: props.peek().defaultValues ?? NONE,
    onChange: (next, by) => props.peek().onValuesChange?.([...next], by),
    equals: (a, b) => a.length === b.length && a.every((each, at) => Object.is(each, b[at])),
  })
  /** What a field is told the control holds: something, or nothing. */
  const held = (list: readonly Value[]) => list.map(sent).join(",")
  const initialValues = values.peek()
  // What a form's reset goes back to: the value the combobox began with.
  const initial = value.peek()
  const inForm = createFormControl((event) => {
    const by = details("form-reset", event)
    if (multiple) {
      values.set(initialValues, by)
      inputValue.set("", details("form-reset", event))
      return member?.reset(held(by.canceled ? values.peek() : initialValues))
    }
    if (free) {
      // The text it began with, which is its value.
      if (input) input.defaultValue = initialText
      inputValue.set(initialText, by)
      return member?.reset(by.canceled ? inputValue.peek() : initialText)
    }
    value.set(initial, by)
    // What was asked for, not what is read back.
    const next = by.canceled ? value.peek() : initial
    // The browser puts the input back to its default next: the default is what it should say.
    if (input) input.defaultValue = labelOf(next)
    inputValue.set(labelOf(next), details("form-reset", event))
    member?.reset(next === null ? "" : sent(next))
  })
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(field?.disabled.get()) || inForm.disabled.get()
  )
  const readOnly = computed(() => Boolean(props.get().readOnly))
  const name = computed(() => props.get().name ?? field?.name.get())
  // Only what was typed since the list opened filters it: opened on a chosen value, it shows
  // all. A list that is always in the page is always filtered by what its input says.
  const typed = signal(inline)
  const query = computed(() => (typed.get() ? inputValue.get() : ""))
  const isSelected = keyed(value as ReadonlySignal<Value | null>)
  const among = new Map<Value, ReadonlySignal<boolean>>()
  /** Whether an item is chosen: the value, or with several one of them. */
  function chosen(item: Value): ReadonlySignal<boolean> {
    if (!multiple) return isSelected.is(item)
    let found = among.get(item)
    if (!found) {
      found = computed(() => values.get().some((each) => Object.is(each, item)))
      among.set(item, found)
    }
    return found
  }

  function setValues(next: readonly Value[], by: ChangeDetails) {
    values.set(next, by)
    if (!by.canceled) member?.changed(held(next))
  }

  const without = (item: Value) => values.peek().filter((each) => !Object.is(each, item))
  // Whether a `Collection` draws the list from `items`: the combobox is then what filters.
  let fromData = false
  const whole = computed(() => arrange(props.get().items, sent))
  const left = computed<readonly ComboboxEntry<Value>[]>(() => {
    const all = whole.get()
    const text = query.get()
    const filter = props.get().filter
    if (filter === null || text === "") return all
    const keeps = (each: ComboboxItemEntry<Value>) => (filter ?? holds)(each.label, text)
    const rest: ComboboxEntry<Value>[] = []
    for (const each of all) {
      if (each.type === "item") {
        if (keeps(each)) rest.push(each)
        continue
      }
      const items = each.items.filter(keeps)
      // A group with nothing left is not there; one with everything left is as it was.
      if (items.length > 0)
        rest.push(items.length === each.items.length ? each : { ...each, items })
    }
    return rest
  })
  const inGroup = new Map<string, ReadonlySignal<readonly ComboboxEntry<Value>[]>>()
  const itemsLeft = () =>
    left.peek().flatMap((each) => (each.type === "group" ? each.items : [each]))
  // The labels learned from the markup, counted: what is chosen is named by one of them.
  const learned = signal(0)
  const showing = computed<ComboboxShown<Value>>(() => {
    void props.get().items
    learned.get()
    if (multiple) {
      const all = values.get()
      const names = all.map(labelOf)
      return {
        value: null,
        label: all.length > 0 ? names.join(", ") : undefined,
        values: all,
        labels: names,
      }
    }
    const one = value.get()
    if (one === null) return { value: null, label: undefined, values: NONE, labels: NONE }
    const label = labelOf(one)
    return { value: one, label, values: [one], labels: [label] }
  })
  const list = createList({
    selector: '[role="option"]',
    virtual: true,
    places: byPlace(() => props.peek().virtualized),
  })
  const rows = new Map<Value, ListRow>()
  const shown = new Set<Shown>()
  const registered = signal(0)
  // Whether the list is in a page: a server draws a list before its items, and cannot say
  // whether there are any.
  const listed = signal(false)
  const empty = computed(() => {
    if (!listed.get()) return false
    const every = props.get().virtualized
    if (every) return every.count === 0
    registered.get()
    // Drawn from data, it is the data that says: an item made and never put in the page (a
    // render that was thrown away) is no item.
    if (fromData) return left.get().length === 0
    for (const each of shown) if (each.shown.get()) return false
    return true
  })
  const placement = createPlacement({ align: "start" })

  let input: HTMLInputElement | undefined
  // Inline completion: what was typed, and what the input shows for it, an item's label after
  // it. Kept while the input shows it, and given to the caller only when it is kept.
  let completed: { typed: string; text: string } | undefined
  let completedRow: ListRow | undefined
  // Counts a completion made for the text the caller holds, or taken out of the input.
  const recompleted = signal(0)
  const recomplete = () => recompleted.set(recompleted.peek() + 1)
  // What was just typed, until an item that begins with it is in the page to complete it.
  let pending: string | undefined
  const completing = () => {
    const mode = around.completion?.()
    return (mode === "inline" || mode === "both") && !readOnly.peek()
  }
  /**
   * What the input shows: the completion of the text the caller holds, or that text. It
   * changes only as the text does or a completion is made or taken out, never as a key is
   * heard: a caller who holds the text gives it back later, and until then what the input
   * shows must not go back to the text before the key.
   */
  const written = computed(() => {
    const text = inputValue.get()
    recompleted.get()
    const done = completed
    return done && done.typed === text ? done.text : text
  })
  const rowOf = new WeakMap<Element, ListRow>()
  // What the input's text was last named from: the items, and how a value is named.
  let known = { items: props.peek().items, itemToStringLabel: props.peek().itemToStringLabel }
  // The text a field was last told, when the text is the value.
  let told = inputValue.peek()
  let trigger: HTMLElement | undefined
  let popup: HTMLElement | undefined
  let positioner: HTMLElement | undefined
  // With several values: the box the chips and the input are in, and each chip in the page.
  let chips: HTMLElement | undefined
  const chipElements = new Map<Value, HTMLElement>()
  const chipParts = new Map<Value, Part>()

  /** The chips in the page, in its order: a caller may draw them in any. */
  function chipsDrawn(): { item: Value; element: HTMLElement }[] {
    const all: { item: Value; element: HTMLElement }[] = []
    for (const [item, element] of chipElements) if (element.isConnected) all.push({ item, element })
    return all.sort((a, b) =>
      a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    )
  }

  /** Whether focus moving to `to` stays among the combobox's chips. */
  const toChip = (to: Node | null) =>
    to !== null && chipsDrawn().some(({ element }) => element === to || element.contains(to))
  // The text the list was last filtered by.
  let asked = ""
  // The items' own box, when the popup holds more than items.
  const boxed = signal<HTMLElement | undefined>(undefined)
  // Where the input is: in the popup, or in the page beside it. Neither while it is in
  // neither, which is a popup with its input inside that has not opened yet.
  const inside = signal(false)
  const beside = signal(false)
  // Whether the page has mounted: until then (on a server, before hydration) nothing says
  // where the input is, and the button is drawn as the one beside an input.
  const settled = signal(false)
  /** The button is the combobox: its input is in the popup, or is not in the page yet. */
  const alone = computed(() => !inline && (inside.get() || (settled.get() && !beside.get())))
  // Whether focus goes back to the button as the popup closes: not when it left by itself.
  let back = true
  const auto = () => Boolean(props.peek().autoHighlight)
  // Drawn from data, the items left come into the page after the text has changed: the first
  // of them is highlighted once they have.
  let awaited = false

  /** Highlights the first item, once the page holds the items that are left and no other. */
  function arrive() {
    if (!awaited) return
    const wanted = new Set(itemsLeft().map((each) => each.value))
    for (const each of wanted) if (!rows.has(each)) return
    for (const each of whole.peek()) {
      for (const item of each.type === "group" ? each.items : [each]) {
        if (!wanted.has(item.value) && rows.has(item.value)) return
      }
    }
    awaited = false
    list.highlight(list.rows()[0], true)
  }

  /** Reads where the input is, once it or what it may be in is in the page or has left. */
  function sort() {
    if (inline) return
    const within = Boolean(input && (positioner?.contains(input) || popup?.contains(input)))
    const entered = within && !inside.peek()
    batch(() => {
      inside.set(within)
      beside.set(Boolean(input) && !within)
    })
    // In the popup the text is only what is looked for: it starts empty, unless it was given.
    const own = props.peek()
    if (
      entered &&
      !free &&
      own.inputValue === undefined &&
      own.defaultInputValue === undefined &&
      inputValue.peek() !== ""
    ) {
      inputValue.set("", details("input-reset"))
    }
    // What the popup is placed against may be another element now.
    placement.position.refresh()
  }

  /**
   * Writes the rest of the first item that begins with what was just typed after it, selected,
   * so typing on replaces it. Asked again as the list follows the text and as items come into
   * the page: the item may not be drawn yet when the key is heard.
   */
  function complete(again = false) {
    const done = completed
    // The text was given back by a caller who holds it, and its highlight moved: the item the
    // input shows is still the one highlighted.
    if (again && done && done.typed === inputValue.peek() && input?.value === done.text) {
      if (completedRow) list.highlight(completedRow, true)
    }
    const text = pending
    if (text === undefined || !input) return
    // Typed on, or the caret moved, since: that is no longer what to complete.
    if (input.value !== text || input.selectionEnd !== text.length)
      return void (pending = undefined)
    const lower = text.toLowerCase()
    const filter = props.peek().filter
    // In the page, in its order, those the text is about to hide included: a caller who holds
    // the text has not given it back yet, and the rows still follow the text before it.
    for (const element of popup?.querySelectorAll('[role="option"]') ?? []) {
      const row = rowOf.get(element)
      if (!row || row.disabled()) continue
      const label = row.label()
      if (!label.toLowerCase().startsWith(lower)) continue
      if (filter !== null && !(filter ?? holds)(label, text)) continue
      pending = undefined
      const full = text + label.slice(text.length)
      completed = { typed: text, text: full }
      completedRow = row
      input.value = full
      input.setSelectionRange(text.length, full.length, "forward")
      // Shown now if the caller holds this text already; else as it gives it back.
      if (inputValue.peek() === text) recomplete()
      list.highlight(row, true)
      return
    }
  }

  /** Makes the completion the input shows the text: it is the caller's now. */
  function keepCompletion(by: ChangeDetails) {
    const done = completed
    pending = undefined
    if (!done || input?.value !== done.text) return void (completed = undefined)
    inputValue.set(done.text, by)
    // Refused, what was typed is left.
    if (by.canceled) return dropCompletion()
    completed = undefined
    input.setSelectionRange(done.text.length, done.text.length)
  }

  /** Takes the completion out of the input: what was typed is left. */
  function dropCompletion() {
    const done = completed
    pending = undefined
    if (!done) return
    completed = undefined
    if (input && input.value === done.text) input.value = inputValue.peek()
    recomplete()
  }

  /**
   * Closes, and puts the input back to what is chosen: `text` when that was only just asked
   * for. With `keep`, what was typed stays: focus went to one of the chips.
   */
  function shut(by: ChangeDetails, text?: string, keep = false) {
    if (inline) return
    // Focus that left by itself is where the person put it.
    back = by.reason !== "focus-out"
    open.set(false, by)
    if (by.canceled) return
    typed.set(false)
    if (keep) return
    if (free) {
      // What was typed stays; an item chosen is written in its place.
      if (text === undefined) return dropCompletion()
      completed = undefined
      pending = undefined
      inputValue.set(text, details("item-press", by.event))
      // The completion that was selected is the text now: the caret goes after it.
      if (input?.value === text) input.setSelectionRange(text.length, text.length)
      return
    }
    // With several, the text is not a value: it goes. As it does from an input in the popup,
    // which is only what was looked for.
    const next = multiple || inside.peek() ? "" : (text ?? labelOf(value.peek()))
    inputValue.set(next, details("input-reset", by.event))
  }

  function setOpen(next: boolean, by: ChangeDetails) {
    if (inline) return
    if (next) {
      if (!disabled.peek()) open.set(true, by)
    } else shut(by)
  }

  function setValue(next: Value | null, by: ChangeDetails) {
    value.set(next, by)
    if (!by.canceled) member?.changed(next === null ? "" : sent(next))
  }

  // As a sheet the list is modal: the page behind it inert, its scroll held, Tab kept inside.
  // As a popup focus stays where the combobox puts it.
  const sheet = createSheet(
    open,
    () => (inline ? {} : props.get()),
    (by) => setOpen(false, by)
  )
  const sheetFocus = popupFocus("none")
  const layer = createPopup({
    open,
    setOpen,
    kind: "combobox",
    modal: () => sheet.on.peek(),
    hold: lockPage,
    mode: sheet.on,
    focus: (element, context) => (context.modal ? sheetFocus(element, context) : NOTHING),
    placement,
    // Under the chips' box when the input is in one, and as wide; against the button when the
    // input is inside the popup, which cannot be placed against what it holds.
    anchor: () => (beside.peek() ? (chips ?? input) : trigger),
    // Focus is the input's throughout. Its button opens the list too.
    branches: () => [trigger, input],
  })

  function choose(item: Value, text: string, event: Event) {
    if (readOnly.peek()) return
    const by = details("item-press", event)
    if (multiple) {
      // Added, or taken away; the list stays open for the next, and what was typed has been
      // used.
      const has = values.peek().some((each) => Object.is(each, item))
      setValues(has ? without(item) : [...values.peek(), item], by)
      if (!by.canceled) inputValue.set("", details("item-press", event))
      return
    }
    // A list that is always there has nothing to close, and its input keeps what was typed.
    if (inline) return setValue(item, by)
    batch(() => {
      setValue(item, by)
      // What was asked for, not what is read back: a caller who holds the value answers later.
      shut(details("item-press", event), by.canceled ? undefined : text)
    })
  }

  /**
   * The highlight a list opens on: the chosen item; or, opened by typing and asked to
   * (`autoHighlight`), the first shown.
   */
  function land() {
    highlightOnOpen()
    complete()
  }

  /** Moves the highlight as what is typed changes: onto the first item still shown, if asked. */
  function follow(text: string) {
    if (text === asked || !(inline || open.peek())) return void (asked = text)
    asked = text
    // Typed at, nothing is highlighted unless asked to; a suggestion, only for text.
    awaited = false
    if (!auto() || (free && text.trim() === "")) return list.highlight(undefined)
    // Drawn from data, the items for this text are not in the page yet.
    if (fromData) return ((awaited = true), arrive())
    if (list.collection()) list.move("first")
    else list.highlight(list.rows()[0], true)
  }

  function highlightOnOpen() {
    const first = typed.peek() && auto()
    if (free || multiple) {
      // No one value to open on. Without `autoHighlight` Enter is the typed text's until an
      // arrow goes to an item.
      if (!first) return
      if (list.collection()) list.move("first")
      else list.highlight(list.rows()[0], true)
      return
    }
    // Typed at, and not asked to highlight: nothing is.
    if (typed.peek() && !first) return list.highlight(undefined)
    const every = list.collection()
    if (every) {
      const one = value.peek()
      const at = one === null ? -1 : (every.indexOf?.(one) ?? -1)
      if (at >= 0) list.goto(at)
      else if (first) list.move("first")
      return
    }
    const all = list.rows()
    const current = value.peek()
    const own = current === null ? undefined : rows.get(current)
    const row = own && all.includes(own) ? own : first ? all[0] : undefined
    list.highlight(row, true)
  }

  return {
    open,
    mounted: inline ? computed(() => true) : layer.mounted,
    value,
    inputValue,
    empty,
    named: computed(() => name.get() !== undefined),
    clearable: computed(
      () => value.get() !== null || values.get().length > 0 || inputValue.get() !== ""
    ),
    values,
    multiple,
    shown: showing,
    entries(of) {
      fromData = true
      if (!of) return left
      let found = inGroup.get(of.key)
      if (!found) {
        found = computed(() => {
          const group = left.get().find((each) => each.key === of.key)
          return group?.type === "group" ? group.items : NONE
        })
        inGroup.set(of.key, found)
      }
      return found
    },
    chips: {
      props: EMPTY,
      attach(element) {
        chips = element
        placement.position.refresh()
        return () => {
          if (chips === element) chips = undefined
        }
      },
    },
    chip(item) {
      let part = chipParts.get(item)
      if (part) return part
      part = {
        props: computed(() => ({
          // Reached by the arrows from the input, as the tags of a tags input are.
          tabindex: disabled.get() ? undefined : "-1",
          onKeyDown(event: KeyboardEvent) {
            // Its own keys only: not those of a button inside it.
            if (event.target !== event.currentTarget || disabled.peek()) return
            const all = chipsDrawn()
            const at = all.findIndex((each) => each.element === event.currentTarget)
            if (at < 0) return
            const rtl = directionOf(event.currentTarget as Element, around.direction) === "rtl"
            const to = (index: number) => {
              event.preventDefault()
              const next = all[index]
              if (next) next.element.focus()
              else input?.focus()
            }
            if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) to(Math.max(0, at - 1))
            else if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) to(at + 1)
            else if (event.key === "Home") to(0)
            else if (event.key === "End" || event.key === "Escape") to(all.length)
            else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              // Back to the input, with the list open.
              to(all.length)
              setOpen(true, details("list-navigation", event))
            } else if (event.key === "Backspace" || event.key === "Delete") {
              event.preventDefault()
              if (readOnly.peek()) return
              // Focus goes to the chip that takes its place: the one before for Backspace, the
              // one after for Delete, and the input when there is none.
              const before = all[at - 1]
              const after = all[at + 1]
              const next = event.key === "Backspace" ? (before ?? after) : (after ?? before)
              const by = details("chip-remove-press", event)
              setValues(without(all[at]!.item), by)
              if (!by.canceled) (next?.element ?? input)?.focus()
            } else if (printable(event)) {
              // A letter is typed into the input: focus goes there before the browser writes it.
              input?.focus()
            }
          },
          onBlur(event: FocusEvent) {
            const to = event.relatedTarget as Node | null
            if (to !== input && !toChip(to)) member?.focused(false)
          },
        })),
        attach(element) {
          chipElements.set(item, element)
          return () => {
            if (chipElements.get(item) === element) chipElements.delete(item)
          }
        },
      }
      chipParts.set(item, part)
      return part
    },
    chipRemove(item) {
      return {
        props: computed(() => ({
          type: "button",
          // The input is the stop; Backspace in it takes the last value away.
          tabindex: "-1",
          disabled: flag(disabled.get()),
          "data-disabled": flag(disabled.get()),
          // Focus stays in the input.
          onMouseDown: (event: Event) => event.preventDefault(),
          onClick(event: Event) {
            if (readOnly.peek()) return
            setValues(without(item), details("chip-remove-press", event))
            input?.focus({ preventScroll: true })
          },
        })),
        attach: () => NOTHING,
      }
    },
    setOpen,
    setValue,
    positioning: placement.positioning,
    mount() {
      if (inline) return NOTHING
      // An input in the popup has focus while the popup is open, and the button after.
      let within = false
      const stops = [
        layer.start(),
        effect(() => {
          const on = open.get() && inside.get()
          untracked(() => {
            if (on) {
              within = true
              back = true
              return input?.focus({ preventScroll: true })
            }
            if (!within) return
            within = false
            const page = trigger?.ownerDocument
            const active = page?.activeElement
            // Only when focus is still in the popup, or lost to the page: a person who moved
            // it keeps it.
            const lost =
              !active ||
              active === page?.body ||
              Boolean(positioner?.contains(active)) ||
              Boolean(popup?.contains(active))
            if (back && lost) trigger?.focus({ preventScroll: true })
          })
        }),
      ]
      // After the parts that are in the page have attached.
      queueMicrotask(() => settled.set(true))
      return () => {
        for (const stop of stops.reverse()) stop()
      }
    },
    selected: chosen,
    input: {
      props: computed(() => ({
        role: "combobox",
        // In a field, the id its label is `for`.
        ...defaultId(field?.controlId),
        // What it says, so a server draws it. In a page the core writes it too.
        value: written.get(),
        autocomplete: "off",
        // Read only, it takes nothing typed: no completion is offered.
        "aria-autocomplete": readOnly.get() ? "none" : (around.completion?.() ?? "list"),
        "aria-haspopup": "listbox",
        ...(inline
          ? { "aria-expanded": "true", "aria-controls": boxed.get() ? listId : popupId }
          : layer.expanded(boxed.get() ? listId : popupId)),
        "aria-activedescendant":
          inline || open.get() ? list.highlighted.get()?.element()?.id : undefined,
        form: props.get().form,
        disabled: flag(disabled.get()),
        readonly: flag(readOnly.get()),
        "aria-readonly": readOnly.get() ? "true" : undefined,
        "aria-required": props.get().required ? "true" : undefined,
        ...field?.aria(),
        ...field?.state(),
        "data-disabled": flag(disabled.get()),
        "data-readonly": flag(readOnly.get()),
        onFocus: () => member?.focused(true),
        onInput(event: Event) {
          const text = (event.currentTarget as HTMLInputElement).value
          // The browser takes no key for it, but a script may still write it: put back.
          if (readOnly.peek()) return void (input && (input.value = inputValue.peek()))
          const by = details("input-change", event)
          // A key that wrote a letter is completed; not a deletion, a paste, or a word being
          // composed (an input method's), which the completion would be written into.
          const native = ((event as { nativeEvent?: Event }).nativeEvent ?? event) as InputEvent
          pending =
            completing() && native.inputType === "insertText" && !native.isComposing
              ? text
              : undefined
          // Anything but a letter typed takes the completion away: what is left is what the
          // key left. A letter replaces it with the next, or leaves it to the text.
          if (pending === undefined && completed) {
            completed = undefined
            recomplete()
          }
          typed.set(true)
          inputValue.set(text, by)
          // Emptied, nothing is chosen any more. In the popup it is only what is looked for.
          if (text === "" && value.peek() !== null && !inline && !multiple && !inside.peek()) {
            setValue(null, details("input-clear", event))
          }
          if (!inline && !open.peek()) setOpen(true, details("input-change", event))
          complete()
        },
        onClick(event: Event) {
          if (free && !free()) return
          if (!inline && !open.peek()) setOpen(true, details("trigger-press", event))
        },
        onKeyDown(event: KeyboardEvent) {
          const control = event.currentTarget as HTMLInputElement
          if (multiple && !event.isComposing && values.peek().length > 0) {
            const last = chipsDrawn().at(-1)
            const rtl = directionOf(control, around.direction) === "rtl"
            const atStart = control.selectionStart === 0 && control.selectionEnd === 0
            // From the start of the input, back onto the last chip: Backspace there takes it
            // away, so a held key does not eat the chips one after another unseen.
            if (
              last &&
              atStart &&
              (event.key === "Backspace" || event.key === (rtl ? "ArrowRight" : "ArrowLeft"))
            ) {
              event.preventDefault()
              return last.element.focus()
            }
            // With no chip drawn, Backspace in the empty input takes the last value away.
            if (!last && event.key === "Backspace" && control.value === "" && !readOnly.peek()) {
              return setValues(values.peek().slice(0, -1), details("chip-remove-press", event))
            }
          }
          // In the popup, which is at the page's end, Tab would go on from there and leave the
          // page: it goes on from the button, as from a dialog that closes, its default left to
          // the browser once focus is on the button.
          if (event.key === "Tab" && inside.peek() && open.peek() && trigger) {
            trigger.focus({ preventScroll: true })
            return setOpen(false, details("focus-out", event))
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            if (!inline && !open.peek()) return setOpen(true, details("list-navigation", event))
            list.move(event.key === "ArrowDown" ? 1 : -1)
            if (!completing()) return
            // The item the arrows are on is written into the input; what was typed stays the
            // text the list is filtered by.
            const row = list.highlighted.peek()
            if (!row || !input) return dropCompletion()
            pending = undefined
            const label = row.label()
            completed = { typed: inputValue.peek(), text: label }
            completedRow = row
            input.value = label
            recomplete()
            return input.setSelectionRange(label.length, label.length)
          }
          if (event.key === "Enter" && (inline || open.peek())) {
            // Not the form's while the list is open: the highlighted item's own press, which a
            // caller's handler on it hears too. With none, nothing.
            const row = list.highlighted.peek()
            const on = row && list.rows().includes(row)
            // Read only, Enter chooses nothing: on an item it is not the form's either, and
            // with none it is the form's as it would be with the list closed.
            if (readOnly.peek()) return void (on && event.preventDefault())
            // With no suggestion taken, Enter is the form's, with the text as typed.
            if (free && !on) {
              keepCompletion(details("input-submit", event))
              return setOpen(false, details("input-submit", event))
            }
            event.preventDefault()
            if (on) row.element()?.click()
          }
        },
        onBlur(event: FocusEvent) {
          const to = event.relatedTarget as Node | null
          if (popup?.contains(to) || positioner?.contains(to) || trigger?.contains(to)) return
          // Onto a chip, focus is still the combobox's: the list closes, what was typed stays.
          if (toChip(to)) {
            if (open.peek()) shut(details("focus-out", event), undefined, true)
            return
          }
          member?.focused(false)
          // Tab keeps what the completion wrote.
          keepCompletion(details("input-blur", event))
          if (open.peek()) setOpen(false, details("focus-out", event))
        },
      })),
      attach(element) {
        input = element as HTMLInputElement
        const one = value.peek()
        member = field?.join({
          element,
          focus: () => element.focus(),
          kind: "select",
          required: () => Boolean(props.peek().required),
          value: free
            ? inputValue.peek()
            : multiple
              ? held(values.peek())
              : one === null
                ? ""
                : sent(one),
        })
        sort()
        const stops = [
          () => {
            member?.leave()
            member = undefined
          },
          inForm.attach(element),
          // The labels may come after the value (items that are loaded, a custom element's
          // properties set after it began): a text that named the value by what was known then
          // names it by what is known now.
          effect(() => {
            const { items, itemToStringLabel } = props.get()
            untracked(() => {
              const before = known
              known = { items, itemToStringLabel }
              const current = value.peek()
              const same = before.items === items && before.itemToStringLabel === itemToStringLabel
              if (same || free || multiple || current === null || inside.peek()) return
              const was = givenLabel(current, before) ?? labels.get(current) ?? plainLabel(current)
              const now = labelOf(current)
              if (was !== now && inputValue.peek() === was) {
                inputValue.set(now, details("input-reset"))
              }
            })
          }),
          // The input's text is the core's to write: a framework that held it would write it
          // in its own time, after what was typed since.
          effect(() => {
            const onScreen = written.get()
            if (input && input.value !== onScreen) input.value = onScreen
            // Its text is its value: the field hears every change of it, not a completion.
            const text = inputValue.get()
            if (free && text !== told) member?.changed((told = text))
          }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
          if (input === element) input = undefined
          sort()
        }
      },
    },
    trigger: {
      props: computed(() => {
        const own = alone.get()
        return {
          type: "button",
          // Beside an input, that is the stop and the button is for a pointer. With its input
          // in the popup the button is the combobox: a stop, and what opens a dialog.
          tabindex: own ? undefined : "-1",
          role: own ? "combobox" : undefined,
          "aria-haspopup": own ? "dialog" : "listbox",
          "aria-expanded": own ? String(open.get()) : undefined,
          "aria-controls": layer.mounted.get() ? popupId : undefined,
          // Said by the combobox: beside an input, that is the input.
          "aria-readonly": own && readOnly.get() ? "true" : undefined,
          "data-popup-open": flag(open.get()),
          disabled: flag(disabled.get()),
          "data-disabled": flag(disabled.get()),
          "data-readonly": flag(readOnly.get()),
          // Focus stays in an input beside it.
          onMouseDown(event: Event) {
            if (!alone.peek()) event.preventDefault()
          },
          onClick(event: Event) {
            setOpen(!open.peek(), details("trigger-press", event))
            if (!alone.peek()) input?.focus({ preventScroll: true })
          },
          onKeyDown(event: KeyboardEvent) {
            if (!alone.peek() || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return
            event.preventDefault()
            setOpen(true, details("list-navigation", event))
          },
        }
      }),
      attach(element) {
        trigger = element
        placement.position.refresh()
        return () => {
          if (trigger === element) trigger = undefined
        }
      },
    },
    clear: {
      props: computed(() => ({
        type: "button",
        // The input is the stop; the button is for a pointer.
        tabindex: "-1",
        disabled: flag(disabled.get()),
        "data-disabled": flag(disabled.get()),
        // Focus stays in the input.
        onMouseDown: (event: Event) => event.preventDefault(),
        onClick(event: Event) {
          if (readOnly.peek()) return
          if (multiple) setValues([], details("clear-press", event))
          else setValue(null, details("clear-press", event))
          inputValue.set("", details("clear-press", event))
          input?.focus({ preventScroll: true })
        },
      })),
      attach: () => NOTHING,
    },
    positioner: {
      props: computed(() => {
        const own = { ...layer.positioner.props.get(), ...sheet.state() }
        // A sheet is on no side of what opened it.
        return sheet.on.get() ? { ...own, "data-side": undefined, "data-align": undefined } : own
      }),
      attach(element) {
        positioner = element
        sort()
        const detach = sheet.positioner(element, (each) => layer.positioner.attach(each))
        return () => {
          detach()
          if (positioner === element) positioner = undefined
          sort()
        }
      },
    },
    popup: {
      props: computed(() => ({
        id: popupId,
        // With a list inside, that is the listbox: around an input and a list, this is a dialog.
        role: boxed.get() ? (inside.get() ? "dialog" : "presentation") : "listbox",
        // Said by the listbox: its options can be gone through, and none chosen.
        "aria-readonly": !boxed.get() && readOnly.get() ? "true" : undefined,
        // Always in the page, it is neither open nor closed, and is placed by the page.
        ...(inline
          ? {}
          : { ...layer.state(), ...(sheet.on.get() ? {} : layer.placed()), ...sheet.state() }),
        "data-empty": flag(empty.get()),
        // As a sheet, it is dragged down to close it.
        onPointerDown: sheet.on.get() ? sheet.swipe.press : undefined,
        // A press in the list does not take focus from the input. A press on an input in the
        // popup is the input's own.
        onMouseDown(event: Event) {
          if (!input?.contains(event.target as Node | null)) event.preventDefault()
        },
      })),
      attach(element) {
        popup = element
        listed.set(true)
        sort()
        const stops = [
          () => listed.set(false),
          sheet.swipe.attach(element),
          list.attach(element),
          inline ? NOTHING : layer.attach(element),
          // Each time it opens, once its items are in the page.
          effect(() => {
            if (inline) return
            if (!open.get()) {
              awaited = false
              return untracked(() => list.highlight(undefined))
            }
            queueMicrotask(() => {
              if (popup === element && open.peek()) land()
            })
          }),
          // And as what is typed changes, on the first item still shown. Followed here, not
          // done where the key is heard: a caller who holds the text gives it back later, and
          // the list is filtered by what the caller has given.
          effect(() => {
            const text = query.get()
            untracked(() => {
              follow(text)
              // A completion highlights its item, after the text's own highlight.
              complete(true)
            })
          }),
          // As items come into the page and leave it.
          effect(() => {
            registered.get()
            untracked(() => {
              arrive()
              complete()
            })
          }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
          if (popup === element) popup = undefined
          sort()
        }
      },
    },
    list: {
      props: computed(() => ({
        id: listId,
        role: "listbox",
        "aria-readonly": readOnly.get() ? "true" : undefined,
        "data-empty": flag(empty.get()),
      })),
      attach(element) {
        boxed.set(element)
        return () => {
          if (boxed.peek() === element) boxed.set(undefined)
        }
      },
    },
    // Said when it comes into the page, where a reader's software follows a status.
    emptyPart: { props: STATUS, attach: () => NOTHING },
    status: STATUS_PART,
    hidden: {
      props: computed(() => {
        const current = value.get()
        const first = values.get()[0]
        return {
          type: "hidden",
          // With several and none chosen, nothing is sent.
          name: multiple && first === undefined ? undefined : name.get(),
          form: props.get().form,
          value: multiple
            ? first === undefined
              ? ""
              : sent(first)
            : current === null
              ? ""
              : sent(current),
          disabled: flag(disabled.get()),
        }
      }),
      attach(element) {
        if (!multiple) return NOTHING
        // One input for each value: the first is this one, the rest the core's own to draw,
        // after it.
        return restInputs(element, () => ({
          rest: values.get().slice(1).map(sent),
          name: name.get(),
          form: props.get().form,
          disabled: disabled.get(),
        }))
      },
    },
    itemIndicator: () => ({ props: INDICATOR, attach: () => NOTHING }),
    backdrop: {
      props: computed(() => ({ role: "presentation", ...layer.state(), ...sheet.state() })),
      attach(element) {
        const stops = [sheet.swipe.also(element), layer.attachBackdrop(element)]
        return () => {
          for (const stop of stops.reverse()) stop()
        }
      },
    },
    groupLabel: LABEL,
    separator: SEPARATOR,
    group(groupId) {
      const members = new Set<Shown>()
      const joined = signal(0)
      const labelled = signal(false)
      const labelId = `${groupId}-label`
      const any = computed(() => {
        joined.get()
        // Before any item is known (a server draws the group first), it is not hidden.
        if (members.size === 0) return true
        for (const each of members) if (each.shown.get()) return true
        return false
      })
      const group: Members = {
        members,
        joined,
        root: {
          props: computed(() => ({
            id: groupId,
            role: "group",
            "aria-labelledby": labelled.get() ? labelId : undefined,
            hidden: flag(!any.get()),
          })),
          attach: () => NOTHING,
        },
        label: {
          props: computed(() => ({ id: labelId, role: "presentation" })),
          attach() {
            labelled.set(true)
            return () => labelled.set(false)
          },
        },
      }
      return group
    },
    item(item, options, group) {
      const selected = chosen(item)
      const within = group as Members | undefined
      // Its text is known once it is in the page.
      const drawn = signal(0)
      // A label given, or one the value has of its own, before the text in the markup.
      const named = () => options().label ?? ownLabel(item, props.peek().itemToStringLabel)
      const row: ListRow = list.row(() => ({
        disabled: options().disabled,
        label: named(),
        hidden: !visible.peek(),
        index: options().index,
      }))
      const visible: ReadonlySignal<boolean> = computed(() => {
        drawn.get()
        const text = query.get()
        const filter = props.get().filter
        // In a collection the caller has filtered: every row that is drawn is shown. Drawn
        // from data, the combobox has: what is in the page is what is left.
        if (filter === null || text === "" || props.get().virtualized || fromData) return true
        // Not through the row: its options ask whether it is shown, which is this.
        const element = row.element()
        return (filter ?? holds)(named() ?? (element ? textOf(element) : ""), text)
      })
      const record: Shown = { shown: visible }
      // Counted from when it is made: a server attaches nothing, and must not say "empty".
      shown.add(record)
      within?.members.add(record)
      return {
        props: computed(() => {
          const off = Boolean(options().disabled)
          return {
            id: options().id,
            role: "option",
            "aria-selected": String(selected.get()),
            "aria-disabled": off ? "true" : undefined,
            ...list.place(options().index),
            hidden: flag(!visible.get()),
            "data-selected": flag(selected.get()),
            "data-highlighted": flag(row.active.get()),
            "data-disabled": flag(off),
            onPointerMove(event: PointerEvent) {
              if (pointerMoved(event) && !off && !row.active.peek()) list.highlight(row)
            },
            onClick(event: Event) {
              if (!options().disabled) choose(item, row.label(), event)
            },
          }
        }),
        attach(element) {
          const detach = row.attach(element)
          rows.set(item, row)
          rowOf.set(element, row)
          shown.add(record)
          within?.members.add(record)
          within?.joined.set(within.joined.peek() + 1)
          registered.set(registered.peek() + 1)
          drawn.set(drawn.peek() + 1)
          // A framework may write the text after the element attaches: read it a moment later.
          queueMicrotask(() => {
            if (!element.isConnected) return
            if (labels.get(item) !== row.label()) {
              labels.set(item, row.label())
              learned.set(learned.peek() + 1)
            }
            drawn.set(drawn.peek() + 1)
          })
          return () => {
            detach()
            if (rows.get(item) === row) rows.delete(item)
            shown.delete(record)
            within?.members.delete(record)
            within?.joined.set(within.joined.peek() + 1)
            registered.set(registered.peek() + 1)
          }
        },
      }
    },
  }
}
