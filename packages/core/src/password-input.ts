import { bindable } from "./bindable.ts"
import type { Field } from "./field.ts"
import { createInput } from "./input.ts"
import type { InputProps } from "./input.ts"
import { defaultLabel, details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { onFormReset } from "./services/form-control.ts"

export interface PasswordInputProps extends InputProps {
  /** Whether the password can be read, when the caller holds it. */
  visible?: boolean | undefined
  /** Read once. Default `false`. */
  defaultVisible?: boolean | undefined
  /** Heard as it is about to be shown or hidden: `details.cancel()` keeps it as it was. */
  onVisibleChange?: ((visible: boolean, details: ChangeDetails) => void) | undefined
  /**
   * What the toggle is called, for assistive technology: `show` while the password is hidden,
   * `hide` while it is shown. Default: `"Show password"` and `"Hide password"`. An `aria-label`
   * given to the toggle itself wins over both.
   */
  toggleLabels?: { show?: string | undefined; hide?: string | undefined } | undefined
}

export interface PasswordInput {
  readonly visible: ReadonlySignal<boolean>
  setVisible(visible: boolean, details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  /** An `<input>`: a password, or text while it is shown. */
  readonly input: Part
  /** Shows the password, and hides it again: named by `toggleLabels`, or by its own `aria-label`. */
  readonly toggle: Part
  /** What draws which of the two it is (an eye, open or struck): it says the state only. */
  readonly indicator: Part
}

const NOTHING = () => {}

/**
 * A password that can be shown while it is typed. The button that shows it leaves focus and the
 * caret where they are, and the password is hidden again as its form is submitted or reset.
 */
export function createPasswordInput(
  props: ReadonlySignal<PasswordInputProps>,
  around: { field?: Field | undefined } = {}
): PasswordInput {
  const inner = createInput(props, around)
  const visible = bindable<boolean>({
    value: () => props.get().visible,
    defaultValue: props.peek().defaultVisible ?? false,
    onChange: (next, by) => props.peek().onVisibleChange?.(next, by),
  })
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(around.field?.disabled.get())
  )
  let input: HTMLInputElement | undefined

  function setVisible(next: boolean, by: ChangeDetails) {
    if (next === visible.peek()) return
    const focused = input !== undefined && input.ownerDocument.activeElement === input
    const from = input?.selectionStart ?? null
    const to = input?.selectionEnd ?? null
    visible.set(next, by)
    if (by.canceled || !input) return
    // Here and now, as the part's props will say: a browser drops the caret when the type
    // changes, and it is put back where it was.
    input.type = next ? "text" : "password"
    if (focused && from !== null) input.setSelectionRange(from, to)
  }

  const state = () => ({
    "data-visible": flag(visible.get()),
    "data-disabled": flag(disabled.get()),
  })

  return {
    visible,
    setVisible,
    mount: inner.mount,
    root: { props: computed(state), attach: () => NOTHING },
    input: {
      props: computed(() => ({
        ...inner.input.props.get(),
        type: visible.get() ? "text" : "password",
        // A password is not a word: nothing corrects or capitalises it.
        spellcheck: "false",
        autocapitalize: "off",
        "data-visible": flag(visible.get()),
      })),
      attach(element) {
        input = element as HTMLInputElement
        const leave = inner.input.attach(element)
        // Never sent, kept or left on a screen as text: hidden as its form goes or starts again.
        const form = input.form
        const hide = (event: Event) => setVisible(false, details("form-submit", event))
        form?.addEventListener("submit", hide)
        const stop = onFormReset(element, (event) =>
          setVisible(false, details("form-reset", event))
        )
        return () => {
          stop()
          form?.removeEventListener("submit", hide)
          leave()
          if (input === element) input = undefined
        }
      },
    },
    toggle: {
      props: computed(() => ({
        type: "button",
        // Its name says what a press does, and so the state: no `aria-pressed` beside it, which
        // a screen reader would read as the state a second time.
        // A default only: the caller's own `aria-label` on the toggle wins.
        ...defaultLabel(
          visible.get()
            ? (props.get().toggleLabels?.hide ?? "Hide password")
            : (props.get().toggleLabels?.show ?? "Show password")
        ),
        disabled: flag(disabled.get()),
        ...state(),
        onPointerDown(event: PointerEvent) {
          // A mouse's press would take focus from the input, and the caret with it.
          if (event.pointerType === "mouse") event.preventDefault()
        },
        onClick: (event: Event) => setVisible(!visible.peek(), details("toggle-press", event)),
      })),
      attach: () => NOTHING,
    },
    indicator: {
      props: computed(() => ({ "aria-hidden": "true", ...state() })),
      attach: () => NOTHING,
    },
  }
}
