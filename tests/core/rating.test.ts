import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { createRating } from "../../packages/core/src/rating.ts"
import type { RatingProps } from "../../packages/core/src/rating.ts"
import { recorder } from "../../packages/core/src/testing.ts"
import { mount } from "./page.ts"

function rating(given: Partial<RatingProps> = {}, dir = "ltr") {
  const root = mount(`
    <form><div class="root" dir="${dir}">
      ${[1, 2, 3, 4, 5].map((each) => `<span class="item" data-place="${each}" style="display:inline-block;width:20px;height:20px"></span>`).join("")}
      <input class="input" />
    </div><button type="reset">Reset</button></form>`)
  const changed = recorder<number>()
  const hovered: (number | null)[] = []
  const props = signal<RatingProps>({
    id: "rt",
    name: "stars",
    onValueChange: changed.listen,
    onHoverChange: (value) => void hovered.push(value),
    ...given,
  })
  const made = createRating(props)
  onTestFinished(bind(root.querySelector<HTMLElement>(".root")!, made.root))
  const items = [...root.querySelectorAll<HTMLElement>(".item")]
  for (const each of items) onTestFinished(bind(each, made.item(Number(each.dataset.place))))
  const input = root.querySelector<HTMLInputElement>(".input")!
  onTestFinished(bind(input, made.input))
  const filled = () => items.filter((each) => each.hasAttribute("data-filled")).length
  const press = (place: number, at = 0.75) => {
    const box = items[place - 1]!.getBoundingClientRect()
    items[place - 1]!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, detail: 1, clientX: box.left + box.width * at })
    )
  }
  const key = (name: string) =>
    (document.activeElement ?? items[0]!).dispatchEvent(
      new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true })
    )
  return { root, made, items, input, changed, hovered, filled, press, key, props }
}

describe("a rating", () => {
  it("is a radio group whose items say their place, with one stop for Tab", () => {
    const { root, items, input } = rating({ defaultValue: 3 })
    expect(root.querySelector(".root")!.getAttribute("role")).toBe("radiogroup")
    expect(items.map((each) => each.getAttribute("aria-checked"))).toEqual([
      "false",
      "false",
      "true",
      "false",
      "false",
    ])
    expect(items.map((each) => each.getAttribute("tabindex"))).toEqual([
      "-1",
      "-1",
      "0",
      "-1",
      "-1",
    ])
    expect(items[2]!.getAttribute("aria-label")).toBe("3 of 5")
    expect(items.map((each) => each.hasAttribute("data-filled"))).toEqual([
      true,
      true,
      true,
      false,
      false,
    ])
    expect(input.value).toBe("3")
    expect(input.name).toBe("stars")
  })

  it("starts with none: the first item is where Tab stops, and nothing is submitted", () => {
    const { items, input } = rating()
    expect(items[0]!.getAttribute("tabindex")).toBe("0")
    expect(items.some((each) => each.hasAttribute("data-checked"))).toBe(false)
    expect(input.value).toBe("")
  })

  it("is given by a press, and by the arrows, which never go back to none", () => {
    const { items, changed, press, key, made } = rating()
    press(4)
    expect(changed.calls.at(-1)).toMatchObject({ value: 4, reason: "item-press", source: "mouse" })
    items[3]!.focus()
    key("ArrowLeft")
    expect(made.value.peek()).toBe(3)
    expect(document.activeElement).toBe(items[2])
    key("Home")
    key("ArrowLeft")
    expect(made.value.peek()).toBe(1)
    key("End")
    expect(made.value.peek()).toBe(5)
    expect(changed.calls.at(-1)).toMatchObject({ reason: "keyboard", source: "keyboard" })
  })

  it("gives a half by the half of an item pressed, and by the arrows", () => {
    const { items, press, key, made, input } = rating({ allowHalf: true })
    press(3, 0.25)
    expect(made.value.peek()).toBe(2.5)
    expect(items[2]!.hasAttribute("data-half")).toBe(true)
    expect(items[2]!.getAttribute("aria-checked")).toBe("true")
    expect(items[2]!.getAttribute("aria-label")).toBe("2.5 of 5")
    expect(input.value).toBe("2.5")
    press(3, 0.75)
    expect(made.value.peek()).toBe(3)
    expect(items[2]!.hasAttribute("data-half")).toBe(false)
    items[2]!.focus()
    key("ArrowRight")
    expect(made.value.peek()).toBe(3.5)
    expect(document.activeElement).toBe(items[3])
  })

  it("reads the halves the other way where the text does", () => {
    const { press, made, key, items } = rating({ allowHalf: true }, "rtl")
    press(3, 0.75)
    expect(made.value.peek()).toBe(2.5)
    items[2]!.focus()
    key("ArrowLeft")
    expect(made.value.peek()).toBe(3)
  })

  it("draws the value a pointer is over, and chooses nothing by it", () => {
    const { root, items, hovered, filled, made } = rating({ defaultValue: 1 })
    const box = items[3]!.getBoundingClientRect()
    items[3]!.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerType: "mouse",
        clientX: box.left + 15,
      })
    )
    expect(filled()).toBe(4)
    expect(root.querySelector(".root")!.hasAttribute("data-hovering")).toBe(true)
    expect(made.value.peek()).toBe(1)
    root.querySelector(".root")!.dispatchEvent(new PointerEvent("pointerleave"))
    expect(filled()).toBe(1)
    expect(hovered).toEqual([4, null])
    // A finger does not hover.
    items[3]!.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "touch" })
    )
    expect(filled()).toBe(1)
  })

  it("is refused by its caller, kept by one who holds it, and left alone when it cannot change", () => {
    const refused = rating({ defaultValue: 2, onValueChange: (_value, by) => by.cancel() })
    refused.press(5)
    expect(refused.made.value.peek()).toBe(2)
    const heldBy = rating({ value: 2 })
    heldBy.press(5)
    expect(heldBy.changed.calls.at(-1)!.value).toBe(5)
    expect(heldBy.made.value.peek()).toBe(2)
    for (const off of [{ disabled: true }, { readOnly: true }]) {
      const fixed = rating({ defaultValue: 2, ...off })
      fixed.press(5)
      fixed.items[1]!.focus()
      fixed.key("ArrowRight")
      expect(fixed.made.value.peek()).toBe(2)
    }
    expect(rating({ disabled: true }).items[0]!.getAttribute("tabindex")).toBe("-1")
  })

  it("goes back to where it began when its form is reset", () => {
    const { root, press, made, changed } = rating({ defaultValue: 2 })
    press(5)
    root.querySelector<HTMLButtonElement>("[type=reset]")!.click()
    expect(made.value.peek()).toBe(2)
    expect(changed.calls.at(-1)).toMatchObject({ value: 2, reason: "form-reset" })
  })
})
