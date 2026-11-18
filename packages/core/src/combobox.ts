import { bindable } from "./bindable.ts"
import type { Field, FieldMembership } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { batch, computed, effect, keyed, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { byPlace } from "./services/list-places.ts"
import { createList, pointerMoved } from "./services/list.ts"
import { createFormControl } from "./services/form-control.ts"
import { restInputs } from "./services/hidden-inputs.ts"
import { labelIn } from "./services/items.ts"
import type { ListCollection, ListRow } from "./services/list.ts"
import { createPopup } from "./services/popup.ts"
import { createPlacement } from "./services/position.ts"
import { textOf } from "./services/typeahead.ts"
import type { PositionOptions } from "./services/position.ts"

export interface ComboboxProps<Value = unknown> {
  id: string
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
  /** With a name, the value is submitted with the form around it. */
  name?: string | undefined
  /** The id of the form the control belongs to, when it is not inside it. */
  form?: string | undefined
  /**
   * The labels of the values, for the input to show a value before the list has ever been
   * opened: a list of values with their labels, or, for values that are text, the labels by
   * value (`{ apple: "Apple" }`). Not needed for the list itself: its items are read from the
   * markup.
   */
  items?: readonly { value: Value; label: string }[] | Readonly<Record<string, string>> | undefined
  /**
   * Whether an item is shown for what was typed. Default: its label holds the text, without
   * regard to case. `null`: every item is shown, and the caller draws the ones it wants.
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
  /**
   * The items' own box inside the popup, when the popup holds more than items: an input, a
   * heading. It is then the listbox, and the popup is not.
   */
  readonly list: Part
  /** What is shown when no item is. */
  readonly emptyPart: Part
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
  } = {}
): Combobox<Value> {
  const { field, free } = around
  let member: FieldMembership | undefined
  const inline = Boolean(props.peek().inline)
  const id = props.peek().id
  const popupId = `${id}-popup`
  const listId = `${id}-list`
  // The labels learned from the markup, so the input still names a value once the list is gone.
  const labels = new Map<Value, string>()

  function labelOf(item: Value | null): string {
    if (item === null) return ""
    return labelIn(props.peek().items, item) ?? labels.get(item) ?? String(item)
  }

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
  const held = (list: readonly Value[]) => list.map(String).join(",")
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
    member?.reset(next === null ? "" : String(next))
  })
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(field?.disabled.get()) || inForm.disabled.get()
  )
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
    for (const each of shown) if (each.shown.get()) return false
    return true
  })
  const placement = createPlacement({ align: "start" })

  let input: HTMLInputElement | undefined
  // The text a field was last told, when the text is the value.
  let told = inputValue.peek()
  let trigger: HTMLElement | undefined
  let popup: HTMLElement | undefined
  let positioner: HTMLElement | undefined
  // With several values: the box the chips and the input are in.
  let chips: HTMLElement | undefined
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

  /** Closes, and puts the input back to what is chosen: `text` when that was only just asked for. */
  function shut(by: ChangeDetails, text?: string) {
    if (inline) return
    // Focus that left by itself is where the person put it.
    back = by.reason !== "focus-out"
    open.set(false, by)
    if (by.canceled) return
    typed.set(false)
    if (free) {
      // What was typed stays; an item chosen is written in its place.
      if (text !== undefined) inputValue.set(text, details("item-press", by.event))
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
    if (!by.canceled) member?.changed(next === null ? "" : String(next))
  }

  const layer = createPopup({
    open,
    setOpen,
    kind: "combobox",
    placement,
    // Under the chips' box when the input is in one, and as wide; against the button when the
    // input is inside the popup, which cannot be placed against what it holds.
    anchor: () => (beside.peek() ? (chips ?? input) : trigger),
    // Focus is the input's throughout. Its button opens the list too.
    branches: () => [trigger, input],
  })

  function choose(item: Value, text: string, event: Event) {
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
    chip: () => ({ props: EMPTY, attach: () => NOTHING }),
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
        id: field?.controlId,
        // What it says, so a server draws it. In a page the core writes it too.
        value: inputValue.get(),
        autocomplete: "off",
        "aria-autocomplete": "list",
        "aria-haspopup": "listbox",
        ...(inline
          ? { "aria-expanded": "true", "aria-controls": boxed.get() ? listId : popupId }
          : layer.expanded(boxed.get() ? listId : popupId)),
        "aria-activedescendant":
          inline || open.get() ? list.highlighted.get()?.element()?.id : undefined,
        form: props.get().form,
        disabled: flag(disabled.get()),
        "aria-required": props.get().required ? "true" : undefined,
        ...field?.aria(),
        ...field?.state(),
        "data-disabled": flag(disabled.get()),
        onFocus: () => member?.focused(true),
        onInput(event: Event) {
          const text = (event.currentTarget as HTMLInputElement).value
          const by = details("input-change", event)
          typed.set(true)
          inputValue.set(text, by)
          // Emptied, nothing is chosen any more. In the popup it is only what is looked for.
          if (text === "" && value.peek() !== null && !inline && !multiple && !inside.peek()) {
            setValue(null, details("input-clear", event))
          }
          if (!inline && !open.peek()) setOpen(true, details("input-change", event))
        },
        onClick(event: Event) {
          if (free && !free()) return
          if (!inline && !open.peek()) setOpen(true, details("trigger-press", event))
        },
        onKeyDown(event: KeyboardEvent) {
          // With nothing typed, Backspace takes the last chip away.
          if (
            multiple &&
            event.key === "Backspace" &&
            (event.currentTarget as HTMLInputElement).value === "" &&
            values.peek().length > 0
          ) {
            return setValues(values.peek().slice(0, -1), details("chip-remove-press", event))
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            if (!inline && !open.peek()) return setOpen(true, details("list-navigation", event))
            return list.move(event.key === "ArrowDown" ? 1 : -1)
          }
          if (event.key === "Enter" && (inline || open.peek())) {
            // Not the form's while the list is open: the highlighted item's own press, which a
            // caller's handler on it hears too. With none, nothing.
            const row = list.highlighted.peek()
            const on = row && list.rows().includes(row)
            // With no suggestion taken, Enter is the form's, with the text as typed.
            if (free && !on) return setOpen(false, details("input-submit", event))
            event.preventDefault()
            if (on) row.element()?.click()
          }
        },
        onBlur(event: FocusEvent) {
          const to = event.relatedTarget as Node | null
          if (popup?.contains(to) || positioner?.contains(to) || trigger?.contains(to)) return
          member?.focused(false)
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
                : String(one),
        })
        sort()
        const stops = [
          () => {
            member?.leave()
            member = undefined
          },
          inForm.attach(element),
          // The input's text is the core's to write: a framework that held it would write it
          // in its own time, after what was typed since.
          effect(() => {
            const text = inputValue.get()
            if (input && input.value !== text) input.value = text
            // Its text is its value: the field hears every change of it.
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
          "data-popup-open": flag(open.get()),
          disabled: flag(disabled.get()),
          "data-disabled": flag(disabled.get()),
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
          if (multiple) setValues([], details("clear-press", event))
          else setValue(null, details("clear-press", event))
          inputValue.set("", details("clear-press", event))
          input?.focus({ preventScroll: true })
        },
      })),
      attach: () => NOTHING,
    },
    positioner: {
      props: layer.positioner.props,
      attach(element) {
        positioner = element
        sort()
        const detach = layer.positioner.attach(element)
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
        // Always in the page, it is neither open nor closed, and is placed by the page.
        ...(inline ? {} : { ...layer.state(), ...layer.placed() }),
        "data-empty": flag(empty.get()),
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
          list.attach(element),
          inline ? NOTHING : layer.attach(element),
          // Each time it opens, once its items are in the page.
          effect(() => {
            if (inline) return
            if (!open.get()) return untracked(() => list.highlight(undefined))
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
              if (text === asked || !(inline || open.peek())) return void (asked = text)
              asked = text
              // Typed at, nothing is highlighted unless asked to; a suggestion, only for text.
              if (!auto() || (free && text.trim() === "")) return list.highlight(undefined)
              if (list.collection()) list.move("first")
              else list.highlight(list.rows()[0], true)
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
              : String(first)
            : current === null
              ? ""
              : String(current),
          disabled: flag(disabled.get()),
        }
      }),
      attach(element) {
        if (!multiple) return NOTHING
        // One input for each value: the first is this one, the rest the core's own to draw,
        // after it.
        return restInputs(element, () => ({
          rest: values.get().slice(1),
          name: name.get(),
          form: props.get().form,
          disabled: disabled.get(),
        }))
      },
    },
    itemIndicator: () => ({ props: INDICATOR, attach: () => NOTHING }),
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
      const row: ListRow = list.row(() => ({
        disabled: options().disabled,
        label: options().label,
        hidden: !visible.peek(),
        index: options().index,
      }))
      const visible: ReadonlySignal<boolean> = computed(() => {
        drawn.get()
        const text = query.get()
        const filter = props.get().filter
        // In a collection the caller has filtered: every row that is drawn is shown.
        if (filter === null || text === "" || props.get().virtualized) return true
        // Not through the row: its options ask whether it is shown, which is this.
        const element = row.element()
        return (filter ?? holds)(options().label ?? (element ? textOf(element) : ""), text)
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
          shown.add(record)
          within?.members.add(record)
          within?.joined.set(within.joined.peek() + 1)
          registered.set(registered.peek() + 1)
          drawn.set(drawn.peek() + 1)
          // A framework may write the text after the element attaches: read it a moment later.
          queueMicrotask(() => {
            if (!element.isConnected) return
            labels.set(item, row.label())
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
