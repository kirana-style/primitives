import { mergeProps, sameProps, signal, styleText } from "@kirana-ui/core"
import type { Part, PartProps, PartStyle, ReadonlySignal } from "@kirana-ui/core"
import { untrack } from "svelte"
import { createAttachmentKey } from "svelte/attachments"
import { createSubscriber } from "svelte/reactivity"

/** A core signal read as Svelte state: `current` is tracked by whatever reads it. */
export function fromSignal<T>(source: ReadonlySignal<T>): { readonly current: T } {
  const subscribe = createSubscriber((update) => source.subscribe(update))
  return {
    get current() {
      subscribe()
      return source.peek()
    },
  }
}

/**
 * A core signal that follows Svelte state: `read` runs before each update of the page, so the
 * core hears a changed prop before anything is drawn from it.
 */
export function toSignal<T extends Record<string, unknown>>(read: () => T): ReadonlySignal<T> {
  const source = signal(untrack(read), sameProps as (a: T, b: T) => boolean)
  $effect.pre(() => {
    source.set(read())
  })
  return source
}

/** A component's controller, made once, following its props. */
export function controller<P extends Record<string, unknown>, C extends { mount(): () => void }>(
  create: (props: ReadonlySignal<P>) => C,
  read: () => P
): C {
  const made = create(toSignal(read))
  $effect(() => untrack(() => made.mount()))
  return made
}

// HTML's boolean attributes, which Svelte sets as properties: a part's `""` means "present".
const BOOLEAN = new Set([
  "hidden",
  "disabled",
  "inert",
  "required",
  "readonly",
  "multiple",
  "checked",
  "novalidate",
])

function toSvelte(props: PartProps): PartProps {
  const out: PartProps = {}
  for (const key in props) {
    const value = props[key]
    if (typeof value === "function") {
      // `onKeyDown` is `onkeydown`; focus and blur are the bubbling ones, as in the core.
      const name = key.slice(2).toLowerCase()
      out[`on${name === "focus" ? "focusin" : name === "blur" ? "focusout" : name}`] = value
    } else if (key === "style" && value) {
      // Svelte writes a style as text.
      out.style = styleText(value as PartStyle)
    } else {
      out[key] = BOOLEAN.has(key) ? value === "" || value === true : value
    }
  }
  return out
}

/**
 * What a part's element spreads: the caller's props merged under the part's, and an attachment
 * that runs the part's DOM work. A `child` snippet spreads the same object on its own element.
 */
export function partProps(
  part: () => Part,
  caller: () => PartProps
): { readonly current: PartProps } {
  const key = createAttachmentKey()
  const own = $derived(fromSignal(part().props))
  // One function for the element's life: Svelte runs an attachment again when it is another.
  const attachment = (element: HTMLElement) => untrack(() => part().attach(element))
  const current = $derived({
    ...mergeProps(caller(), toSvelte(own.current)),
    [key]: attachment,
  })
  return {
    get current() {
      return current
    },
  }
}
