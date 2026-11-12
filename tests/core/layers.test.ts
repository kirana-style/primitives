import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { layersAbove, layersChanged, pushLayer } from "../../packages/core/src/services/layers.ts"
import type { Layer } from "../../packages/core/src/services/layers.ts"
import { find, mount } from "./page.ts"

const PAGE = `
  <button id="outside">Outside</button>
  <button id="trigger">Trigger</button>
  <div id="one"><button id="in-one">One</button></div>
  <div id="two"><input id="in-two" /></div>
  <div id="three"><button id="in-three">Three</button></div>`

function stack(root: HTMLElement, layers: (Partial<Layer> & { id: string })[]) {
  const heard: string[] = []
  for (const { id, ...rest } of layers) {
    const pop = pushLayer({
      element: find(root, id),
      kind: "popover",
      onEscape: () => void heard.push(`escape ${id}`),
      onOutsidePress: () => void heard.push(`outside ${id}`),
      ...rest,
    })
    onTestFinished(pop)
  }
  return heard
}

const pressOn = (element: Element) =>
  element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))

describe("the stack of open popups", () => {
  it("gives Escape to the top layer only", async () => {
    const root = mount(PAGE)
    const heard = stack(root, [{ id: "one" }, { id: "two" }])
    await userEvent.keyboard("{Escape}")
    expect(heard).toEqual(["escape two"])
  })

  it("leaves an Escape something inside already took", async () => {
    const root = mount(PAGE)
    const heard = stack(root, [{ id: "two" }])
    const input = find(root, "in-two")
    input.addEventListener("keydown", (event) => event.preventDefault())
    input.focus()
    await userEvent.keyboard("{Escape}")
    expect(heard).toEqual([])
  })

  it("tells every layer a press is outside of, the top one first", () => {
    const root = mount(PAGE)
    const heard = stack(root, [{ id: "one" }, { id: "two" }])
    pressOn(find(root, "outside"))
    expect(heard).toEqual(["outside two", "outside one"])
  })

  it("stops at the layer the press is inside", () => {
    const root = mount(PAGE)
    const heard = stack(root, [{ id: "one" }, { id: "two" }, { id: "three" }])
    pressOn(find(root, "in-two"))
    expect(heard).toEqual(["outside three"])
  })

  it("goes no further down than a modal layer", () => {
    const root = mount(PAGE)
    const heard = stack(root, [{ id: "one" }, { id: "two", modal: true }, { id: "three" }])
    pressOn(find(root, "outside"))
    expect(heard).toEqual(["outside three", "outside two"])
  })

  it("counts a layer's branches as inside it", () => {
    const root = mount(PAGE)
    const heard = stack(root, [
      { id: "one" },
      { id: "two", branches: () => [find(root, "trigger"), undefined, null] },
    ])
    pressOn(find(root, "trigger"))
    expect(heard).toEqual([])
  })

  it("counts the layers of a kind above an element's own", () => {
    const root = mount(PAGE)
    stack(root, [{ id: "one", kind: "dialog" }, { id: "two" }, { id: "three", kind: "dialog" }])
    expect(layersAbove(find(root, "one"), "dialog")).toBe(1)
    expect(layersAbove(find(root, "one"), "popover")).toBe(1)
    expect(layersAbove(find(root, "three"), "dialog")).toBe(0)
    expect(layersAbove(find(root, "outside"), "dialog")).toBe(0)
  })

  it("listens only while a layer is open, and says when the stack changes", async () => {
    const root = mount(PAGE)
    const heard: string[] = []
    const before = layersChanged.peek()
    const pop = pushLayer({
      element: find(root, "one"),
      kind: "popover",
      onEscape: () => void heard.push("escape"),
      onOutsidePress: () => void heard.push("outside"),
    })
    expect(layersChanged.peek()).toBe(before + 1)
    pop()
    expect(layersChanged.peek()).toBe(before + 2)
    await userEvent.keyboard("{Escape}")
    pressOn(find(root, "outside"))
    expect(heard).toEqual([])
  })
})
