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
  it("follows its anchor only while it is told to: a popup on its way out stays put", async () => {
    const root = mount(`
      <button id="anchor" style="position: fixed; left: 100px; top: 100px; width: 80px; height: 20px; padding: 0; border: 0">A</button>
      <div id="positioner"><div style="width: 120px; height: 40px"></div></div>`)
    const position = createPosition(signal<PositionOptions>({ ...POSITION_DEFAULTS }))
    const positioner = find(root, "positioner")
    const anchor = find(root, "anchor")
    const following = signal(true)
    onTestFinished(position.attach(positioner, anchor, following))
    await expect.poll(() => position.placed.peek()).toBe(true)
    anchor.style.top = "200px"
    await expect.poll(() => box(positioner).top).toBe(220)
    following.set(false)
    anchor.style.top = "300px"
    anchor.style.width = "40px"
    await new Promise((done) => setTimeout(done, 100))
    expect(box(positioner).top).toBe(220)
    expect(positioner.style.getPropertyValue("--anchor-width")).toBe("80px")
    // Open again, it is placed where its anchor is by now.
    following.set(true)
    await expect.poll(() => box(positioner).top).toBe(320)
  })

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

  it("measures the gap without the arrow: an arrow changes no offset", async () => {
    const drawn = page("left: 100px; top: 100px", { sideOffset: 8 })
    const arrow = document.createElement("div")
    arrow.style.cssText = "width: 10px; height: 10px"
    find(drawn.root, "popup").append(arrow)
    drawn.position.arrow(arrow)
    await drawn.placed()
    await expect.poll(() => arrow.style.left).not.toBe("")
    // Exactly the offset asked for, to the pixel: neither the arrow's size nor half of it added.
    expect(box(drawn.positioner).top - box(drawn.anchor).bottom).toBe(8)
  })

  it("keeps the arrow at the anchor's centre on the side it flipped to", async () => {
    const { position, positioner, anchor, placed, root } = page("left: 100px; bottom: 10px", {
      sideOffset: 8,
    })
    const arrow = document.createElement("div")
    arrow.style.cssText = "width: 10px; height: 10px"
    find(root, "popup").append(arrow)
    position.arrow(arrow)
    await placed()
    await expect.poll(() => arrow.style.left).not.toBe("")
    // The side chosen, not the side asked for, is what the popup says and the gap is on.
    expect(position.side.peek()).toBe("top")
    expect(box(anchor).top - box(positioner).bottom).toBe(8)
    expect(box(arrow).left + 5).toBe(box(anchor).left + box(anchor).width / 2)
  })

  it("is not placed any more once stopped, and gives back the direction it wrote", async () => {
    const { position, positioner, stop, placed } = page("left: 200px; top: 100px", {}, "rtl")
    await placed()
    stop()
    expect(position.placed.peek()).toBe(false)
    expect(positioner.hasAttribute("dir")).toBe(false)
  })

  it("reads a logical side in the direction it is placed in, and says it in the same words", async () => {
    // Left to right, the end of a line is its right.
    const ltr = page("left: 150px; top: 100px", { side: "inline-end" })
    // Before it is placed, it says the side it was asked for.
    expect(ltr.position.side.peek()).toBe("inline-end")
    await ltr.placed()
    expect(box(ltr.positioner).left).toBe(230)
    expect(ltr.position.side.peek()).toBe("inline-end")
    ltr.stop()
    const start = page("left: 150px; top: 100px", { side: "inline-start" })
    await start.placed()
    expect(box(start.positioner).right).toBe(150)
    expect(start.position.side.peek()).toBe("inline-start")
    start.stop()
    // Right to left, the same word is the other side of the page.
    const rtl = page("left: 150px; top: 100px", { side: "inline-end" }, "rtl")
    await rtl.placed()
    expect(box(rtl.positioner).right).toBe(150)
    expect(rtl.position.side.peek()).toBe("inline-end")
    rtl.stop()
    const back = page("left: 150px; top: 100px", { side: "inline-start" }, "rtl")
    await back.placed()
    expect(box(back.positioner).left).toBe(230)
    expect(back.position.side.peek()).toBe("inline-start")
  })

  it("says the other logical side once flipped, and a physical side when one was asked for", async () => {
    // No room at the right: flipped to the left, which is the start of the line.
    const logical = page("right: 10px; top: 100px", { side: "inline-end" })
    expect(logical.position.side.peek()).toBe("inline-end")
    await logical.placed()
    expect(box(logical.positioner).right).toBe(box(logical.anchor).left)
    expect(logical.position.side.peek()).toBe("inline-start")
    logical.stop()
    const rtl = page("left: 10px; top: 100px", { side: "inline-end" }, "rtl")
    await rtl.placed()
    expect(box(rtl.positioner).left).toBe(box(rtl.anchor).right)
    expect(rtl.position.side.peek()).toBe("inline-start")
    rtl.stop()
    // Asked for by its place on the page, it is said by its place on the page.
    const physical = page("right: 10px; top: 100px", { side: "right" })
    await physical.placed()
    expect(physical.position.side.peek()).toBe("left")
  })

  it("reads a logical side in the direction its provider states, whatever the page says", async () => {
    const root = mount(`
      <button id="anchor" style="position: fixed; left: 150px; top: 100px; width: 80px; height: 20px; padding: 0; border: 0">A</button>
      <div id="positioner"><div style="width: 120px; height: 40px"></div></div>`)
    const direction = signal<"ltr" | "rtl">("rtl")
    const position = createPosition(
      signal<PositionOptions>({ ...POSITION_DEFAULTS, side: "inline-end" }),
      direction
    )
    const positioner = find(root, "positioner")
    onTestFinished(position.attach(positioner, find(root, "anchor")))
    await expect.poll(() => position.placed.peek()).toBe(true)
    expect(box(positioner).right).toBe(150)
    expect(position.side.peek()).toBe("inline-end")
    // The provider turns: the popup goes to the other side, by the same name.
    direction.set("ltr")
    await expect.poll(() => box(positioner).left).toBe(230)
    expect(position.side.peek()).toBe("inline-end")
  })

  it("is placed against the anchor its options name, and follows another when that changes", async () => {
    const { options, positioner, anchor, placed, root } = page("left: 100px; top: 100px")
    const extra = (id: string, left: number, top: number, width: number) => {
      const element = document.createElement("div")
      element.id = id
      element.style.cssText = `position: fixed; left: ${left}px; top: ${top}px; width: ${width}px; height: 30px`
      root.append(element)
      return element
    }
    const second = extra("second", 150, 200, 200)
    const third = extra("third", 200, 300, 160)
    await placed()
    expect(box(positioner).top).toBe(120)
    // An element: under it, and the geometry is its.
    options.set({ ...options.peek(), align: "start", anchor: second })
    await expect.poll(() => box(positioner).top).toBe(230)
    expect(box(positioner).left).toBe(150)
    expect(positioner.style.getPropertyValue("--anchor-width")).toBe("200px")
    // Another one while it is open: it goes there, and follows that one from then on.
    options.set({ ...options.peek(), anchor: third })
    await expect.poll(() => box(positioner).top).toBe(330)
    expect(positioner.style.getPropertyValue("--anchor-width")).toBe("160px")
    third.style.top = "340px"
    await expect.poll(() => box(positioner).top).toBe(370)
    // The one it left is no longer followed.
    second.style.top = "20px"
    await new Promise((done) => setTimeout(done, 50))
    expect(box(positioner).top).toBe(370)
    // A function is asked each time it is placed.
    let now: Element | null = second
    options.set({ ...options.peek(), anchor: () => now })
    await expect.poll(() => box(positioner).top).toBe(50)
    // A place in the viewport that is no element.
    options.set({
      ...options.peek(),
      anchor: { getBoundingClientRect: () => new DOMRect(250, 400, 0, 0) },
    })
    await expect.poll(() => box(positioner).top).toBe(400)
    expect(box(positioner).left).toBe(250)
    // Nothing named: its own anchor again.
    now = null
    options.set({ ...options.peek(), anchor: null })
    await expect.poll(() => box(positioner).top).toBe(120)
    expect(box(positioner).left).toBe(box(anchor).left)
    expect(positioner.style.getPropertyValue("--anchor-width")).toBe("80px")
  })

  it("asks a function that gave nothing once more: its element may arrive a moment later", async () => {
    const root = mount(`
      <button id="anchor" style="position: fixed; left: 100px; top: 100px; width: 80px; height: 20px; padding: 0; border: 0">A</button>
      <div id="second" style="position: fixed; left: 150px; top: 200px; width: 200px; height: 30px"></div>
      <div id="positioner"><div style="width: 120px; height: 40px"></div></div>`)
    // As a framework's ref is: empty while the popup attaches, set before the page is drawn.
    const ref: { current: Element | null } = { current: null }
    const position = createPosition(
      signal<PositionOptions>({ ...POSITION_DEFAULTS, anchor: () => ref.current })
    )
    const positioner = find(root, "positioner")
    onTestFinished(position.attach(positioner, find(root, "anchor")))
    ref.current = find(root, "second")
    await expect.poll(() => position.placed.peek()).toBe(true)
    await expect.poll(() => box(positioner).top).toBe(230)
  })
})
