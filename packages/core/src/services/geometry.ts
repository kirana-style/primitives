/**
 * Geometry the core writes on an element's `style`: a position, a measured size as a custom
 * property. A framework that writes the whole `style` attribute when the caller's style changes
 * (Svelte, with a style given as a string) would take these with it, so they are remembered and
 * put back when that happens: a mutation observer on the attribute, which runs before the page is
 * drawn again.
 */
const written = new WeakMap<HTMLElement, Map<string, string>>()

function restore(records: MutationRecord[]) {
  for (const record of records) {
    const element = record.target as HTMLElement
    const values = written.get(element)
    if (!values) continue
    for (const [name, value] of values) {
      // Only what is gone: putting back what is there would report itself, for ever.
      if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value)
    }
  }
}

let observer: MutationObserver | undefined

/** Sets a style property the core owns on `element`, and keeps it there. */
export function setGeometry(element: HTMLElement, name: string, value: string): void {
  let values = written.get(element)
  if (!values) {
    values = new Map()
    written.set(element, values)
    observer ??= new MutationObserver(restore)
    observer.observe(element, { attributes: true, attributeFilter: ["style"] })
  }
  values.set(name, value)
  if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value)
}

/** Takes a style property the core set off `element`, and stops keeping it there. */
export function clearGeometry(element: HTMLElement, name: string): void {
  written.get(element)?.delete(name)
  element.style.removeProperty(name)
}
