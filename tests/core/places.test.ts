import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { createAccordion } from "../../packages/core/src/accordion.ts"
import type { AccordionProps } from "../../packages/core/src/accordion.ts"
import { bind, write } from "../../packages/core/src/bind.ts"
import { createCollapsible } from "../../packages/core/src/collapsible.ts"
import { details } from "../../packages/core/src/part.ts"
import { effect, signal } from "../../packages/core/src/reactivity.ts"
import { createPlaces } from "../../packages/core/src/services/places.ts"
import { createTabs } from "../../packages/core/src/tabs.ts"
import type { TabsProps } from "../../packages/core/src/tabs.ts"
import { find, mount, style } from "./page.ts"

describe("places", () => {
  it("are guessed from the order the parts are first asked for, then read from the page", () => {
    const places = createPlaces<string>({ guess: true })
    // Asked twice for the first, as React's StrictMode makes a part twice: the same place.
    for (const key of ["a", "a", "b", "c"]) places.ask(key)
    expect(["a", "b", "c"].map((key) => places.place(key))).toEqual([0, 1, 2])
    const root = mount(`<div id="c"></div><div id="a"></div><div id="b"></div>`)
    const leave = ["a", "b", "c"].map((key) => places.join(key, find(root, key)))
    expect(["a", "b", "c"].map((key) => places.place(key))).toEqual([1, 2, 0])
    // One leaves the page: the ones after it move up.
    leave[2]!()
    expect(["a", "b"].map((key) => places.place(key))).toEqual([0, 1])
  })

  it("are known only in the page without a guess", () => {
    const places = createPlaces<string>({ guess: false })
    places.ask("a")
    expect(places.place("a")).toBe(undefined)
    const root = mount(`<div id="a"></div>`)
    places.join("a", find(root, "a"))
    expect(places.place("a")).toBe(0)
  })
})

describe("an accordion's items", () => {
  it("say their place on each part, which a server writes too, as Base UI's data-index", () => {
    const accordion = createAccordion(signal<AccordionProps<string>>({ id: "a" }))
    // Made twice over, as React's StrictMode makes them: each keeps its place.
    for (const value of ["one", "one", "two", "two"]) accordion.item(value)
    const one = accordion.item("one")
    const two = accordion.item("two")
    const root = mount(`<div id="one"></div><div id="two"></div>`)
    // What a server writes: no page, the order they were made in.
    for (const [part, at] of [
      [one.root, "0"],
      [one.header, "0"],
      [one.trigger, "0"],
      [one.panel, "0"],
      [two.root, "1"],
      [two.trigger, "1"],
    ] as const)
      expect(part.props.peek()["data-index"]).toBe(at)
    write(find(root, "two"), two.root)
    expect(find(root, "two").getAttribute("data-index")).toBe("1")
  })

  it("take their place from the page once in it", () => {
    const accordion = createAccordion(signal<AccordionProps<string>>({ id: "a" }))
    const late = accordion.item("late")
    const first = accordion.item("first")
    // Drawn in the other order than they were made.
    const root = mount(`<div id="first"></div><div id="late"></div>`)
    onTestFinished(bind(find(root, "first"), first.root))
    onTestFinished(bind(find(root, "late"), late.root))
    expect(find(root, "first").getAttribute("data-index")).toBe("0")
    expect(find(root, "late").getAttribute("data-index")).toBe("1")
    expect(late.trigger.props.peek()["data-index"]).toBe("1")
  })
})

describe("tabs", () => {
  // A tab and a panel write their own ids: the elements are held before they are bound.
  it("say the way the active tab came from on each tab too", () => {
    style(`.tab { display: inline-block; width: 50px; }`)
    const tabs = createTabs(signal<TabsProps<string>>({ id: "t", defaultValue: "a" }))
    const root = mount(
      `<div id="list"><button id="a" class="tab"></button><button id="b" class="tab"></button></div>`
    )
    const [a, b] = [find(root, "a"), find(root, "b")]
    onTestFinished(bind(find(root, "list"), tabs.list))
    onTestFinished(bind(a, tabs.tab("a")))
    onTestFinished(bind(b, tabs.tab("b")))
    expect(a.getAttribute("data-activation-direction")).toBe("none")
    b.click()
    expect(a.getAttribute("data-activation-direction")).toBe("right")
    expect(b.getAttribute("data-activation-direction")).toBe("right")
    a.click()
    expect(b.getAttribute("data-activation-direction")).toBe("left")
  })

  it("give each panel in the page its place among them, once it is there, as Base UI's", () => {
    const tabs = createTabs(signal<TabsProps<string>>({ id: "t", defaultValue: "b" }))
    const a = tabs.panel("a")
    const b = tabs.panel("b")
    // A server has no page to count in: it writes none.
    expect(b.part.props.peek()["data-index"]).toBe(undefined)
    const root = mount(`<div id="a"></div><div id="b"></div>`)
    const [first, second] = [find(root, "a"), find(root, "b")]
    // Only the active panel is in the page: it is the first there.
    const leave = bind(second, b.part)
    expect(second.getAttribute("data-index")).toBe("0")
    // Kept in the page too, the first panel comes before it.
    onTestFinished(bind(first, a.part))
    expect(first.getAttribute("data-index")).toBe("0")
    expect(second.getAttribute("data-index")).toBe("1")
    leave()
  })
})

describe("a collapsible's root", () => {
  it("says its panel's starting and ending styles, at the same moments as the panel", async () => {
    style(
      `#panel { transition: opacity 60ms } #panel[data-starting-style], #panel[data-ending-style] { opacity: 0 }`
    )
    const made = createCollapsible(signal({ id: "c" }))
    const root = mount(`<div id="root"><div id="holder"></div></div>`)
    onTestFinished(bind(find(root, "root"), made.root))
    onTestFinished(made.mount())
    // Each frame: whether the root and the panel had each style, when either changed.
    const frames: string[] = []
    onTestFinished(
      effect(() => {
        const own = made.root.props.get()
        const panel = made.panel.props.get()
        const said = (props: Record<string, unknown>) =>
          `${props["data-starting-style"] === "" ? "S" : "-"}${props["data-ending-style"] === "" ? "E" : "-"}`
        frames.push(`${said(own)}/${said(panel)}`)
      })
    )
    let undo: (() => void) | undefined
    onTestFinished(
      effect(() => {
        if (made.mounted.get() && !undo) {
          const panel = document.createElement("div")
          panel.id = "panel"
          find(root, "holder").append(panel)
          const unbind = bind(panel, made.panel)
          undo = () => {
            unbind()
            panel.remove()
          }
        } else if (!made.mounted.get() && undo) {
          undo()
          undo = undefined
        }
      })
    )
    made.setOpen(true, details("trigger-press"))
    await expect.poll(() => find(root, "root").hasAttribute("data-starting-style")).toBe(false)
    made.setOpen(false, details("trigger-press"))
    expect(find(root, "root").hasAttribute("data-ending-style")).toBe(true)
    await expect.poll(() => made.mounted.peek()).toBe(false)
    expect(find(root, "root").hasAttribute("data-ending-style")).toBe(false)
    for (const frame of frames) expect(frame.slice(0, 2)).toBe(frame.slice(3))
    expect(frames).toContain("S-/S-")
    expect(frames).toContain("-E/-E")
    undo?.()
  })
})
