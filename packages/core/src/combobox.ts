import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { batch, computed, effect, keyed, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { createList } from "./services/list.ts"
import type { ListRow } from "./services/list.ts"
import { createPopup } from "./services/popup.ts"
import { createPlacement } from "./services/position.ts"
import { textOf } from "./services/typeahead.ts"
import type { PositionOptions } from "./services/position.ts"

export interface ComboboxProps<Value = unknown> {
  id: string
  /** The chosen value; `null` is "none". */
  value?: Value | null | undefined
  defaultValue?: Value | null | undefined
  onValueChange?: ((value: Value | null, details: ChangeDetails) => void) | undefined
  /** What the input says. */
  inputValue?: string | undefined
  defaultInputValue?: string | undefined
  onInputValueChange?: ((value: string, details: ChangeDetails) => void) | undefined
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  disabled?: boolean | undefined
  /** With a name, the value is submitted with the form around it. */
  name?: string | undefined
  /** The id of the form the control belongs to, when it is not inside it. */
  form?: string | undefined
  /**
   * The labels of the values, for the input to show a value before the list has ever been
   * opened. Not needed for the list itself: its items are read from the markup.
   */
  items?: readonly { value: Value; label: string }[] | undefined
  /**
   * Whether an item is shown for what was typed. Default: its label holds the text, without
   * regard to case. `null`: every item is shown, and the caller draws the ones it wants.
   */
  filter?: ((label: string, query: string) => boolean) | null | undefined
}

export interface ComboboxItemOptions {
  /** The item's id: the input names the highlighted item by it. */
  id: string
  disabled?: boolean | undefined
  /** What is filtered and what the input shows; the item's text when left out. */
  label?: string | undefined
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
  setOpen(open: boolean, details: ChangeDetails): void
  setValue(value: Value | null, details: ChangeDetails): void
  readonly positioning: Signal<Partial<PositionOptions>>
  mount(): () => void
  /** The text input: what is typed filters the list, and the list is placed against it. */
  readonly input: Part
  /** A button that opens and closes the list. */
  readonly trigger: Part
  readonly positioner: Part
  readonly popup: Part
  /** What is shown when no item is. */
  readonly emptyPart: Part
  /** The hidden input that submits the value. Rendered only when the combobox has a name. */
  readonly hidden: Part
  item(value: Value, options: () => ComboboxItemOptions): Part
  /** Whether `value` is the chosen one, for an item's indicator. */
  selected(value: Value): ReadonlySignal<boolean>
  /** The mark an item shows while it is the chosen one. */
  itemIndicator(value: Value): Part
}

const NOTHING = () => {}
const INDICATOR = computed(() => ({ "aria-hidden": "true" }))
const EMPTY = computed(() => ({}))
const holds = (label: string, query: string) => label.toLowerCase().includes(query.toLowerCase())

interface Shown {
  readonly shown: ReadonlySignal<boolean>
}

/**
 * A text input with a list under it: what is typed filters the list, and an item chosen from it
 * is the value. Focus stays in the input; the arrows move a highlight the input names.
 */
export function createCombobox<Value = unknown>(
  props: ReadonlySignal<ComboboxProps<Value>>
): Combobox<Value> {
  const id = props.peek().id
  const popupId = `${id}-popup`
  // The labels learned from the markup, so the input still names a value once the list is gone.
  const labels = new Map<Value, string>()

  function labelOf(item: Value | null): string {
    if (item === null) return ""
    const given = props.peek().items?.find((each) => Object.is(each.value, item))
    return given?.label ?? labels.get(item) ?? String(item)
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
  const disabled = computed(() => Boolean(props.get().disabled))
  // Only what was typed since the list opened filters it: opened on a chosen value, it shows all.
  const typed = signal(false)
  const query = computed(() => (typed.get() ? inputValue.get() : ""))
  const isSelected = keyed(value as ReadonlySignal<Value | null>)
  const list = createList({ selector: '[role="option"]', virtual: true })
  const rows = new Map<Value, ListRow>()
  const shown = new Set<Shown>()
  const registered = signal(0)
  const empty = computed(() => {
    registered.get()
    for (const each of shown) if (each.shown.get()) return false
    return true
  })
  const placement = createPlacement({ align: "start" })

  let input: HTMLInputElement | undefined
  let trigger: HTMLElement | undefined
  let popup: HTMLElement | undefined
  // The text the list was last filtered by.
  let asked = ""

  /** Closes, and puts the input back to what is chosen: `text` when that was only just asked for. */
  function shut(by: ChangeDetails, text?: string) {
    open.set(false, by)
    if (by.canceled) return
    typed.set(false)
    inputValue.set(text ?? labelOf(value.peek()), details("input-reset", by.event))
  }

  function setOpen(next: boolean, by: ChangeDetails) {
    if (next) {
      if (!disabled.peek()) open.set(true, by)
    } else shut(by)
  }

  const setValue = (next: Value | null, by: ChangeDetails) => value.set(next, by)

  const layer = createPopup({
    open,
    setOpen,
    kind: "combobox",
    placement,
    // Focus is the input's throughout. Its button opens the list too.
    branches: () => [trigger],
  })

  function choose(item: Value, text: string, event: Event) {
    const by = details("item-press", event)
    batch(() => {
      setValue(item, by)
      // What was asked for, not what is read back: a caller who holds the value answers later.
      shut(details("item-press", event), by.canceled ? undefined : text)
    })
  }

  /** The highlight a list opens on: the chosen item, or with something typed the first shown. */
  function land() {
    const all = list.rows()
    const current = value.peek()
    const chosen = current === null ? undefined : rows.get(current)
    const row = chosen && all.includes(chosen) ? chosen : typed.peek() ? all[0] : undefined
    list.highlight(row, true)
  }

  return {
    open,
    mounted: layer.mounted,
    value,
    inputValue,
    empty,
    named: computed(() => props.get().name !== undefined),
    setOpen,
    setValue,
    positioning: placement.positioning,
    mount: () => layer.start(),
    selected: (item) => isSelected.is(item),
    input: {
      props: computed(() => ({
        role: "combobox",
        autocomplete: "off",
        "aria-autocomplete": "list",
        "aria-haspopup": "listbox",
        ...layer.expanded(popupId),
        "aria-activedescendant": open.get() ? list.highlighted.get()?.element()?.id : undefined,
        form: props.get().form,
        disabled: flag(disabled.get()),
        "data-disabled": flag(disabled.get()),
        onInput(event: Event) {
          const text = (event.currentTarget as HTMLInputElement).value
          const by = details("input-change", event)
          typed.set(true)
          inputValue.set(text, by)
          // Emptied, nothing is chosen any more.
          if (text === "" && value.peek() !== null) setValue(null, details("input-clear", event))
          if (!open.peek()) setOpen(true, details("input-change", event))
        },
        onClick(event: Event) {
          if (!open.peek()) setOpen(true, details("trigger-press", event))
        },
        onKeyDown(event: KeyboardEvent) {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            if (!open.peek()) return setOpen(true, details("list-navigation", event))
            return list.move(event.key === "ArrowDown" ? 1 : -1)
          }
          if (event.key === "Enter" && open.peek()) {
            // Not the form's while the list is open: the highlighted item's own press, which a
            // caller's handler on it hears too. With none, nothing.
            event.preventDefault()
            const row = list.highlighted.peek()
            if (row && list.rows().includes(row)) row.element()?.click()
          }
        },
        onBlur(event: FocusEvent) {
          const to = event.relatedTarget as Node | null
          if (popup?.contains(to) || trigger?.contains(to)) return
          if (open.peek()) setOpen(false, details("focus-out", event))
        },
      })),
      attach(element) {
        input = element as HTMLInputElement
        const stops = [
          layer.attachTrigger(element),
          // The input's text is the core's to write: a framework that held it would write it
          // in its own time, after what was typed since.
          effect(() => {
            const text = inputValue.get()
            if (input && input.value !== text) input.value = text
          }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
          if (input === element) input = undefined
        }
      },
    },
    trigger: {
      props: computed(() => ({
        type: "button",
        // The input is the stop; the button is for a pointer.
        tabindex: "-1",
        "aria-haspopup": "listbox",
        "aria-controls": layer.mounted.get() ? popupId : undefined,
        "data-popup-open": flag(open.get()),
        disabled: flag(disabled.get()),
        "data-disabled": flag(disabled.get()),
        // Focus stays in the input.
        onMouseDown: (event: Event) => event.preventDefault(),
        onClick(event: Event) {
          setOpen(!open.peek(), details("trigger-press", event))
          input?.focus({ preventScroll: true })
        },
      })),
      attach(element) {
        trigger = element
        return () => {
          if (trigger === element) trigger = undefined
        }
      },
    },
    positioner: layer.positioner,
    popup: {
      props: computed(() => ({
        id: popupId,
        role: "listbox",
        ...layer.state(),
        ...layer.placed(),
        "data-empty": flag(empty.get()),
        // A press in the list does not take focus from the input.
        onMouseDown: (event: Event) => event.preventDefault(),
      })),
      attach(element) {
        popup = element
        const stops = [
          list.attach(element),
          layer.attach(element),
          // Each time it opens, once its items are in the page.
          effect(() => {
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
              if (text === asked || !open.peek()) return void (asked = text)
              asked = text
              list.highlight(list.rows()[0], true)
            })
          }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
          if (popup === element) popup = undefined
        }
      },
    },
    emptyPart: { props: EMPTY, attach: () => NOTHING },
    hidden: {
      props: computed(() => {
        const current = value.get()
        return {
          type: "hidden",
          name: props.get().name,
          form: props.get().form,
          value: current === null ? "" : String(current),
          disabled: flag(disabled.get()),
        }
      }),
      attach: () => NOTHING,
    },
    itemIndicator: () => ({ props: INDICATOR, attach: () => NOTHING }),
    item(item, options) {
      const selected = isSelected.is(item)
      // Its text is known once it is in the page.
      const drawn = signal(0)
      const row: ListRow = list.row(() => ({
        disabled: options().disabled,
        label: options().label,
        hidden: !visible.peek(),
      }))
      const visible: ReadonlySignal<boolean> = computed(() => {
        drawn.get()
        const text = query.get()
        const filter = props.get().filter
        if (filter === null || text === "") return true
        // Not through the row: its options ask whether it is shown, which is this.
        const element = row.element()
        return (filter ?? holds)(options().label ?? (element ? textOf(element) : ""), text)
      })
      const record: Shown = { shown: visible }
      return {
        props: computed(() => {
          const off = Boolean(options().disabled)
          return {
            id: options().id,
            role: "option",
            "aria-selected": String(selected.get()),
            "aria-disabled": off ? "true" : undefined,
            hidden: flag(!visible.get()),
            "data-selected": flag(selected.get()),
            "data-highlighted": flag(row.active.get()),
            "data-disabled": flag(off),
            onPointerMove() {
              if (!off && !row.active.peek()) list.highlight(row)
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
            registered.set(registered.peek() + 1)
          }
        },
      }
    },
  }
}
