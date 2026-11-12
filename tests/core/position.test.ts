import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { signal } from "../../packages/core/src/reactivity.ts"
import { POSITION_DEFAULTS, createPosition } from "../../packages/core/src/services/position.ts"
import type { PositionOptions } from "../../packages/core/src/services/position.ts"
import { find, mount } from "./page.ts"

// An anchor 80 × 20 and a popup 120 × 40. The viewport is the test page's own.
function page(anchorStyle: string, given: Partial<PositionOptions> = {}, dir?: "rtl") {
  const root = mount(`
    <div ${dir ? `dir="${dir}"` : ""}>
      <button id="anchor" style="position: fixed; width: 80px; height: 20px; padding: 0; border: 0; ${anchorStyle}">A</button>
    </div>
    <div id="positioner"><div id="popup" style="width: 120px; height: 40px"></div></div>`)
  const options = signal<PositionOptions>({ ...POSITION_DEFAULTS, ...given })
  const position = createPosition(options)
  const positioner = find(root, "positioner")
  const anchor = find(root, "anchor")
  const stop = position.attach(positioner, anchor)
  onTestFinished(stop)
  const placed = () => expect.poll(() => position.placed.peek()).toBe(true)
  return { options, position, positioner, anchor, stop, placed, root }
}

const box = (element: Element) => element.getBoundingClientRect()

describe("positioning", () => {
  it("places the popup under its anchor, centred, and says where", async () => {
    const { position, positioner, placed } = page("left: 100px; top: 100px")
    await placed()
    expect(box(positioner).top).toBe(120)
    expect(box(positioner).left).toBe(80)
    expect(position.side.peek()).toBe("bottom")
    expect(position.align.peek()).toBe("center")
  })

  it("writes the anchor's size and the room there is", async () => {
    const { positioner, placed } = page("left: 100px; top: 100px")
    await placed()
    const read = (name: string) => positioner.style.getPropertyValue(name)
    expect(read("--anchor-width")).toBe("80px")
    expect(read("--anchor-height")).toBe("20px")
    expect(parseFloat(read("--available-height"))).toBe(window.innerHeight - 120 - 5)
    // The anchor's centre, from the popup's corner: where a scale grows from.
    expect(read("--transform-origin")).toBe("60px 0%")
  })

  it("keeps the gap asked for, and aligns to an edge", async () => {
    const { positioner, placed } = page("left: 100px; top: 100px", {
      sideOffset: 8,
      align: "start",
      alignOffset: 4,
    })
    await placed()
    expect(box(positioner).top).toBe(128)
    expect(box(positioner).left).toBe(104)
  })

  it("flips to the other side when there is no room", async () => {
    const { position, positioner, anchor, placed } = page("left: 100px; bottom: 10px")
    await placed()
    expect(position.side.peek()).toBe("top")
    expect(box(positioner).bottom).toBe(box(anchor).top)
  })

  it("stays inside the viewport's edge", async () => {
    const { positioner, placed } = page("left: 0px; top: 100px")
    await placed()
    expect(box(positioner).left).toBe(5)
  })

  it("moves when another side is asked for", async () => {
    const { options, position, positioner, placed } = page("left: 100px; top: 100px")
    await placed()
    options.set({ ...POSITION_DEFAULTS, side: "right" })
    await expect.poll(() => position.side.peek()).toBe("right")
    expect(box(positioner).left).toBe(180)
    expect(box(positioner).top).toBe(90)
  })

  it("follows its anchor when the anchor moves", async () => {
    const { positioner, anchor, placed } = page("left: 100px; top: 100px")
    await placed()
    anchor.style.top = "200px"
    await expect.poll(() => box(positioner).top).toBe(220)
  })

  it("reads start and end in the direction of where the anchor is", async () => {
    const { positioner, anchor, placed } = page(
      "left: 200px; top: 100px",
      { align: "start" },
      "rtl"
    )
    await placed()
    expect(positioner.getAttribute("dir")).toBe("rtl")
    expect(box(positioner).right).toBe(box(anchor).right)
  })

  it("points an arrow at the anchor's centre", async () => {
    const { position, positioner, anchor, placed, root } = page("left: 100px; top: 100px")
    const arrow = document.createElement("div")
    arrow.style.cssText = "width: 10px; height: 10px"
    find(root, "popup").append(arrow)
    position.arrow(arrow)
    await placed()
    await expect.poll(() => arrow.style.left).not.toBe("")
    const centre = box(anchor).left + box(anchor).width / 2
    expect(box(arrow).left + 5).toBe(centre)
    expect(position.uncentered.peek()).toBe(false)
    expect(box(positioner).left).toBe(80)
  })

  it("is not placed any more once stopped, and gives back the direction it wrote", async () => {
    const { position, positioner, stop, placed } = page("left: 200px; top: 100px", {}, "rtl")
    await placed()
    stop()
    expect(position.placed.peek()).toBe(false)
    expect(positioner.hasAttribute("dir")).toBe(false)
  })
})
