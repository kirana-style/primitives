import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { lockScroll } from "../../packages/core/src/services/scroll-lock.ts"
import { mount } from "./page.ts"

function tallPage() {
  mount(`<div style="height: 4000px"></div>`)
  const root = document.documentElement
  const before = { overflow: root.style.overflow, padding: root.style.paddingInlineEnd }
  onTestFinished(() => {
    root.style.overflow = before.overflow
    root.style.paddingInlineEnd = before.padding
  })
  return root
}

describe("the scroll lock", () => {
  it("stops the page scrolling and gives it back", () => {
    const root = tallPage()
    const unlock = lockScroll(document)
    expect(getComputedStyle(root).overflowY).toBe("hidden")
    unlock()
    expect(root.style.overflow).toBe("")
    expect(getComputedStyle(root).overflowY).toBe("visible")
  })

  it("holds until the last of several locks is released", () => {
    const root = tallPage()
    const first = lockScroll(document)
    const second = lockScroll(document)
    first()
    // Released twice, counted once.
    first()
    expect(root.style.overflow).toBe("hidden")
    second()
    expect(root.style.overflow).toBe("")
  })

  it("puts back the page's own style", () => {
    const root = tallPage()
    root.style.overflow = "scroll"
    root.style.paddingInlineEnd = "3px"
    const unlock = lockScroll(document)
    unlock()
    expect(root.style.overflow).toBe("scroll")
    expect(root.style.paddingInlineEnd).toBe("3px")
  })

  it("keeps the page's width when its scrollbar took space", () => {
    const root = tallPage()
    const gap = window.innerWidth - root.clientWidth
    const width = document.body.getBoundingClientRect().width
    const unlock = lockScroll(document)
    expect(root.style.paddingInlineEnd).toBe(gap > 0 ? `${gap}px` : "")
    expect(document.body.getBoundingClientRect().width).toBe(width)
    unlock()
    expect(root.style.paddingInlineEnd).toBe("")
  })
})
