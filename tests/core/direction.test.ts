import { describe, expect, it } from "vite-plus/test"

import { carryDirection, createDirection, directionOf } from "../../packages/core/src/direction.ts"
import type { DirectionProps } from "../../packages/core/src/direction.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { find, mount } from "./page.ts"

const PAGE = `
  <div dir="rtl"><span id="rtl">Right to left</span><div dir="ltr"><span id="back">Back</span></div></div>
  <span id="plain">Plain</span>
  <div id="popup"></div>`

describe("the reading direction", () => {
  it("is the nearest dir's, and left to right without one", () => {
    const root = mount(PAGE)
    expect(directionOf(find(root, "rtl"))).toBe("rtl")
    expect(directionOf(find(root, "back"))).toBe("ltr")
    expect(directionOf(find(root, "plain"))).toBe("ltr")
  })

  it("follows CSS where the direction is set there", () => {
    const root = mount(`<div style="direction: rtl"><span id="styled">Styled</span></div>`)
    expect(directionOf(find(root, "styled"))).toBe("rtl")
  })

  it("is the provider's when there is one", () => {
    const root = mount(PAGE)
    const props = signal<DirectionProps>({ direction: "rtl" })
    const provider = createDirection(props)
    expect(directionOf(find(root, "plain"), provider.direction)).toBe("rtl")
    props.set({})
    expect(directionOf(find(root, "rtl"), provider.direction)).toBe("ltr")
  })
})

describe("a popup moved out of its place", () => {
  it("is given the direction of where it came from", () => {
    const root = mount(PAGE)
    const popup = find(root, "popup")
    const forget = carryDirection(popup, find(root, "rtl"))
    expect(popup.getAttribute("dir")).toBe("rtl")
    forget()
    expect(popup.hasAttribute("dir")).toBe(false)
  })

  it("is left alone when the two agree", () => {
    const root = mount(PAGE)
    const popup = find(root, "popup")
    carryDirection(popup, find(root, "plain"))
    expect(popup.hasAttribute("dir")).toBe(false)
  })

  it("keeps a dir of its own", () => {
    const root = mount(PAGE)
    const popup = find(root, "popup")
    popup.setAttribute("dir", "ltr")
    const forget = carryDirection(popup, find(root, "rtl"))
    forget()
    expect(popup.getAttribute("dir")).toBe("ltr")
  })
})
