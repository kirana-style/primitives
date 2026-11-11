import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import type { ChangeDetails } from "./part.ts"

export interface Bindable<T> extends ReadonlySignal<T> {
  /** Asks for a new value: the caller's `onChange` hears it, and may cancel it. */
  set(value: T, details: ChangeDetails): void
}

/**
 * A value that is the caller's while they give one, and the part's own otherwise. The default is
 * read once, when the bindable is made: a default that changes later never moves the value.
 */
export function bindable<T>(options: {
  /** The caller's value; `undefined` means "not controlled". */
  value: () => T | undefined
  defaultValue: T
  onChange?: (value: T, details: ChangeDetails) => void
  equals?: (a: T, b: T) => boolean
}): Bindable<T> {
  const equals = options.equals ?? Object.is
  const own = signal(options.defaultValue, equals)
  const current = computed(() => {
    const given = options.value()
    return given === undefined ? own.get() : given
  }, equals)
  return {
    get: () => current.get(),
    peek: () => current.peek(),
    subscribe: (listener) => current.subscribe(listener),
    set(value, details) {
      if (equals(current.peek(), value)) return
      options.onChange?.(value, details)
      if (details.canceled) return
      // Kept even while controlled, so the part holds the last value if control is given up.
      own.set(value)
    },
  }
}
