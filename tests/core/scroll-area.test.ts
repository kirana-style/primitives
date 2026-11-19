import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { effect, signal, untracked } from "../../packages/core/src/reactivity.ts"
import { SCROLLING_FOR, createScrollArea } from "../../packages/core/src/scroll-area.ts"
import { find, mount, style } from "./page.ts"

const PAGE = `
  <div id="area">
    <div id="view"><div id="content"></div></div>
  </div>`

/**
 * An area 100 square, drawn as an adapter draws one: a scrollbar is in the page while shown,
 * and so is the corner. The stylesheet gives each scrollbar its thickness and nothing else:
 * where they lie is the library's.
 */
function area(
  width: number,
  height: number,
  {
    dir,
    corner = true,
    padded = false,
    wrapped = true,
  }: { dir?: "rtl"; corner?: boolean; padded?: boolean; wrapped?: boolean } = {}
) {
  style(`
    #area { width: 100px; height: 100px; }
    #view { width: 100px; height: 100px; }
    .bar { background: #eee; box-sizing: border-box; }
    .bar[data-orientation="vertical"] { width: 10px; }
    .bar[data-orientation="horizontal"] { height: 10px; display: flex; }
    .bar.padded[data-orientation="vertical"] { padding: 4px 0; }
    .bar.padded[data-orientation="horizontal"] { padding: 0 4px; }
    .thumb { background: #888; }
    .thumb[data-orientation="horizontal"] { height: 10px; }
    .corner { background: #ccc; }`)
  const root = mount(PAGE)
  if (dir) root.setAttribute("dir", dir)
  const content = find(root, "content")
  content.style.cssText = `width: ${width}px; height: ${height}px`
  const made = createScrollArea(signal({}))
  const stops = [bind(find(root, "area"), made.root)]
  /** Draws an element while `shown` holds, and puts its parts on. */
  const draw = (
    shown: { get(): boolean },
    make: () => { element: HTMLElement; undo: (() => void)[] }
  ) => {
    let now: ReturnType<typeof make> | undefined
    stops.push(
      effect(() => {
        const wanted = shown.get()
        untracked(() => {
          if (wanted && !now) {
            now = make()
          } else if (!wanted && now) {
            for (const each of now.undo) each()
            now.element.remove()
            now = undefined
          }
        })
      })
    )
  }
  for (const orientation of ["vertical", "horizontal"] as const) {
    const bar = made.scrollbar(orientation)
    draw(bar.shown, () => {
      const element = document.createElement("div")
      element.id = orientation
      element.className = padded ? "bar padded" : "bar"
      const thumb = document.createElement("div")
      thumb.id = `${orientation}-thumb`
      thumb.className = "thumb"
      element.append(thumb)
      find(root, "area").append(element)
      return { element, undo: [bind(element, bar.part), bind(thumb, bar.thumb)] }
    })
  }
  if (corner) {
    draw(made.corner.shown, () => {
      const element = document.createElement("div")
      element.id = "corner"
      element.className = "corner"
      find(root, "area").append(element)
      return { element, undo: [bind(element, made.corner.part)] }
    })
  }
  // Without the content part, what the viewport holds is only its children.
  stops.push(bind(find(root, "view"), made.viewport), made.mount())
  if (wrapped) stops.push(bind(content, made.content))
  onTestFinished(() => {
    for (const stop of stops.reverse()) stop()
  })
  return { root, made, view: find(root, "view"), content }
}

const drawn = () => new Promise((resolve) => setTimeout(resolve, 60))
const box = (element: Element) => element.getBoundingClientRect()

describe("a scroll area", () => {
  it("has a scrollbar only where there is something to scroll", async () => {
    const { root, view } = area(100, 400)
    await drawn()
    expect(root.querySelector("#vertical")).not.toBe(null)
    expect(root.querySelector("#horizontal")).toBe(null)
    expect(view.hasAttribute("data-has-overflow-y")).toBe(true)
    expect(view.hasAttribute("data-has-overflow-x")).toBe(false)
    // The viewport scrolls by itself and is a stop for the keyboard; its own bars are hidden.
    expect(getComputedStyle(view).overflowY).toBe("scroll")
    expect(view.getAttribute("tabindex")).toBe("0")
    expect(view.offsetWidth - view.clientWidth).toBe(0)
  })

  it("sizes its thumb to the share that is seen, and moves it with the scroll", async () => {
    const { root, view } = area(100, 400)
    await drawn()
    const thumb = find(root, "vertical-thumb")
    // A quarter is seen: a quarter of the track.
    expect(Math.round(box(thumb).height)).toBe(25)
    // Its length is its scrollbar's to say, as Base UI says it.
    expect(find(root, "vertical").style.getPropertyValue("--scroll-area-thumb-height")).toBe("25px")
    expect(thumb.style.height).toBe("var(--scroll-area-thumb-height)")
    const top = box(thumb).top
    // A browser says a box scrolled when it next draws, which is not always the next frame.
    view.scrollTop = 300
    await expect.poll(() => Math.round(box(thumb).top - top)).toBe(75)
    view.scrollTop = 150
    await expect.poll(() => Math.round(box(thumb).top - top)).toBe(38)
  })

  it("measures again when its content grows late", async () => {
    const { root, content } = area(100, 100)
    const reported: string[] = []
    const hear = (event: ErrorEvent) => void reported.push(event.message)
    window.addEventListener("error", hear)
    onTestFinished(() => window.removeEventListener("error", hear))
    await drawn()
    expect(root.querySelector("#vertical")).toBe(null)
    content.style.height = "1000px"
    await expect.poll(() => root.querySelector("#vertical")).not.toBe(null)
    await drawn()
    // Never smaller than can be taken hold of.
    expect(Math.round(box(find(root, "vertical-thumb")).height)).toBe(16)
    // The scrollbar was drawn while the observer was reporting the content: watching it then
    // is a size the browser cannot deliver in that frame.
    expect(reported.filter((each) => each.includes("ResizeObserver"))).toEqual([])
    // Watched afterwards all the same: a track that changes length moves its thumb.
    find(root, "vertical").style.height = "50px"
    await expect.poll(() => Math.round(box(find(root, "vertical-thumb")).height)).toBe(16)
  })

  it("measures again when what it holds grows late, with no content part", async () => {
    // Pictures that load after the area is measured, as in a row of them: the viewport keeps
    // its size and only what it holds grows, so watching the viewport alone kept the thumb at
    // the length the row had before.
    const { root, content } = area(100, 100, { wrapped: false })
    await drawn()
    expect(root.querySelector("#horizontal")).toBe(null)
    content.style.width = "400px"
    await expect.poll(() => root.querySelector("#horizontal")).not.toBe(null)
    // A quarter is seen: a quarter of the track.
    await expect.poll(() => box(find(root, "horizontal-thumb")).width).toBeCloseTo(25, 1)
    content.style.width = "200px"
    await expect.poll(() => box(find(root, "horizontal-thumb")).width).toBeCloseTo(50, 1)
  })

  it("measures what is put into it later, with no content part", async () => {
    const { root, view } = area(100, 100, { wrapped: false })
    await drawn()
    const more = document.createElement("div")
    more.style.cssText = "width: 400px; height: 0px"
    view.append(more)
    await expect.poll(() => root.querySelector("#horizontal")).not.toBe(null)
    await expect.poll(() => box(find(root, "horizontal-thumb")).width).toBeCloseTo(25, 1)
    // What is put in is watched too: it grows, and the thumb follows.
    more.style.width = "200px"
    await expect.poll(() => box(find(root, "horizontal-thumb")).width).toBeCloseTo(50, 1)
    more.remove()
    await expect.poll(() => root.querySelector("#horizontal")).toBe(null)
  })

  it("scrolls as its thumb is dragged, and jumps to a press on its track", async () => {
    const { root, view } = area(100, 400)
    await drawn()
    const thumb = find(root, "vertical-thumb")
    const pointer = (target: Element, type: string, y: number) =>
      target.dispatchEvent(
        new PointerEvent(type, {
          clientY: y,
          button: 0,
          pointerId: 1,
          bubbles: true,
          cancelable: true,
        })
      )
    const top = box(thumb).top
    pointer(thumb, "pointerdown", top + 5)
    pointer(thumb, "pointermove", top + 5 + 30)
    // 30 of the thumb's 75 pixels of travel: that share of the 300 there are to scroll.
    expect(Math.round(view.scrollTop)).toBe(120)
    pointer(thumb, "pointerup", top + 35)
    pointer(thumb, "pointermove", top + 80)
    expect(Math.round(view.scrollTop)).toBe(120)
    // The thumb's middle goes to where the track was pressed.
    const track = find(root, "vertical")
    pointer(track, "pointerdown", box(track).top + 87.5)
    expect(Math.round(view.scrollTop)).toBe(300)
  })

  it("says it is scrolling while it is, and a moment after", async () => {
    const { root, view } = area(100, 400)
    await drawn()
    view.scrollTop = 40
    await drawn()
    expect(find(root, "area").hasAttribute("data-scrolling")).toBe(true)
    expect(find(root, "vertical").hasAttribute("data-scrolling")).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, SCROLLING_FOR + 100))
    expect(find(root, "area").hasAttribute("data-scrolling")).toBe(false)
  })

  it("sideways, the thumb follows the reading direction", async () => {
    const { root, view } = area(400, 100, { dir: "rtl" })
    await drawn()
    const thumb = find(root, "horizontal-thumb")
    const bar = find(root, "horizontal")
    // At rest it is at the start: the right.
    expect(Math.round(box(bar).right - box(thumb).right)).toBe(0)
    view.scrollLeft = -300
    // A browser says a box scrolled when it next draws, which is not always the next frame.
    await expect.poll(() => Math.round(box(thumb).left - box(bar).left)).toBe(0)
  })

  it("has a corner while both scrollbars are in the page", async () => {
    const { root, made } = area(400, 400)
    await drawn()
    expect(made.corner.shown.peek()).toBe(true)
    expect(find(root, "area").style.getPropertyValue("--scroll-area-corner-width")).toBe("10px")
    expect(find(root, "area").style.getPropertyValue("--scroll-area-corner-height")).toBe("10px")
  })

  it("places its scrollbars and its corner itself", async () => {
    // Nothing in the stylesheet says where a scrollbar lies: a scrollbar left in the flow sat
    // under the viewport, outside the area.
    const { root } = area(400, 400)
    await drawn()
    const whole = box(find(root, "area"))
    expect(getComputedStyle(find(root, "area")).position).toBe("relative")
    const down = box(find(root, "vertical"))
    expect(getComputedStyle(find(root, "vertical")).position).toBe("absolute")
    expect([down.top, down.right, down.width]).toEqual([whole.top, whole.right, 10])
    // Short of the corner, which is as tall as the scrollbar along the bottom.
    expect(down.bottom).toBe(whole.bottom - 10)
    const across = box(find(root, "horizontal"))
    expect([across.left, across.bottom, across.height]).toEqual([whole.left, whole.bottom, 10])
    expect(across.right).toBe(whole.right - 10)
    const meet = box(find(root, "corner"))
    expect([meet.right, meet.bottom, meet.width, meet.height]).toEqual([
      whole.right,
      whole.bottom,
      10,
      10,
    ])
    // The thumbs are sized by the scrollbars as they lie: a quarter of 90.
    expect(box(find(root, "vertical-thumb")).height).toBeCloseTo(22.5, 1)
    expect(box(find(root, "horizontal-thumb")).width).toBeCloseTo(22.5, 1)
  })

  it("places them at the other side where lines run right to left", async () => {
    const { root } = area(400, 400, { dir: "rtl" })
    await drawn()
    const whole = box(find(root, "area"))
    const down = box(find(root, "vertical"))
    expect([down.top, down.left, down.bottom]).toEqual([whole.top, whole.left, whole.bottom - 10])
    const across = box(find(root, "horizontal"))
    expect([across.right, across.left]).toEqual([whole.right, whole.left + 10])
    const meet = box(find(root, "corner"))
    expect([meet.left, meet.bottom]).toEqual([whole.left, whole.bottom])
  })

  it("runs its scrollbars the whole edge where no corner is drawn", async () => {
    const { root } = area(400, 400, { corner: false })
    await drawn()
    const whole = box(find(root, "area"))
    expect(find(root, "area").style.getPropertyValue("--scroll-area-corner-height")).toBe("0px")
    expect(box(find(root, "vertical")).bottom).toBe(whole.bottom)
    expect(box(find(root, "horizontal")).right).toBe(whole.right)
    // A thumb is still sized as if its scrollbar stopped at the other, as Base UI sizes it.
    expect(box(find(root, "vertical-thumb")).height).toBeCloseTo(22.5, 1)
  })

  it("keeps its thumb inside its scrollbar's padding", async () => {
    // Sized from the track with its padding in, a thumb at the end of its travel stood
    // outside the padding by as much.
    const { root, view } = area(100, 400, { padded: true })
    await drawn()
    const thumb = find(root, "vertical-thumb")
    const bar = find(root, "vertical")
    // A quarter is seen: a quarter of the 92 pixels between the padding.
    expect(box(thumb).height).toBeCloseTo(23, 1)
    expect(box(thumb).top - box(bar).top).toBeCloseTo(4, 1)
    view.scrollTop = 300
    await expect.poll(() => Math.round((box(bar).bottom - box(thumb).bottom) * 10) / 10).toBe(4)
    // And a press on the track still puts the thumb's middle there.
    bar.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientY: box(bar).top + 4 + 11.5 + 23,
        button: 0,
        pointerId: 1,
        bubbles: true,
        cancelable: true,
      })
    )
    expect(Math.round(view.scrollTop)).toBe(100)
  })

  it("says where its parts lie before there is a page", () => {
    // What a server writes: every part's place, and nothing measured.
    const made = createScrollArea(signal({}))
    expect(made.root.props.peek().style).toEqual({
      position: "relative",
      "--scroll-area-corner-height": "0px",
      "--scroll-area-corner-width": "0px",
    })
    expect(made.scrollbar("vertical").part.props.peek().style).toEqual({
      position: "absolute",
      "touch-action": "none",
      "-webkit-user-select": "none",
      "user-select": "none",
      top: "0px",
      bottom: "var(--scroll-area-corner-height)",
      "inset-inline-end": "0px",
      "--scroll-area-thumb-height": "0px",
    })
    expect(made.scrollbar("horizontal").part.props.peek().style).toEqual({
      position: "absolute",
      "touch-action": "none",
      "-webkit-user-select": "none",
      "user-select": "none",
      "inset-inline-start": "0px",
      "inset-inline-end": "var(--scroll-area-corner-width)",
      bottom: "0px",
      "--scroll-area-thumb-width": "0px",
    })
    expect(made.scrollbar("vertical").thumb.props.peek().style).toEqual({
      visibility: "hidden",
      height: "var(--scroll-area-thumb-height)",
    })
    expect(made.corner.part.props.peek().style).toEqual({
      position: "absolute",
      bottom: "0px",
      "inset-inline-end": "0px",
      width: "0px",
      height: "0px",
    })
  })
})
