import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createFormControl } from "./services/form-control.ts"

export interface OtpProps {
  id: string
  /** How many characters the code has. Default: 6. */
  length?: number | undefined
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string, details: ChangeDetails) => void) | undefined
  /** Every character is in: the moment to send the code. */
  onComplete?: ((value: string) => void) | undefined
  /** What a character may be. Default: `numeric`. */
  mode?: "numeric" | "alphanumeric" | "text" | undefined
  disabled?: boolean | undefined
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

const NOTHING = () => {}
const ALLOWED = { numeric: /[^0-9]/g, alphanumeric: /[^0-9a-zA-Z]/g, text: /[\s]/g }

/**
 * A one-time code: one text input, and a cell drawn for each of its characters. One input, so a
 * code pasted, autofilled from a message or typed by a screen reader's user goes in as into any
 * input, and the browser's own selection, undo and deletion are the component's.
 */
export function createOtp(props: ReadonlySignal<OtpProps>): Otp {
  const length = () => Math.max(1, props.peek().length ?? 6)
  const clean = (text: string) =>
    text.replace(ALLOWED[props.peek().mode ?? "numeric"], "").slice(0, length())
  const value = bindable<string>({
    value: () => props.get().value,
    defaultValue: clean(props.peek().defaultValue ?? ""),
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  const initial = value.peek()
  const inForm = createFormControl((event) => {
    // The browser puts the input back to its default next: the default is what it should say.
    if (input) input.defaultValue = initial
    value.set(initial, details("form-reset", event))
  })
  const disabled = computed(() => Boolean(props.get().disabled) || inForm.disabled.get())
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
    // What was asked for, not what is read back.
    if (!by.canceled && text !== before && text.length === length()) {
      props.peek().onComplete?.(text)
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
          "data-index": String(index),
          "data-active": flag(active.get()),
          "data-filled": flag(char.get() !== ""),
          "data-disabled": flag(disabled.get()),
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
        "data-disabled": flag(disabled.get()),
        "data-focused": flag(focused.get()),
        "data-complete": flag(value.get().length === length()),
      })),
      attach: () => NOTHING,
    },
    group: { props: computed(() => ({})), attach: () => NOTHING },
    separator: { props: computed(() => ({ role: "separator" })), attach: () => NOTHING },
    caretPart: { props: computed(() => ({ "aria-hidden": "true" })), attach: () => NOTHING },
    input: {
      props: computed(() => {
        const mode = props.get().mode ?? "numeric"
        return {
          id: props.get().id,
          type: "text",
          inputmode: mode === "numeric" ? "numeric" : "text",
          // What a phone offers from the message the code came in.
          autocomplete: "one-time-code",
          maxlength: String(length()),
          pattern: mode === "numeric" ? "[0-9]*" : undefined,
          name: props.get().name,
          form: props.get().form,
          disabled: flag(disabled.get()),
          "data-disabled": flag(disabled.get()),
          // What may not be in a code never goes in: refused before the input changes, so the
          // browser's undo holds only what was really typed.
          onBeforeInput(event: InputEvent) {
            // A paste's text is the event's own in an input, or in what it carries.
            const text = event.data ?? event.dataTransfer?.getData("text/plain")
            if (text === null || text === undefined || text === "") return
            const kept = text.replace(ALLOWED[props.peek().mode ?? "numeric"], "")
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
          },
          onBlur: () => focused.set(false),
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
        const stops = [
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
