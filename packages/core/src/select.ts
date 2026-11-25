import { bindable } from "./bindable.ts"
import type { Field, FieldMembership } from "./field.ts"
import { defaultId, details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { directionOf } from "./direction.ts"
import { batch, computed, effect, keyed, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { createItemAlignment } from "./services/align-item.ts"
import { createFormControl } from "./services/form-control.ts"
import { restInputs } from "./services/hidden-inputs.ts"
import { formValue, itemsOf, labelIn, ownLabel, plainLabel } from "./services/items.ts"
import { lockPage, popupFocus } from "./services/popup-focus.ts"
import { createPopup } from "./services/popup.ts"
import { createSheet } from "./services/sheet.ts"
import type { Presentation } from "./services/sheet.ts"
import { createPresence, presentPart } from "./services/presence.ts"
import type { PresentPart } from "./services/presence.ts"
import { createPlacement } from "./services/position.ts"
import { lockScroll } from "./services/scroll-lock.ts"
import type { PositionOptions } from "./services/position.ts"
import { byPlace } from "./services/list-places.ts"
import { createList, pointerMoved } from "./services/list.ts"
import type { ListCollection, ListRow } from "./services/list.ts"
import { createTypeahead, printable, textOf } from "./services/typeahead.ts"

/**
 * `Multiple` is what `multiple` is given, as Base UI types it: with `true`, `value`,
 * `defaultValue` and `onValueChange` hold the list of chosen values. Each adapter's root
 * infers it from `multiple`; written out, it is `false` when left out, as Base UI's is, and
 * `multiple` alone does not change it.
 */
export interface SelectProps<Value = unknown, Multiple extends boolean | undefined = false> {
  id: string
  /**
   * How the list opens. `"sheet"`: from the bottom edge, not placed against the trigger, modal
   * with a backdrop, swiped down or pressed outside to close. `"auto"`: decided each time it
   * opens, a sheet when the pointer is coarse and the viewport narrower than `sheetBelow`.
   * Default `"popup"`.
   */
  presentation?: Presentation | undefined
  /**
   * With `presentation: "auto"`: the viewport's width, in CSS pixels, under which a coarse
   * pointer opens a sheet. Default 640.
   */
  sheetBelow?: number | undefined
  /**
   * The chosen value; `null` is "none". With `multiple`, the chosen values, in the order they
   * were chosen.
   */
  value?: (Multiple extends true ? readonly Value[] : Value | null) | undefined
  /**
   * The value it starts with (with `multiple`, the values), when the caller does not hold
   * `value`. Read once.
   */
  defaultValue?: (Multiple extends true ? readonly Value[] : Value | null) | undefined
  /**
   * Heard as a value is about to be chosen (with `multiple`, added or taken away, with the
   * values there would then be): `details.cancel()` keeps it as it was.
   */
  onValueChange?:
    | ((value: Multiple extends true ? Value[] : Value | null, details: ChangeDetails) => void)
    | undefined
  /** Whether the list is open, when the caller holds it. */
  open?: boolean | undefined
  /** Whether the list starts open, when the caller does not hold `open`. Read once. */
  defaultOpen?: boolean | undefined
  /** Heard as the list is about to open or close: `details.cancel()` keeps it as it was. */
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  /** Disabled: it cannot be changed. */
  disabled?: boolean | undefined
  /**
   * Shown as it is, focusable, not changeable: the list still opens to be read, and no item
   * can be chosen. Its value is still submitted with the form.
   */
  readOnly?: boolean | undefined
  /** In a field, "none" is then wrong. */
  required?: boolean | undefined
  /** With a name, the value is submitted with the form around it. */
  name?: string | undefined
  /** The id of the form the control belongs to, when it is not inside it. */
  form?: string | undefined
  /**
   * The labels of the values, for the trigger to show before the list has ever been opened: a
   * list of values with their labels, or, for values that are text, the labels by value
   * (`{ apple: "Apple" }`). Not needed for the list itself: its items are read from the markup.
   */
  items?: readonly { value: Value; label: string }[] | Readonly<Record<string, string>> | undefined
  /**
   * For values that are objects: the text the trigger shows for one, and what typing matches
   * an item by when it gives no `label`. Without it, an object's own `label` names it, then the
   * label `items` gives it, then the item's text in the markup.
   */
  itemToStringLabel?: ((value: Value) => string) | undefined
  /**
   * For values that are objects: the text the form is sent for one. Without it, the `value` of
   * an object shaped `{ value, label }` is sent, and any other object as JSON.
   */
  itemToStringValue?: ((value: Value) => string) | undefined
  /**
   * Several values: an item chosen is added, chosen again taken away, and the list stays open.
   * `value`, `defaultValue` and `onValueChange` then hold a list. Read once.
   */
  multiple?: boolean | undefined
  /**
   * With `multiple`: the chosen values.
   * @deprecated Base UI's shape is `value` holding the list, which wins when both are given.
   */
  values?: readonly Value[] | undefined
  /**
   * With `multiple`: the values it starts with.
   * @deprecated Base UI's shape is `defaultValue` holding the list, which wins when both are
   * given.
   */
  defaultValues?: readonly Value[] | undefined
  /**
   * With `multiple`: heard as a value is about to be added or taken away.
   * @deprecated Base UI's shape is `onValueChange` told the list, the one called when both are
   * given.
   */
  onValuesChange?: ((values: Value[], details: ChangeDetails) => void) | undefined
  /**
   * Every row, when only some are in the page (a virtualizer draws the ones in view). Each item
   * is then given its `index`.
   */
  virtualized?: ListCollection | undefined
}

export interface SelectItemOptions {
  /** Disables this item: it cannot be chosen, and the arrows pass over it. */
  disabled?: boolean
  /** What typeahead matches and the trigger shows; the item's text when left out. */
  label?: string
  /** Its place among all the rows, in a virtualized list. */
  index?: number
}

/** What a select's value part shows: what is chosen, and how it is named. */
export interface SelectShown<Value = unknown> {
  /** The chosen value; `null` while nothing is chosen, and with `multiple`. */
  readonly value: Value | null
  /**
   * What the part says: the chosen value's label, or with `multiple` every chosen label with
   * ", " between; `undefined` while nothing is chosen.
   */
  readonly label: string | undefined
  /** Every chosen value, in the items' order: one or none without `multiple`. */
  readonly values: readonly Value[]
  /** The label of each of `values`. */
  readonly labels: readonly string[]
}

export interface Select<Value = unknown> {
  readonly open: ReadonlySignal<boolean>
  readonly mounted: ReadonlySignal<boolean>
  readonly value: ReadonlySignal<Value | null>
  /** Whether it holds several values. Read once, when the select is made. */
  readonly multiple: boolean
  /** With `multiple`: the chosen values, in the order they were chosen. */
  readonly values: ReadonlySignal<readonly Value[]>
  /**
   * What the value part says: the chosen value's label, or with `multiple` the chosen labels
   * with ", " between, in the items' order. `undefined` while nothing is chosen.
   */
  readonly label: ReadonlySignal<string | undefined>
  /** What is chosen and how it is named, for a value part its caller draws. */
  readonly shown: ReadonlySignal<SelectShown<Value>>
  /** Whether the select has a name, its own or its field's: whether its hidden input is drawn. */
  readonly named: ReadonlySignal<boolean>
  setOpen(open: boolean, details: ChangeDetails): void
  setValue(value: Value | null, details: ChangeDetails): void
  /** With `multiple`. */
  setValues(values: readonly Value[], details: ChangeDetails): void
  readonly positioning: Signal<Partial<PositionOptions>>
  /**
   * Whether the list opens over its trigger, the chosen item's text on the trigger's own (as
   * a native select does), where there is room and unless a finger opened it. With `multiple`
   * it is the first chosen item's; with nothing chosen, the first item's, in either mode. Its
   * positioner's adapter writes it here. Off unless asked for. While the list is open over
   * its trigger the page's scroll is held, and a scroll of a box around the trigger closes it
   * (`"ancestor-scroll"`), as a change of the window's size does (`"window-resize"`).
   */
  readonly alignItemWithTrigger: Signal<boolean>
  mount(): () => void
  readonly trigger: Part
  readonly valuePart: Part
  readonly positioner: Part
  readonly popup: Part
  /** What lies over the page behind the list; a press on it closes the list. */
  readonly backdrop: Part
  /**
   * The items' own box inside the popup, when the popup holds more than its items (scroll
   * arrows): it is then the listbox, and what scrolls.
   */
  readonly list: Part
  /** Items that belong together; `id` is its element's, and what its label's is made from. */
  group(id: string): SelectGroup
  /** A label that is in no group: it names nothing, and is valid there. */
  readonly groupLabel: Part
  /** A line between groups. */
  readonly separator: Part
  /** A strip at the list's top or bottom that scrolls it while the pointer moves over it. */
  scrollArrow(direction: "up" | "down"): SelectScrollArrow
  /**
   * The hidden input that submits the value. Rendered only when the select has a name. With
   * `multiple` it is the first value's, and the core draws one more after it for each other.
   */
  readonly input: Part
  /** An item's part. One per item element, with no controller of its own. */
  item(value: Value, options?: () => SelectItemOptions): Part
  /** The part of an item that is its name: what the trigger shows once it is chosen. */
  itemText(value: Value): Part
  /**
   * The mark an item shows while it is chosen: in the page then, and through its exit. Asked for
   * again, a new one: an adapter keeps the one it made.
   */
  itemIndicator(value: Value): PresentPart
  /** Whether `value` is chosen (with `multiple`, one of the chosen), for an item's indicator. */
  selected(value: Value): ReadonlySignal<boolean>
}

/** Items that belong together, named by their label. */
export interface SelectGroup {
  readonly root: Part
  readonly label: Part
}

/** In the page while there is more of the list its way, and through its exit. */
export interface SelectScrollArrow {
  readonly mounted: ReadonlySignal<boolean>
  readonly part: Part
  mount(): () => void
}

const NOTHING = () => {}
const NONE: readonly never[] = []
const NOTHING_SHOWN: SelectShown<never> = {
  value: null,
  label: undefined,
  values: NONE,
  labels: NONE,
}
const alike = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((each, at) => Object.is(each, b[at]))
// How near an end of its scroll a list is taken to be at it, in pixels.
const NEAR = 1
const NO_PROPS = computed(() => ({}))
const LABEL: Part = { props: computed(() => ({ role: "presentation" })), attach: () => NOTHING }
const SEPARATOR: Part = {
  props: computed(() => ({ role: "separator", "aria-orientation": "horizontal" })),
  attach: () => NOTHING,
}

export function createSelect<Value = unknown, Multiple extends boolean | undefined = false>(
  shaped: ReadonlySignal<SelectProps<Value, Multiple>>,
  around: { field?: Field | undefined } = {}
): Select<Value> {
  // Read in either shape: whether it holds a list is known once it is made.
  const props = shaped as unknown as ReadonlySignal<SelectProps<Value, boolean | undefined>>
  const { field } = around
  let member: FieldMembership | undefined
  const id = props.peek().id
  const popupId = `${id}-popup`
  const open = bindable({
    value: () => props.get().open,
    defaultValue: props.peek().defaultOpen ?? false,
    onChange: (next, by) => props.peek().onOpenChange?.(next, by),
  })
  const multiple = Boolean(props.peek().multiple)
  // `undefined` means "not controlled", so "none" is `null` on the way in and out.
  const value = bindable<Value | null>({
    value: () => (multiple ? undefined : (props.get().value as Value | null | undefined)),
    defaultValue: multiple ? null : ((props.peek().defaultValue as Value | null) ?? null),
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  // With `multiple`, Base UI's `value` holding the list first, then the older `values`.
  const asList = (held: unknown) =>
    multiple && Array.isArray(held) ? (held as readonly Value[]) : undefined
  const values = bindable<readonly Value[]>({
    value: () => asList(props.get().value) ?? props.get().values,
    defaultValue: asList(props.peek().defaultValue) ?? props.peek().defaultValues ?? NONE,
    onChange(next, by) {
      const { onValueChange, onValuesChange } = props.peek()
      if (onValueChange) onValueChange([...next], by)
      else onValuesChange?.([...next], by)
    },
    equals: alike,
  })
  /** What the form is sent for a value. */
  const sent = (item: Value) => formValue(item, props.peek().itemToStringValue)
  /** What a field is told the control holds: something, or nothing. */
  const held = (list: readonly Value[]) => list.map(sent).join(",")
  // What a form's reset goes back to: the value the select began with.
  const initial = value.peek()
  const initialValues = values.peek()
  const inForm = createFormControl((event) => {
    const by = details("form-reset", event)
    if (multiple) {
      values.set(initialValues, by)
      // What was asked for, not what is read back.
      return member?.reset(held(by.canceled ? values.peek() : initialValues))
    }
    value.set(initial, by)
    // What was asked for, not what is read back: a caller who holds the value gives it back
    // in their framework's time.
    const next = by.canceled ? value.peek() : initial
    member?.reset(next === null ? "" : sent(next))
  })
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(field?.disabled.get()) || inForm.disabled.get()
  )
  const readOnly = computed(() => Boolean(props.get().readOnly))
  const name = computed(() => props.get().name ?? field?.name.get())
  const placement = createPlacement({ align: "start" })
  const alignItemWithTrigger = signal(false)
  // Whether the list lies over its trigger now, and whether a finger opened it.
  const aligned = signal(false)
  // Whether the positioner is in the page: the trigger says the list's side only then.
  const positioned = signal(false)
  /** The side of the trigger the list is on; `none` over it, and none at all as a sheet. */
  const side = () =>
    sheet.on.get() ? undefined : aligned.get() ? "none" : placement.position.side.get()
  let touched = false
  const fingered = signal(false)
  const alignment = createItemAlignment()
  // As a sheet the list is modal: the page behind it inert, its scroll held, Tab kept inside.
  const sheet = createSheet(
    open,
    () => props.get(),
    (by) => setOpen(false, by)
  )
  const layer = createPopup({
    open,
    setOpen,
    kind: "select",
    // The list moves focus itself, once its rows are in the page; the popup gives it back.
    focus: popupFocus("none"),
    modal: () => sheet.on.peek(),
    hold: lockPage,
    mode: sheet.on,
    placement,
    // Over its trigger, its place is its own: the usual one would take it back.
    following: computed(() => open.get() && !aligned.get()),
  })

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
  /** Whether nothing is chosen: the trigger then shows its placeholder. */
  const none = computed(() => (multiple ? values.get().length === 0 : value.get() === null))
  // The rows are read from the page: nothing re-renders for one to be known.
  const list = createList({
    selector: '[role="option"]',
    places: byPlace(() => props.peek().virtualized),
  })
  const rows = new Map<Value, ListRow>()
  // The labels learned from the markup, so the trigger still names a value once the list is gone.
  const labels = new Map<Value, string>()
  const labelsChanged = signal(0)
  // Each item's text part while it is in the page, and the values a caller's `label` names.
  const texts = new Map<Value, HTMLElement>()
  const explicit = new Set<Value>()
  // With several values: each item's place in the page, learned while the list is in it, so
  // the trigger names what is chosen in the items' order.
  const places = new Map<Value, number>()
  const valueOf = new WeakMap<Element, { item: Value }>()

  let trigger: HTMLElement | undefined
  let popup: HTMLElement | undefined
  // The value part's element: where the trigger says what is chosen.
  let said: HTMLElement | undefined
  // The items' own box, when there is one: the listbox, and what scrolls.
  const listed = signal<HTMLElement | undefined>(undefined)
  const scroller = () => listed.peek() ?? popup
  // Whether there is more of the list above and below what is in view.
  const more = { up: signal(false), down: signal(false) }

  function seen() {
    const box = scroller()
    if (!box) return
    const end = Math.max(0, box.scrollHeight - box.clientHeight)
    more.up.set(box.scrollTop > NEAR)
    more.down.set(box.scrollTop < end - NEAR)
  }

  function learn(item: Value, text: string) {
    if (labels.get(item) === text) return
    labels.set(item, text)
    // Only a chosen value's label is on screen: the others change nothing.
    const on = multiple
      ? values.peek().some((each) => Object.is(each, item))
      : Object.is(value.peek(), item)
    if (on) labelsChanged.set(labelsChanged.peek() + 1)
  }

  /**
   * The label the caller gave a value (`itemToStringLabel`, an object's own, `items`), else
   * the one learned from the markup, else the value.
   */
  const nameOf = (item: Value) =>
    ownLabel(item, props.get().itemToStringLabel) ??
    labelIn(props.get().items, item) ??
    (labels.get(item) || plainLabel(item))

  /**
   * With several values: reads the items' order from the page. A list of which only some rows
   * are in the page says each row's place itself.
   */
  function arrange() {
    if (!multiple || !popup || list.collection()) return
    places.clear()
    let at = 0
    for (const each of popup.querySelectorAll('[role="option"]')) {
      const own = valueOf.get(each)
      if (own) places.set(own.item, at++)
    }
    if (values.peek().length > 1) labelsChanged.set(labelsChanged.peek() + 1)
  }

  /** Values in the items' order: as given in `items`, else as the list has them. */
  function inOrder(chosenNow: readonly Value[]): readonly Value[] {
    if (chosenNow.length < 2) return chosenNow
    const given = itemsOf(props.get().items)
    const every = props.get().virtualized
    const placeOf = (item: Value) => {
      let at: number | undefined
      if (given.length > 0) at = given.findIndex((each) => Object.is(each.value, item))
      else at = every?.indexOf?.(item) ?? places.get(item)
      // One that is not known comes after those that are, in the order it was chosen.
      return at === undefined || at < 0 ? Infinity : at
    }
    const ranked = chosenNow.map((item) => ({ item, at: placeOf(item) }))
    ranked.sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? -1 : 1))
    return ranked.map((each) => each.item)
  }

  // For choosing by a letter while the list is closed: the open list has its own.
  const typeahead = createTypeahead()

  function setOpen(next: boolean, by: ChangeDetails) {
    if (disabled.peek()) return
    // A finger's list is placed beside its trigger: over it, the finger would hide the item.
    if (next) {
      touched = by.source === "touch"
      fingered.set(touched)
    }
    open.set(next, by)
  }

  /** Of these texts, the one that comes first in the page. */
  function firstOf(given: Iterable<HTMLElement | undefined>): HTMLElement | undefined {
    let first: HTMLElement | undefined
    for (const each of given) {
      if (!each?.isConnected) continue
      if (!first || each.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING)
        first = each
    }
    return first
  }

  /**
   * The text the list lines up with the trigger's: the chosen item's (with several values, the
   * first chosen item's), else the first item's.
   */
  function lead(): HTMLElement | undefined {
    const all = multiple ? values.peek() : value.peek() === null ? NONE : [value.peek() as Value]
    // Nothing chosen: the first item. Something chosen that is not in the page: none.
    return firstOf(all.length > 0 ? all.map((each) => texts.get(each)) : texts.values())
  }

  function setValue(next: Value | null, by: ChangeDetails) {
    value.set(next, by)
    if (!by.canceled) member?.changed(next === null ? "" : sent(next))
  }

  function setValues(next: readonly Value[], by: ChangeDetails) {
    values.set(next, by)
    if (!by.canceled) member?.changed(held(next))
  }

  function choose(item: Value, event: Event) {
    // Read-only locks the value, not the list: it opens and is moved through, nothing is chosen.
    if (readOnly.peek()) return
    if (multiple) {
      // Added, or taken away: the list stays open for the next. Its rows may have changed
      // since it opened, and the trigger names what is chosen in their order.
      arrange()
      const now = values.peek()
      const has = now.some((each) => Object.is(each, item))
      return setValues(
        has ? now.filter((each) => !Object.is(each, item)) : [...now, item],
        details("item-press", event)
      )
    }
    batch(() => {
      setValue(item, details("item-press", event))
      setOpen(false, details("item-press", event))
    })
  }

  const shown = computed<SelectShown<Value>>(
    () => {
      labelsChanged.get()
      if (multiple) {
        const ordered = inOrder(values.get())
        if (ordered.length === 0) return NOTHING_SHOWN
        const names = ordered.map(nameOf)
        return { value: null, label: names.join(", "), values: ordered, labels: names }
      }
      const current = value.get()
      if (current === null) return NOTHING_SHOWN
      const text = nameOf(current)
      return { value: current, label: text, values: [current], labels: [text] }
    },
    // A new object each time is not a new thing to show.
    (a, b) =>
      Object.is(a.value, b.value) &&
      a.label === b.label &&
      alike(a.values, b.values) &&
      alike(a.labels, b.labels)
  )
  const label = computed(() => shown.get().label)

  return {
    open,
    mounted: layer.mounted,
    value,
    multiple,
    values,
    label,
    shown,
    named: computed(() => name.get() !== undefined),
    setOpen,
    setValue,
    setValues,
    positioning: placement.positioning,
    alignItemWithTrigger,
    mount: () => layer.start(),
    selected: chosen,
    trigger: {
      props: computed(() => ({
        type: "button",
        // In a field, the id its label is `for`.
        ...defaultId(field?.controlId),
        role: "combobox",
        "aria-haspopup": "listbox",
        ...layer.expanded(listed.get() ? `${id}-list` : popupId),
        // The trigger is the select's element in a form: its reset is heard through it.
        form: props.get().form,
        disabled: flag(disabled.get()),
        "aria-readonly": readOnly.get() ? "true" : undefined,
        "aria-required": props.get().required ? "true" : undefined,
        ...field?.aria(),
        ...field?.state(),
        "data-popup-open": flag(open.get()),
        "data-pressed": flag(open.get()),
        "data-popup-side": layer.mounted.get() && positioned.get() ? side() : undefined,
        "data-placeholder": flag(none.get()),
        "data-disabled": flag(disabled.get()),
        "data-readonly": flag(readOnly.get()),
        "data-required": flag(props.get().required),
        onFocus: () => member?.focused(true),
        onBlur(event: FocusEvent) {
          // Into its own list, focus has not left the select.
          if (!popup?.contains(event.relatedTarget as Node | null)) member?.focused(false)
        },
        onClick: (event: Event) => setOpen(!open.peek(), details("trigger-press", event)),
        onKeyDown(event: KeyboardEvent) {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            setOpen(true, details("trigger-press", event))
          } else if (printable(event) && !open.peek() && !multiple && !readOnly.peek()) {
            // Closed, a letter chooses: only the labels the caller gave are known then. With
            // several values a letter would have to add or take away: it does neither.
            // By the names the trigger would show for them.
            const items = itemsOf(props.peek().items).map((each) => ({
              value: each.value,
              label: nameOf(each.value),
            }))
            const one = value.peek()
            const match = typeahead.match(
              event.key,
              items,
              items.findIndex((each) => Object.is(each.value, one))
            )
            if (match) setValue(match.value, details("typeahead", event))
          }
        },
      })),
      attach(element) {
        trigger = element
        const untrigger = layer.attachTrigger(element)
        const one = value.peek()
        member = field?.join({
          element,
          focus: () => element.focus(),
          kind: "select",
          // With several values: at least one.
          required: () => Boolean(props.peek().required),
          value: multiple ? held(values.peek()) : one === null ? "" : sent(one),
        })
        const leave = inForm.attach(element)
        return () => {
          leave()
          untrigger()
          member?.leave()
          member = undefined
          if (trigger === element) trigger = undefined
        }
      },
    },
    valuePart: {
      props: computed(() => ({ "data-placeholder": flag(none.get()) })),
      attach(element) {
        said = element
        return () => {
          if (said === element) said = undefined
        }
      },
    },
    positioner: {
      props: computed(() => {
        const own = { ...layer.positioner.props.get(), ...sheet.state() }
        // A sheet is on no side of its trigger; over its trigger, the list is on none either.
        if (sheet.on.get()) return { ...own, "data-side": undefined, "data-align": undefined }
        return aligned.get() ? { ...own, "data-side": "none" } : own
      }),
      attach(element) {
        const detach = sheet.positioner(element, (each) => layer.positioner.attach(each))
        positioned.set(true)
        const view = element.ownerDocument.defaultView
        // The window changed: what was measured no longer holds.
        const resized = (event: Event) => {
          if (aligned.peek()) setOpen(false, details("window-resize", event))
        }
        view?.addEventListener("resize", resized)
        let reopened = false
        const stops = [
          detach,
          () => view?.removeEventListener("resize", resized),
          // Over its trigger, it is placed once: while it is open there, the page's scroll is
          // held, and a box around the trigger that scrolls (which that does not hold) closes it.
          effect(() => {
            if (!open.get() || !aligned.get()) return
            const page = element.ownerDocument
            const scrolled = (event: Event) => {
              const box = event.target
              // The page is held; the list's own scroll is inside it, not around the trigger.
              if (box === page || !trigger || !(box as Node).contains?.(trigger)) return
              setOpen(false, details("ancestor-scroll", event))
            }
            page.addEventListener("scroll", scrolled, true)
            const unlock = lockScroll(page)
            return () => {
              page.removeEventListener("scroll", scrolled, true)
              unlock()
            }
          }),
          // Each time it opens, once it has been placed the usual way: its variables are
          // written by then, and its items are in the page.
          effect(() => {
            const isOpen = open.get()
            // A sheet is not placed, over its trigger or anywhere else.
            const wanted = alignItemWithTrigger.get() && !sheet.on.get()
            const ready = placement.position.placed.get() || sheet.on.get()
            untracked(() => {
              // Closing, it stays where it is through its exit.
              if (!isOpen) return void (reopened = true)
              // Placed, its room is known: whether there is more of the list than shows.
              if (ready) seen()
              // Kept in the page and opened again: placed afresh, its trigger may have moved.
              if (!wanted || reopened) {
                reopened = false
                if (aligned.peek()) alignment.clear()
                aligned.set(false)
                if (!wanted) return
              }
              if (!ready || aligned.peek() || touched || !trigger || !popup) return
              aligned.set(
                alignment.place({
                  trigger,
                  positioner: element,
                  popup,
                  scroller: scroller()!,
                  text: lead(),
                  value: said,
                  rtl: directionOf(trigger) === "rtl",
                })
              )
              seen()
            })
          }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
          alignment.clear()
          aligned.set(false)
          positioned.set(false)
        }
      },
    },
    popup: {
      props: computed(() => {
        return {
          id: popupId,
          // With a list inside, that is the listbox.
          role: listed.get() ? "presentation" : "listbox",
          "aria-multiselectable": multiple && !listed.get() ? "true" : undefined,
          "aria-readonly": readOnly.get() && !listed.get() ? "true" : undefined,
          tabindex: "-1",
          ...layer.state(),
          ...(sheet.on.get() ? {} : { ...layer.placed(), "data-side": side() }),
          ...sheet.state(),
          // As a sheet, it is dragged down to close it.
          onPointerDown: sheet.on.get() ? sheet.swipe.press : undefined,
          onKeyDown(event: KeyboardEvent) {
            switch (event.key) {
              case " ":
                // Part of a name that is being typed, not a press.
                if (list.typing()) break
              // falls through
              case "Enter":
                event.preventDefault()
                // The row's own press: what a caller's handler on it hears too.
                return list.highlighted.peek()?.element()?.click()
              case "Tab":
                // The list is one stop: Tab leaves it, and the trigger takes focus back.
                event.preventDefault()
                return setOpen(false, details("focus-out", event))
            }
            list.key(event)
          },
        }
      }),
      attach(element) {
        popup = element
        const scrolled = () => {
          alignment.scrolled()
          seen()
        }
        // A scroll does not come up from the list inside: heard on its way down.
        element.addEventListener("scroll", scrolled, true)
        const stops = [
          () => element.removeEventListener("scroll", scrolled, true),
          sheet.swipe.attach(element),
          list.attach(element),
          layer.attach(element),
          // Each time it opens: the items attach around the list, in an order each framework
          // chooses. Once all have, the chosen one takes focus, or the list itself. Unless it
          // closed in the meantime.
          effect(() => {
            if (!open.get()) return
            queueMicrotask(() => {
              if (popup !== element || !open.peek()) return
              arrange()
              // With several values, the first of them in the items' order.
              const all = multiple ? inOrder(values.peek()) : [value.peek()]
              const every = list.collection()
              const at = every?.indexOf
                ? all.reduce<number>((least, each) => {
                    const place = each === null ? -1 : every.indexOf!(each)
                    return place >= 0 && (least < 0 || place < least) ? place : least
                  }, -1)
                : -1
              // The chosen row may not be in the page: it is asked for by its place.
              if (at >= 0) return list.goto(at)
              const row = all
                .map((each) => (each === null ? undefined : rows.get(each)))
                .find((each) => each?.element() && !each.disabled())
              list.highlight(row, true)
            })
          }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
          if (popup === element) popup = undefined
        }
      },
    },
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
      const labelled = signal(false)
      const labelId = `${groupId}-label`
      return {
        root: {
          props: computed(() => ({
            id: groupId,
            role: "group",
            "aria-labelledby": labelled.get() ? labelId : undefined,
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
    },
    list: {
      props: computed(() => ({
        id: `${id}-list`,
        role: "listbox",
        "aria-multiselectable": multiple ? "true" : undefined,
        "aria-readonly": readOnly.get() ? "true" : undefined,
      })),
      attach(element) {
        listed.set(element)
        return () => {
          if (listed.peek() === element) listed.set(undefined)
        }
      },
    },
    scrollArrow(direction) {
      const up = direction === "up"
      // A finger scrolls the list itself: the arrows are for a pointer that hovers.
      const visible = computed(() => open.get() && more[direction].get() && !fingered.get())
      const presence = createPresence(visible)
      let own: HTMLElement | undefined
      let timer: ReturnType<typeof setTimeout> | undefined
      const stop = () => {
        clearTimeout(timer)
        timer = undefined
      }
      /** A row at a time, for as long as the pointer stays: the next row comes whole into view. */
      function step() {
        const box = scroller()
        if (!box) return stop()
        list.highlight(undefined)
        const end = Math.max(0, box.scrollHeight - box.clientHeight)
        const from = Math.min(end, Math.max(0, box.scrollTop))
        if (up ? from <= NEAR : from >= end - NEAR) return stop()
        const strip = own?.offsetHeight ?? 0
        const options = [...box.querySelectorAll<HTMLElement>('[role="option"]')]
        const top = (row: HTMLElement) =>
          row.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
        let to = up ? 0 : end
        if (up) {
          // The last row that starts above what is in view, under the strip.
          for (const row of options) {
            if (top(row) >= from + strip - NEAR) break
            to = top(row) - strip
          }
        } else {
          for (const row of options) {
            const bottom = top(row) + row.offsetHeight
            if (bottom > from + box.clientHeight - strip + NEAR) {
              to = bottom - box.clientHeight + strip
              break
            }
          }
        }
        box.scrollTop = Math.min(end, Math.max(0, to))
        timer = setTimeout(step, 40)
      }
      return {
        mounted: presence.mounted,
        mount: () => presence.start(),
        part: {
          props: computed(() => {
            const status = presence.status.get()
            return {
              "aria-hidden": "true",
              "data-direction": direction,
              "data-visible": flag(visible.get()),
              "data-side": aligned.get() ? "none" : placement.position.side.get(),
              "data-starting-style": flag(status === "starting"),
              "data-ending-style": flag(status === "ending"),
              style: { position: "absolute" },
              onMouseMove(event: MouseEvent) {
                // A list that scrolls under a pointer at rest sends a move of its own.
                if ((event.movementX === 0 && event.movementY === 0) || timer !== undefined) return
                timer = setTimeout(step, 40)
              },
              onMouseLeave: stop,
            }
          }),
          attach(element) {
            own = element
            const detach = presence.attach(element)
            return () => {
              detach()
              stop()
              if (own === element) own = undefined
            }
          },
        },
      }
    },
    input: {
      props: computed(() => {
        const current = multiple ? values.get()[0] : (value.get() ?? undefined)
        return {
          type: "hidden",
          // With several and none chosen, nothing is sent.
          name: multiple && current === undefined ? undefined : name.get(),
          form: props.get().form,
          value: current === undefined ? "" : sent(current),
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
    itemIndicator: (item) => presentPart(chosen(item), () => ({ "aria-hidden": "true" })),
    itemText(item) {
      return {
        props: NO_PROPS,
        attach(element) {
          texts.set(item, element)
          // A framework may write the text after the element attaches: read it a moment later.
          queueMicrotask(() => {
            if (!explicit.has(item) && element.isConnected) {
              learn(item, textOf(element))
            }
          })
          return () => {
            if (texts.get(item) === element) texts.delete(item)
          }
        },
      }
    },
    item(item, options = () => ({})) {
      const selected = chosen(item)
      // Its name is the one given, or the value's own, else its text part's when it has one,
      // read when it is needed.
      const row = list.row(
        () => {
          const own = options()
          if (own.label !== undefined) return own
          const named = ownLabel(item, props.peek().itemToStringLabel)
          return named === undefined ? own : { ...own, label: named }
        },
        (element) => textOf(texts.get(item) ?? element)
      )
      return {
        props: computed(() => {
          const off = Boolean(options().disabled)
          return {
            role: "option",
            tabindex: "-1",
            "aria-selected": String(selected.get()),
            "aria-disabled": off ? "true" : undefined,
            ...list.place(options().index),
            "data-selected": flag(selected.get()),
            "data-highlighted": flag(row.active.get()),
            "data-disabled": flag(off),
            onPointerMove(event: PointerEvent) {
              if (!pointerMoved(event) || off || row.active.peek()) return
              list.highlight(row, true)
            },
            onClick(event: Event) {
              if (!options().disabled) choose(item, event)
            },
          }
        }),
        attach(element) {
          const detach = row.attach(element)
          rows.set(item, row)
          if (multiple) {
            valueOf.set(element, { item })
            // A row of a list that is only partly in the page says its place itself.
            const index = options().index
            if (index !== undefined) places.set(item, index)
          }
          // A label given names it; else its text part does (which may attach before or after
          // the item, as each framework orders them); else its whole text.
          const given = options().label
          if (given !== undefined) {
            explicit.add(item)
            learn(item, given)
          } else {
            queueMicrotask(() => {
              if (!texts.has(item) && element.isConnected) learn(item, row.label())
            })
          }
          return () => {
            detach()
            if (rows.get(item) === row) rows.delete(item)
          }
        },
      }
    },
  }
}
