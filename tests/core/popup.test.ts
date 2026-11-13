import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { bindable } from "../../packages/core/src/bindable.ts"
import { details } from "../../packages/core/src/part.ts"
import type { ChangeDetails, Part } from "../../packages/core/src/part.ts"
import { computed, effect, signal, untracked } from "../../packages/core/src/reactivity.ts"
import { lockPage, popupFocus } from "../../packages/core/src/services/popup-focus.ts"
import { createPopup } from "../../packages/core/src/services/popup.ts"
import type { PopupOptions } from "../../packages/core/src/services/popup.ts"
import { find, focused, mount, style } from "./page.ts"

/**
 * A popup drawn as an adapter draws one, in plain DOM: its element is in the page while
 * `mounted` (or always, when it is kept), with the popup's state on it.
 */
function popup(
  root: HTMLElement,
  name: string,
  given: Partial<PopupOptions> & { content?: string; kept?: boolean; trigger?: string } = {}
) {
  const {
    content = `<button id="${name}-inside">Inside</button>`,
    kept,
    trigger,
    ...options
  } = given
  const reasons: string[] = []
  const value = signal<boolean>(false)
  const open = bindable<boolean>({
    value: () => undefined,
    defaultValue: false,
    onChange: (next, by) => {
      reasons.push(by.reason)
      value.set(next)
    },
  })
  const setOpen = (next: boolean, by: ChangeDetails = details("test")) => open.set(next, by)
  const made = createPopup({
    open,
    setOpen,
    kind: "popover",
    focus: popupFocus(),
    hold: lockPage,
    ...options,
  })
  const part: Part = {
    props: computed(() => ({ id: name, class: "popup", tabindex: "-1", ...made.state() })),
    attach: (element) => made.attach(element),
  }
  const stops: (() => void)[] = []
  if (trigger) stops.push(made.attachTrigger(find(root, trigger)))
  let unbind: (() => void) | undefined
  let element: HTMLElement | undefined
  const draw = () => {
    element = document.createElement("div")
    element.innerHTML = content
    root.append(element)
    unbind = bind(element, part)
  }
  if (kept) draw()
  else {
    stops.push(
      effect(() => {
        const mounted = made.mounted.get()
        untracked(() => {
          if (mounted && !element) draw()
          else if (!mounted && element) {
            unbind?.()
            element.remove()
            element = unbind = undefined
          }
        })
      })
    )
  }
  stops.push(made.start())
  onTestFinished(() => {
    unbind?.()
    for (const stop of stops) stop()
    element?.remove()
  })
  return {
    made,
    open,
    setOpen,
    reasons,
    element: () => root.querySelector<HTMLElement>(`#${name}`),
  }
}

const PAGE = `
  <button id="before">Before</button>
  <button id="trigger">Trigger</button>
  <button id="other">Other</button>
  <p id="text">Text</p>`

const SLOW = `
  .popup { opacity: 1; transition: opacity 150ms linear; }
  .popup[data-ending-style] { opacity: 0; }`

/** An exit is read once the ending attribute is on the element: a mutation's report away. */
const written = () => new Promise((resolve) => setTimeout(resolve))
const gone = (read: () => HTMLElement | null) => expect.poll(read, { timeout: 2000 }).toBe(null)

describe("a popup", () => {
  it("moves focus in as it opens and back to its trigger as it closes", async () => {
    const root = mount(PAGE)
    const { setOpen, element } = popup(root, "p", { trigger: "trigger" })
    find(root, "trigger").focus()
    setOpen(true)
    expect(focused()).toBe("p-inside")
    setOpen(false)
    expect(focused()).toBe("trigger")
    await gone(element)
  })

  it("closes on Escape and on a press outside, and says which", async () => {
    const root = mount(PAGE)
    const { setOpen, reasons, open } = popup(root, "p", { trigger: "trigger" })
    setOpen(true)
    await userEvent.keyboard("{Escape}")
    expect(open.peek()).toBe(false)
    setOpen(true)
    find(root, "text").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))
    expect(open.peek()).toBe(false)
    expect(reasons).toEqual(["test", "escape-key", "test", "outside-press"])
  })

  it("stays for a press on its trigger, which is the trigger's to answer", () => {
    const root = mount(PAGE)
    const { setOpen, open } = popup(root, "p", { trigger: "trigger" })
    setOpen(true)
    find(root, "trigger").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))
    expect(open.peek()).toBe(true)
  })

  it("can keep through a press outside, and leave focus where it is", async () => {
    const root = mount(PAGE)
    const { setOpen, open } = popup(root, "p", { outsidePress: () => false, focus: undefined })
    find(root, "other").focus()
    setOpen(true)
    expect(focused()).toBe("other")
    find(root, "text").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))
    expect(open.peek()).toBe(true)
    await userEvent.keyboard("{Escape}")
    expect(open.peek()).toBe(false)
    expect(focused()).toBe("other")
  })

  it("does nothing while it is kept in the page closed", async () => {
    const root = mount(PAGE)
    const { setOpen, open, element } = popup(root, "p", { kept: true, trigger: "trigger" })
    find(root, "other").focus()
    expect(focused()).toBe("other")
    expect(element()!.hasAttribute("data-closed")).toBe(true)
    // Not in the stack: Escape and a press are not its to hear.
    await userEvent.keyboard("{Escape}")
    setOpen(true)
    expect(focused()).toBe("p-inside")
    setOpen(false)
    expect(open.peek()).toBe(false)
    expect(focused()).toBe("trigger")
  })
})

describe("a popup on its way out", () => {
  it("has given focus back and left the stack before its exit ends", async () => {
    style(SLOW)
    const root = mount(PAGE)
    const under = popup(root, "under", { trigger: "before" })
    under.setOpen(true)
    const over = popup(root, "over", { trigger: "under-inside" })
    over.setOpen(true)
    expect(focused()).toBe("over-inside")
    over.setOpen(false)
    await written()
    // Still drawn, fading; no longer live.
    expect(over.element()).not.toBe(null)
    expect(over.element()!.hasAttribute("data-ending-style")).toBe(true)
    expect(over.element()!.hasAttribute("inert")).toBe(true)
    expect(focused()).toBe("under-inside")
    // Escape is for the popup under it now.
    await userEvent.keyboard("{Escape}")
    expect(under.open.peek()).toBe(false)
    await gone(over.element)
  })

  it("is live again when it is opened during its exit", async () => {
    style(SLOW)
    const root = mount(PAGE)
    const { setOpen, open, element } = popup(root, "p", { trigger: "trigger" })
    setOpen(true)
    setOpen(false)
    await written()
    expect(element()!.hasAttribute("inert")).toBe(true)
    setOpen(true)
    expect(element()!.hasAttribute("inert")).toBe(false)
    expect(focused()).toBe("p-inside")
    await userEvent.keyboard("{Escape}")
    expect(open.peek()).toBe(false)
  })
})

describe("where focus goes back", () => {
  it("is what had focus before, when the trigger is gone", () => {
    const root = mount(PAGE)
    const { setOpen } = popup(root, "p", { trigger: "trigger" })
    find(root, "before").focus()
    setOpen(true)
    find(root, "trigger").remove()
    setOpen(false)
    expect(focused()).toBe("before")
  })

  it("is the popup it was opened from, when both are gone", () => {
    const root = mount(PAGE)
    const under = popup(root, "under", {
      trigger: "before",
      content: `<button id="row">Delete…</button>`,
    })
    under.setOpen(true)
    expect(focused()).toBe("row")
    // A row that opens a dialog and is removed by what the dialog does.
    const over = popup(root, "over", { trigger: "row" })
    over.setOpen(true)
    find(root, "row").remove()
    over.setOpen(false)
    expect(focused()).toBe("under")
  })

  it("is nowhere a person has not put it: focus moved elsewhere stays there", () => {
    const root = mount(PAGE)
    const { setOpen } = popup(root, "p", { trigger: "trigger" })
    setOpen(true)
    find(root, "other").focus()
    setOpen(false)
    expect(focused()).toBe("other")
  })

  it("skips a trigger that is hidden", () => {
    const root = mount(PAGE)
    const { setOpen } = popup(root, "p", { trigger: "trigger" })
    find(root, "before").focus()
    setOpen(true)
    find(root, "trigger").hidden = true
    setOpen(false)
    expect(focused()).toBe("before")
  })
})

describe("a modal popup", () => {
  const inert = (root: HTMLElement, id: string) => find(root, id).hasAttribute("inert")
  const locked = () => document.documentElement.style.overflow === "hidden"

  it("blocks the page while open, and holds its scroll until it has left", async () => {
    style(SLOW)
    const root = mount(PAGE)
    const { setOpen, element } = popup(root, "p", { trigger: "trigger", modal: () => true })
    setOpen(true)
    expect(inert(root, "text")).toBe(true)
    expect(locked()).toBe(true)
    setOpen(false)
    await written()
    // The page is live at once; its scroll comes back with the popup's last frame.
    expect(inert(root, "text")).toBe(false)
    expect(focused()).toBe("trigger")
    expect(element()).not.toBe(null)
    expect(locked()).toBe(true)
    await gone(element)
    expect(locked()).toBe(false)
  })

  it("keeps Tab inside", async () => {
    const root = mount(PAGE)
    const { setOpen } = popup(root, "p", {
      trigger: "trigger",
      modal: () => true,
      content: `<button id="one">One</button><button id="two">Two</button>`,
    })
    setOpen(true)
    expect(focused()).toBe("one")
    await userEvent.keyboard("{Tab}")
    expect(focused()).toBe("two")
    await userEvent.keyboard("{Tab}")
    expect(focused()).toBe("one")
  })

  it("stops a press outside from reaching the popup under it", () => {
    const root = mount(PAGE)
    const under = popup(root, "under", { trigger: "before" })
    under.setOpen(true)
    const over = popup(root, "over", { modal: () => true, outsidePress: () => false })
    over.setOpen(true)
    find(root, "text").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))
    expect(over.open.peek()).toBe(true)
    expect(under.open.peek()).toBe(true)
  })
})
