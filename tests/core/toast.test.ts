import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { effect, signal } from "../../packages/core/src/reactivity.ts"
import { TOAST_SWIPE, createToast, createToaster } from "../../packages/core/src/toast.ts"
import type { ToastProps, Toaster } from "../../packages/core/src/toast.ts"
import { find, focused, mount, style } from "./page.ts"

/** Draws a toaster's toasts with no framework: an element per toast, the newest first. */
function toasts(
  options: { duration?: number; limit?: number } = {},
  given: Partial<ToastProps> = {}
) {
  style(`
    .toast { height: 40px; transition: opacity 60ms; }
    .toast[data-starting-style], .toast[data-ending-style] { opacity: 0; }`)
  const root = mount(`<button id="outside">Outside</button><div id="region"></div>`)
  const toaster: Toaster = createToaster({ duration: 60_000, ...options })
  const made = createToast(signal<ToastProps>({ id: "region", toaster, ...given }))
  const region = find(root, "region")
  onTestFinished(bind(region, made.viewport))
  onTestFinished(made.mount())
  const drawn = new Map<string, { element: HTMLElement; stop: () => void }>()
  onTestFinished(
    effect(() => {
      const all = made.toasts.get()
      for (const [id, each] of drawn) {
        if (all.some((toast) => toast.id === id)) continue
        each.stop()
        each.element.remove()
        drawn.delete(id)
      }
      all.forEach((toast, at) => {
        let each = drawn.get(toast.id)
        if (!each) {
          const element = document.createElement("div")
          element.className = "toast"
          element.innerHTML = `<div class="title"></div><div class="description"></div><button class="close">Close</button><button class="action">Undo</button>`
          region.insertBefore(element, region.children[at] ?? null)
          const parts = made.toast(toast.id)
          const stops = [
            bind(element, parts.root),
            bind(element.querySelector<HTMLElement>(".title")!, parts.title),
            bind(element.querySelector<HTMLElement>(".description")!, parts.description),
            bind(element.querySelector<HTMLElement>(".close")!, parts.close),
            bind(element.querySelector<HTMLElement>(".action")!, parts.action),
          ]
          drawn.set(toast.id, (each = { element, stop: () => stops.forEach((stop) => stop()) }))
        }
        each.element.querySelector(".title")!.textContent = toast.title ?? ""
      })
    })
  )
  const ids = () => [...region.children].map((each) => each.id)
  const of = (id: string) => region.querySelector<HTMLElement>(`#region-${id}`)!
  return { root, region, toaster, made, ids, of }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const pointer = (target: Element, type: string, x: number, y = 0) =>
  target.dispatchEvent(
    new PointerEvent(type, { clientX: x, clientY: y, button: 0, pointerId: 1, bubbles: true })
  )

describe("a toaster", () => {
  it("holds its toasts apart from what draws them, the newest first", () => {
    const toaster = createToaster()
    const first = toaster.add({ title: "One" })
    const second = toaster.add({ title: "Two", type: "error", duration: 100 })
    expect(toaster.toasts.peek().map((each) => [each.id, each.title, each.duration])).toEqual([
      [second, "Two", 100],
      [first, "One", 5000],
    ])
    toaster.update(first, { title: "One, changed" })
    expect(toaster.toasts.peek()[1]!.title).toBe("One, changed")
    // The same id again is the same toast.
    toaster.add({ id: first, title: "One, again" })
    expect(toaster.toasts.peek().map((each) => each.title)).toEqual(["One, again", "Two"])
  })

  it("closes one, or every one, and says why", () => {
    const toaster = createToaster()
    const why: string[] = []
    const first = toaster.add({ title: "One", onClose: (details) => void why.push(details.reason) })
    toaster.add({ title: "Two", onClose: (details) => void why.push(details.reason) })
    toaster.dismiss(first)
    expect(toaster.toasts.peek().map((each) => each.closing)).toEqual([false, true])
    toaster.dismiss()
    expect(toaster.toasts.peek().every((each) => each.closing)).toBe(true)
    // Each hears it once.
    expect(why).toEqual(["dismiss", "dismiss"])
  })
})

describe("toasts in the page", () => {
  it("are a region that is read when it changes, each named by what it says", async () => {
    const { region, toaster, ids, of } = toasts()
    expect(region.getAttribute("role")).toBe("region")
    expect(region.getAttribute("aria-live")).toBe("polite")
    expect(region.getAttribute("aria-label")).toBe("Notifications")
    const id = toaster.add({ title: "Saved", type: "success" })
    const toast = of(id)
    expect(toast.getAttribute("data-type")).toBe("success")
    expect(toast.getAttribute("aria-labelledby")).toBe(`region-${id}-title`)
    expect(toast.getAttribute("aria-describedby")).toBe(`region-${id}-description`)
    expect(toast.querySelector(".close")!.getAttribute("type")).toBe("button")
    await userEvent.click(toast.querySelector(".close")!)
    await expect.poll(ids).toEqual([])
  })

  it("say where each lies: its place, its height, and what is in front of it", async () => {
    const { toaster, of } = toasts()
    const first = toaster.add({ title: "One" })
    const second = toaster.add({ title: "Two" })
    await wait(20)
    expect(of(second).style.getPropertyValue("--toast-index")).toBe("0")
    expect(of(first).style.getPropertyValue("--toast-index")).toBe("1")
    expect(of(first).style.getPropertyValue("--toast-height")).toBe("40px")
    expect(of(second).style.getPropertyValue("--toast-offset-y")).toBe("0px")
    expect(of(first).style.getPropertyValue("--toast-offset-y")).toBe("40px")
  })

  it("come in from a first style, and stay through their exit", async () => {
    const { toaster, ids, of } = toasts()
    const id = toaster.add({ title: "One" })
    const toast = of(id)
    expect(toast.hasAttribute("data-starting-style")).toBe(false)
    expect(Number(getComputedStyle(toast).opacity)).toBeLessThan(1)
    // Its motion runs on the page's frames, which a busy browser draws late.
    await expect.poll(() => getComputedStyle(toast).opacity).toBe("1")
    // Closed here and read at once: a press takes long enough for a short exit to end.
    toaster.dismiss(id)
    expect(toast.hasAttribute("data-ending-style")).toBe(true)
    expect(ids()).toEqual([`region-${id}`])
    await expect.poll(ids).toEqual([])
  })

  it("leave when their time is up, and wait while the pointer or focus is on them", async () => {
    const { root, toaster, made, ids, of } = toasts({ duration: 150 })
    const id = toaster.add({ title: "One" })
    await wait(60)
    pointer(of(id), "pointermove", 5, 5)
    expect(made.expanded.peek()).toBe(true)
    expect(of(id).hasAttribute("data-expanded")).toBe(true)
    await wait(250)
    expect(ids()).toEqual([`region-${id}`])
    pointer(find(root, "outside"), "pointermove", 5, 5)
    expect(made.expanded.peek()).toBe(false)
    // What was left of its time, not the whole of it again.
    await wait(40)
    expect(of(id)?.hasAttribute("data-ending-style") ?? false).toBe(false)
    await expect.poll(ids, { timeout: 1000 }).toEqual([])

    const held = toaster.add({ title: "Two" })
    of(held).focus()
    await wait(250)
    expect(ids()).toEqual([`region-${held}`])
    find(root, "outside").focus()
    await expect.poll(ids, { timeout: 1000 }).toEqual([])
  })

  it("stay until closed when they say so", async () => {
    const { toaster, ids } = toasts({ duration: 50 })
    toaster.add({ title: "One", duration: Infinity })
    await wait(200)
    expect(ids().length).toBe(1)
  })

  it("show only so many at once", async () => {
    const { toaster, of } = toasts({ limit: 2 })
    const first = toaster.add({ title: "One" })
    toaster.add({ title: "Two" })
    const third = toaster.add({ title: "Three" })
    expect(of(first).hasAttribute("data-limited")).toBe(true)
    expect(of(third).hasAttribute("data-limited")).toBe(false)
    toaster.dismiss(third)
    await expect.poll(() => of(first).hasAttribute("data-limited")).toBe(false)
  })

  it("are reached with F6, and closed with Escape, focus staying with them", async () => {
    const { region, toaster, ids } = toasts()
    toaster.add({ title: "One" })
    await userEvent.keyboard("{F6}")
    expect(focused()).toBe("region")
    await userEvent.keyboard("{Tab}")
    expect(document.activeElement?.className).toBe("toast")
    await userEvent.keyboard("{Escape}")
    expect(focused()).toBe("region")
    await expect.poll(ids).toEqual([])
    expect(region.getAttribute("tabindex")).toBe("-1")
  })

  it("are dragged out the way they are told, and spring back from less", async () => {
    const { toaster, ids, of } = toasts({}, { swipeDirection: "right" })
    const why: string[] = []
    const id = toaster.add({ title: "One", onClose: (details) => void why.push(details.reason) })
    const toast = of(id)
    pointer(toast, "pointerdown", 100)
    pointer(toast, "pointermove", 100 + TOAST_SWIPE - 10)
    expect(toast.hasAttribute("data-swiping")).toBe(true)
    expect(toast.style.getPropertyValue("--toast-swipe-movement-x")).toBe(`${TOAST_SWIPE - 10}px`)
    pointer(toast, "pointerup", 100 + TOAST_SWIPE - 10)
    expect(toast.hasAttribute("data-swiping")).toBe(false)
    expect(toast.style.getPropertyValue("--toast-swipe-movement-x")).toBe("")
    // The other way is no drag at all.
    pointer(toast, "pointerdown", 100)
    pointer(toast, "pointermove", 20)
    expect(toast.style.getPropertyValue("--toast-swipe-movement-x")).toBe("0px")
    pointer(toast, "pointerup", 20)
    expect(why).toEqual([])
    pointer(toast, "pointerdown", 100)
    pointer(toast, "pointermove", 100 + TOAST_SWIPE + 5)
    pointer(toast, "pointerup", 100 + TOAST_SWIPE + 5)
    expect(why).toEqual(["swipe"])
    expect(toast.getAttribute("data-swipe-direction")).toBe("right")
    await expect.poll(ids).toEqual([])
  })

  it("leave a press on their own buttons to the buttons", async () => {
    const { toaster, ids, of } = toasts()
    const why: string[] = []
    const id = toaster.add({ title: "One", onClose: (details) => void why.push(details.reason) })
    const action = of(id).querySelector<HTMLElement>(".action")!
    pointer(action, "pointerdown", 100)
    pointer(action, "pointermove", 200)
    expect(of(id).hasAttribute("data-swiping")).toBe(false)
    await userEvent.click(action)
    expect(why).toEqual(["action-press"])
    await expect.poll(ids).toEqual([])
  })
})
