import { onTestFinished } from "vite-plus/test"

/**
 * Puts markup in the page for one test and takes it out when the test ends. Answers its
 * container; `find` reads an element of it by id.
 */
export function mount(html: string): HTMLElement {
  const root = document.createElement("div")
  root.innerHTML = html
  document.body.append(root)
  onTestFinished(() => root.remove())
  return root
}

export function find<T extends HTMLElement = HTMLElement>(root: ParentNode, id: string): T {
  const element = root.querySelector<T>(`#${id}`)
  if (!element) throw new Error(`no #${id} in the page`)
  return element
}

/** A stylesheet for one test. */
export function style(css: string): void {
  const sheet = document.createElement("style")
  sheet.textContent = css
  document.head.append(sheet)
  onTestFinished(() => sheet.remove())
}

/** The id of the element that has focus. */
export const focused = (): string | undefined => document.activeElement?.id || undefined
