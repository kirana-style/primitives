import { focusScope, isolate } from "./focus.ts"
import type { FocusScopeOptions } from "./focus.ts"
import { layerBelow, layersFrom } from "./layers.ts"
import type { PopupFocus } from "./popup.ts"
import { lockScroll } from "./scroll-lock.ts"

/**
 * A popup's focus: it moves in as the popup opens (`"none"`: the component moves it itself, a
 * moment later) and goes back as it closes, to the trigger; if that is gone, to what had focus
 * before; if that is gone too, to the popup this one was opened from. A modal popup keeps Tab
 * inside and makes the page around it inert.
 */
export function popupFocus(initial?: FocusScopeOptions["initial"]): PopupFocus {
  return (element, context) => {
    const release = focusScope(element, {
      trap: context.modal,
      initial,
      restore: context.trigger,
      fallback: () => layerBelow(element),
      // Focus in a popup opened from this one is this one's to give back: the two may close
      // in either order.
      within: () => layersFrom(element),
    })
    if (!context.modal) return release
    const free = isolate(element, () => [context.backdrop()])
    return () => {
      // The page first: it is no longer inert when focus goes back to it.
      free()
      release()
    }
  }
}

/** A modal popup's hold on the page: its scroll, until the popup has left. */
export const lockPage = (element: HTMLElement): (() => void) => lockScroll(element.ownerDocument)
