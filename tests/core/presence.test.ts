import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { flag } from "../../packages/core/src/part.ts"
import type { Part } from "../../packages/core/src/part.ts"
import { computed, effect, signal, untracked } from "../../packages/core/src/reactivity.ts"
import { createPanelPresence } from "../../packages/core/src/services/panel.ts"
import { createPresence } from "../../packages/core/src/services/presence.ts"
import type { Presence, PresenceHooks } from "../../packages/core/src/services/presence.ts"
import { mount, style } from "./page.ts"

/**
 * What an adapter does with a presence, in plain DOM: the element is in the page while
 * `mounted`, and carries the two style attributes as the status says.
 */
function panel(
  initial: boolean,
  make: (open: ReturnType<typeof signal<boolean>>) => Presence,
  content = "Panel"
) {
  const root = mount("")
  const open = signal(initial)
  const presence = make(open)
  const part: Part = {
    props: computed(() => ({
      class: "panel",
      "data-open": flag(open.get()),
      "data-starting-style": flag(presence.status.get() === "starting"),
      "data-ending-style": flag(presence.status.get() === "ending"),
    })),
    attach: (element) => presence.attach(element),
  }
  let unbind: (() => void) | undefined
  const stopDrawing = effect(() => {
    const mounted = presence.mounted.get()
    untracked(() => {
      if (mounted) {
        const element = document.createElement("div")
        element.innerHTML = content
        root.append(element)
        unbind = bind(element, part)
      } else {
        unbind?.()
        unbind = undefined
        root.replaceChildren()
      }
    })
  })
  const stop = presence.start()
  onTestFinished(() => {
    stop()
    stopDrawing()
    unbind?.()
  })
  return { open, presence, element: () => root.querySelector<HTMLElement>(".panel") }
}

const plain = (hooks?: PresenceHooks) => (open: ReturnType<typeof signal<boolean>>) =>
  createPresence(open, hooks)

/** The exit is read once the ending attribute is on the element: a mutation's report away. */
const written = () => new Promise((resolve) => setTimeout(resolve))

const FADE = `
  .panel { opacity: 1; transition: opacity 80ms linear; }
  .panel[data-starting-style], .panel[data-ending-style] { opacity: 0; }`

describe("presence", () => {
  it("draws nothing while closed and the element while open", () => {
    const { open, presence, element } = panel(false, plain())
    expect(presence.mounted.peek()).toBe(false)
    expect(element()).toBeNull()
    open.set(true)
    expect(presence.mounted.peek()).toBe(true)
    expect(element()?.hasAttribute("data-open")).toBe(true)
  })

  it("is in the page at once when open from the start, with no entrance", () => {
    const { presence, element } = panel(true, plain())
    expect(presence.mounted.peek()).toBe(true)
    expect(presence.status.peek()).toBeUndefined()
    expect(element()?.hasAttribute("data-starting-style")).toBe(false)
  })

  it("takes an element with no motion out at once", async () => {
    const { open, presence, element } = panel(true, plain())
    open.set(false)
    await written()
    expect(presence.mounted.peek()).toBe(false)
    expect(element()).toBeNull()
  })

  it("enters from the starting style, as a transition", async () => {
    style(FADE)
    const entered: string[] = []
    const { open, presence, element } = panel(
      false,
      plain({
        onEnter: () => void entered.push("enter"),
        onEntered: () => void entered.push("entered"),
      })
    )
    open.set(true)
    const target = element()!
    // The starting frame is gone, and the opacity is on its way from it.
    expect(target.hasAttribute("data-starting-style")).toBe(false)
    expect(presence.status.peek()).toBeUndefined()
    expect(target.getAnimations()).toHaveLength(1)
    expect(Number(getComputedStyle(target).opacity)).toBeLessThan(1)
    expect(entered).toEqual(["enter"])
    await expect.poll(() => entered).toEqual(["enter", "entered"])
    expect(getComputedStyle(target).opacity).toBe("1")
  })

  it("keeps the element through its exit's transition", async () => {
    style(FADE)
    const exits: number[] = []
    const { open, presence, element } = panel(
      true,
      plain({ onExit: (target) => void exits.push(Number(getComputedStyle(target).opacity)) })
    )
    open.set(false)
    expect(presence.mounted.peek()).toBe(true)
    expect(presence.status.peek()).toBe("ending")
    expect(element()?.hasAttribute("data-ending-style")).toBe(true)
    // The hook saw the element with its open style still.
    expect(exits).toEqual([1])
    await expect.poll(() => presence.mounted.peek()).toBe(false)
    expect(presence.status.peek()).toBeUndefined()
    expect(element()).toBeNull()
  })

  it("waits for a keyframe animation too", async () => {
    style(`
      @keyframes leave { to { opacity: 0; } }
      .panel[data-ending-style] { animation: leave 80ms linear forwards; }`)
    const { open, presence } = panel(true, plain())
    open.set(false)
    expect(presence.mounted.peek()).toBe(true)
    await expect.poll(() => presence.mounted.peek()).toBe(false)
  })

  it("does not wait for an animation that never ends", async () => {
    style(`
      @keyframes turn { to { rotate: 1turn; } }
      .panel { animation: turn 1s linear infinite; }`)
    const { open, presence } = panel(true, plain())
    open.set(false)
    await written()
    expect(presence.mounted.peek()).toBe(false)
  })

  it("stays when it is opened again during its exit", async () => {
    style(FADE)
    const entered: string[] = []
    const { open, presence, element } = panel(
      true,
      plain({ onEntered: () => void entered.push("entered") })
    )
    const target = element()
    open.set(false)
    open.set(true)
    expect(presence.status.peek()).toBeUndefined()
    expect(element()?.hasAttribute("data-ending-style")).toBe(false)
    await expect.poll(() => entered).toEqual(["entered"])
    expect(presence.mounted.peek()).toBe(true)
    // The same element: it was never taken out.
    expect(element()).toBe(target)
  })

  it("leaves when it is closed again during its entrance", async () => {
    style(FADE)
    const entered: string[] = []
    const { open, presence } = panel(
      false,
      plain({ onEntered: () => void entered.push("entered") })
    )
    open.set(true)
    open.set(false)
    await expect.poll(() => presence.mounted.peek()).toBe(false)
    expect(entered).toEqual([])
  })
})

describe("a panel that opens by growing", () => {
  const grow = (open: ReturnType<typeof signal<boolean>>) => createPanelPresence(open, "--panel")
  const CONTENT = `<div style="height: 120px; width: 200px"></div>`
  const GROW = `
    .panel { overflow: hidden; height: var(--panel-height); transition: height 80ms linear; }
    .panel[data-starting-style], .panel[data-ending-style] { height: 0; }`

  it("follows its content when open from the start", () => {
    const { element } = panel(true, grow, CONTENT)
    expect(element()?.style.getPropertyValue("--panel-height")).toBe("auto")
    expect(element()?.style.getPropertyValue("--panel-width")).toBe("auto")
  })

  it("carries its content's size while it opens, then follows it", async () => {
    style(GROW)
    const { open, element } = panel(false, grow, CONTENT)
    open.set(true)
    const target = element()!
    expect(target.style.getPropertyValue("--panel-height")).toBe("120px")
    expect(target.getBoundingClientRect().height).toBeLessThan(120)
    await expect.poll(() => target.style.getPropertyValue("--panel-height")).toBe("auto")
    expect(target.getBoundingClientRect().height).toBe(120)
  })

  it("closes from its size, not from auto", async () => {
    style(GROW)
    const { open, presence, element } = panel(true, grow, CONTENT)
    open.set(false)
    expect(element()?.style.getPropertyValue("--panel-height")).toBe("120px")
    expect(presence.mounted.peek()).toBe(true)
    await expect.poll(() => presence.mounted.peek()).toBe(false)
  })
})
