import { bindable } from "./bindable.ts"
import type { Field, FieldMembership } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { batch, computed, effect, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createFormControl } from "./services/form-control.ts"

export interface NumberFieldProps {
  id: string
  /** The number; `null` is "none". */
  value?: number | null | undefined
  defaultValue?: number | null | undefined
  onValueChange?: ((value: number | null, details: ChangeDetails) => void) | undefined
  /** Heard once a change is done: focus left the input, a key or a button stepped it. */
  onValueCommitted?: ((value: number | null, details: ChangeDetails) => void) | undefined
  min?: number | undefined
  max?: number | undefined
  /** What the buttons and the arrows move by. Default 1. */
  step?: number | undefined
  /** With Alt held. Default 0.1. */
  smallStep?: number | undefined
  /** With Shift held. Default 10. */
  largeStep?: number | undefined
  /** A step lands on a multiple of the step, counted from `min`. */
  snapOnStep?: boolean | undefined
  /** The wheel steps it while the pointer is over the input and focus is in it. */
  allowWheelScrub?: boolean | undefined
  /** How the number is written. */
  format?: Intl.NumberFormatOptions | undefined
  /** The language it is written in; the page's by default. */
  locale?: string | undefined
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  required?: boolean | undefined
  /** With a name, the number is submitted with the form around it. */
  name?: string | undefined
  /** The id of the form the control belongs to, when it is not inside it. */
  form?: string | undefined
}

export interface NumberField {
  readonly value: ReadonlySignal<number | null>
  /** What the input says: the number as written, or what is being typed. */
  readonly text: ReadonlySignal<string>
  /** Whether it has a name: whether its hidden input is drawn. */
  readonly named: ReadonlySignal<boolean>
  /** Moves it by a step, held to its range. Says whether it moved. */
  stepBy(steps: number, details: ChangeDetails, amount?: number): boolean
  mount(): () => void
  readonly root: Part
  /** What holds the input and its buttons, as one control. */
  readonly group: Part
  readonly input: Part
  readonly increment: Part
  readonly decrement: Part
  /** The hidden input that submits the number. Rendered only when it has a name. */
  readonly hidden: Part
}

const NOTHING = () => {}
/** How long a button is held before it repeats, and how often it then does, in milliseconds. */
export const NUMBER_HOLD = 400
export const NUMBER_REPEAT = 60

/** How a locale writes a number: what stands for a digit, a point, a sign. */
interface Writing {
  readonly decimal: string
  readonly group: string
  readonly minus: string
  /** Its ten digits, when they are not 0 to 9. */
  readonly digits: string
  /** Every character it may write that is not a digit. */
  readonly others: ReadonlySet<string>
  readonly percent: boolean
}

function writingOf(locale: string | undefined, format: Intl.NumberFormatOptions): Writing {
  const parts = new Intl.NumberFormat(locale, format).formatToParts(-12345.6)
  const find = (type: string, or: string) => parts.find((each) => each.type === type)?.value ?? or
  const digits = new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210)
  const others = new Set<string>(["-", "+", "−", ".", ",", " ", " ", " "])
  for (const part of parts) {
    if (part.type === "integer" || part.type === "fraction") continue
    for (const each of part.value) others.add(each)
  }
  return {
    decimal: find("decimal", "."),
    group: find("group", ","),
    minus: find("minusSign", "-"),
    digits: Array.from(digits).toReversed().join(""),
    others,
    percent: format.style === "percent",
  }
}

/** The number a text says, as its locale writes numbers; `null` when it says none. */
function parse(text: string, writing: Writing): number | null {
  let plain = ""
  let negative = false
  let pointed = false
  for (const each of text) {
    const at = writing.digits.indexOf(each)
    if (each >= "0" && each <= "9") plain += each
    else if (at >= 0) plain += String(at)
    else if (each === "-" || each === "−" || each === writing.minus) negative = true
    else if (each === writing.decimal && !pointed) {
      plain += "."
      pointed = true
    }
    // A point where the locale's own is another, and is not its mark between thousands.
    else if (each === "." && writing.group !== "." && !pointed) {
      plain += "."
      pointed = true
    }
  }
  if (plain === "" || plain === ".") return null
  const value = Number(plain) * (negative ? -1 : 1)
  if (!Number.isFinite(value)) return null
  return writing.percent ? value / 100 : value
}

/** How many decimals a number is written with. */
function decimals(value: number): number {
  const text = String(value)
  if (text.includes("e-")) return Number(text.split("e-")[1])
  return text.split(".")[1]?.length ?? 0
}

/**
 * A number typed or stepped: an input that takes only what its locale writes a number with,
 * buttons and arrows that step it, a range it is held to. What the input says while it is
 * typed in is the text; the number follows where the text is one, and the text is written out
 * whole again when focus leaves.
 */
export function createNumberField(
  props: ReadonlySignal<NumberFieldProps>,
  around: { field?: Field | undefined } = {}
): NumberField {
  const { field } = around
  let member: FieldMembership | undefined
  const id = props.peek().id
  const inputId = field?.controlId ?? `${id}-input`
  const value = bindable<number | null>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? null,
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  const initial = value.peek()
  // Written in full unless the caller says how many decimals: a number is not rounded for show.
  const options = computed(() => ({ maximumFractionDigits: 20, ...props.get().format }))
  const writing = computed(() => writingOf(props.get().locale, options.get()))
  const write = (next: number | null) =>
    next === null ? "" : new Intl.NumberFormat(props.peek().locale, options.peek()).format(next)
  const text = signal(write(value.peek()))
  // Whether the text is what is being typed: the number does not write over it.
  let typing = false
  const focused = signal(false)
  const touched = signal(false)
  const dirty = signal(false)

  const inForm = createFormControl((event) => {
    const by = details("form-reset", event)
    value.set(initial, by)
    const next = by.canceled ? value.peek() : initial
    typing = false
    // The browser puts the input back to its default next: the default is what it should say.
    if (input) input.defaultValue = write(next)
    batch(() => {
      text.set(write(next))
      touched.set(false)
      dirty.set(false)
    })
    member?.reset(next === null ? "" : String(next))
  })
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(field?.disabled.get()) || inForm.disabled.get()
  )
  const locked = () => disabled.peek() || Boolean(props.peek().readOnly)
  const name = computed(() => props.get().name ?? field?.name.get())

  const held = (next: number) => {
    const { min, max } = props.peek()
    return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next))
  }

  /** Sets the number, held to its range. Says whether the caller let it. */
  function setValue(next: number | null, by: ChangeDetails): boolean {
    const to = next === null ? null : held(next)
    value.set(to, by)
    if (by.canceled) return false
    dirty.set(to !== initial)
    member?.changed(to === null ? "" : String(to))
    return true
  }

  const commit = (reason: string, event?: Event) =>
    props.peek().onValueCommitted?.(value.peek(), details(reason, event))

  function stepBy(steps: number, by: ChangeDetails, amount = props.peek().step ?? 1): boolean {
    if (locked()) return false
    const { min, snapOnStep } = props.peek()
    // From what is typed, when that is a number the value has not caught up with.
    const typed = typing ? parse(text.peek(), writing.peek()) : null
    const from = typed ?? value.peek()
    let next = from === null ? Math.max(0, min ?? 0) : from + steps * amount
    if (snapOnStep && from !== null) {
      const base = min ?? 0
      const along = (from - base) / amount
      // Off a multiple, a step goes to the next one its way, not a whole step past it.
      const whole = steps > 0 ? Math.floor(along + 1e-9) : Math.ceil(along - 1e-9)
      next = base + (whole + steps) * amount
    }
    // The sum of two decimals is not always the decimal it should be.
    const places = Math.min(10, Math.max(decimals(amount), decimals(from ?? 0), decimals(min ?? 0)))
    next = Number(next.toFixed(places))
    if (held(next) === value.peek() && !typing) return false
    if (!setValue(next, by)) return false
    typing = false
    text.set(write(held(next)))
    return true
  }

  /** What Alt and Shift make of a step. */
  const amountFor = (event: { altKey: boolean; shiftKey: boolean }) => {
    const { step = 1, smallStep = 0.1, largeStep = 10 } = props.peek()
    return event.altKey ? smallStep : event.shiftKey ? largeStep : step
  }

  let input: HTMLInputElement | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  const release = () => {
    clearTimeout(timer)
    timer = undefined
  }

  const state = () => {
    const filled = value.get() !== null
    return {
      "data-touched": flag(touched.get()),
      "data-dirty": flag(dirty.get()),
      "data-filled": flag(filled),
      "data-focused": flag(focused.get()),
      // In a field, what the field says of it: valid, invalid, and its own of the above.
      ...field?.state(),
      "data-disabled": flag(disabled.get()),
      "data-readonly": flag(props.get().readOnly),
      "data-required": flag(props.get().required),
    }
  }

  function button(steps: 1 | -1, label: string): Part {
    const off = computed(() => {
      const { min, max, readOnly } = props.get()
      const now = value.get()
      const end = steps > 0 ? max : min
      return (
        disabled.get() ||
        Boolean(readOnly) ||
        (now !== null && end !== undefined && (steps > 0 ? now >= end : now <= end))
      )
    })
    const press = (event: Event, amount: number) => {
      if (stepBy(steps, details(steps > 0 ? "increment-press" : "decrement-press", event), amount))
        commit(steps > 0 ? "increment-press" : "decrement-press", event)
    }
    return {
      props: computed(() => ({
        type: "button",
        // The input is the stop, and the arrows do what the buttons do.
        tabindex: "-1",
        "aria-label": label,
        "aria-controls": inputId,
        disabled: flag(off.get()),
        ...state(),
        "data-disabled": flag(off.get()),
        // Focus stays where it is.
        onMouseDown: (event: Event) => event.preventDefault(),
        onPointerDown(event: PointerEvent) {
          if (event.button !== 0 || off.peek()) return
          const amount = amountFor(event)
          if (event.pointerType === "mouse") input?.focus({ preventScroll: true })
          press(event, amount)
          release()
          // Held, it goes on.
          const again = () => {
            if (off.peek()) return release()
            press(event, amount)
            timer = setTimeout(again, NUMBER_REPEAT)
          }
          timer = setTimeout(again, NUMBER_HOLD)
        },
        onPointerUp: release,
        onPointerLeave: release,
        onPointerCancel: release,
        // A press no pointer made: a key on the button, a screen reader.
        onClick(event: MouseEvent) {
          if (event.detail === 0 && !off.peek()) press(event, amountFor(event))
        },
      })),
      attach: () => release,
    }
  }

  return {
    value,
    text,
    named: computed(() => name.get() !== undefined),
    stepBy,
    mount: () =>
      // The number written out, whenever it changes and nothing is being typed.
      effect(() => {
        const now = value.get()
        void options.get()
        void props.get().locale
        untracked(() => {
          if (!typing) text.set(write(now))
        })
      }),
    root: { props: computed(state), attach: () => NOTHING },
    group: {
      props: computed(() => ({ role: "group", ...state() })),
      attach: () => NOTHING,
    },
    input: {
      props: computed(() => {
        const { min: least, format, required, readOnly } = props.get()
        const whole = format?.maximumFractionDigits === 0
        return {
          id: inputId,
          type: "text",
          // What it says, so a server draws the number. In a page the core writes it too:
          // a framework writes in its own time, after what was typed since.
          value: text.get(),
          // A keypad where it has every key a number here can need.
          inputmode: least !== undefined && least >= 0 ? (whole ? "numeric" : "decimal") : "text",
          autocomplete: "off",
          spellcheck: "false",
          "aria-roledescription": "Number field",
          form: props.get().form,
          disabled: flag(disabled.get()),
          readonly: flag(readOnly),
          "aria-required": required ? "true" : undefined,
          ...field?.aria(),
          ...state(),
          onFocus() {
            focused.set(true)
            member?.focused(true)
          },
          onBlur(event: FocusEvent) {
            batch(() => {
              focused.set(false)
              touched.set(true)
            })
            member?.focused(false)
            if (locked()) return
            const had = typing
            typing = false
            if (!had) return
            const said = text.peek().trim() === "" ? null : parse(text.peek(), writing.peek())
            // Written as its format rounds it, when it rounds.
            const places = props.peek().format?.maximumFractionDigits
            const next = said !== null && places !== undefined ? Number(said.toFixed(places)) : said
            if (next !== value.peek()) setValue(next, details("input-blur", event))
            text.set(write(value.peek()))
            commit("input-blur", event)
          },
          onInput(event: Event) {
            const element = event.currentTarget as HTMLInputElement
            const raw = element.value
            const { digits, others } = writing.peek()
            const numeral = (each: string) =>
              (each >= "0" && each <= "9") || digits.includes(each) || others.has(each)
            // What is not part of a number is not taken: the input says what it said.
            if (!Array.from(raw).every(numeral)) return void (element.value = text.peek())
            typing = true
            text.set(raw)
            if (raw.trim() === "") return void setValue(null, details("input-clear", event))
            const said = parse(raw, writing.peek())
            if (said !== null) setValue(said, details("input-change", event))
          },
          onKeyDown(event: KeyboardEvent) {
            if (locked() || event.isComposing) return
            const { min, max } = props.peek()
            const stepped = event.key === "ArrowUp" || event.key === "ArrowDown"
            const end =
              event.key === "Home" && min !== undefined
                ? min
                : event.key === "End" && max !== undefined
                  ? max
                  : undefined
            if (!stepped && end === undefined) return
            // The caret stays where it is.
            event.preventDefault()
            const by = details("keyboard", event)
            const moved = stepped
              ? stepBy(event.key === "ArrowUp" ? 1 : -1, by, amountFor(event))
              : end !== value.peek() && setValue(end!, by)
            if (!moved) return
            typing = false
            text.set(write(value.peek()))
            commit("keyboard", event)
          },
        }
      }),
      attach(element) {
        input = element as HTMLInputElement
        const now = value.peek()
        member = field?.join({
          element,
          focus: () => element.focus(),
          kind: "range",
          required: () => Boolean(props.peek().required),
          value: now === null ? "" : String(now),
        })
        // Not passive: a wheel that steps the number does not scroll the page too.
        const wheel = (event: WheelEvent) => {
          if (!props.peek().allowWheelScrub || !focused.peek() || locked() || event.ctrlKey) return
          event.preventDefault()
          const steps = event.deltaY < 0 ? 1 : -1
          if (stepBy(steps, details("wheel", event), amountFor(event))) commit("wheel", event)
        }
        element.addEventListener("wheel", wheel, { passive: false })
        const stops = [
          () => element.removeEventListener("wheel", wheel),
          inForm.attach(element),
          // The input's text is the core's to write: a framework that held it would write it
          // in its own time, after what was typed since.
          effect(() => {
            const said = text.get()
            if (input && input.value !== said) input.value = said
          }),
          () => {
            member?.leave()
            member = undefined
          },
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
          if (input === element) input = undefined
        }
      },
    },
    increment: button(1, "Increase"),
    decrement: button(-1, "Decrease"),
    hidden: {
      props: computed(() => {
        const now = value.get()
        return {
          type: "hidden",
          name: name.get(),
          form: props.get().form,
          value: now === null ? "" : String(now),
          disabled: flag(disabled.get()),
        }
      }),
      attach: () => NOTHING,
    },
  }
}
