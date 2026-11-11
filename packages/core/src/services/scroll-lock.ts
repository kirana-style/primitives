let locks = 0
let restore: (() => void) | undefined

/** Stops the page scrolling while a modal layer is open. Counted: the last unlock restores. */
export function lockScroll(document: Document): () => void {
  if (locks++ === 0) {
    const root = document.documentElement
    const view = document.defaultView!
    const gap = view.innerWidth - root.clientWidth
    const overflow = root.style.overflow
    const padding = root.style.paddingInlineEnd
    root.style.overflow = "hidden"
    // The scrollbar's width, when it takes space, so the page does not shift.
    if (gap > 0 && view.getComputedStyle(root).scrollbarGutter !== "stable") {
      root.style.paddingInlineEnd = `${gap}px`
    }
    restore = () => {
      root.style.overflow = overflow
      root.style.paddingInlineEnd = padding
    }
  }
  let released = false
  return () => {
    if (released) return
    released = true
    if (--locks === 0) {
      restore?.()
      restore = undefined
    }
  }
}
