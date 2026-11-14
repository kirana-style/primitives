import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { effect, signal, untracked } from "../../packages/core/src/reactivity.ts"
import { SCROLLING_FOR, createScrollArea } from "../../packages/core/src/scroll-area.ts"
import { find, mount, style } from "./page.ts"

const PAGE = `
  <div id="area">
    <div id="view"><div id="content"></div></div>
  </div>`

/** An area 100 square, drawn as an adapter draws one: a scrollbar is in the page while shown. */
function area(width: number, height: number, dir?: "rtl") {
  style(`
    #area { position: relative; width: 100px; height: 100px; }
    #view { width: 100px; height: 100px; }
    .bar { position: absolute; background: #eee; }
    .bar[data-orientation="vertical"] { top: 0; right: 0; width: 10px; height: 100px; }
    .bar[data-orientation="horizontal"] { left: 0; bottom: 0; height: 10px; width: 100px; display: flex; }
    .thumb { background: #888; }
    .thumb[data-orientation="vertical"] { width: 10px; }
    .thumb[data-orientation="horizontal"] { height: 10px; }`)
  const root = mount(PAGE)
  if (dir) root.setAttribute("dir", dir)
  const content = find(root, "content")
  content.style.cssText = `width: ${width}px; height: ${height}px`
  const made = createScrollArea(signal({}))
  const stops = [bind(find(root, "area"), made.root)]
  for (const orientation of ["vertical", "horizontal"] as const) {
    const bar = made.scrollbar(orientation)
    let element: HTMLElement | undefined
    let undo: (() => void)[] = []
    stops.push(
      effect(() => {
        const shown = bar.shown.get()
        untracked(() => {
          if (shown && !element) {
            element = document.createElement("div")
            element.id = orientation
            element.className = "bar"
            const thumb = document.createElement("div")
            thumb.id = `${orientation}-thumb`
            thumb.className = "thumb"
            element.append(thumb)
            find(root, "area").append(element)
            undo = [bind(element, bar.part), bind(thumb, bar.thumb)]
          } else if (!shown && element) {
            for (const each of undo) each()
            element.remove()
            element = undefined
          }
        })
      })
    )
  }
  stops.push(bind(find(root, "view"), made.viewport), bind(content, made.content), made.mount())
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
    expect(thumb.style.getPropertyValue("--scroll-area-thumb-height")).toBe("25px")
    const top = box(thumb).top
    view.scrollTop = 300
    await drawn()
    expect(Math.round(box(thumb).top - top)).toBe(75)
    view.scrollTop = 150
    await drawn()
    expect(Math.round(box(thumb).top - top)).toBe(38)
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
    const { root, view } = area(400, 100, "rtl")
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
})
