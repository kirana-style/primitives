import { details } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

/** When a field checks its value. Once it is found invalid, it checks on every change. */
export type ValidationMode = "onSubmit" | "onBlur" | "onChange"

export type FormErrors = Record<string, string | readonly string[]>
export type FormValues = Record<string, FormDataEntryValue | FormDataEntryValue[]>

export interface FormProps {
  /** Errors from outside the page (a server's), by field name. A field shows its own until its value changes. */
  errors?: FormErrors | undefined
  /** A field's value changed while it showed an error from `errors`: what is left of them. */
  onClearErrors?: ((errors: FormErrors) => void) | undefined
  /**
   * Every field is valid. Given this, the page is not left: the values come as an object.
   * Without it, the form submits as a form does.
   */
  onFormSubmit?: ((values: FormValues, details: ChangeDetails) => void) | undefined
  /** When the form's fields check their values, unless a field says otherwise. Default `"onSubmit"`. */
  validationMode?: ValidationMode | undefined
}

/** What a field gives the form it is in. */
export interface FormField {
  readonly element: HTMLElement
  focus(): void
  /** Checks the value now, and says whether it is valid. */
  validate(): boolean | Promise<boolean>
}

export interface Form {
  readonly validationMode: ReadonlySignal<ValidationMode>
  /** The errors from outside for a field's name, until its value changes. */
  errorsFor(name: () => string | undefined): ReadonlySignal<readonly string[]>
  /** A field's value changed: its errors from outside are over. */
  clear(name: string): void
  register(field: FormField): () => void
  mount(): () => void
  readonly root: Part
}

const NOTHING = () => {}
const NONE: readonly string[] = []

function values(form: HTMLFormElement): FormValues {
  const out: FormValues = {}
  for (const [name, value] of new FormData(form)) {
    const held = out[name]
    if (held === undefined) out[name] = value
    else if (Array.isArray(held)) held.push(value)
    else out[name] = [held, value]
  }
  return out
}

/**
 * A form whose fields say what is wrong themselves: the browser's own bubbles are off
 * (`novalidate`), a submit checks every field and stops at the first that is invalid, with focus
 * on it.
 */
export function createForm(props: ReadonlySignal<FormProps>): Form {
  const fields = new Set<FormField>()
  // The names whose errors a change of value dismissed, for the `errors` they were dismissed from.
  const cleared = signal<{ of: FormErrors | undefined; names: readonly string[] }>({
    of: undefined,
    names: [],
  })

  function firstInvalid(results: boolean[], list: FormField[]) {
    list
      .filter((_each, index) => !results[index])
      .sort((a, b) =>
        a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      )[0]
      ?.focus()
  }

  function send(form: HTMLFormElement, event: Event) {
    const { onFormSubmit } = props.peek()
    if (onFormSubmit) onFormSubmit(values(form), details("submit", event))
    // A check that had to wait stopped the event: the form goes now, as it would have.
    else if (event.defaultPrevented) form.submit()
  }

  return {
    validationMode: computed(() => props.get().validationMode ?? "onSubmit"),
    errorsFor(name) {
      return computed(
        () => {
          const key = name()
          const errors = props.get().errors
          const dismissed = cleared.get()
          if (!key || !errors || (dismissed.of === errors && dismissed.names.includes(key)))
            return NONE
          const given = errors[key]
          if (given === undefined) return NONE
          return typeof given === "string" ? [given] : given
        },
        (a, b) => a.length === b.length && a.every((each, index) => each === b[index])
      )
    },
    clear(name) {
      const errors = props.peek().errors
      if (!errors || !(name in errors)) return
      const dismissed = cleared.peek()
      const names = dismissed.of === errors ? dismissed.names : []
      if (names.includes(name)) return
      cleared.set({ of: errors, names: [...names, name] })
      const left: FormErrors = {}
      for (const key in errors) if (key !== name && !names.includes(key)) left[key] = errors[key]!
      props.peek().onClearErrors?.(left)
    },
    register(field) {
      fields.add(field)
      return () => void fields.delete(field)
    },
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        // The fields say what is wrong: the browser's bubbles would say it twice.
        novalidate: "",
        onSubmit(event: Event) {
          const form = event.currentTarget as HTMLFormElement
          const list = [...fields]
          const results = list.map((each) => each.validate())
          if (results.some((each) => typeof each !== "boolean")) {
            event.preventDefault()
            void Promise.all(results.map((each) => Promise.resolve(each))).then((settled) => {
              if (settled.every(Boolean)) send(form, event)
              else firstInvalid(settled, list)
            })
            return
          }
          if (!(results as boolean[]).every(Boolean)) {
            event.preventDefault()
            firstInvalid(results as boolean[], list)
            return
          }
          if (props.peek().onFormSubmit) event.preventDefault()
          send(form, event)
        },
      })),
      attach: () => NOTHING,
    },
  }
}
