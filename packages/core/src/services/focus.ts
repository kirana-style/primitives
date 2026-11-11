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
  /** What takes focus on entry: the first tabbable (default), the container, or an element. */
  initial?: "first" | "container" | (() => HTMLElement | null | undefined)
  /** What takes focus back on exit: what had it before (default), or an element. */
  restore?: () => HTMLElement | null | undefined
}

/** Moves focus into `container`, optionally keeps it there, and gives it back. */
export function focusScope(container: HTMLElement, options: FocusScopeOptions = {}): () => void {
  const document = container.ownerDocument
  const previous = document.activeElement as HTMLElement | null

  const initial = options.initial ?? "first"
  const target =
    typeof initial === "function"
      ? initial()
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
    const back = options.restore?.() ?? previous
    // Only when focus is still inside, or lost to the page: a person who moved it keeps it.
    const active = document.activeElement
    if (active === document.body || active === null || container.contains(active)) {
      back?.focus({ preventScroll: true })
    }
  }
}

/**
 * Makes everything outside `element` inert: no pointer, no focus, hidden from assistive
 * technology. Modality without touching `pointer-events` on the page. Layers opened later (they
 * are added to the page after this one) are not touched.
 */
export function isolate(
  element: HTMLElement,
  keep: () => readonly (Element | null | undefined)[] = () => []
): () => void {
  const kept = keep()
  const changed: Element[] = []
  let node: Element | null = element
  const body = element.ownerDocument.body
  while (node && node !== body) {
    const parent: Element | null = node.parentElement
    if (!parent) break
    for (const sibling of parent.children) {
      if (sibling === node || sibling.hasAttribute("inert")) continue
      if (sibling.hasAttribute("aria-live") || sibling.tagName === "SCRIPT") continue
      // A backdrop belongs to its layer.
      if (kept.includes(sibling)) continue
      sibling.setAttribute("inert", "")
      changed.push(sibling)
    }
    node = parent
  }
  return () => {
    for (const each of changed) each.removeAttribute("inert")
  }
}
