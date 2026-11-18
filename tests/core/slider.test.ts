import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { createSlider } from "../../packages/core/src/slider.ts"
import type { SliderProps } from "../../packages/core/src/slider.ts"
import { mount, style } from "./page.ts"

/** A control 200 wide at the page's left edge, its thumbs 20 wide. */
function slider(given: Partial<SliderProps>) {
  style(`
    .control { position: fixed; left: 0; top: 0; width: 200px; height: 20px; }
    .control[data-orientation="vertical"] { width: 20px; height: 200px; }
    .track { position: absolute; inset: 0; }
    .thumb { width: 20px; height: 20px; }`)
  const root = mount(
    `<div class="control"><div class="track"><div class="fill"></div></div><div class="thumb a"></div><div class="thumb b"></div></div>`
  )
  const heard: (number | number[])[] = []
  const props = signal<SliderProps>({
    id: "s",
    onValueChange: (value) => void heard.push(value),
    ...given,
  })
  const made = createSlider(props)
  const control = root.querySelector<HTMLElement>(".control")!
  const fill = root.querySelector<HTMLElement>(".fill")!
  const a = root.querySelector<HTMLElement>(".a")!
  const b = root.querySelector<HTMLElement>(".b")!
  onTestFinished(bind(control, made.control))
  onTestFinished(bind(fill, made.indicator))
  onTestFinished(bind(a, made.thumb(0)))
  if (made.values.peek().length > 1) onTestFinished(bind(b, made.thumb(1)))
  else b.remove()
  const box = (element: HTMLElement) => {
    const { left, right, top, bottom, width } = element.getBoundingClientRect()
    return { left, right, top, bottom, width }
  }
  const press = (x: number, y = 10) =>
    control.dispatchEvent(
      new PointerEvent("pointerdown", { clientX: x, clientY: y, button: 0, bubbles: true })
    )
  const release = () => document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }))
  return { props, made, control, fill, a, b, box, heard, press, release }
}

describe("a slider whose thumbs stay inside", () => {
  it("lies with its centre on the control's edge unless asked", () => {
    const { a, box } = slider({ defaultValue: 0 })
    expect(box(a).left).toBe(-10)
    expect(a.style.getPropertyValue("--position")).toBe("")
  })

  it("keeps a thumb's edge on the control's edge at both ends, and its centre in between", () => {
    const { props, a, fill, box } = slider({ defaultValue: 0, thumbAlignment: "edge" })
    expect(box(a).left).toBe(0)
    // Once measured, its centre is written as a share of the control: half a thumb in.
    expect(a.style.getPropertyValue("--position")).toBe("5%")
    expect(a.style.insetInlineStart).toBe("var(--position)")
    expect(a.style.translate).toBe("-50% -50%")
    props.set({ ...props.peek(), value: 100 })
    expect(box(a).right).toBe(200)
    props.set({ ...props.peek(), value: 50 })
    expect(box(a).left).toBe(90)
    // The filled part ends at the thumb's centre.
    expect(fill.style.getPropertyValue("--start-position")).toBe("50%")
    expect(box(fill).width).toBe(100)
    props.set({ ...props.peek(), value: 100 })
    expect(box(fill).width).toBe(190)
  })

  it("keeps to the edge when its control changes length", async () => {
    const { control, a, box } = slider({ defaultValue: 10, thumbAlignment: "edge" })
    const share = () => Math.round(parseFloat(a.style.getPropertyValue("--position")) * 100) / 100
    // Half a thumb in, and a tenth of the way the centre travels: 10 + 18 of 200.
    expect(share()).toBe(14)
    control.style.width = "100px"
    // 10 + 8 of 100: the share is another one, and the thumb is still where its value is.
    await expect.poll(share).toBe(18)
    expect(box(a).left).toBeCloseTo(8, 3)
  })

  it("is in the same place before it is measured", () => {
    const made = createSlider(signal<SliderProps>({ id: "s", value: 25, thumbAlignment: "edge" }))
    // What a server writes: the value's share, moved back by that share of the thumb itself.
    expect(made.thumb(0).props.peek().style).toMatchObject({
      "inset-inline-start": "25%",
      translate: "-25% -50%",
    })
  })

  it("reads a press along the way a thumb's centre travels", () => {
    const { heard, press, release } = slider({ defaultValue: 50, thumbAlignment: "edge" })
    // The centre travels from 10 to 190.
    press(10)
    release()
    press(190)
    release()
    press(55)
    release()
    press(0)
    release()
    expect(heard).toEqual([0, 100, 25, 0])
  })

  it("places both thumbs of a range, and the filled part between their centres", () => {
    const { a, b, fill, box } = slider({ defaultValue: [0, 100], thumbAlignment: "edge" })
    expect(box(a).left).toBe(0)
    expect(box(b).right).toBe(200)
    expect(box(fill).left).toBe(10)
    expect(box(fill).width).toBe(180)
    expect(fill.style.getPropertyValue("--relative-size")).toBe("90%")
  })

  it("stays inside when the track runs up", () => {
    const { a, box } = slider({ defaultValue: 0, thumbAlignment: "edge", orientation: "vertical" })
    expect(box(a).bottom).toBe(200)
  })
})

/** A control 200 wide with a thumb for each name, each asked for by its name and no index. */
function unnumbered(given: Partial<SliderProps>, names: string[]) {
  style(`
    .control { position: fixed; left: 0; top: 0; width: 200px; height: 20px; }
    .thumb { width: 20px; height: 20px; }`)
  const root = mount(`<div class="control"></div>`)
  const heard: (number | number[])[] = []
  const made = createSlider(
    signal<SliderProps>({ id: "s", onValueChange: (value) => void heard.push(value), ...given })
  )
  const control = root.querySelector<HTMLElement>(".control")!
  onTestFinished(bind(control, made.control))
  const undo = new Map<string, () => void>()
  /** Draws a thumb, before the thumb named `before` or last. */
  const add = (name: string, before?: string) => {
    const element = document.createElement("div")
    element.className = "thumb"
    element.id = name
    control.insertBefore(element, before ? control.querySelector(`#${before}`) : null)
    undo.set(name, bind(element, made.thumb(name)))
    return element
  }
  const remove = (name: string) => {
    undo.get(name)?.()
    undo.delete(name)
    control.querySelector(`#${name}`)?.remove()
  }
  for (const name of names) add(name)
  onTestFinished(() => {
    for (const stop of undo.values()) stop()
  })
  const said = () =>
    [...control.querySelectorAll<HTMLElement>(".thumb")].map(
      (each) => `${each.id}:${each.dataset.index}=${each.getAttribute("aria-valuenow")}`
    )
  return { made, control, add, remove, said, heard }
}

describe("a slider's thumbs that are given no index", () => {
  it("take their places in the order they are asked for, before there is a page", () => {
    // What a server writes. Every thumb was the first value's: two thumbs of a range were
    // drawn on top of each other.
    const made = createSlider(signal<SliderProps>({ id: "s", defaultValue: [25, 50, 75] }))
    const places = ["a", "b", "c"].map((name) => made.thumb(name).props.peek())
    expect(places.map((each) => each["data-index"])).toEqual(["0", "1", "2"])
    expect(
      places.map((each) => (each.style as Record<string, string>)["inset-inline-start"])
    ).toEqual(["25%", "50%", "75%"])
    expect(["a", "b", "c"].map((name) => made.thumbInput(name).props.peek().value)).toEqual([
      "25",
      "50",
      "75",
    ])
    // Asked for again (a second render of the same thumb), it is the same thumb in the same
    // place: nothing is counted twice.
    expect(made.thumb("a")).toBe(made.thumb("a"))
    expect(made.thumb("b").props.peek()["data-index"]).toBe("1")
    expect(made.thumb("c").props.peek()["data-index"]).toBe("2")
  })

  it("take the page's order once they are in it", () => {
    const made = createSlider(signal<SliderProps>({ id: "s", defaultValue: [25, 50] }))
    // Asked for in another order than they are written in (a render that was thrown away).
    const second = made.thumb("second")
    const first = made.thumb("first")
    expect(second.props.peek()["data-index"]).toBe("0")
    const root = mount(`<div><div id="first"></div><div id="second"></div></div>`)
    onTestFinished(bind(root.querySelector<HTMLElement>("#second")!, second))
    onTestFinished(bind(root.querySelector<HTMLElement>("#first")!, first))
    expect(root.querySelector("#first")!.getAttribute("aria-valuenow")).toBe("25")
    expect(root.querySelector("#second")!.getAttribute("aria-valuenow")).toBe("50")
  })

  it("move up when a thumb before them leaves, and make room for one that is added", () => {
    const { add, remove, said } = unnumbered({ defaultValue: [10, 20, 70] }, ["a", "b", "c"])
    expect(said()).toEqual(["a:0=10", "b:1=20", "c:2=70"])
    remove("a")
    expect(said()).toEqual(["b:0=10", "c:1=20"])
    add("d", "c")
    expect(said()).toEqual(["b:0=10", "d:1=20", "c:2=70"])
    add("e", "b")
    remove("d")
    expect(said()).toEqual(["e:0=10", "b:1=20", "c:2=70"])
  })

  it("are each moved by their own keys and their own pointer", () => {
    const { control, said, heard } = unnumbered({ defaultValue: [20, 80] }, ["a", "b"])
    const b = control.querySelector<HTMLElement>("#b")!
    b.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }))
    expect(heard).toEqual([[20, 79]])
    // A press on the second thumb takes hold of the second thumb.
    const box = b.getBoundingClientRect()
    b.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: box.left + box.width / 2,
        clientY: 10,
        button: 0,
        bubbles: true,
      })
    )
    expect(document.activeElement).toBe(b)
    document.dispatchEvent(new PointerEvent("pointermove", { clientX: 120, clientY: 10 }))
    document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }))
    expect(said()).toEqual(["a:0=20", "b:1=60"])
  })

  it("leave a thumb that was given an index where it was put", () => {
    const made = createSlider(signal<SliderProps>({ id: "s", defaultValue: [25, 50] }))
    const root = mount(`<div><div id="first"></div><div id="second"></div></div>`)
    onTestFinished(bind(root.querySelector<HTMLElement>("#first")!, made.thumb("one")))
    onTestFinished(bind(root.querySelector<HTMLElement>("#second")!, made.thumb(0)))
    // The second thumb is the first value's because it says so; the first has no say in it.
    expect(root.querySelector("#second")!.getAttribute("aria-valuenow")).toBe("25")
    expect(root.querySelector("#first")!.getAttribute("data-index")).toBe("0")
  })

  it("are all the one value's where the slider holds one value", () => {
    // As Base UI draws it: a second thumb has no value of its own to be.
    const { said } = unnumbered({ defaultValue: 30 }, ["a", "b"])
    expect(said()).toEqual(["a:0=30", "b:0=30"])
  })
})

describe("a read-only slider", () => {
  it("says so on every part, and keeps its thumb a stop for Tab", () => {
    const { props, control, fill, a } = slider({ defaultValue: 40, readOnly: true })
    for (const each of [control, fill, a]) expect(each.hasAttribute("data-readonly")).toBe(true)
    expect(a.getAttribute("aria-readonly")).toBe("true")
    expect(a.getAttribute("tabindex")).toBe("0")
    expect(a.hasAttribute("aria-disabled")).toBe(false)
    props.set({ ...props.peek(), readOnly: false })
    for (const each of [control, fill, a]) expect(each.hasAttribute("data-readonly")).toBe(false)
    expect(a.hasAttribute("aria-readonly")).toBe(false)
  })

  it("is moved by no key and no pointer, and the press still gives its thumb focus", () => {
    const { made, heard, a, press, release } = slider({ defaultValue: 40, readOnly: true })
    for (const key of ["ArrowRight", "ArrowLeft", "PageUp", "Home", "End"]) {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })
      a.dispatchEvent(event)
      // The key is not the slider's: it is left to the page.
      expect(event.defaultPrevented).toBe(false)
    }
    press(150)
    expect(document.activeElement).toBe(a)
    expect(made.dragging.peek()).toBe(null)
    document.dispatchEvent(new PointerEvent("pointermove", { clientX: 20, clientY: 10 }))
    release()
    expect(made.values.peek()).toEqual([40])
    expect(heard).toEqual([])
    expect(a.getAttribute("aria-valuenow")).toBe("40")
  })

  it("is still submitted, and still goes back with its form", () => {
    const root = mount(
      `<form><div class="control"><div class="thumb"><input class="hidden" /></div></div></form>`
    )
    const props = signal<SliderProps>({ id: "s", name: "volume", defaultValue: 40 })
    const made = createSlider(props)
    const form = root.querySelector("form")!
    onTestFinished(bind(root.querySelector<HTMLElement>(".control")!, made.control))
    onTestFinished(bind(root.querySelector<HTMLElement>(".thumb")!, made.thumb(0)))
    onTestFinished(bind(root.querySelector<HTMLElement>(".hidden")!, made.thumbInput(0)))
    root
      .querySelector<HTMLElement>(".thumb")!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))
    props.set({ ...props.peek(), readOnly: true })
    expect(new FormData(form).get("volume")).toBe("41")
    expect(root.querySelector<HTMLInputElement>(".hidden")!.disabled).toBe(false)
    // As a native read-only control: a reset is not a change it refuses.
    form.reset()
    expect(made.values.peek()).toEqual([40])
    expect(new FormData(form).get("volume")).toBe("40")
  })
})
