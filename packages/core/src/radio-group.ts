import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, keyed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createPresence } from "./services/presence.ts"

export interface RadioGroupProps<Value = unknown> {
  id: string
  /** The chosen value; `null` is "none". */
  value?: Value | null | undefined
  defaultValue?: Value | null | undefined
  onValueChange?: ((value: Value, details: ChangeDetails) => void) | undefined
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  required?: boolean | undefined
  /** With a name, the chosen value is submitted with the form around the group. */
  name?: string | undefined
}

export interface RadioItemOptions {
  disabled?: boolean
}

/** An item's mark: in the page while the item is the chosen one, and through its exit. */
export interface RadioIndicator {
  readonly mounted: ReadonlySignal<boolean>
  readonly part: Part
  mount(): () => void
}

export interface RadioGroup<Value = unknown> {
  readonly value: ReadonlySignal<Value | null>
  setValue(value: Value, details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  item(value: Value, options?: () => RadioItemOptions): Part
  /** The native radio inside an item, hidden: it is what a form and a label know. */
  itemInput(value: Value, options?: () => RadioItemOptions): Part
  indicator(value: Value): RadioIndicator
}

const NOTHING = () => {}
const NONE = Symbol("none")
const NEXT = new Set(["ArrowDown", "ArrowRight"])
const PREVIOUS = new Set(["ArrowUp", "ArrowLeft"])

export function createRadioGroup<Value = unknown>(
  props: ReadonlySignal<RadioGroupProps<Value>>
): RadioGroup<Value> {
  const value = bindable<Value | null>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? null,
    onChange: (next, by) => props.peek().onValueChange?.(next as Value, by),
  })
  const isChecked = keyed(value as ReadonlySignal<Value | null>)
  // The item focus was last on. Until there is one, and while nothing is chosen, every item can
  // take focus, so Tab enters at the first and Shift+Tab at the last, as native radios do.
  const focused = signal<Value | typeof NONE>(NONE)
  const disabled = computed(() => Boolean(props.get().disabled))
  const readOnly = computed(() => Boolean(props.get().readOnly))

  let root: HTMLElement | undefined
  const values = new WeakMap<Element, Value>()
  const inputs = new Map<Value, HTMLInputElement>()

  function setValue(next: Value, by: ChangeDetails) {
    if (disabled.peek() || readOnly.peek()) return
    value.set(next, by)
  }

  function press(item: Value, off: boolean, event: Event) {
    if (off || disabled.peek() || readOnly.peek()) return
    const input = inputs.get(item)
    // Through the native input when it is in the page, so its `change` is the one path.
    if (input) input.click()
    else setValue(item, details("press", event))
  }

  /** The items that can be chosen, in document order, read when a key needs them. */
  function enabled(): HTMLElement[] {
    if (!root) return []
    return [...root.querySelectorAll<HTMLElement>('[role="radio"]')].filter(
      (each) => values.has(each) && each.getAttribute("aria-disabled") !== "true"
    )
  }

  const state = () => ({
    "data-disabled": flag(disabled.get()),
    "data-readonly": flag(readOnly.get()),
    "data-required": flag(props.get().required),
  })

  return {
    value,
    setValue,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        role: "radiogroup",
        "aria-disabled": disabled.get() ? "true" : undefined,
        "aria-readonly": readOnly.get() ? "true" : undefined,
        "aria-required": props.get().required ? "true" : undefined,
        ...state(),
        onKeyDown(event: KeyboardEvent) {
          const forward = NEXT.has(event.key)
          if (!forward && !PREVIOUS.has(event.key)) return
          const list = enabled()
          const index = list.indexOf(event.target as HTMLElement)
          if (index < 0) return
          event.preventDefault()
          // Left and right follow the reading direction of the group, wherever it is set.
          const horizontal = event.key === "ArrowRight" || event.key === "ArrowLeft"
          const rtl =
            horizontal &&
            root?.ownerDocument.defaultView?.getComputedStyle(root).direction === "rtl"
          const step = forward !== rtl ? 1 : -1
          const next = list[(index + step + list.length) % list.length]!
          next.focus()
          // Arrows choose as they move, as native radios do.
          press(values.get(next)!, false, event)
        },
      })),
      attach(element) {
        root = element
        return () => {
          if (root === element) root = undefined
        }
      },
    },
    item(item, options = () => ({})) {
      const checked = isChecked.is(item)
      return {
        props: computed(() => {
          const off = Boolean(options().disabled) || disabled.get()
          const last = focused.get()
          const stop = checked.get() || (value.get() === null && (last === NONE || last === item))
          return {
            role: "radio",
            tabindex: !off && stop ? "0" : "-1",
            "aria-checked": String(checked.get()),
            "aria-disabled": off ? "true" : undefined,
            "data-checked": flag(checked.get()),
            "data-unchecked": flag(!checked.get()),
            ...state(),
            "data-disabled": flag(off),
            onClick(event: Event) {
              if (event.target === inputs.get(item)) return
              event.preventDefault()
              press(item, off, event)
            },
            onKeyDown(event: KeyboardEvent) {
              if (event.key === " ") {
                event.preventDefault()
                press(item, off, event)
              } else if (event.key === "Enter") {
                event.preventDefault()
              }
            },
            onFocus: () => focused.set(item),
          }
        }),
        attach(element) {
          values.set(element, item)
          return NOTHING
        },
      }
    },
    itemInput(item, options = () => ({})) {
      const checked = isChecked.is(item)
      return {
        props: computed(() => ({
          type: "radio",
          name: props.get().name,
          value: String(item),
          checked: flag(checked.get()),
          disabled: flag(Boolean(options().disabled) || disabled.get()),
          hidden: "",
          tabindex: "-1",
          "aria-hidden": "true",
          onChange(event: Event) {
            const element = event.currentTarget as HTMLInputElement
            if (element.checked) setValue(item, details("press", event))
            // A caller who kept the value keeps the inputs with it.
            for (const [each, input] of inputs) input.checked = Object.is(value.peek(), each)
          },
        })),
        attach(element) {
          inputs.set(item, element as HTMLInputElement)
          return () => {
            if (inputs.get(item) === element) inputs.delete(item)
          }
        },
      }
    },
    indicator(item) {
      const checked = isChecked.is(item)
      const presence = createPresence(checked)
      return {
        mounted: presence.mounted,
        mount: () => presence.start(),
        part: {
          props: computed(() => {
            const status = presence.status.get()
            return {
              "data-checked": flag(checked.get()),
              "data-unchecked": flag(!checked.get()),
              ...state(),
              "data-starting-style": flag(status === "starting"),
              "data-ending-style": flag(status === "ending"),
            }
          }),
          attach: (element) => presence.attach(element),
        },
      }
    },
  }
}
