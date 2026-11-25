import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { onFormReset } from "./services/form-control.ts"

export interface EditableProps {
  id: string
  /** The text it holds: what the preview shows, and what editing starts from. */
  value?: string | undefined
  /** The text it starts with, when the caller does not hold `value`. Read once. */
  defaultValue?: string | undefined
  /** Heard as an edit is about to be kept: `details.cancel()` keeps the text, and the edit open. */
  onValueChange?: ((value: string, details: ChangeDetails) => void) | undefined
  /** Whether it is being edited, when the caller holds it. */
  editing?: boolean | undefined
  /** Read once. */
  defaultEditing?: boolean | undefined
  /** Heard as editing is about to start or end: `details.cancel()` keeps it as it was. */
  onEditingChange?: ((editing: boolean, details: ChangeDetails) => void) | undefined
  /** What the preview shows while the text is empty. */
  placeholder?: string | undefined
  /**
   * What on the preview starts an edit: focus reaching it (the default), a press, two presses,
   * or nothing, where only the edit trigger does.
   */
  activation?: "focus" | "click" | "dblclick" | "none" | undefined
  /** Whether focus leaving the input keeps the edit (the default) or drops it. */
  submitOnBlur?: boolean | undefined
  /** Whether the text is selected as editing starts. Default `true`. */
  selectOnFocus?: boolean | undefined
  /** Disabled: it cannot be edited. */
  disabled?: boolean | undefined
  /** Shown as it is, not editable. */
  readOnly?: boolean | undefined
  /** With a name, the text is submitted with the form around it. */
  name?: string | undefined
  /** The id of the form the input belongs to, when it is not inside it. */
  form?: string | undefined
}

export interface Editable {
  readonly value: ReadonlySignal<string>
  readonly editing: ReadonlySignal<boolean>
  /** What the preview says: the text, or the placeholder while there is none. */
  readonly text: ReadonlySignal<string>
  /** Starts an edit. */
  edit(details: ChangeDetails): void
  /** Keeps what was typed, and ends the edit. */
  submit(details: ChangeDetails): void
  /** Drops what was typed, and ends the edit. */
  cancel(details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  /** The text as it reads: in the page always, hidden while editing. */
  readonly preview: Part
  /** An `<input>` or a `<textarea>`: in the page always, hidden unless editing. */
  readonly input: Part
  readonly editTrigger: Part
  readonly submitTrigger: Part
  readonly cancelTrigger: Part
}

const NOTHING = () => {}

/**
 * A text edited in place: it reads as text until it is edited, Enter or leaving keeps the edit,
 * Escape drops it, and focus goes back to where the edit began.
 */
export function createEditable(props: ReadonlySignal<EditableProps>): Editable {
  const id = props.peek().id
  const value = bindable<string>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? "",
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  const editing = bindable<boolean>({
    value: () => props.get().editing,
    defaultValue: props.peek().defaultEditing ?? false,
    onChange: (next, by) => props.peek().onEditingChange?.(next, by),
  })
  const disabled = computed(() => Boolean(props.get().disabled))
  const readOnly = computed(() => Boolean(props.get().readOnly))
  const activation = computed(() => props.get().activation ?? "focus")
  const text = computed(() => value.get() || (props.get().placeholder ?? ""))
  let input: HTMLInputElement | HTMLTextAreaElement | undefined
  let preview: HTMLElement | undefined
  let trigger: HTMLElement | undefined
  // Focus put back on the preview by the component itself starts no edit.
  let returning = false

  function edit(by: ChangeDetails) {
    if (disabled.peek() || readOnly.peek() || editing.peek()) return
    editing.set(true, by)
    if (by.canceled || !input) return
    // Shown here and now, as the part's props will say: focus cannot go to what is hidden,
    // and a framework draws in its own time.
    input.hidden = false
    input.value = value.peek()
    input.focus()
    if (props.peek().selectOnFocus ?? true) input.select()
  }

  /** Ends the edit, and takes focus back to where it began unless it has gone elsewhere. */
  function end(by: ChangeDetails, back: boolean) {
    editing.set(false, by)
    if (by.canceled) return
    if (input) input.value = value.peek()
    if (!back) return
    const to = trigger ?? preview
    if (!to) return
    to.hidden = false
    returning = true
    try {
      to.focus()
    } finally {
      returning = false
    }
  }

  function submit(by: ChangeDetails, back = true) {
    if (!editing.peek()) return
    const typed = input?.value ?? value.peek()
    if (typed !== value.peek()) {
      value.set(typed, by)
      // Refused: the edit stays open on what was typed.
      if (by.canceled) return
    }
    end(by, back)
  }

  function cancel(by: ChangeDetails, back = true) {
    if (editing.peek()) end(by, back)
  }

  const state = () => ({
    "data-editing": flag(editing.get()),
    "data-disabled": flag(disabled.get()),
    "data-readonly": flag(readOnly.get()),
    "data-placeholder": flag(value.get() === ""),
  })

  /** A button of the edit: pressed, focus stays in the input, so leaving it is not heard. */
  const button = (shown: () => boolean, press: (event: Event) => void): Part["props"] =>
    computed(() => ({
      type: "button",
      hidden: flag(!shown()),
      disabled: flag(disabled.get() || readOnly.get()),
      ...state(),
      onPointerDown(event: PointerEvent) {
        if (editing.peek()) event.preventDefault()
      },
      onClick: press,
    }))

  return {
    value,
    editing,
    text,
    edit,
    submit: (by) => submit(by),
    cancel: (by) => cancel(by),
    mount: () => NOTHING,
    root: { props: computed(state), attach: () => NOTHING },
    preview: {
      props: computed(() => {
        const can = !disabled.get() && !readOnly.get()
        const by = activation.get()
        return {
          hidden: flag(editing.get()),
          // Reached with Tab where focus is what starts an edit.
          tabindex: can && by === "focus" ? "0" : undefined,
          "aria-disabled": disabled.get() ? "true" : undefined,
          ...state(),
          onFocus(event: FocusEvent) {
            if (by === "focus" && !returning) edit(details("focus", event))
          },
          onClick(event: MouseEvent) {
            if (by === "click" || (by === "dblclick" && event.detail === 2))
              edit(details("preview-press", event))
          },
        }
      }),
      attach(element) {
        preview = element
        return () => {
          if (preview === element) preview = undefined
        }
      },
    },
    input: {
      props: computed(() => ({
        id,
        hidden: flag(!editing.get()),
        name: props.get().name,
        form: props.get().form,
        // What a server draws and a form reads; the text being typed is the element's own.
        value: value.get(),
        disabled: flag(disabled.get()),
        readonly: flag(readOnly.get()),
        ...state(),
        onKeyDown(event: KeyboardEvent) {
          if (event.isComposing) return
          if (event.key === "Escape") {
            event.preventDefault()
            cancel(details("escape-key", event))
          } else if (event.key === "Enter") {
            // In a text of several lines Enter is a new line: with Ctrl or ⌘ it keeps the edit.
            const lines = event.currentTarget instanceof HTMLTextAreaElement
            if (lines && !event.ctrlKey && !event.metaKey) return
            event.preventDefault()
            submit(details("enter-key", event))
          }
        },
        onBlur(event: FocusEvent) {
          if (!editing.peek()) return
          const by = details("blur", event)
          // Focus has gone where the person put it: it is not taken back.
          if (props.peek().submitOnBlur ?? true) submit(by, false)
          else cancel(by, false)
        },
      })),
      attach(element) {
        input = element as HTMLInputElement | HTMLTextAreaElement
        // While it is not edited the element holds the text kept, which is what a form reads.
        const follow = effect(() => {
          const kept = value.get()
          if (!input) return
          // And what the browser puts back when its form is reset, which it does after the
          // reset is heard: the text kept, not what the page was first drawn with.
          input.defaultValue = kept
          if (!editing.get()) input.value = kept
        })
        // Open as it comes into the page: focus goes in as it would when an edit starts.
        if (editing.peek() && element.ownerDocument.activeElement !== element) {
          input.hidden = false
          input.focus()
        }
        const stop = onFormReset(element, (event) => {
          const by = details("form-reset", event)
          cancel(by, false)
          value.set(props.peek().defaultValue ?? "", by)
        })
        return () => {
          stop()
          follow()
          if (input === element) input = undefined
        }
      },
    },
    editTrigger: {
      props: button(
        () => !editing.get(),
        (event) => edit(details("trigger-press", event))
      ),
      attach(element) {
        trigger = element
        return () => {
          if (trigger === element) trigger = undefined
        }
      },
    },
    submitTrigger: {
      props: button(
        () => editing.get(),
        (event) => submit(details("submit-press", event))
      ),
      attach: () => NOTHING,
    },
    cancelTrigger: {
      props: button(
        () => editing.get(),
        (event) => cancel(details("cancel-press", event))
      ),
      attach: () => NOTHING,
    },
  }
}
