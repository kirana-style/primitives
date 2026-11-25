import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { createRating, ratingVocabulary } from "../../docs/examples/rating.ts"
import type { RatingProps } from "../../docs/examples/rating.ts"
import { bind } from "../../packages/core/src/bind.ts"
import { createCollapsible } from "../../packages/core/src/collapsible.ts"
import type { CollapsibleProps } from "../../packages/core/src/collapsible.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { faults, known, recorder, serialize, settled } from "../../packages/core/src/testing.ts"
import { mount, style } from "./page.ts"

describe("the testing kit", () => {
  it("finds no fault in a component of the library, in each of its states", async () => {
    style(
      `.panel { transition: opacity 40ms; } .panel[data-starting-style], .panel[data-ending-style] { opacity: 0; }`
    )
    const root = mount(`<div class="root"><button class="trigger">More</button></div>`)
    const heard = recorder<boolean>()
    const made = createCollapsible(
      signal<CollapsibleProps>({ id: "c", onOpenChange: heard.listen })
    )
    const trigger = root.querySelector<HTMLElement>(".trigger")!
    onTestFinished(bind(root.querySelector<HTMLElement>(".root")!, made.root))
    onTestFinished(bind(trigger, made.trigger))
    onTestFinished(made.mount())
    // Closed, its panel is out of the page: its trigger must not point at it.
    expect(faults(root)).toEqual([])
    const panel = document.createElement("div")
    panel.className = "panel"
    trigger.click()
    root.firstElementChild!.append(panel)
    onTestFinished(bind(panel, made.panel))
    await settled()
    expect(faults(root)).toEqual([])
    expect(heard.said()).toEqual(["true trigger-press"])
    expect(heard.calls[0]!.source).toBe("virtual")
  })

  it("names each kind of fault", () => {
    const root = mount(
      `<div id="twice" data-open="false" data-made-up aria-controls="nowhere" style="--made-up: 1px"></div>
       <div id="twice" data-side="diagonal" data-testid="second" data-mine="x"></div>`
    )
    expect(faults(root, known(), { allow: ["data-mine"] })).toEqual([
      'twice has data-open="false": a state is present or absent',
      "twice has data-made-up, which no vocabulary names",
      'twice has aria-controls="nowhere", which is not in the page',
      "twice has --made-up, which no vocabulary names",
      'second has data-side="diagonal", which is none of its values',
      '2 elements have the id "twice"',
    ])
  })

  it("holds a component of one's own to its own vocabulary", () => {
    const root = mount(`<div class="stars"><button class="star">★</button></div>`)
    const made = createRating(signal<RatingProps>({ defaultValue: 1 }))
    onTestFinished(bind(root.querySelector<HTMLElement>(".stars")!, made.root))
    onTestFinished(bind(root.querySelector<HTMLElement>(".star")!, made.item(1)))
    // The library's vocabulary does not know a rating's `data-checked`… it does: a checkbox's.
    expect(faults(root, known(ratingVocabulary))).toEqual([])
    root.querySelector(".star")!.setAttribute("data-rating", "1")
    expect(faults(root, known(ratingVocabulary))).toEqual([
      "button has data-rating, which no vocabulary names",
    ])
  })

  it("writes what two frameworks drew the same as the same text", () => {
    const one = mount(
      `<div data-testid="box" class=" a  b " data-open style="width:40%;color: red"><!--v-if-->Hello<!----> there<input value="x" /></div>`
    )
    const other = mount(
      `<div style="color: red; width: 40%;" data-open="" class="a b" data-testid="box" ng-version="20">Hello there<input></div>`
    )
    other.querySelector("input")!.value = "x"
    const text = serialize(one.firstElementChild!)
    expect(text).toBe(serialize(other.firstElementChild!, { skip: ["ng-version"] }))
    expect(text).toBe(
      [
        '<div#box class="a b" data-open style="color: red; width: 40%">',
        '  "Hello there"',
        '  <input value="x">',
      ].join("\n")
    )
  })

  it("waits for motion to end, and says what did not", async () => {
    style(`.fade { transition: opacity 60ms; }`)
    const root = mount(`<div class="fade" style="opacity: 1">x</div>`)
    const element = root.firstElementChild as HTMLElement
    void getComputedStyle(element).opacity
    element.style.opacity = "0"
    await settled()
    expect(getComputedStyle(element).opacity).toBe("0")
    element.setAttribute("data-ending-style", "")
    await expect(settled(document, 60)).rejects.toThrow("<div> in its first or last frame")
  })

  it("is settled in a document with no Web Animations, as the components there are", async () => {
    // jsdom has no `getAnimations`: nothing animates there, so nothing is moving.
    const page = document.implementation.createHTMLDocument()
    Object.defineProperty(page, "getAnimations", { value: undefined })
    await expect(settled(page, 200)).resolves.toBeUndefined()
  })

  it("rejects when it cannot look at the page, rather than throwing in a timer", async () => {
    const page = document.implementation.createHTMLDocument()
    Object.defineProperty(page, "querySelector", {
      value: () => {
        throw new Error("no selectors here")
      },
    })
    await expect(settled(page, 200)).rejects.toThrow("no selectors here")
  })

  it("records what a callback heard, and refuses when told to", () => {
    const heard = recorder<number>()
    const made = createRating(signal<RatingProps>({ defaultValue: 1, onValueChange: heard.listen }))
    const root = mount(`<button class="star">★</button>`)
    const star = root.firstElementChild as HTMLElement
    onTestFinished(bind(star, made.item(3)))
    star.click()
    expect(heard.said()).toEqual(["3 item-press"])
    expect(made.value.peek()).toBe(3)
    heard.refuse()
    const other = createRating(
      signal<RatingProps>({ defaultValue: 1, onValueChange: heard.listen })
    )
    const second = mount(`<button class="star">★</button>`).firstElementChild as HTMLElement
    onTestFinished(bind(second, other.item(5)))
    second.click()
    expect(other.value.peek()).toBe(1)
  })
})
