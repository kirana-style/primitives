import type { Part } from "./part.ts"
import { computed, effect } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { clearGeometry, setGeometry } from "./services/geometry.ts"

export interface AutosizeProps {
  /**
   * The text, when the caller holds it: a change that no key made (a form filled by code) is
   * then measured too.
   */
  value?: unknown
}

export interface Autosize {
  mount(): () => void
  /** A `<textarea>` as tall as its text. */
  readonly textarea: Part
  /** Measures again: after its text was set with no event to hear. */
  update(): void
}

const NOTHING = () => {}

/**
 * A text area that grows and shrinks with its text. Its height is the one thing written; the
 * least and the most it may be are the design's `min-height` and `max-height` (in `lh`, lines),
 * which a height never beats.
 *
 * `field-sizing: content` does this in CSS where a browser has it; not every one does.
 */
export function createAutosize(props: ReadonlySignal<AutosizeProps>): Autosize {
  let element: HTMLTextAreaElement | undefined

  function measure() {
    const target = element
    if (!target || !target.isConnected) return
    const view = target.ownerDocument.defaultView
    if (!view) return
    const style = view.getComputedStyle(target)
    const px = (name: string) => Number.parseFloat(style.getPropertyValue(name)) || 0
    // What its text needs is asked with no height of its own in the way.
    setGeometry(target, "height", "auto")
    const edges =
      style.boxSizing === "border-box"
        ? px("border-top-width") + px("border-bottom-width")
        : -(px("padding-top") + px("padding-bottom"))
    setGeometry(target, "height", `${target.scrollHeight + edges}px`)
  }

  return {
    update: measure,
    mount: () => NOTHING,
    textarea: {
      props: computed(() => ({ onInput: measure })),
      attach(target) {
        element = target as HTMLTextAreaElement
        measure()
        // The text a caller holds: measured once the framework has written it.
        const stop = effect(() => {
          void props.get().value
          queueMicrotask(measure)
        })
        // A narrower box wraps its lines. Written a task later: a size written while sizes
        // are reported is one the browser cannot deliver.
        let width = target.offsetWidth
        let later: ReturnType<typeof setTimeout> | undefined
        const observer = new ResizeObserver(() => {
          if (target.offsetWidth === width) return
          width = target.offsetWidth
          clearTimeout(later)
          later = setTimeout(measure)
        })
        observer.observe(target)
        // A form's reset puts the first text back after the event.
        const form = element.form
        const reset = () => setTimeout(measure)
        form?.addEventListener("reset", reset)
        return () => {
          stop()
          observer.disconnect()
          clearTimeout(later)
          form?.removeEventListener("reset", reset)
          clearGeometry(target, "height")
          if (element === target) element = undefined
        }
      },
    },
  }
}
