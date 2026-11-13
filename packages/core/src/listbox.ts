import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createList } from "./services/list.ts"
import type { ListRow } from "./services/list.ts"

export interface ListboxProps<Value = unknown> {
  id: string
  /** The chosen values: none, one, or with `multiple` several. */
  value?: readonly Value[] | undefined
  defaultValue?: readonly Value[] | undefined
  onValueChange?: ((value: Value[], details: ChangeDetails) => void) | undefined
  /** Whether more than one can be chosen: a press then adds or takes away. */
  multiple?: boolean | undefined
  disabled?: boolean | undefined
  /** Whether the arrows go round from the last item to the first. Default: they do not. */
  loop?: boolean | undefined
}

export interface ListboxItemOptions {
  disabled?: boolean | undefined
  /** What typing matches; the item's text when left out. */
  label?: string | undefined
}

export interface ListboxGroup {
  readonly root: Part
  readonly label: Part
}

export interface Listbox<Value = unknown> {
  readonly value: ReadonlySignal<readonly Value[]>
  setValue(value: Value[], details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  item(value: Value, options?: () => ListboxItemOptions): Part
  /** Whether `value` is chosen, for an item's indicator. */
  selected(value: Value): ReadonlySignal<boolean>
  /** The mark an item shows while it is chosen. */
  indicator(value: Value): Part
  /** A group; `id` is its element's, and what its label's is made from. */
  group(id: string): ListboxGroup
}

const NOTHING = () => {}
const NONE: readonly never[] = []

/**
 * A list to choose from that is always in the page: one stop for Tab, the arrows and typing move
 * through it, Space or Enter or a press chooses.
 */
export function createListbox<Value = unknown>(
  props: ReadonlySignal<ListboxProps<Value>>
): Listbox<Value> {
  const value = bindable<readonly Value[]>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? NONE,
    onChange: (next, by) => props.peek().onValueChange?.([...next], by),
    equals: (a, b) => a.length === b.length && a.every((each, at) => Object.is(each, b[at])),
  })
  const disabled = computed(() => Boolean(props.get().disabled))
  const list = createList({ selector: '[role="option"]', loop: () => props.peek().loop ?? false })
  const rows = new Map<Value, ListRow>()
  // Whether focus is in the list: it is then no stop of its own, so Shift+Tab leaves it.
  const within = signal(false)
  const chosen = new Map<Value, ReadonlySignal<boolean>>()

  function selected(item: Value): ReadonlySignal<boolean> {
    let found = chosen.get(item)
    if (!found) {
      found = computed(() => value.get().some((each) => Object.is(each, item)))
      chosen.set(item, found)
    }
    return found
  }

  const setValue = (next: Value[], by: ChangeDetails) => value.set(next, by)

  function choose(item: Value, event: Event) {
    const now = value.peek()
    const has = now.some((each) => Object.is(each, item))
    const by = details("item-press", event)
    if (props.peek().multiple) {
      setValue(has ? now.filter((each) => !Object.is(each, item)) : [...now, item], by)
    } else if (!has) setValue([item], by)
  }

  return {
    value,
    setValue,
    selected,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        id: props.get().id,
        role: "listbox",
        tabindex: within.get() || disabled.get() ? "-1" : "0",
        "aria-multiselectable": props.get().multiple ? "true" : undefined,
        "aria-disabled": disabled.get() ? "true" : undefined,
        "data-disabled": flag(disabled.get()),
        onFocus(event: FocusEvent) {
          within.set(true)
          // Tab came to the list itself: on to the first chosen item, or the first.
          if (event.target !== event.currentTarget) return
          const all = list.rows()
          const first = value
            .peek()
            .map((each) => rows.get(each))
            .find((row) => row && all.includes(row))
          list.highlight(first ?? all[0], true)
        },
        onBlur(event: FocusEvent) {
          if ((event.currentTarget as Element).contains(event.relatedTarget as Node | null)) return
          within.set(false)
          list.highlight(undefined)
        },
        onKeyDown(event: KeyboardEvent) {
          if (disabled.peek()) return
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            // The row's own press: what a caller's handler on it hears too.
            return list.highlighted.peek()?.element()?.click()
          }
          list.key(event)
        },
      })),
      attach: (element) => list.attach(element),
    },
    item(item, options = () => ({})) {
      const on = selected(item)
      const row = list.row(() => ({
        ...options(),
        disabled: Boolean(options().disabled) || disabled.get(),
      }))
      return {
        props: computed(() => {
          const off = Boolean(options().disabled) || disabled.get()
          return {
            role: "option",
            tabindex: "-1",
            "aria-selected": String(on.get()),
            "aria-disabled": off ? "true" : undefined,
            "data-selected": flag(on.get()),
            "data-highlighted": flag(row.active.get()),
            "data-disabled": flag(off),
            // Focus that came by itself (a press) is where the keys go on from.
            onFocus: () => list.highlight(row),
            onClick(event: Event) {
              if (off) return
              list.highlight(row, true)
              choose(item, event)
            },
          }
        }),
        attach(element) {
          const detach = row.attach(element)
          rows.set(item, row)
          return () => {
            detach()
            if (rows.get(item) === row) rows.delete(item)
          }
        },
      }
    },
    indicator(item) {
      const on = selected(item)
      return {
        props: computed(() => ({ "aria-hidden": "true", "data-selected": flag(on.get()) })),
        attach: () => NOTHING,
      }
    },
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
  }
}
