import { setGeometry } from "./geometry.ts"
import { whenSettled } from "./presence.ts"

/** A size in CSS pixels. */
interface Size {
  width: number
  height: number
}

/**
 * Follows an open popup's size, for a design that animates it: `--positioner-width` and
 * `--positioner-height` on the positioner, and `--popup-width` and `--popup-height` on the popup
 * when it is asked for. Given to `createPopup`, which measures as the popup opens; while `open`
 * says it is, a change of what the popup holds measures it again.
 */
export type PopupSize = (
  popup: HTMLElement,
  positioner: () => HTMLElement | undefined,
  open: () => boolean
) => { measure(): void; reset(): void; stop(): void }

/** A property of an element's own style, set for a moment and put back as it was. */
function override(element: HTMLElement, name: string, value: string): () => void {
  const was = element.style.getPropertyValue(name)
  element.style.setProperty(name, value)
  return () => {
    if (was) element.style.setProperty(name, was)
    else element.style.removeProperty(name)
  }
}

/** The element's size as its style lays it out, or as drawn when the two disagree. */
function sizeOf(element: HTMLElement): Size {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element)
  let width = Number.parseFloat(style?.width ?? "") || 0
  let height = Number.parseFloat(style?.height ?? "") || 0
  if (Math.round(width) !== element.offsetWidth || Math.round(height) !== element.offsetHeight) {
    width = element.offsetWidth
    height = element.offsetHeight
  }
  return { width, height }
}

/**
 * Base UI's sizes for a popup whose content changes while it is open. The popup is measured as
 * its content would lay it out (the positioner `max-content`, the popup's own variables `auto`,
 * the room it is given set aside), and the positioner takes that size. With `onPopup`, a change
 * of size while it is open is written on the popup too: the old size, then the new one, so a
 * transition on `width: var(--popup-width)` runs between them, and `auto` once the popup's own
 * motion has ended. The old size is computed by reading the style, never by waiting for a frame.
 */
export function popupSize(onPopup = false): PopupSize {
  return (popup, positioner, open) => {
    let last: Size | undefined
    // Bumped by every measure: a motion that ends late knows a newer size has been written.
    let run = 0
    const observer =
      typeof MutationObserver === "undefined"
        ? undefined
        : new MutationObserver(() => {
            if (open()) measure()
          })

    function natural(around: HTMLElement): Size {
      const undo = [
        override(around, "--positioner-width", "max-content"),
        override(around, "--positioner-height", "max-content"),
        override(around, "--available-width", "max-content"),
        override(around, "--available-height", "max-content"),
        ...(onPopup
          ? [override(popup, "--popup-width", "auto"), override(popup, "--popup-height", "auto")]
          : []),
      ]
      const size = sizeOf(popup)
      for (const each of undo.reverse()) each()
      return size
    }

    function measure() {
      const around = positioner()
      if (!around || !popup.isConnected) return
      const before = last
      const now = natural(around)
      last = now
      const token = ++run
      setGeometry(around, "--positioner-width", `${now.width}px`)
      setGeometry(around, "--positioner-height", `${now.height}px`)
      if (!onPopup) return
      const changed = before && (before.width !== now.width || before.height !== now.height)
      if (!changed) {
        setGeometry(popup, "--popup-width", "auto")
        setGeometry(popup, "--popup-height", "auto")
        return
      }
      setGeometry(popup, "--popup-width", `${before.width}px`)
      setGeometry(popup, "--popup-height", `${before.height}px`)
      // Computed at the old size, so the change that follows is a transition from it.
      void popup.ownerDocument.defaultView?.getComputedStyle(popup).width
      setGeometry(popup, "--popup-width", `${now.width}px`)
      setGeometry(popup, "--popup-height", `${now.height}px`)
      whenSettled(popup, () => {
        if (token !== run) return
        setGeometry(popup, "--popup-width", "auto")
        setGeometry(popup, "--popup-height", "auto")
      })
    }

    // What it holds changing: its text, or elements put in or taken out.
    observer?.observe(popup, { childList: true, subtree: true, characterData: true })
    return {
      measure,
      // Opened again: the first size is not a change from the last one it had.
      reset: () => {
        last = undefined
        run++
      },
      stop: () => observer?.disconnect(),
    }
  }
}
