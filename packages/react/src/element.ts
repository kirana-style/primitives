import { version } from "react"
import type { ReactElement, Ref } from "react"

/**
 * React 19 keeps a ref among the props, an element's and a component's alike. Before, an
 * element's ref was on the element (reading it there now warns), and a component was given
 * its own only through `forwardRef`.
 */
export const REF_IS_A_PROP = Number.parseInt(version, 10) >= 19

/** The ref a caller put on an element it handed over as `render`. */
export function refOf(element: ReactElement): Ref<HTMLElement> | undefined {
  return REF_IS_A_PROP
    ? (element.props as { ref?: Ref<HTMLElement> }).ref
    : (element as { ref?: Ref<HTMLElement> }).ref
}

/** Hands an element to a ref, whichever kind it is. */
export function give(ref: Ref<HTMLElement> | undefined, element: HTMLElement | null): void {
  if (typeof ref === "function") ref(element)
  else if (ref) (ref as { current: HTMLElement | null }).current = element
}
