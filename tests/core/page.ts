import { onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

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

/**
 * Takes the real pointer to the far corner of the page. It stays wherever the test before
 * left it, in whatever file that was: a trigger that then appears under it is hovered, and a
 * menu opens or closes for a pointer no test moved. For a file whose parts answer hover.
 */
export async function park(): Promise<void> {
  const corner = document.createElement("div")
  corner.style.cssText = "position:fixed;right:0;bottom:0;width:2px;height:2px"
  document.body.append(corner)
  await userEvent.hover(corner)
  corner.remove()
}
