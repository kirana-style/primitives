const TABBABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable]:not([contenteditable=false])",
].join(",")

export function tabbables(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (each) => !each.closest("[inert]") && each.getClientRects().length > 0
  )
}

export interface FocusScopeOptions {
  /** Keeps Tab inside the container. */
  trap?: boolean
  /**
   * What takes focus on entry: the first tabbable (default), the container, an element, or
   * `"none"` when the caller moves it itself.
   */
  initial?: "first" | "container" | "none" | (() => HTMLElement | null | undefined) | undefined
  /** What takes focus back on exit, before what had it when the scope began. */
  restore?: () => HTMLElement | null | undefined
  /** Where focus goes when neither is in the page any more. */
  fallback?: () => HTMLElement | null | undefined
}

/** Whether an element can take focus now: in the page, drawn, and not inert. */
const reachable = (element: HTMLElement | null | undefined): element is HTMLElement =>
  Boolean(element?.isConnected) &&
  !element!.closest("[inert]") &&
  element!.getClientRects().length > 0

/** Moves focus into `container`, optionally keeps it there, and gives it back. */
export function focusScope(container: HTMLElement, options: FocusScopeOptions = {}): () => void {
  const document = container.ownerDocument
  const previous = document.activeElement as HTMLElement | null

  const initial = options.initial ?? "first"
  const target =
    typeof initial === "function"
      ? initial()
      : initial === "none"
        ? undefined
        : initial === "container"
          ? container
          : (tabbables(container)[0] ?? container)
  if (target === container && !container.hasAttribute("tabindex")) {
    container.setAttribute("tabindex", "-1")
  }
  target?.focus({ preventScroll: true })

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "Tab" || event.defaultPrevented) return
    const list = tabbables(container)
    if (list.length === 0) {
      event.preventDefault()
      return
    }
    const first = list[0]!
    const last = list[list.length - 1]!
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === container)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }
  if (options.trap) container.addEventListener("keydown", onKeyDown)

  return () => {
    if (options.trap) container.removeEventListener("keydown", onKeyDown)
    // Only when focus is still inside, or lost to the page: a person who moved it keeps it.
    const active = document.activeElement
    if (active === document.body || active === null || container.contains(active)) {
      // A chain, read now: the first that is still there to take it.
      const back = [options.restore?.(), previous, options.fallback?.()].find(reachable)
      back?.focus({ preventScroll: true })
    }
  }
}

/**
 * Makes everything outside `element` inert: no pointer, no focus, hidden from assistive
 * technology. Modality without touching `pointer-events` on the page. Layers opened later (they
 * are added to the page after this one) are not touched.
 */
// How many open layers hold each element inert. Layers close in any order: an element is given
// back only when the last one that needs it inert lets go.
const held = new WeakMap<Element, number>()

export function isolate(
  element: HTMLElement,
  keep: () => readonly (Element | null | undefined)[] = () => []
): () => void {
  const kept = keep()
  const changed: Element[] = []
  let node: Element | null = element
  const body = element.ownerDocument.body
  // What a layer under this one made inert and this one is inside of, or is: a layer that was
  // in the page already when the other opened. Lifted while this one is open.
  const lifted: Element[] = []
  while (node && node !== body) {
    if ((held.get(node) ?? 0) > 0 && node.hasAttribute("inert")) {
      node.removeAttribute("inert")
      lifted.push(node)
    }
    const parent: Element | null = node.parentElement
    if (!parent) break
    for (const sibling of parent.children) {
      if (sibling === node) continue
      if (sibling.hasAttribute("aria-live") || sibling.tagName === "SCRIPT") continue
      // A backdrop belongs to its layer.
      if (kept.includes(sibling)) continue
      const holders = held.get(sibling) ?? 0
      // Inert before any layer asked: the page's own, and not a layer's to undo.
      if (holders === 0 && sibling.hasAttribute("inert")) continue
      held.set(sibling, holders + 1)
      sibling.setAttribute("inert", "")
      changed.push(sibling)
    }
    node = parent
  }
  return () => {
    for (const each of changed.splice(0)) {
      const holders = (held.get(each) ?? 1) - 1
      if (holders > 0) {
        held.set(each, holders)
      } else {
        held.delete(each)
        each.removeAttribute("inert")
      }
    }
    // Back under the layer that still holds it.
    for (const each of lifted.splice(0)) {
      if ((held.get(each) ?? 0) > 0) each.setAttribute("inert", "")
    }
  }
}
