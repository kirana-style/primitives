import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { createResizable } from "../../packages/core/src/resizable.ts"
import type { ResizableProps } from "../../packages/core/src/resizable.ts"
import { find, mount, style } from "./page.ts"

const PAGE = `
  <div id="group">
    <div id="a">A</div><div id="h1" class="bar"></div>
    <div id="b">B</div><div id="h2" class="bar"></div>
    <div id="c">C</div>
  </div>`

function panels(given: Partial<ResizableProps> = {}, dir?: "rtl") {
  style(`
    #group { display: flex; width: 620px; height: 100px; }
    #group[data-orientation="vertical"] { flex-direction: column; width: 100px; height: 620px; }
    .bar { flex: 0 0 10px; }
    #group > div { min-width: 0; min-height: 0; overflow: hidden; }`)
  const root = mount(PAGE)
  if (dir) root.setAttribute("dir", dir)
  const heard: number[][] = []
  const made = createResizable(
    signal<ResizableProps>({
      id: "group",
      onSizesChange: (next) => void heard.push(next),
      ...given,
    })
  )
  onTestFinished(bind(find(root, "group"), made.group))
  onTestFinished(
    bind(
      find(root, "a"),
      made.panel(() => ({ defaultSize: 25, minSize: 10 }))
    )
  )
  onTestFinished(
    bind(
      find(root, "b"),
      made.panel(() => ({ defaultSize: 50 }))
    )
  )
  onTestFinished(
    bind(
      find(root, "c"),
      made.panel(() => ({ defaultSize: 25, maxSize: 40 }))
    )
  )
  onTestFinished(bind(find(root, "h1"), made.handle()))
  onTestFinished(bind(find(root, "h2"), made.handle()))
  const widths = () =>
    ["a", "b", "c"].map((id) => Math.round(find(root, id).getBoundingClientRect().width))
  const shares = () => made.sizes.peek().map((each) => Math.round(each))
  return { root, made, heard, widths, shares }
}

const press = (key: string) => userEvent.keyboard(`{${key}}`)
const settled = () => new Promise((resolve) => setTimeout(resolve, 20))
const pointer = (target: Element, type: string, x: number, y = 0) =>
  target.dispatchEvent(
    new PointerEvent(type, {
      clientX: x,
      clientY: y,
      button: 0,
      pointerId: 1,
      bubbles: true,
      cancelable: true,
    })
  )

describe("resizable panels", () => {
  it("share what the bars leave, by what each began with", async () => {
    const { root, widths, shares } = panels()
    await settled()
    // 600 pixels are left by two bars of 10.
    expect(widths()).toEqual([150, 300, 150])
    expect(shares()).toEqual([25, 50, 25])
    const bar = find(root, "h1")
    expect(bar.getAttribute("role")).toBe("separator")
    // Between panels side by side, the bar stands: said once, by the group.
    expect(bar.getAttribute("aria-orientation")).toBe("vertical")
    expect(bar.getAttribute("aria-valuenow")).toBe("25")
    expect(bar.getAttribute("aria-valuemin")).toBe("10")
    expect(find(root, "a").style.getPropertyValue("--panel-size")).toBe("25")
  })

  it("a dragged bar gives one panel what it takes from the next", async () => {
    const { root, widths, shares, heard } = panels()
    await settled()
    const bar = find(root, "h1")
    pointer(bar, "pointerdown", 150)
    expect(bar.hasAttribute("data-dragging")).toBe(true)
    // 62 pixels of 620: ten hundredths.
    pointer(bar, "pointermove", 212)
    await settled()
    expect(shares()).toEqual([35, 40, 25])
    expect(widths()).toEqual([210, 240, 150])
    pointer(bar, "pointerup", 212)
    expect(bar.hasAttribute("data-dragging")).toBe(false)
    pointer(bar, "pointermove", 400)
    expect(shares()).toEqual([35, 40, 25])
    expect(heard.length).toBe(1)
  })

  it("stays within what each panel allows", async () => {
    const { root, shares } = panels()
    await settled()
    const first = find(root, "h1")
    pointer(first, "pointerdown", 150)
    pointer(first, "pointermove", -500)
    // The first panel's least.
    expect(shares()).toEqual([10, 65, 25])
    pointer(first, "pointerup", -500)
    const second = find(root, "h2")
    pointer(second, "pointerdown", 400)
    pointer(second, "pointermove", 0)
    // The last panel's most.
    expect(shares()).toEqual([10, 50, 40])
  })

  it("moves with the arrows, Home and End, in the reading direction", async () => {
    const { root, shares } = panels()
    await settled()
    find(root, "h1").focus()
    await press("ArrowRight")
    expect(shares()).toEqual([35, 40, 25])
    await press("ArrowLeft")
    await press("ArrowLeft")
    expect(shares()).toEqual([15, 60, 25])
    await press("Home")
    expect(shares()).toEqual([10, 65, 25])
    await press("End")
    expect(shares()).toEqual([75, 0, 25])
    const rtl = panels({}, "rtl")
    await settled()
    find(rtl.root, "h1").focus()
    await press("ArrowLeft")
    expect(rtl.shares()).toEqual([35, 40, 25])
  })

  it("one over the other, the bars lie and the arrows go down", async () => {
    const { root, shares } = panels({ orientation: "vertical" })
    await settled()
    const bar = find(root, "h1")
    expect(bar.getAttribute("aria-orientation")).toBe("horizontal")
    bar.focus()
    await press("ArrowRight")
    expect(shares()).toEqual([25, 50, 25])
    await press("ArrowDown")
    expect(shares()).toEqual([35, 40, 25])
    pointer(bar, "pointerdown", 0, 100)
    pointer(bar, "pointermove", 0, 38)
    expect(shares()).toEqual([25, 50, 25])
  })

  it("a caller who refuses keeps the panels as they are; disabled, a bar is no stop", async () => {
    const refused = panels({ onSizesChange: (_next, by) => by.cancel() })
    await settled()
    find(refused.root, "h1").focus()
    await press("ArrowRight")
    expect(refused.shares()).toEqual([25, 50, 25])
    const off = panels({ disabled: true })
    await settled()
    expect(find(off.root, "h1").hasAttribute("tabindex")).toBe(false)
    pointer(find(off.root, "h1"), "pointerdown", 150)
    pointer(find(off.root, "h1"), "pointermove", 300)
    expect(off.shares()).toEqual([25, 50, 25])
  })
})
