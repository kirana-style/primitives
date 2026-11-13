import { signal } from "../reactivity.ts"
import type { ReadonlySignal } from "../reactivity.ts"

type Reset = (event: Event) => void

interface Listener {
  readonly control: HTMLElement
  readonly reset: Reset
}

// One listener for each window or shadow root, however many controls are in it.
const listening = new WeakMap<EventTarget, Set<Listener>>()

function heard(this: EventTarget, event: Event) {
  // A reset a listener cancelled does not happen.
  if (event.defaultPrevented) return
  for (const each of listening.get(this) ?? []) {
    if (formOf(each.control) === event.target) each.reset(event)
  }
}

/** The form a control belongs to: around it, or the one its `form` attribute names. */
export function formOf(control: Element): HTMLFormElement | null {
  return (control as Partial<HTMLInputElement>).form ?? null
}

/**
 * Tells a control that its form is being reset, as a native one is told. `reset` runs at the
 * end of the event's way up, after every listener that could cancel it and before the browser
 * puts the native controls back, so what it writes on a native input is what the browser then
 * reads. The control is one a form knows (an `<input>`, a `<button>`), in the form or naming it
 * with `form`.
 */
export function onFormReset(control: HTMLElement, reset: Reset): () => void {
  const listener: Listener = { control, reset }
  let target: EventTarget | undefined
  let live = true

  const start = () => {
    if (!live) return
    // `reset` does not leave a shadow tree: inside one, its root is where it ends.
    const root = control.getRootNode()
    target = root instanceof ShadowRoot ? root : (control.ownerDocument.defaultView ?? root)
    let set = listening.get(target)
    if (!set) {
      listening.set(target, (set = new Set()))
      target.addEventListener("reset", heard)
    }
    set.add(listener)
  }
  // A framework may hand the element over before it is in the page (Vue, in a subtree it is
  // still building): where it will be is known a moment later.
  if (control.isConnected) start()
  else queueMicrotask(start)

  return () => {
    live = false
    if (!target) return
    const set = listening.get(target)
    set?.delete(listener)
    if (set?.size === 0) {
      listening.delete(target)
      target.removeEventListener("reset", heard)
    }
  }
}

/**
 * Whether a `<fieldset disabled>` around the element disables it, as it does a native control:
 * any ancestor fieldset counts, but for what is inside that fieldset's first `<legend>`.
 */
export function inDisabledFieldset(element: Element): boolean {
  for (
    let fieldset = element.parentElement?.closest("fieldset");
    fieldset;
    fieldset = fieldset.parentElement?.closest("fieldset")
  ) {
    if (!fieldset.disabled) continue
    const legend = fieldset.querySelector(":scope > legend")
    if (!legend?.contains(element)) return true
  }
  return false
}

export interface FormControl {
  /** Whether a `<fieldset disabled>` around the control disables it. */
  readonly disabled: ReadonlySignal<boolean>
  /** For the element a form knows the control by: its hidden input, its button. */
  attach(element: HTMLElement): () => void
}

/**
 * What a control that is not a native one owes the form around it: back to its first value when
 * the form is reset, and disabled while a `<fieldset disabled>` holds it. A control with several
 * elements in the form (a range's thumbs, a group's radios) attaches each, and hears one reset.
 * `settle` runs a task later, when the native controls are back at their defaults: where a
 * control checks that its native inputs say what it does.
 */
export function createFormControl(reset: Reset, settle?: () => void): FormControl {
  const disabled = signal(false)
  const elements = new Set<HTMLElement>()
  const done = new WeakSet<Event>()

  const once: Reset = (event) => {
    if (done.has(event)) return
    done.add(event)
    reset(event)
    // Once the browser has put the native controls back, and a caller's framework has drawn.
    if (settle) setTimeout(() => elements.size > 0 && settle())
  }
  const read = () => disabled.set([...elements].some(inDisabledFieldset))

  return {
    disabled,
    attach(element) {
      elements.add(element)
      const stop = onFormReset(element, once)
      let observer: MutationObserver | undefined
      let live = true

      const watch = () => {
        if (!live) return
        // Only a control inside a fieldset pays for watching one.
        for (
          let fieldset = element.parentElement?.closest("fieldset");
          fieldset;
          fieldset = fieldset.parentElement?.closest("fieldset")
        ) {
          observer ??= new MutationObserver(read)
          observer.observe(fieldset, { attributes: true, attributeFilter: ["disabled"] })
        }
        if (observer) read()
      }
      if (element.isConnected) watch()
      else queueMicrotask(watch)

      return () => {
        live = false
        stop()
        observer?.disconnect()
        elements.delete(element)
        if (observer) read()
      }
    },
  }
}
