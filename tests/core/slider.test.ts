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
