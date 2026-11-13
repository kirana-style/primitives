import type { Fieldset } from "./fieldset.ts"
import type { Form, ValidationMode } from "./form.ts"
import { flag } from "./part.ts"
import type { Part } from "./part.ts"
import { batch, computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { onFormReset } from "./services/form-control.ts"
import { createPresence } from "./services/presence.ts"

/** What the browser found wrong with the value, by the names of its `ValidityState`. */
export type ValidityKey = Exclude<keyof ValidityState, "valid">

const KEYS: ValidityKey[] = [
  "badInput",
  "customError",
  "patternMismatch",
  "rangeOverflow",
  "rangeUnderflow",
  "stepMismatch",
  "tooLong",
  "tooShort",
  "typeMismatch",
  "valueMissing",
]

export interface FieldValidity {
  /** `null` until the value has been checked. */
  readonly valid: boolean | null
  /** What is wrong, one message each. */
  readonly errors: readonly string[]
  /** What the browser found, by name; `customError` is the field's own `validate`. */
  readonly state: Readonly<Record<ValidityKey, boolean>>
  /** The value that was checked. */
  readonly value: string
}

export type FieldControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export interface FieldProps {
  id: string
  /** The control's name in the form. */
  name?: string | undefined
  disabled?: boolean | undefined
  /** Invalid whatever the value: an error known from elsewhere. */
  invalid?: boolean | undefined
  /**
   * The field's own check, after the browser's: a message or several when the value is wrong,
   * `null` when it is right. It may answer later, with a promise.
   */
  validate?:
    | ((
        value: string
      ) => string | readonly string[] | null | Promise<string | readonly string[] | null>)
    | undefined
  /** When the value is checked; the form's by default, else `"onSubmit"`. */
  validationMode?: ValidationMode | undefined
  /** With `"onChange"`, how long the value must rest before it is checked, in milliseconds. */
  validationDebounceTime?: number | undefined
}

/** A control that is not a native one, as it joins a field: a checkbox, a select, a slider. */
export interface FieldSubject {
  /** Where the control is in the page: a form goes to its invalid fields in the page's order. */
  readonly element: HTMLElement
  focus(): void
  /** The native control it stands for: the browser words "this is required" for each its own way. */
  readonly kind: "checkbox" | "radio" | "select" | "range"
  required(): boolean
  /** Its value as text when it joins; empty is "none". */
  readonly value: string
}

/** What a control that joined a field tells it. */
export interface FieldMembership {
  changed(value: string): void
  /** Its form was reset: the value it went back to. The field is as new again. */
  reset(value: string): void
  focused(on: boolean): void
  leave(): void
}

/** A message of the field's, in the page while it applies and through its exit. */
export interface FieldError {
  readonly mounted: ReadonlySignal<boolean>
  /** The messages, one a line. */
  readonly text: ReadonlySignal<string>
  readonly part: Part
  mount(): () => void
}

export interface Field {
  readonly validity: ReadonlySignal<FieldValidity>
  /** Whether the field is invalid: by its value, by `invalid`, or by its form's errors. */
  readonly invalid: ReadonlySignal<boolean>
  /** What is wrong: the form's errors for the field, else its own. */
  readonly errors: ReadonlySignal<readonly string[]>
  readonly touched: ReadonlySignal<boolean>
  readonly dirty: ReadonlySignal<boolean>
  readonly filled: ReadonlySignal<boolean>
  readonly focused: ReadonlySignal<boolean>
  /** Checks the value now, and says whether it is valid. */
  validate(): boolean | Promise<boolean>
  /** The id the control's element takes, which the label is `for`. */
  readonly controlId: string
  readonly name: ReadonlySignal<string | undefined>
  /** Disabled by the field or by the fieldset around it. */
  readonly disabled: ReadonlySignal<boolean>
  /** The field's state as attributes, for a part of a control inside it. */
  state(): Record<string, "" | undefined>
  /** What a control's own element says of the field: its label, its description, its errors. */
  aria(): Record<string, string | undefined>
  /** A control that is not a native one joins the field. */
  join(subject: FieldSubject): FieldMembership
  mount(): () => void
  readonly root: Part
  readonly label: Part
  /** The control: an `<input>`, a `<textarea>` or a `<select>`. */
  readonly control: Part
  readonly description: Part
  /**
   * A message. With no `match` it shows whatever is wrong; with one of the browser's names
   * (`"valueMissing"`) only that; with `true`, always.
   */
  error(match?: () => ValidityKey | boolean | undefined): FieldError
}

const NOTHING = () => {}
const CLEAN = Object.fromEntries(KEYS.map((key) => [key, false])) as Record<ValidityKey, boolean>
const UNCHECKED: FieldValidity = { valid: null, errors: [], state: CLEAN, value: "" }

/** What a field checks: a native control, or one that joined. */
interface Checked {
  readonly element: HTMLElement
  focus(): void
  value(): string
  /** The browser's findings and its message for them. */
  native(): { state: Record<ValidityKey, boolean>; message: string | undefined }
  /** Tells the control the field's own message, where it can hold one. */
  mark(message: string): void
}

/** How the browser says "this is required" for a kind of control, in the page's language. */
function wording(kind: FieldSubject["kind"], page: Document): string {
  if (kind === "select") {
    const probe = page.createElement("select")
    probe.required = true
    return probe.validationMessage
  }
  const probe = page.createElement("input")
  probe.type = kind === "range" ? "text" : kind
  // A radio with no name is in no group, and a browser finds nothing missing in it.
  probe.name = "probe"
  probe.required = true
  return probe.validationMessage
}

/** What a form's reset puts a control's value back to, as text. */
function resting(control: FieldControl): string {
  if (control instanceof HTMLSelectElement) {
    const options = [...control.options]
    const chosen = options.find((each) => each.defaultSelected)
    // With none marked, a list of one line goes back to its first choice.
    return (
      (chosen ?? (control.multiple ? undefined : options.find((each) => !each.disabled)))?.value ??
      ""
    )
  }
  if (
    control instanceof HTMLInputElement &&
    (control.type === "checkbox" || control.type === "radio")
  )
    return control.defaultChecked ? control.value : ""
  return control.defaultValue
}

/** A control's value as text: a box that is not ticked has none. */
function read(control: FieldControl): string {
  if (
    control instanceof HTMLInputElement &&
    (control.type === "checkbox" || control.type === "radio")
  )
    return control.checked ? control.value : ""
  return control.value
}

/**
 * A control with its label, its description and what is wrong with its value. The field names
 * the control for its label, says the description and the errors to assistive technology, and
 * marks every part with the field's state: touched, dirty, filled, focused, valid or invalid.
 */
export function createField(
  props: ReadonlySignal<FieldProps>,
  around: { form?: Form | undefined; fieldset?: Fieldset | undefined } = {}
): Field {
  const id = props.peek().id
  const { form, fieldset } = around
  const validity = signal<FieldValidity>(UNCHECKED)
  const touched = signal(false)
  const dirty = signal(false)
  const filled = signal(false)
  const focused = signal(false)
  const described = signal(false)
  const labelled = signal(false)
  // How many messages are in the page: the control points at them while there is one.
  const shown = signal(0)

  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(fieldset?.disabled.get())
  )
  const mode = computed(
    () => props.get().validationMode ?? form?.validationMode.get() ?? "onSubmit"
  )
  const outside = form?.errorsFor(() => props.get().name)
  const invalid = computed(
    () =>
      Boolean(props.get().invalid) ||
      (outside ? outside.get().length > 0 : false) ||
      validity.get().valid === false
  )
  const errors = computed(() => {
    const given = outside?.get() ?? []
    return given.length > 0 ? given : validity.get().errors
  })

  let subject: Checked | undefined
  // A control that is not native has no element the label is `for`: a press on the label goes to it.
  let joined: FieldSubject | undefined
  let initial = ""
  let timer: ReturnType<typeof setTimeout> | undefined
  // Bumped by every check: an answer that comes late knows it is stale.
  let run = 0

  const state = () => ({
    "data-disabled": flag(disabled.get()),
    "data-touched": flag(touched.get()),
    "data-dirty": flag(dirty.get()),
    "data-filled": flag(filled.get()),
    "data-focused": flag(focused.get()),
    "data-valid": flag(!invalid.get() && validity.get().valid === true),
    "data-invalid": flag(invalid.get()),
  })

  const says = () => {
    const ids = [
      described.get() ? `${id}-description` : undefined,
      shown.get() > 0 ? `${id}-error` : undefined,
    ].filter(Boolean)
    return {
      "aria-describedby": ids.length > 0 ? ids.join(" ") : undefined,
      "aria-invalid": invalid.get() ? "true" : undefined,
    }
  }

  function settle(
    checked: Checked,
    value: string,
    found: { state: Record<ValidityKey, boolean>; message: string | undefined },
    own: readonly string[]
  ): boolean {
    const wrong = found.message !== undefined
    const messages = wrong ? [found.message!] : own
    const flags = { ...found.state, customError: own.length > 0 }
    // What `:invalid` and a plain form's own check read.
    checked.mark(wrong ? "" : own.join("\n"))
    const valid = messages.length === 0
    validity.set({ valid, errors: messages, state: flags, value })
    return valid
  }

  function validate(): boolean | Promise<boolean> {
    const checked = subject
    if (!checked || disabled.peek()) return true
    clearTimeout(timer)
    const token = ++run
    const value = checked.value()
    const found = checked.native()
    if (found.message !== undefined) return settle(checked, value, found, [])
    const answer = props.peek().validate?.(value) ?? null
    const list = (given: string | readonly string[] | null) =>
      given === null ? [] : typeof given === "string" ? [given] : given
    if (answer instanceof Promise) {
      return answer.then((given) =>
        token === run ? settle(checked, value, found, list(given)) : validity.peek().valid !== false
      )
    }
    return settle(checked, value, found, list(answer))
  }

  function changed(value: string) {
    batch(() => {
      dirty.set(value !== initial)
      filled.set(value !== "")
    })
    const name = props.peek().name
    if (name) form?.clear(name)
    if (validity.peek().valid === false) {
      // Found wrong once, it is checked as it changes: the message leaves when it is put right.
      void validate()
    } else if (mode.peek() === "onChange") {
      const wait = props.peek().validationDebounceTime ?? 0
      clearTimeout(timer)
      if (wait > 0) timer = setTimeout(() => void validate(), wait)
      else void validate()
    }
  }

  /** After its form's reset: untouched, clean, unchecked, with the value the control went back to. */
  function reset(value: string) {
    clearTimeout(timer)
    run++
    subject?.mark("")
    initial = value
    batch(() => {
      touched.set(false)
      dirty.set(false)
      filled.set(value !== "")
      validity.set(UNCHECKED)
    })
  }

  function left() {
    batch(() => {
      focused.set(false)
      touched.set(true)
    })
    if (mode.peek() === "onBlur") void validate()
  }

  /** Takes a control as the field's, and gives it to the form. Returns the release. */
  function take(checked: Checked): () => void {
    subject = checked
    initial = checked.value()
    filled.set(initial !== "")
    const leave = form?.register({
      element: checked.element,
      focus: () => checked.focus(),
      validate,
    })
    return () => {
      leave?.()
      if (subject === checked) subject = undefined
    }
  }

  return {
    validity,
    invalid,
    errors,
    touched,
    dirty,
    filled,
    focused,
    validate,
    controlId: `${id}-control`,
    name: computed(() => props.get().name),
    disabled,
    state,
    aria: () => ({
      "aria-labelledby": labelled.get() ? `${id}-label` : undefined,
      ...says(),
    }),
    join(control) {
      joined = control
      let current = control.value
      const release = take({
        element: control.element,
        focus: () => control.focus(),
        value: () => current,
        native() {
          const missing = control.required() && current === ""
          return {
            state: { ...CLEAN, valueMissing: missing },
            message: missing ? wording(control.kind, control.element.ownerDocument) : undefined,
          }
        },
        // Its hidden input holds no message: a plain form could not show one on it.
        mark: NOTHING,
      })
      return {
        changed(value) {
          current = value
          changed(value)
        },
        reset(value) {
          current = value
          reset(value)
        },
        focused(on) {
          if (on) focused.set(true)
          else left()
        },
        leave() {
          release()
          if (joined === control) joined = undefined
        },
      }
    },
    mount: () => () => clearTimeout(timer),
    root: { props: computed(state), attach: () => NOTHING },
    label: {
      props: computed(() => ({
        id: `${id}-label`,
        for: `${id}-control`,
        ...state(),
        onClick(event: Event) {
          // A box has its hidden native input, which the label presses by itself. Any other
          // control takes focus, and no more: a label must not press a select's trigger open.
          if (!joined || joined.kind === "checkbox") return
          event.preventDefault()
          joined.focus()
        },
      })),
      attach() {
        labelled.set(true)
        return () => labelled.set(false)
      },
    },
    control: {
      props: computed(() => ({
        id: `${id}-control`,
        name: props.get().name,
        disabled: flag(disabled.get()),
        ...says(),
        ...state(),
        onFocus: () => focused.set(true),
        onBlur: left,
        onInput: (event: Event) => changed(read(event.currentTarget as FieldControl)),
        // A plain form's own check found the value wrong: the field says so too.
        onInvalid() {
          touched.set(true)
          void validate()
        },
      })),
      attach(element) {
        const control = element as FieldControl
        // The browser puts the value back after the event: what it will be is read from the
        // control's defaults.
        const unhear = onFormReset(element, () => reset(resting(control)))
        const release = take({
          element,
          focus: () => control.focus(),
          value: () => read(control),
          native() {
            // The field's own message from last time is not the browser's finding.
            control.setCustomValidity("")
            const found = { ...CLEAN }
            for (const key of KEYS) found[key] = control.validity[key]
            return {
              state: found,
              message: control.validity.valid ? undefined : control.validationMessage,
            }
          },
          mark: (message) => control.setCustomValidity(message),
        })
        return () => {
          unhear()
          release()
        }
      },
    },
    description: {
      props: computed(() => ({ id: `${id}-description`, ...state() })),
      attach() {
        described.set(true)
        return () => described.set(false)
      },
    },
    error(match = () => undefined) {
      const applies = computed(() => {
        const wanted = match()
        if (wanted === true) return true
        if (!invalid.get()) return false
        return typeof wanted === "string" ? validity.get().state[wanted] : true
      })
      const presence = createPresence(applies)
      return {
        mounted: presence.mounted,
        text: computed(() => errors.get().join("\n")),
        mount: () => presence.start(),
        part: {
          props: computed(() => {
            const status = presence.status.get()
            return {
              id: `${id}-error`,
              ...state(),
              "data-starting-style": flag(status === "starting"),
              "data-ending-style": flag(status === "ending"),
            }
          }),
          attach(element) {
            shown.set(shown.peek() + 1)
            const detach = presence.attach(element)
            return () => {
              detach()
              shown.set(shown.peek() - 1)
            }
          },
        },
      }
    },
  }
}
