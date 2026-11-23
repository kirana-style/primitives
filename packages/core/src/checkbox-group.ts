import { bindable } from "./bindable.ts"
import type { CheckboxGroupLink } from "./checkbox.ts"
import type { Field, FieldMembership } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export interface CheckboxGroupProps {
  /** Unique in the page: the group's own id, and what its checkboxes' ids are made from. */
  id: string
  /** The values of the checked checkboxes, when the caller holds them. */
  value?: readonly string[] | undefined
  /** The values checked at the start, when the caller does not hold `value`. Read once. */
  defaultValue?: readonly string[] | undefined
  /**
   * Heard as a checkbox of the group is about to be checked or unchecked, with the values that
   * would then be checked: `details.cancel()` keeps them as they were.
   */
  onValueChange?: ((value: string[], details: ChangeDetails) => void) | undefined
  /**
   * The value of every checkbox of the group, for a checkbox marked `parent`: it is checked
   * when all of them are, mixed when some are, and a press on it goes from the set they were
   * left in to all, then none, then back. Its order names the boxes' elements (`<id>-0` …).
   */
  allValues?: readonly string[] | undefined
  /** Disables every checkbox of the group. */
  disabled?: boolean | undefined
}

export interface CheckboxGroup {
  /** The values of the checked checkboxes. */
  readonly value: ReadonlySignal<readonly string[]>
  setValue(value: readonly string[], details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  /** What a checkbox inside the group is given (`createCheckbox(props, { group })`). */
  readonly link: CheckboxGroupLink
}

const NOTHING = () => {}
const NONE: readonly never[] = []
const alike = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((each, at) => each === b[at])

/**
 * Checkboxes that hold one list of values between them: each `Checkbox` inside with a `value`
 * is checked while the list has its value. With `allValues`, a checkbox marked `parent` stands
 * for them all. In a field the group is the field's control: the field's label names it, and
 * its value is the checked values.
 */
export function createCheckboxGroup(
  props: ReadonlySignal<CheckboxGroupProps>,
  around: { field?: Field | undefined } = {}
): CheckboxGroup {
  const { field } = around
  let member: FieldMembership | undefined
  const id = field?.controlId ?? props.peek().id
  const value = bindable<readonly string[]>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? NONE,
    onChange: (next, by) => props.peek().onValueChange?.([...next], by),
    equals: alike,
  })
  const disabled = computed(() => Boolean(props.get().disabled) || Boolean(field?.disabled.get()))
  const every = computed(() => props.get().allValues ?? NONE, alike)
  // What a form's reset goes back to: the values the group began with.
  const initial = value.peek()

  // The parent goes round three sets: every box on, every box off, and the mixed set the boxes
  // themselves were last left in, which is kept so it can be come back to.
  let kept = initial
  let status: "on" | "off" | "mixed" = "mixed"
  // The boxes in the page, by value: how many there are of each, and whether each is disabled.
  const boxes = new Map<string, Set<ReadonlySignal<boolean>>>()
  const drawn = signal(0)
  // Until the group is in the page its boxes cannot be asked for: a server names them all.
  const settled = signal(false)
  // What each reset was answered with: every box of the group hears the one event.
  const resets = new WeakMap<Event, readonly string[]>()

  /** Whether no box of this value can be changed. */
  const fixed = (each: string) => {
    const of = boxes.get(each)
    return of !== undefined && of.size > 0 && [...of].every((off) => off.peek())
  }

  function setValue(next: readonly string[], by: ChangeDetails): boolean {
    value.set(next, by)
    if (by.canceled) return false
    member?.changed(next.join(","))
    return true
  }

  const idOf = (each: string) => {
    const at = every.get().indexOf(each)
    return at < 0 ? undefined : `${id}-${at}`
  }

  const allOn = (list: readonly string[]) =>
    every.peek().length > 0 && list.length === every.peek().length

  /** The form is being reset: the values that are then checked. Asked by every box, done once. */
  function reset(event: Event): readonly string[] {
    const answered = resets.get(event)
    if (answered) return answered
    const by = details("form-reset", event)
    value.set(initial, by)
    // What was asked for, not what is read back: a caller who holds the values gives them
    // back in their framework's time.
    const next = by.canceled ? value.peek() : initial
    resets.set(event, next)
    kept = next
    status = "mixed"
    member?.reset(next.join(","))
    return next
  }

  /** A press on the parent: every box on, every box off, or back to how they were left. */
  function press(by: ChangeDetails) {
    const all = every.peek()
    // None, but for the checked boxes that cannot be changed; all, but for the unchecked
    // ones that cannot.
    const off = all.filter((each) => fixed(each) && kept.includes(each))
    const on = all.filter((each) => !fixed(each) || kept.includes(each))
    // The boxes were left all on or all off: there is no mixed set to come back to.
    if (kept.length === on.length || kept.length === 0) {
      return void setValue(value.peek().length === on.length ? off : on, by)
    }
    const to = status === "mixed" ? "on" : status === "on" ? "off" : "mixed"
    if (setValue(to === "on" ? on : to === "off" ? off : kept, by)) status = to
  }

  const shared = {
    disabled,
    name: () => field?.name.get(),
    state: () => field?.state() ?? {},
  }

  return {
    value,
    setValue: (next, by) => void setValue(next, by),
    mount: () => NOTHING,
    link: {
      box(box) {
        if (box.peek().parent) {
          return {
            parent: {
              mixed: () => value.get().length > 0 && value.get().length !== every.get().length,
              controls() {
                drawn.get()
                const all = every.get()
                const named = settled.get() ? all.filter((each) => boxes.has(each)) : all
                return named.map(idOf).join(" ") || undefined
              },
            },
            around: {
              ...shared,
              // A parent says nothing of its own to a form.
              submitted: false,
              held: {
                checked: () => every.get().length > 0 && value.get().length === every.get().length,
                set: (_next, by) => press(by),
                reset: (event) => allOn(reset(event)),
              },
            },
          }
        }
        // A box with no value is no part of the group's value: it holds its own.
        if (box.peek().value === undefined) return { around: { ...shared, submitted: true } }
        const own = () => box.peek().value!
        return {
          around: {
            ...shared,
            submitted: true,
            id: () => idOf(box.get().value!),
            held: {
              checked: () => value.get().includes(box.get().value!),
              set(checked, by) {
                const without = value.peek().filter((each) => each !== own())
                const next = checked ? [...without, own()] : without
                if (!setValue(next, by)) return
                kept = next
                status = "mixed"
              },
              reset: (event) => reset(event).includes(own()),
            },
            join(off) {
              const item = own()
              let of = boxes.get(item)
              if (!of) boxes.set(item, (of = new Set()))
              of.add(off)
              drawn.set(drawn.peek() + 1)
              return () => {
                of.delete(off)
                if (of.size === 0 && boxes.get(item) === of) boxes.delete(item)
                drawn.set(drawn.peek() + 1)
              }
            },
          },
        }
      },
    },
    root: {
      props: computed(() => ({
        role: "group",
        // In a field, the id its label is `for`.
        id,
        ...field?.aria(),
        ...field?.state(),
        "data-disabled": flag(disabled.get()),
        onFocus: () => member?.focused(true),
        onBlur(event: FocusEvent) {
          // From one box to another, focus has not left the group.
          const to = event.relatedTarget as Node | null
          if (!(event.currentTarget as HTMLElement).contains(to)) member?.focused(false)
        },
      })),
      attach(element) {
        // Its boxes attach around it, in an order each framework chooses: a moment later they
        // all have, and the parent names those that are in the page.
        let live = true
        queueMicrotask(() => live && settled.set(true))
        member = field?.join({
          element,
          focus: () =>
            element
              .querySelector<HTMLElement>('[role="checkbox"]:not([aria-disabled="true"])')
              ?.focus(),
          kind: "group",
          // Nothing of a group is needed: a field's own `validate` says what is.
          required: () => false,
          value: value.peek().join(","),
        })
        return () => {
          live = false
          member?.leave()
          member = undefined
        }
      },
    },
  }
}
