import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createList, pointerMoved } from "./services/list.ts"
import type { ListRow } from "./services/list.ts"
import { textOf } from "./services/typeahead.ts"

export interface CommandProps {
  id: string
  /** What the input says. */
  inputValue?: string | undefined
  /** The text the input starts with, when the caller does not hold `inputValue`. Read once. */
  defaultInputValue?: string | undefined
  /** Heard as the input's text is about to change: `details.cancel()` keeps it as it was. */
  onInputValueChange?: ((value: string, details: ChangeDetails) => void) | undefined
  /**
   * An item was chosen: pressed, or Enter while it was highlighted. Told the item's `value`, or
   * when it was given none, its `label`, or its text.
   */
  onSelect?: ((value: string, details: ChangeDetails) => void) | undefined
  /**
   * Whether an item is shown for what was typed. Default: its label or one of its keywords
   * holds the text, without regard to case. `null`: every item is shown, and the caller draws
   * the ones it wants.
   */
  filter?: ((label: string, query: string, keywords: readonly string[]) => boolean) | null
  /** Whether a step past an end of the list goes round to the other. */
  loop?: boolean | undefined
  /** Disabled: nothing can be typed or chosen. */
  disabled?: boolean | undefined
  /**
   * Whether the first item shown is highlighted from the start and again whenever the text
   * changes, so Enter does it with no arrow key first, as a command palette is used. Default:
   * `true`. With `false`, nothing is highlighted until the input has focus or an arrow or the
   * pointer moves to an item.
   */
  autoHighlight?: boolean | undefined
}

export interface CommandItemOptions {
  /** The item's id: the input names the highlighted item by it. */
  id: string
  /** Disables this item: it cannot be chosen, and the arrows pass over it. */
  disabled?: boolean | undefined
  /** What is filtered; the item's text when left out. */
  label?: string | undefined
  /** Other words the item answers to. */
  keywords?: readonly string[] | undefined
}

/** Items under a heading: in the page while one of them is shown. */
export interface CommandGroup {
  readonly part: Part
  readonly heading: Part
}

export interface Command {
  readonly inputValue: ReadonlySignal<string>
  /** Whether no item is shown for what was typed. */
  readonly empty: ReadonlySignal<boolean>
  mount(): () => void
  readonly root: Part
  /** The text input: what is typed filters the list. Focus stays in it. */
  readonly input: Part
  readonly list: Part
  /** What is shown when no item is. */
  readonly emptyPart: Part
  group(id: string): CommandGroup
  /** A heading with no group around it: a line of text, and nothing more. */
  readonly heading: Part
  /**
   * An item: `value` is what `onSelect` is told, and when it is `undefined` the item's `label`
   * stands for it, or its text, read from the page when it is chosen.
   */
  item(value: string | undefined, options: () => CommandItemOptions, group?: CommandGroup): Part
  /** A line between groups: gone while something is typed, unless `always` says to stay. */
  separator(always?: () => boolean | undefined): Part
}

const NOTHING = () => {}
const EMPTY = computed(() => ({}))
const STATUS = computed(() => ({ role: "status", "aria-live": "polite", "aria-atomic": "true" }))
const holds = (label: string, query: string, keywords: readonly string[]) => {
  const text = query.toLowerCase()
  return (
    label.toLowerCase().includes(text) || keywords.some((each) => each.toLowerCase().includes(text))
  )
}

interface Shown {
  readonly shown: ReadonlySignal<boolean>
}

interface Made extends Shown {
  readonly row: ListRow
  readonly options: () => CommandItemOptions
}

interface Members extends CommandGroup {
  readonly members: Set<Shown>
  readonly joined: ReturnType<typeof signal<number>>
}

/**
 * A list of commands with a text input over it: what is typed filters the list, the arrows move
 * a highlight the input names, and Enter chooses. Nothing stays chosen: an item is a thing to
 * do. Focus stays in the input.
 */
export function createCommand(props: ReadonlySignal<CommandProps>): Command {
  const id = props.peek().id
  const listId = `${id}-list`
  const inputValue = bindable<string>({
    value: () => props.get().inputValue,
    defaultValue: props.peek().defaultInputValue ?? "",
    onChange: (next, by) => props.peek().onInputValueChange?.(next, by),
  })
  const disabled = computed(() => Boolean(props.get().disabled))
  const list = createList({
    selector: '[role="option"]',
    virtual: true,
    loop: () => Boolean(props.peek().loop),
  })
  const shown = new Set<Shown>()
  const registered = signal(0)
  // Whether the list is in a page: a server draws a list before its items, and cannot say
  // whether there are any.
  const listed = signal(false)
  const empty = computed(() => {
    if (!listed.get()) return false
    registered.get()
    for (const each of shown) if (each.shown.get()) return false
    return true
  })

  let input: HTMLInputElement | undefined
  // The text the list was last filtered by.
  let asked = inputValue.peek()

  // Every item, in the order it was made: a server's order, and the page's until it is drawn.
  const made = new Set<Made>()
  const byRow = new Map<ListRow, Made>()
  const auto = () => props.get().autoHighlight ?? true
  // With `autoHighlight`, the item highlighted while no other is: the first shown. Derived, not
  // set, so it is the first of what the page holds now, whenever the rows the text leaves come
  // in, and a server draws it as the page then does.
  const first = computed((): Made | undefined => {
    if (!auto() || disabled.get() || list.highlighted.get()) return undefined
    registered.get()
    // Every item's `shown` is read, so a change to any of them comes back here.
    let found: Made | undefined
    for (const each of made) if (each.shown.get() && !each.options().disabled) found ??= each
    if (!listed.get()) return found
    // In a page: the first in the page's order, which a caller's own list may set.
    const row = list.rows()[0]
    return row ? byRow.get(row) : undefined
  })
  // Whether focus is in the input: the item shown highlighted is named to a reader then. At
  // rest it is not, so the input a server draws, before any item is made, says the same.
  const focused = signal(false)
  // A key that acts on the highlight acts on the one shown.
  const settle = () => {
    const lit = first.peek()
    if (lit?.row.element()) list.highlight(lit.row)
  }

  return {
    inputValue,
    empty,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({ "data-disabled": flag(disabled.get()) })),
      attach: () => NOTHING,
    },
    input: {
      props: computed(() => ({
        role: "combobox",
        // What it says, so a server draws it. In a page the core writes it too.
        value: inputValue.get(),
        autocomplete: "off",
        spellcheck: "false",
        "aria-autocomplete": "list",
        "aria-expanded": "true",
        "aria-controls": listId,
        "aria-activedescendant":
          list.highlighted.get()?.element()?.id ??
          (focused.get() ? first.get()?.options().id : undefined),
        disabled: flag(disabled.get()),
        "data-disabled": flag(disabled.get()),
        // The first command is the one Enter does, once the palette is being used.
        onFocus() {
          focused.set(true)
          if (!list.highlighted.peek()) list.highlight(list.rows()[0], true)
        },
        onBlur: () => focused.set(false),
        onInput(event: Event) {
          inputValue.set(
            (event.currentTarget as HTMLInputElement).value,
            details("input-change", event)
          )
        },
        onKeyDown(event: KeyboardEvent) {
          if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter")
            settle()
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            return list.move(event.key === "ArrowDown" ? 1 : -1)
          }
          if (event.key === "Enter" && !event.isComposing) {
            // The highlighted item's own press, which a caller's handler on it hears too.
            event.preventDefault()
            const row = list.highlighted.peek()
            if (row && list.rows().includes(row)) row.element()?.click()
          }
        },
      })),
      attach(element) {
        input = element as HTMLInputElement
        // The input's text is the core's to write: a framework that held it would write it in
        // its own time, after what was typed since.
        const stop = effect(() => {
          const text = inputValue.get()
          if (input && input.value !== text) input.value = text
        })
        return () => {
          stop()
          if (input === element) input = undefined
        }
      },
    },
    list: {
      props: computed(() => ({
        id: listId,
        role: "listbox",
        "data-empty": flag(empty.get()),
        // A press in the list does not take focus from the input.
        onMouseDown: (event: Event) => event.preventDefault(),
      })),
      attach(element) {
        // The list first: once it is in the page, the first item is read from it.
        const stops = [list.attach(element), () => listed.set(false)]
        listed.set(true)
        stops.push(
          // As what is typed changes, the highlight is on the first item still shown. Followed
          // here, not done where the key is heard: a caller who holds the text gives it back
          // later, and the list is filtered by what the caller has given.
          effect(() => {
            const text = inputValue.get()
            untracked(() => {
              if (text === asked) return
              asked = text
              // With `autoHighlight`, the first shown is highlighted by itself once the page
              // holds what is left: a caller drawing the rows from data draws them later.
              if (auto()) list.highlight(undefined)
              else list.highlight(list.rows()[0], true)
            })
          })
        )
        return () => {
          for (const stop of stops.reverse()) stop()
        }
      },
    },
    // Said when it comes into the page, where a reader's software follows a status.
    emptyPart: { props: STATUS, attach: () => NOTHING },
    heading: { props: EMPTY, attach: () => NOTHING },
    group(groupId) {
      const members = new Set<Shown>()
      const joined = signal(0)
      const named = signal(false)
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
        part: {
          props: computed(() => ({
            role: "group",
            "aria-labelledby": named.get() ? `${groupId}-heading` : undefined,
            hidden: flag(!any.get()),
          })),
          attach: () => NOTHING,
        },
        heading: {
          props: computed(() => ({ id: `${groupId}-heading`, "aria-hidden": "true" })),
          attach() {
            named.set(true)
            return () => named.set(false)
          },
        },
      }
      return group
    },
    separator(always = () => false) {
      return {
        props: computed(() => ({
          role: "separator",
          hidden: flag(inputValue.get() !== "" && !always()),
        })),
        attach: () => NOTHING,
      }
    },
    item(value, options, group) {
      // Its text is known once it is in the page.
      const drawn = signal(0)
      const row: ListRow = list.row(() => ({
        disabled: options().disabled,
        label: options().label,
        hidden: !visible.peek(),
      }))
      const visible: ReadonlySignal<boolean> = computed(() => {
        drawn.get()
        const text = inputValue.get()
        const filter = props.get().filter
        if (filter === null || text === "") return true
        const element = row.element()
        return (filter ?? holds)(
          options().label ?? (element ? textOf(element) : (value ?? "")),
          text,
          options().keywords ?? []
        )
      })
      const record: Made = { shown: visible, row, options }
      made.add(record)
      byRow.set(row, record)
      const lit = computed(() => row.active.get() || first.get() === record)
      const within = group as Members | undefined
      // Counted from when it is made: a server attaches nothing, and must not say "empty".
      shown.add(record)
      within?.members.add(record)
      return {
        props: computed(() => {
          const off = Boolean(options().disabled) || disabled.get()
          return {
            id: options().id,
            role: "option",
            // Nothing stays chosen: "selected" is the one the keys are on.
            "aria-selected": String(lit.get()),
            "aria-disabled": off ? "true" : undefined,
            hidden: flag(!visible.get()),
            "data-highlighted": flag(lit.get()),
            "data-disabled": flag(off),
            onPointerMove(event: PointerEvent) {
              if (pointerMoved(event) && !off && !row.active.peek()) list.highlight(row)
            },
            onClick(event: Event) {
              if (off) return
              // An item given no value is named by its label, or by its text, as it reads now.
              const named = value ?? options().label ?? textOf(event.currentTarget as Element)
              props.peek().onSelect?.(named, details("item-press", event))
            },
          }
        }),
        attach(element) {
          const detach = row.attach(element)
          made.add(record)
          byRow.set(row, record)
          shown.add(record)
          within?.members.add(record)
          within?.joined.set(within.joined.peek() + 1)
          registered.set(registered.peek() + 1)
          drawn.set(drawn.peek() + 1)
          // A framework may write the text after the element attaches: read it a moment later.
          queueMicrotask(() => {
            if (element.isConnected) drawn.set(drawn.peek() + 1)
          })
          return () => {
            detach()
            made.delete(record)
            byRow.delete(row)
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
