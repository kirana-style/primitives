import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { createAlertDialog } from "../../packages/core/src/alert-dialog.ts"
import { createDialog } from "../../packages/core/src/dialog.ts"
import type { DialogProps } from "../../packages/core/src/dialog.ts"
import { details as because } from "../../packages/core/src/part.ts"
import { effect, signal, untracked } from "../../packages/core/src/reactivity.ts"
import { focused, mount, style } from "./page.ts"

/**
 * A dialog drawn as an adapter draws one, in plain DOM: its backdrop, its viewport and its
 * popup are in the page while it is mounted, the popup inside the viewport.
 */
function dialog(name: string, given: Partial<DialogProps> = {}, alert = false, exit = 80) {
  style(`
    .backdrop { position: fixed; inset: 0; }
    .viewport { position: fixed; inset: 0; overflow-y: scroll; }
    .popup { margin: 40px auto; width: 200px; height: 2000px; background: white;
      transition: opacity ${exit}ms; }
    .popup[data-starting-style], .popup[data-ending-style] { opacity: 0; }`)
  const root = mount(
    `<button id="${name}-trigger">Open</button><button id="${name}-under">Under</button>`
  )
  const why: string[] = []
  const props = signal<DialogProps>({
    id: name,
    onOpenChange: (open, by) => void why.push(open ? "open" : by.reason),
    ...given,
  })
  const made = alert ? createAlertDialog(props) : createDialog(props)
  onTestFinished(bind(root.querySelector<HTMLElement>(`#${name}-trigger`)!, made.trigger))
  let drawn: { backdrop: HTMLElement; viewport: HTMLElement; popup: HTMLElement } | undefined
  let undo: (() => void)[] = []
  const draw = () => {
    const backdrop = document.createElement("div")
    backdrop.className = "backdrop"
    const viewport = document.createElement("div")
    viewport.className = "viewport"
    const popup = document.createElement("div")
    popup.className = "popup"
    popup.innerHTML = `<button id="${name}-inside">Inside</button>`
    viewport.append(popup)
    root.append(backdrop, viewport)
    drawn = { backdrop, viewport, popup }
    undo = [bind(backdrop, made.backdrop), bind(viewport, made.viewport), bind(popup, made.popup)]
  }
  const stop = effect(() => {
    const mounted = made.mounted.get()
    untracked(() => {
      if (mounted && !drawn) draw()
      else if (!mounted && drawn) {
        for (const each of undo) each()
        drawn.backdrop.remove()
        drawn.viewport.remove()
        drawn = undefined
      }
    })
  })
  onTestFinished(() => {
    stop()
    for (const each of undo) each()
  })
  onTestFinished(made.mount())
  const open = () => made.setOpen(true, because("test"))
  return { root, made, why, open, parts: () => drawn! }
}

const press = (target: Element, x: number, y: number, pointerType = "mouse") =>
  target.dispatchEvent(
    new PointerEvent("pointerdown", {
      clientX: x,
      clientY: y,
      button: 0,
      pointerId: 1,
      pointerType,
      bubbles: true,
      cancelable: true,
    })
  )
const settled = (time = 30) => new Promise((resolve) => setTimeout(resolve, time))
/** Its way in is over: an exit begun before would be the entrance turned round, and as short. */
const arrived = (popup: HTMLElement) =>
  Promise.all(popup.getAnimations().map((each) => each.finished))

describe("a dialog's viewport", () => {
  it("says what the dialog says: open, the frames of its way in and out", async () => {
    // An exit long enough that "still there a moment later" is not a race on a busy machine.
    const { open, made, parts } = dialog("v1", {}, false, 400)
    open()
    const { viewport, popup } = parts()
    expect(viewport.getAttribute("role")).toBe("presentation")
    expect(viewport.hasAttribute("data-open")).toBe(true)
    expect(viewport.hasAttribute("data-closed")).toBe(false)
    expect(viewport.hasAttribute("data-nested")).toBe(false)
    expect(viewport.hasAttribute("inert")).toBe(false)
    await settled()
    await arrived(popup)
    made.setOpen(false, because("test"))
    await settled(10)
    expect(viewport.hasAttribute("data-closed")).toBe(true)
    expect(viewport.hasAttribute("data-ending-style")).toBe(true)
    expect(viewport.isConnected).toBe(true)
    await expect.poll(() => viewport.isConnected, { timeout: 5000 }).toBe(false)
  })

  it("is outside the dialog: a press on it beside the popup closes the dialog", async () => {
    const { open, why, parts, made } = dialog("v2")
    open()
    await settled()
    const { viewport, popup } = parts()
    press(popup, 300, 100)
    expect(made.open.peek()).toBe(true)
    press(viewport, 20, 100)
    expect(made.open.peek()).toBe(false)
    expect(why).toEqual(["open", "outside-press"])
  })

  it("scrolls by its own scrollbar: a press there closes nothing", async () => {
    const { open, parts, made } = dialog("v3")
    open()
    await settled()
    const { viewport } = parts()
    // The browsers these tests run in are launched with their scrollbars hidden, so none
    // takes room here. A scrollbar's room is what lies between an element's border box and
    // what it shows of its content: a border on that side stands in for it.
    viewport.style.borderRight = "16px solid transparent"
    const edge = viewport.getBoundingClientRect().right
    expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight)
    press(viewport, edge - 8, 100)
    expect(made.open.peek()).toBe(true)
    // A finger meets no scrollbar: the same place is beside the popup.
    press(viewport, edge - 8, 100, "touch")
    expect(made.open.peek()).toBe(false)
  })

  it("is not kept open by a press at its edge when it has nothing to scroll", async () => {
    const { open, parts, made } = dialog("v8")
    open()
    await settled()
    const { viewport, popup } = parts()
    popup.style.height = "100px"
    viewport.style.borderRight = "16px solid transparent"
    press(viewport, viewport.getBoundingClientRect().right - 8, 100)
    expect(made.open.peek()).toBe(false)
  })

  it("keeps a press from closing a dialog that asks for an answer", async () => {
    const { open, parts, made } = dialog("v4", {}, true)
    open()
    await settled()
    press(parts().viewport, 20, 100)
    expect(made.open.peek()).toBe(true)
  })

  it("takes no press on its way out, and is live again when the dialog comes back", async () => {
    const { open, parts, made } = dialog("v5")
    open()
    await settled()
    const { viewport } = parts()
    made.setOpen(false, because("test"))
    expect(viewport.hasAttribute("inert")).toBe(true)
    // Back before it has left: focus goes in at once, which an inert viewport would refuse.
    open()
    expect(viewport.hasAttribute("inert")).toBe(false)
    expect(focused()).toBe("v5-inside")
  })

  it("says it opened over another dialog, through its exit, and that one is open over it", async () => {
    const under = dialog("v6")
    under.open()
    await settled()
    const over = dialog("v7", {}, false, 400)
    over.open()
    await settled()
    await arrived(over.parts().popup)
    expect(under.parts().viewport.hasAttribute("data-nested-dialog-open")).toBe(true)
    expect(under.parts().viewport.hasAttribute("data-nested")).toBe(false)
    const { viewport } = over.parts()
    expect(viewport.hasAttribute("data-nested")).toBe(true)
    expect(viewport.hasAttribute("data-nested-dialog-open")).toBe(false)
    over.made.setOpen(false, because("test"))
    await settled(10)
    expect(viewport.isConnected).toBe(true)
    expect(viewport.hasAttribute("data-nested")).toBe(true)
    expect(under.parts().viewport.hasAttribute("data-nested-dialog-open")).toBe(false)
  })
})
