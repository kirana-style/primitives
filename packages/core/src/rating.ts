import { bindable } from "./bindable.ts"
import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import type { Field, FieldMembership } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createFormControl } from "./services/form-control.ts"

export interface RatingProps {
  id: string
  /** How much is given, from 0 (none) to `count`; a half where `allowHalf` is set. */
  value?: number | undefined
  /** The value it starts with, when the caller does not hold `value`. Read once. */
  defaultValue?: number | undefined
  /** Heard as another value is about to be given: `details.cancel()` keeps it as it was. */
  onValueChange?: ((value: number, details: ChangeDetails) => void) | undefined
  /** Told the value the pointer is over, and `null` as it leaves: nothing is chosen by it. */
  onHoverChange?: ((value: number | null) => void) | undefined
  /** How many items there are. Default 5. */
  count?: number | undefined
  /** Whether half an item can be given: by the half of it a pointer is over, and by the arrows. */
  allowHalf?: boolean | undefined
  /** Disabled: it cannot be changed. */
  disabled?: boolean | undefined
  /** Shown as it is, focusable, not changeable. */
  readOnly?: boolean | undefined
  /** Needed: in a `Field`, giving none is then invalid. */
  required?: boolean | undefined
  /** With a name, the value is submitted with the form around it; none is submitted as empty. */
  name?: string | undefined
  /** The id of the form the control belongs to, when it is not inside it. */
  form?: string | undefined
}

export interface Rating {
  readonly value: ReadonlySignal<number>
  /** What is drawn: the value the pointer is over while it is over one, the value held otherwise. */
  readonly shown: ReadonlySignal<number>
  /** The items' places, from 1 to `count`. */
  readonly places: ReadonlySignal<readonly number[]>
  setValue(value: number, details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  /** The item at `place`, from 1. */
  item(place: number): Part
  /** The hidden input that submits the value. */
  readonly input: Part
}

const NOTHING = () => {}

/**
 * A value given as a number of items out of a few (stars): one choice, moved with the arrows,
 * with the value a pointer is over drawn before it is chosen.
 */
export function createRating(
  props: ReadonlySignal<RatingProps>,
  around: { field?: Field | undefined } & DirectionAround = {}
): Rating {
  const { field } = around
  let member: FieldMembership | undefined
  const value = bindable<number>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? 0,
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  const count = computed(() => Math.max(1, Math.round(props.get().count ?? 5)))
  const step = computed(() => (props.get().allowHalf ? 0.5 : 1))
  const hovered = signal<number | null>(null)
  const shown = computed(() => hovered.get() ?? value.get())
  const places = computed<readonly number[]>(
    () => Array.from({ length: count.get() }, (_each, at) => at + 1),
    (a, b) => a.length === b.length
  )
  const submitted = (given: number) => (given > 0 ? String(given) : "")
  // What a form's reset goes back to: the value it began with.
  const initial = value.peek()
  const inForm = createFormControl((event) => {
    const by = details("form-reset", event)
    value.set(initial, by)
    // What was asked for, not what is read back: a caller who holds the value answers later.
    member?.reset(submitted(by.canceled ? value.peek() : initial))
  })
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(field?.disabled.get()) || inForm.disabled.get()
  )
  const readOnly = computed(() => Boolean(props.get().readOnly))
  const elements = new Map<number, HTMLElement>()
  const items = new Map<number, Part>()

  /** A value held to what can be given: a step, from 0 to `count`. */
  const held = (raw: number) =>
    Math.min(count.peek(), Math.max(0, Math.round(raw / step.peek()) * step.peek()))

  function setValue(raw: number, by: ChangeDetails) {
    if (disabled.peek() || readOnly.peek()) return
    const next = held(raw)
    if (next === value.peek()) return
    value.set(next, by)
    if (!by.canceled) member?.changed(submitted(next))
  }

  function hover(next: number | null) {
    if (hovered.peek() === next) return
    hovered.set(next)
    props.peek().onHoverChange?.(next)
  }

  /** The value under a pointer on an item: its first half is half of it, where halves are given. */
  function under(place: number, event: MouseEvent): number {
    const element = event.currentTarget as HTMLElement
    // A press no pointer made (a key, a screen reader) is the whole item.
    if (!props.peek().allowHalf || event.detail === 0) return place
    const box = element.getBoundingClientRect()
    const along = (event.clientX - box.left) / (box.width || 1)
    const first = directionOf(element, around.direction) === "rtl" ? along > 0.5 : along < 0.5
    return first ? place - 0.5 : place
  }

  const state = () => ({
    ...field?.state(),
    "data-disabled": flag(disabled.get()),
    "data-readonly": flag(readOnly.get()),
    "data-required": flag(props.get().required),
  })

  return {
    value,
    shown,
    places,
    setValue,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        role: "radiogroup",
        // In a field, the id its label is `for`.
        id: field?.controlId,
        "aria-disabled": disabled.get() ? "true" : undefined,
        "aria-readonly": readOnly.get() ? "true" : undefined,
        "aria-required": props.get().required ? "true" : undefined,
        ...field?.aria(),
        ...state(),
        "data-hovering": flag(hovered.get() !== null),
        onKeyDown(event: KeyboardEvent) {
          if (disabled.peek() || readOnly.peek()) return
          const rtl = directionOf(event.currentTarget as Element, around.direction) === "rtl"
          const now = value.peek()
          const by = step.peek()
          let next: number
          if (event.key === (rtl ? "ArrowLeft" : "ArrowRight") || event.key === "ArrowUp")
            next = now + by
          else if (event.key === (rtl ? "ArrowRight" : "ArrowLeft") || event.key === "ArrowDown")
            next = now - by
          else if (event.key === "Home") next = by
          else if (event.key === "End") next = count.peek()
          else return
          event.preventDefault()
          // A pointer resting on an item no longer says what is drawn: the keys do.
          hover(null)
          // As radios: the arrows choose as they move, and never go back to none.
          next = Math.min(count.peek(), Math.max(by, next))
          setValue(next, details("keyboard", event))
          elements.get(Math.ceil(next))?.focus()
        },
        onPointerLeave: () => hover(null),
        onFocus: () => member?.focused(true),
        onBlur(event: FocusEvent) {
          const to = event.relatedTarget as Node | null
          if (!(event.currentTarget as HTMLElement).contains(to)) member?.focused(false)
        },
      })),
      attach(element) {
        member = field?.join({
          element,
          focus: () => (elements.get(Math.max(1, Math.ceil(value.peek()))) ?? element).focus(),
          kind: "radio",
          required: () => Boolean(props.peek().required),
          value: submitted(value.peek()),
        })
        return () => {
          member?.leave()
          member = undefined
        }
      },
    },
    item(place) {
      let part = items.get(place)
      if (part) return part
      part = {
        props: computed(() => {
          const now = value.get()
          const drawn = shown.get()
          const off = disabled.get()
          const chosen = Math.ceil(now) === place
          return {
            role: "radio",
            "aria-checked": String(chosen),
            // The item that holds a half says the half.
            "aria-label": `${chosen ? now : place} of ${count.get()}`,
            "aria-disabled": off ? "true" : undefined,
            // One stop for Tab: the item that holds the value, or the first while none does.
            tabindex: !off && (chosen || (now === 0 && place === 1)) ? "0" : "-1",
            "data-checked": flag(chosen),
            "data-filled": flag(place <= Math.ceil(drawn)),
            "data-half": flag(Math.ceil(drawn) === place && drawn < place),
            ...state(),
            onClick(event: MouseEvent) {
              setValue(under(place, event), details("item-press", event))
            },
            onPointerMove(event: PointerEvent) {
              // A finger does not hover: what it touches is chosen.
              if (event.pointerType === "touch" || disabled.peek() || readOnly.peek()) return
              hover(under(place, event))
            },
          }
        }),
        attach(element) {
          elements.set(place, element)
          return () => {
            if (elements.get(place) === element) elements.delete(place)
          }
        },
      }
      items.set(place, part)
      return part
    },
    input: {
      props: computed(() => ({
        type: "hidden",
        name: props.get().name ?? field?.name.get(),
        form: props.get().form,
        value: submitted(value.get()),
        disabled: flag(disabled.get()),
      })),
      attach: (element) => inForm.attach(element),
    },
  }
}
