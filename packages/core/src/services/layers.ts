import { signal } from "../reactivity.ts"
import type { Signal } from "../reactivity.ts"

/**
 * The stack of open popups. One `keydown` and one `pointerdown` listener for the whole page,
 * present only while something is open: Escape closes the top layer, a press outside closes
 * every layer it is outside of, down to the first modal one.
 */
export interface Layer {
  element: HTMLElement
  /** What the layer is (`"dialog"`, `"popover"`, `"select"`), for a part counting its own kind. */
  kind: string
  /** Elements that count as inside though they are elsewhere in the page: the trigger. */
  branches?: () => readonly (Element | null | undefined)[]
  /** Blocks what is under it: a press outside goes no further down the stack. */
  modal?: boolean
  onEscape?(event: KeyboardEvent): void
  onOutsidePress?(event: PointerEvent): void
}

const stack: Layer[] = []

/** Changes whenever a layer opens or closes: read it to follow the stack. */
export const layersChanged: Signal<number> = signal(0)

function inside(layer: Layer, target: Node): boolean {
  if (layer.element.contains(target)) return true
  return layer.branches?.().some((each) => each?.contains(target)) ?? false
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape" || event.defaultPrevented) return
  const top = stack[stack.length - 1]
  if (!top?.onEscape) return
  top.onEscape(event)
}

function onPointerDown(event: PointerEvent) {
  const target = event.target
  if (!(target instanceof Node)) return
  // A copy: closing a layer takes it off the stack.
  for (const layer of [...stack].reverse()) {
    if (inside(layer, target)) return
    layer.onOutsidePress?.(event)
    if (layer.modal) return
  }
}

export function pushLayer(layer: Layer): () => void {
  const document = layer.element.ownerDocument
  if (stack.length === 0) {
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onPointerDown, true)
  }
  stack.push(layer)
  layersChanged.set(layersChanged.peek() + 1)
  return () => {
    const index = stack.indexOf(layer)
    if (index >= 0) stack.splice(index, 1)
    layersChanged.set(layersChanged.peek() + 1)
    if (stack.length === 0) {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown, true)
    }
  }
}

/** The popup under `element`'s own in the stack: what it was opened from. */
export function layerBelow(element: HTMLElement): HTMLElement | undefined {
  const index = stack.findIndex((each) => each.element === element)
  return index > 0 ? stack[index - 1]!.element : undefined
}

/**
 * The popups opened from inside `element`, and from inside those: what is its own though it is
 * drawn elsewhere in the page. A popup is opened from where its trigger is.
 */
export function layersFrom(element: HTMLElement): HTMLElement[] {
  const own = [element]
  // In the stack's order: a popup is under what was opened from it.
  for (const layer of stack) {
    if (own.includes(layer.element)) continue
    const from = layer.branches?.() ?? []
    if (from.some((branch) => branch && own.some((each) => each.contains(branch)))) {
      own.push(layer.element)
    }
  }
  return own.slice(1)
}

/** How many layers of this kind are open above `element`'s own. */
export function layersAbove(element: HTMLElement, kind: string): number {
  const index = stack.findIndex((each) => each.element === element)
  if (index < 0) return 0
  return stack.slice(index + 1).filter((each) => each.kind === kind).length
}
