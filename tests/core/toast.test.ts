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
    .toast { display: flex; transition: opacity 60ms; }
    .toast .title { height: 40px; }
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

describe("a toast a design sizes", () => {
  it("is measured as tall as it is, and the region says how tall the newest is", async () => {
    const { toaster, region, of } = toasts()
    style(`
      .toast { height: var(--toast-frontmost-height); }
      .toast .title { height: 30px; }`)
    toaster.add({ id: "a", title: "One" })
    await wait(20)
    const tall = of("a").style.getPropertyValue("--toast-height")
    expect(tall).toBe("30px")
    expect(region.style.getPropertyValue("--toast-frontmost-height")).toBe(tall)
    // An older toast is held to the newest's height by the design: its own is still known.
    of("a").querySelector<HTMLElement>(".title")!.style.height = "60px"
    toaster.add({ id: "b", title: "Two" })
    await wait(20)
    const front = region.style.getPropertyValue("--toast-frontmost-height")
    expect(of("b").style.getPropertyValue("--toast-height")).toBe(front)
    expect(front).toBe("30px")
    expect(of("a").offsetHeight).toBe(30)
    expect(of("a").style.getPropertyValue("--toast-height")).toBe("60px")
    toaster.dismiss()
    await wait(200)
    expect(region.style.getPropertyValue("--toast-frontmost-height")).toBe("")
  })

  it("says what is behind the newest, and is measured again when what it holds changes", async () => {
    const { toaster, made, of } = toasts()
    toaster.add({ id: "a", title: "One" })
    toaster.add({ id: "b", title: "Two" })
    await wait(20)
    const content = document.createElement("div")
    of("a").append(content)
    onTestFinished(bind(content, made.toast("a").content))
    expect(content.hasAttribute("data-behind")).toBe(true)
    const before = of("a").style.getPropertyValue("--toast-height")
    content.textContent = "A line more"
    content.style.height = "50px"
    await expect.poll(() => of("a").style.getPropertyValue("--toast-height")).not.toBe(before)
    toaster.dismiss("b")
    await expect.poll(() => content.hasAttribute("data-behind")).toBe(false)
  })
})

describe("a toaster", () => {
  it("shows one toast for a promise: loading, then what came of it", async () => {
    const toaster = createToaster({ duration: 1000 })
    let done!: (value: number) => void
    const work = new Promise<number>((resolve) => void (done = resolve))
    const given = toaster.promise(work, {
      loading: "Saving",
      success: (rows) => ({ title: `Saved ${rows}`, description: "All of it" }),
      error: "Failed",
    })
    expect(given).toBe(work)
    expect(toaster.toasts.peek()).toMatchObject([
      { title: "Saving", type: "loading", duration: Infinity },
    ])
    done(3)
    await work
    await Promise.resolve()
    expect(toaster.toasts.peek()).toMatchObject([
      { title: "Saved 3", description: "All of it", type: "success", duration: 1000 },
    ])

    const failing = Promise.reject(new Error("no"))
    void toaster.promise(failing, {
      loading: "Sending",
      success: "Sent",
      error: (error) => `Not sent: ${(error as Error).message}`,
    })
    await failing.catch(() => {})
    await Promise.resolve()
    expect(toaster.toasts.peek()[0]).toMatchObject({ title: "Not sent: no", type: "error" })

    // Closed while it waited: nothing comes back for it.
    let late!: () => void
    const slow = new Promise<void>((resolve) => void (late = resolve))
    void toaster.promise(slow, { loading: "Slow", success: "Done", error: "Failed" })
    toaster.dismiss(toaster.toasts.peek()[0]!.id)
    late()
    await slow
    await Promise.resolve()
    expect(toaster.toasts.peek()[0]).toMatchObject({ title: "Slow", closing: true })
  })

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

  it("hands on what a toast says as it was given, whatever it is", () => {
    // What a framework draws: here, elements. The toaster never reads them.
    const toaster = createToaster<HTMLElement | string>()
    const title = document.createElement("b")
    const description = document.createElement("a")
    const label = document.createElement("i")
    const before = title.outerHTML
    const id = toaster.add({ title, description, action: { label, onAction() {} } })
    const [toast] = toaster.toasts.peek()
    expect(toast!.title).toBe(title)
    expect(toast!.description).toBe(description)
    expect(toast!.action!.label).toBe(label)
    expect(title.outerHTML).toBe(before)
    // What draws it is given the same.
    const made = createToast(signal<ToastProps<HTMLElement | string>>({ id: "region", toaster }))
    expect(made.toast(id).record.peek()!.title).toBe(title)
    const next = document.createElement("em")
    toaster.update(id, { title: next })
    expect(made.toast(id).record.peek()).toMatchObject({ title: next, description })
    expect(made.toast(id).record.peek()!.action!.label).toBe(label)
    // A string is still a title, in a promise's states too.
    void toaster.promise(new Promise(() => {}), {
      loading: "Saving",
      success: { title: next },
      error: "Failed",
    })
    expect(toaster.toasts.peek()[0]!.title).toBe("Saving")
  })

  it("changes a toast's action with the rest of it", () => {
    const toaster = createToaster()
    const heard: string[] = []
    const id = toaster.add({ title: "Deleted" })
    expect(toaster.toasts.peek()[0]!.action).toBeUndefined()
    const undo = { label: "Undo", onAction: () => void heard.push("undo") }
    toaster.update(id, { action: undo })
    expect(toaster.toasts.peek()[0]).toMatchObject({ title: "Deleted", action: undo })
    // What an update does not name stays.
    toaster.update(id, { title: "Gone" })
    expect(toaster.toasts.peek()[0]).toMatchObject({ title: "Gone", action: undo })
    toaster.update(id, { action: undefined })
    expect(toaster.toasts.peek()[0]!.action).toBeUndefined()
  })

  it("gives each state of a promise its own action, and none that it did not ask for", async () => {
    const toaster = createToaster()
    const heard: string[] = []
    let done!: (value: string) => void
    const work = new Promise<string>((resolve) => void (done = resolve))
    void toaster.promise(work, {
      loading: {
        title: "Uploading",
        description: "Three files",
        action: { label: "Cancel", onAction: () => void heard.push("cancel") },
      },
      success: (name) => ({
        title: `Uploaded ${name}`,
        priority: "assertive",
        action: { label: "Open", onAction: () => void heard.push("open") },
      }),
      error: "Failed",
    })
    expect(toaster.toasts.peek()[0]).toMatchObject({
      type: "loading",
      description: "Three files",
      priority: "polite",
    })
    expect(toaster.toasts.peek()[0]!.action!.label).toBe("Cancel")
    done("a.txt")
    await work
    await Promise.resolve()
    const settled = toaster.toasts.peek()[0]!
    expect(settled).toMatchObject({
      title: "Uploaded a.txt",
      type: "success",
      priority: "assertive",
    })
    expect(settled.action!.label).toBe("Open")
    // What the state before said is not this one's.
    expect(settled.description).toBeUndefined()

    const failing = Promise.reject(new Error("no"))
    void toaster.promise(failing, {
      loading: { title: "Sending", action: { label: "Cancel", onAction() {} } },
      success: "Sent",
      error: "Not sent",
    })
    await failing.catch(() => {})
    await Promise.resolve()
    expect(toaster.toasts.peek()[0]).toMatchObject({ title: "Not sent", type: "error" })
    expect(toaster.toasts.peek()[0]!.action).toBeUndefined()
    expect(heard).toEqual([])
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

  it("are read when the reader is idle, or at once when they say so", async () => {
    const { region, toaster, of } = toasts()
    const calm = toaster.add({ title: "Saved" })
    expect(toaster.toasts.peek()[0]!.priority).toBe("polite")
    expect(of(calm).getAttribute("role")).toBe("dialog")
    expect(of(calm).hasAttribute("aria-live")).toBe(false)
    expect(of(calm).hasAttribute("aria-atomic")).toBe(false)
    const urgent = toaster.add({ title: "Connection lost", priority: "assertive" })
    expect(toaster.toasts.peek()[0]!.priority).toBe("assertive")
    // An alert, read whole, that interrupts: its own word, over the region's.
    expect(of(urgent).getAttribute("role")).toBe("alertdialog")
    expect(of(urgent).getAttribute("aria-live")).toBe("assertive")
    expect(of(urgent).getAttribute("aria-atomic")).toBe("true")
    expect(of(urgent).getAttribute("aria-modal")).toBe("false")
    expect(region.getAttribute("aria-live")).toBe("polite")
    expect(region.hasAttribute("aria-atomic")).toBe(false)
    // One that is changed says what it now is; what an update does not name stays.
    toaster.update(urgent, { title: "Still lost" })
    expect(of(urgent).getAttribute("role")).toBe("alertdialog")
    toaster.update(urgent, { priority: "polite" })
    await expect.poll(() => of(urgent).getAttribute("role")).toBe("dialog")
    expect(of(urgent).hasAttribute("aria-live")).toBe(false)
    expect(of(urgent).hasAttribute("aria-atomic")).toBe(false)
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

  it("tell their action it was pressed, then close", async () => {
    const { toaster, ids, of } = toasts()
    const heard: string[] = []
    const id = toaster.add({
      title: "Deleted",
      action: {
        label: "Undo",
        onAction: (details) =>
          void heard.push(`action ${details.reason} ${details.event?.type} ${details.source}`),
      },
      onClose: (details) => void heard.push(`close ${details.reason}`),
    })
    await userEvent.click(of(id).querySelector(".action")!)
    // The action first, while the toast is still whole; then it leaves, for that reason.
    expect(heard).toEqual(["action action-press click mouse", "close action-press"])
    expect(toaster.toasts.peek()[0]!.closing).toBe(true)
    await expect.poll(ids).toEqual([])
  })

  it("stay when their action refuses, until it does not", async () => {
    const { toaster, ids, of } = toasts()
    const heard: string[] = []
    const id = toaster.add({
      title: "Delete everything?",
      action: {
        label: "Delete",
        onAction(details) {
          heard.push("action")
          details.cancel()
        },
      },
      onClose: (details) => void heard.push(`close ${details.reason}`),
    })
    const action = of(id).querySelector<HTMLElement>(".action")!
    await userEvent.click(action)
    await wait(120)
    expect(heard).toEqual(["action"])
    expect(toaster.toasts.peek()[0]!.closing).toBe(false)
    expect(ids()).toEqual([`region-${id}`])
    // The action it has now is the one a press tells: here, one that lets it go.
    toaster.update(id, {
      action: { label: "Delete", onAction: () => void heard.push("sure") },
    })
    await userEvent.click(action)
    expect(heard).toEqual(["action", "sure", "close action-press"])
    await expect.poll(ids).toEqual([])
  })
})
