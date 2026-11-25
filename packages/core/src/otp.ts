import { bindable } from "./bindable.ts"
import type { Field, FieldMembership } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createFormControl } from "./services/form-control.ts"

export interface OtpProps {
  id: string
  /** How many characters the code has. Default: 6. */
  length?: number | undefined
  /** The characters typed so far, when the caller holds them. */
  value?: string | undefined
  /** The characters it starts with, when the caller does not hold `value`. Read once. */
  defaultValue?: string | undefined
  /** Heard as the characters are about to change: `details.cancel()` keeps them as they were. */
  onValueChange?: ((value: string, details: ChangeDetails) => void) | undefined
  /**
   * Every character is in: the moment to send the code. `details` are those of the change that
   * filled it (`reason`, `event`, `source`).
   */
  onValueComplete?: ((value: string, details: ChangeDetails) => void) | undefined
  /**
   * Every character is in.
   * @deprecated Use `onValueComplete`, which is told the change's details too
   * and is the one called when both are given.
   */
  onComplete?: ((value: string) => void) | undefined
  /**
   * What a character may be: a digit (`numeric`), a letter (`alpha`, `a` to `z` either case),
   * either (`alphanumeric`), or anything but white space (`none`: no rule beyond that). It also
   * says which keyboard a phone shows: the digits' for `numeric`, letters' otherwise. Default:
   * `numeric`, on purpose: a one-time code is digits, and its keyboard is then the one to type
   * them on. `alphabetic` and `text` are older spellings of `alpha` and `none`, still read.
   */
  validationType?: OtpValidation | undefined
  /**
   * What a character may be.
   * @deprecated Use `validationType`, which wins when both are given. Both take
   * either spelling of the values.
   */
  mode?: OtpValidation | undefined
  /**
   * What else a character may be: a regular expression, as text, that one character must match
   * whole (`"[A-F0-9]"`), in place of `validationType`'s rule. Text, as an attribute can only
   * be, so it is given the same way on every framework and on a custom element. With a
   * pattern, `validationType` only says the keyboard, and defaults to `none`.
   */
  pattern?: string | undefined
  /** Disabled: it cannot be changed. */
  disabled?: boolean | undefined
  /** Shown as it is, focusable, not changeable. */
  readOnly?: boolean | undefined
  /** Needed: in a `Field`, an empty code is then invalid. */
  required?: boolean | undefined
  /** With a name, the code is submitted with the form around it. */
  name?: string | undefined
  /** The id of the form the input belongs to, when it is not inside it. */
  form?: string | undefined
}

/** One drawn cell of the code. */
export interface OtpSlot {
  /** Its character, or `""`. */
  readonly char: ReadonlySignal<string>
  /** Whether the next character typed goes here, or it is part of what is selected. */
  readonly active: ReadonlySignal<boolean>
  /** Whether a caret is to be drawn in it: active, and empty. */
  readonly caret: ReadonlySignal<boolean>
  readonly part: Part
}

export interface Otp {
  readonly value: ReadonlySignal<string>
  setValue(value: string, details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  /** The one input the code is typed in. The cells are drawn from it. */
  readonly input: Part
  readonly group: Part
  /** A cell, by its place. Asked for again, the same. */
  slot(index: number): OtpSlot
  readonly separator: Part
  /** A caret drawn in the active cell while it is empty. */
  readonly caretPart: Part
}

/**
 * Which characters a one-time code takes: Base UI's four values, and `alphabetic` and `text`,
 * the older spellings of `alpha` and `none`.
 */
export type OtpValidation = "numeric" | "alpha" | "alphanumeric" | "none" | "alphabetic" | "text"

const NOTHING = () => {}
const ALLOWED: Record<OtpValidation, string> = {
  numeric: "[0-9]",
  alpha: "[a-zA-Z]",
  alphabetic: "[a-zA-Z]",
  alphanumeric: "[0-9a-zA-Z]",
  none: "\\S",
  text: "\\S",
}
const rules = new Map<string, RegExp>()
/** What is left of `text` once each character the rule refuses is taken out. */
function keep(text: string, rule: string): string {
  let made = rules.get(rule)
  if (!made) rules.set(rule, (made = new RegExp(`^(?:${rule})$`, "u")))
  let kept = ""
  for (const char of text) if (made.test(char)) kept += char
  return kept
}

/**
 * A one-time code: one text input, and a cell drawn for each of its characters. One input, so a
 * code pasted, autofilled from a message or typed by a screen reader's user goes in as into any
 * input, and the browser's own selection, undo and deletion are the component's.
 */
export function createOtp(
  props: ReadonlySignal<OtpProps>,
  /** The field the code is in, if it is in one: its label, its state, its check. */
  around: { field?: Field | undefined } = {}
): Otp {
  const { field } = around
  let member: FieldMembership | undefined
  const length = () => Math.max(1, props.peek().length ?? 6)
  // Base UI's name first, then the older one; with neither, digits, or anything with a pattern.
  const validation = (given: OtpProps): OtpValidation =>
    given.validationType ?? given.mode ?? (given.pattern ? "none" : "numeric")
  // The pattern given, or the validation's: read each time, as a caller may change either.
  const rule = () => props.peek().pattern ?? ALLOWED[validation(props.peek())]
  const clean = (text: string) => keep(text, rule()).slice(0, length())
  const value = bindable<string>({
    value: () => props.get().value,
    defaultValue: clean(props.peek().defaultValue ?? ""),
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  const initial = value.peek()
  const inForm = createFormControl((event) => {
    // The browser puts the input back to its default next: the default is what it should say.
    if (input) input.defaultValue = initial
    const by = details("form-reset", event)
    value.set(initial, by)
    if (!by.canceled) member?.reset(initial)
  })
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(field?.disabled.get()) || inForm.disabled.get()
  )
  const readOnly = computed(() => Boolean(props.get().readOnly))
  const focused = signal(false)
  // The input's own selection: where the next character goes, or what is selected.
  const selection = signal<readonly [number, number]>(
    [0, 0],
    (a, b) => a[0] === b[0] && a[1] === b[1]
  )
  let input: HTMLInputElement | undefined
  const slots = new Map<number, OtpSlot>()

  function setValue(next: string, by: ChangeDetails) {
    const text = clean(next)
    const before = value.peek()
    value.set(text, by)
    if (!by.canceled) member?.changed(text)
    // What was asked for, not what is read back.
    if (!by.canceled && text !== before && text.length === length()) {
      const given = props.peek()
      if (given.onValueComplete) given.onValueComplete(text, by)
      else given.onComplete?.(text)
    }
  }

  const read = () => {
    if (!input) return
    selection.set([input.selectionStart ?? 0, input.selectionEnd ?? 0])
  }

  /** Puts the caret where a press asked for it: on that cell, or after the last character. */
  function place(index: number) {
    if (!input || disabled.peek()) return
    input.focus({ preventScroll: true })
    const at = Math.min(index, value.peek().length)
    // A filled cell is selected, so what is typed takes its place.
    input.setSelectionRange(at, Math.min(at + 1, value.peek().length))
    read()
  }

  /**
   * What the root and every cell carry: the field's state when the code is in one, then the
   * code's own, which a focus anywhere on it or a character in it says whatever the field does.
   */
  const state = () => ({
    ...field?.state(),
    "data-disabled": flag(disabled.get()),
    "data-readonly": flag(readOnly.get()),
    "data-required": flag(props.get().required),
    "data-focused": flag(focused.get()),
    "data-complete": flag(value.get().length === length()),
  })

  function slot(index: number): OtpSlot {
    const found = slots.get(index)
    if (found) return found
    const char = computed(() => value.get()[index] ?? "")
    const active = computed(() => {
      if (!focused.get()) return false
      const [start, end] = selection.get()
      // With every cell full the caret is after the last: the last cell shows it.
      if (start === end) return index === Math.min(start, length() - 1)
      return index >= start && index < end
    })
    const caret = computed(() => active.get() && char.get() === "")
    const made: OtpSlot = {
      char,
      active,
      caret,
      part: {
        props: computed(() => ({
          // The code's state, as Base UI's each character carries it, and the cell's own.
          ...state(),
          "data-index": String(index),
          "data-active": flag(active.get()),
          "data-filled": flag(char.get() !== ""),
          // A press on a cell goes to the input, with the caret there.
          onPointerDown(event: PointerEvent) {
            event.preventDefault()
            place(index)
          },
        })),
        attach: () => NOTHING,
      },
    }
    slots.set(index, made)
    return made
  }

  return {
    value,
    setValue,
    slot,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        ...state(),
        "data-filled": flag(value.get() !== ""),
      })),
      attach: () => NOTHING,
    },
    group: { props: computed(() => ({})), attach: () => NOTHING },
    separator: { props: computed(() => ({ role: "separator" })), attach: () => NOTHING },
    caretPart: { props: computed(() => ({ "aria-hidden": "true" })), attach: () => NOTHING },
    input: {
      props: computed(() => {
        const mode = validation(props.get())
        return {
          id: props.get().id,
          type: "text",
          // The code it holds, so a server draws it. In a page the core writes it too: a
          // framework writes in its own time, after what was typed since.
          value: value.get(),
          inputmode: mode === "numeric" ? "numeric" : "text",
          // What a phone offers from the message the code came in.
          autocomplete: "one-time-code",
          maxlength: String(length()),
          pattern: mode === "numeric" && !props.get().pattern ? "[0-9]*" : undefined,
          // In a field the name is the field's when the code has none.
          name: props.get().name ?? field?.name.get(),
          form: props.get().form,
          disabled: flag(disabled.get()),
          readonly: flag(readOnly.get()),
          // Never `required`: in a field the field checks it, and words the message.
          "aria-required": props.get().required ? "true" : undefined,
          ...field?.aria(),
          "data-disabled": flag(disabled.get()),
          // What may not be in a code never goes in: refused before the input changes, so the
          // browser's undo holds only what was really typed.
          onBeforeInput(event: InputEvent) {
            // A paste's text is the event's own in an input, or in what it carries.
            const text = event.data ?? event.dataTransfer?.getData("text/plain")
            if (text === null || text === undefined || text === "") return
            const kept = keep(text, rule())
            if (kept === text) return
            event.preventDefault()
            // A paste with spaces or dashes in it: what is left of it goes in.
            const target = event.currentTarget as HTMLInputElement
            if (kept !== "") target.ownerDocument.execCommand("insertText", false, kept)
          },
          onInput(event: Event) {
            const target = event.currentTarget as HTMLInputElement
            setValue(target.value, details("input-change", event))
            read()
          },
          onFocus(event: FocusEvent) {
            focused.set(true)
            // Arriving by Tab, the caret goes after what is there.
            const target = event.currentTarget as HTMLInputElement
            const end = target.value.length
            if (target.selectionStart === 0 && target.selectionEnd === 0 && end > 0) {
              target.setSelectionRange(end, end)
            }
            read()
            member?.focused(true)
          },
          onBlur() {
            focused.set(false)
            member?.focused(false)
          },
          onKeyUp: read,
          onSelect: read,
        }
      }),
      attach(element) {
        input = element as HTMLInputElement
        const document = element.ownerDocument
        const changed = () => {
          if (document.activeElement === element) read()
        }
        // The arrows and a drag move the selection with no event on the input itself.
        document.addEventListener("selectionchange", changed)
        // In a field, the code is its control: the label is for the input, and the field checks it.
        member = field?.join({
          element,
          focus: () => element.focus(),
          kind: "text",
          required: () => Boolean(props.peek().required),
          value: value.peek(),
        })
        const stops = [
          () => {
            member?.leave()
            member = undefined
          },
          () => document.removeEventListener("selectionchange", changed),
          inForm.attach(element),
          // The input's text is the core's to write: a framework that held it would write it
          // in its own time, after what was typed since.
          effect(() => {
            const text = value.get()
            if (input && input.value !== text) input.value = text
          }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
          if (input === element) input = undefined
        }
      },
    },
  }
}
