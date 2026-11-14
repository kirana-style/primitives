import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createCarousel } from "../../packages/core/src/carousel.ts"
import type { CarouselProps } from "../../packages/core/src/carousel.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { find, mount, style } from "./page.ts"

const PAGE = `
  <div id="root">
    <div id="view" class="view">
      <div id="s0" class="slide">One</div><div id="s1" class="slide">Two</div>
      <div id="s2" class="slide">Three</div><div id="s3" class="slide">Four</div>
    </div>
    <button id="previous">Previous</button><button id="next">Next</button>
    <button id="dot0"></button><button id="dot3"></button>
  </div>`

function carousel(
  given: Partial<CarouselProps> = {},
  options: { dir?: "rtl"; each?: string } = {}
) {
  style(`
    .view { display: flex; width: 300px; height: 60px; overflow: auto; scroll-snap-type: both mandatory; }
    .view[data-orientation="vertical"] { flex-direction: column; }
    .slide { flex: 0 0 ${options.each ?? "100%"}; scroll-snap-align: start; }`)
  const root = mount(PAGE)
  if (options.dir) root.setAttribute("dir", options.dir)
  const heard: [number, string][] = []
  const props = signal<CarouselProps>({
    id: "root",
    onIndexChange: (index, details) => void heard.push([index, details.reason]),
    ...given,
  })
  const made = createCarousel(props)
  // Found before it is a part: the view takes an id of the carousel's.
  const view = find(root, "view")
  onTestFinished(bind(find(root, "root"), made.root))
  onTestFinished(bind(view, made.viewport))
  for (const at of [0, 1, 2, 3]) onTestFinished(bind(find(root, `s${at}`), made.item(at)))
  onTestFinished(bind(find(root, "previous"), made.previous))
  onTestFinished(bind(find(root, "next"), made.next))
  onTestFinished(bind(find(root, "dot0"), made.indicator(0)))
  onTestFinished(bind(find(root, "dot3"), made.indicator(3)))
  onTestFinished(made.mount())
  return { root, view, props, made, heard }
}

const press = (key: string) => userEvent.keyboard(`{${key}}`)
const off = (element: HTMLElement) => element.hasAttribute("disabled")

describe("a carousel", () => {
  it("is a region of slides that says which the view is at", async () => {
    const { root, made } = carousel()
    expect(find(root, "root").getAttribute("role")).toBe("region")
    expect(find(root, "root").getAttribute("aria-roledescription")).toBe("carousel")
    expect(find(root, "s0").getAttribute("aria-roledescription")).toBe("slide")
    expect(find(root, "s0").hasAttribute("data-current")).toBe(true)
    expect(find(root, "dot0").getAttribute("aria-current")).toBe("true")
    await expect.poll(() => made.count.peek()).toBe(4)
  })

  it("goes on and back by scrolling, and stops at its ends", async () => {
    const { root, view, made, heard } = carousel()
    await expect.poll(() => off(find(root, "next"))).toBe(false)
    expect(off(find(root, "previous"))).toBe(true)
    await userEvent.click(find(root, "next"))
    expect(made.index.peek()).toBe(1)
    await expect.poll(() => view.scrollLeft).toBe(300)
    expect(find(root, "s1").hasAttribute("data-current")).toBe(true)
    // A browser says a box scrolled when it next draws.
    await expect.poll(() => off(find(root, "previous"))).toBe(false)
    await userEvent.click(find(root, "dot3"))
    await expect.poll(() => view.scrollLeft).toBe(900)
    await expect.poll(() => off(find(root, "next"))).toBe(true)
    await userEvent.click(find(root, "previous"))
    await expect.poll(() => view.scrollLeft).toBe(600)
    expect(heard).toEqual([
      [1, "next"],
      [3, "indicator"],
      [2, "previous"],
    ])
  })

  it("comes round when it loops", async () => {
    const { root, view, made } = carousel({ loop: true })
    await expect.poll(() => made.count.peek()).toBe(4)
    expect(off(find(root, "previous"))).toBe(false)
    await userEvent.click(find(root, "previous"))
    await expect.poll(() => view.scrollLeft).toBe(900)
    expect(made.index.peek()).toBe(3)
    await userEvent.click(find(root, "next"))
    await expect.poll(() => view.scrollLeft).toBe(0)
    expect(made.index.peek()).toBe(0)
  })

  it("says where a scroll of the person's own came to rest", async () => {
    const { view, made, heard } = carousel()
    view.scrollTo({ left: 620 })
    await expect.poll(() => made.index.peek()).toBe(2)
    expect(heard).toEqual([[2, "scroll"]])
  })

  it("moves with the arrows, Home and End while the view has focus", async () => {
    const { view, made } = carousel()
    await expect.poll(() => made.count.peek()).toBe(4)
    view.focus()
    await press("ArrowRight")
    await expect.poll(() => view.scrollLeft).toBe(300)
    await press("End")
    await expect.poll(() => view.scrollLeft).toBe(900)
    await press("ArrowLeft")
    await expect.poll(() => view.scrollLeft).toBe(600)
    await press("Home")
    await expect.poll(() => view.scrollLeft).toBe(0)
    expect(made.index.peek()).toBe(0)
  })

  it("goes the way the text reads", async () => {
    const { root, view, made } = carousel({}, { dir: "rtl" })
    await expect.poll(() => made.count.peek()).toBe(4)
    await userEvent.click(find(root, "next"))
    await expect.poll(() => view.scrollLeft).toBe(-300)
    view.focus()
    await press("ArrowLeft")
    await expect.poll(() => view.scrollLeft).toBe(-600)
    await expect.poll(() => made.index.peek()).toBe(2)
  })

  it("goes down when it is told to", async () => {
    const { view, made } = carousel({ orientation: "vertical" })
    await expect.poll(() => made.count.peek()).toBe(4)
    expect(view.getAttribute("data-orientation")).toBe("vertical")
    view.focus()
    await press("ArrowDown")
    await expect.poll(() => view.scrollTop).toBe(60)
    expect(made.index.peek()).toBe(1)
  })

  it("with several slides in view, ends where its run ends", async () => {
    const { root, view, made } = carousel({}, { each: "50%" })
    await expect.poll(() => made.count.peek()).toBe(4)
    await userEvent.click(find(root, "next"))
    await userEvent.click(find(root, "next"))
    await expect.poll(() => view.scrollLeft).toBe(300)
    // The last two fill the view: there is nowhere further to go.
    await expect.poll(() => off(find(root, "next"))).toBe(true)
    expect(made.index.peek()).toBe(2)
  })

  it("begins at the slide it is given, and follows a caller who holds it", async () => {
    const { view, props, heard } = carousel({ index: 2 })
    await expect.poll(() => view.scrollLeft).toBe(600)
    props.set({ ...props.peek(), index: 1 })
    await expect.poll(() => view.scrollLeft).toBe(300)
    expect(heard).toEqual([])
  })

  it("stays where it is when a caller refuses", async () => {
    const { root, view, made } = carousel({ onIndexChange: (_, details) => details.cancel() })
    await expect.poll(() => made.count.peek()).toBe(4)
    await userEvent.click(find(root, "next"))
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(view.scrollLeft).toBe(0)
    expect(made.index.peek()).toBe(0)
  })
})
