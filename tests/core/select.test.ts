import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { details } from "../../packages/core/src/part.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { createSelect } from "../../packages/core/src/select.ts"
import type { SelectProps } from "../../packages/core/src/select.ts"
import { mount, style } from "./page.ts"

/** A select whose trigger is `top` from the viewport's top, with `count` items 30 tall. */
function select(given: {
  top: number
  count?: number
  value?: string | null
  align?: boolean
  /** Whether the design holds the list to the room beside its trigger. */
  capped?: boolean
}) {
  const { top, count = 5, value = "v2", align = true, capped = true } = given
  style(`
    .trigger { position: fixed; left: 100px; top: ${top}px; width: 160px; height: 36px; padding: 0 12px; border: 1px solid; text-align: start; font: 14px/20px sans-serif; }
    .popup { box-sizing: border-box; width: 200px; ${capped ? "max-height: var(--available-height);" : ""} overflow-y: auto; border: 1px solid; font: 14px/20px sans-serif; }
    .option { height: 30px; padding: 5px 20px; box-sizing: border-box; }`)
  const items = Array.from({ length: count }, (_each, at) => `v${at}`)
  const root = mount(
    `<button class="trigger"><span class="value"></span></button>
     <div class="positioner"><div class="popup">${items
       .map((each) => `<div class="option" data-v="${each}"><span>Item ${each}</span></div>`)
       .join("")}</div></div>`
  )
  const reasons: string[] = []
  const made = createSelect(
    signal<SelectProps<string>>({
      id: "s",
      defaultValue: value,
      onOpenChange: (open, by) => void reasons.push(`${open ? "open" : "close"}: ${by.reason}`),
    })
  )
  made.alignItemWithTrigger.set(align)
  const trigger = root.querySelector<HTMLElement>(".trigger")!
  const shown = root.querySelector<HTMLElement>(".value")!
  const positioner = root.querySelector<HTMLElement>(".positioner")!
  const popup = root.querySelector<HTMLElement>(".popup")!
  shown.textContent = value === null ? "Pick" : `Item ${value}`
  onTestFinished(made.mount())
  onTestFinished(bind(trigger, made.trigger))
  onTestFinished(bind(shown, made.valuePart))
  for (const each of root.querySelectorAll<HTMLElement>(".option")) {
    const item = each.dataset.v!
    onTestFinished(bind(each, made.item(item)))
    onTestFinished(bind(each.querySelector("span")!, made.itemText(item)))
  }
  onTestFinished(bind(positioner, made.positioner))
  onTestFinished(bind(popup, made.popup))
  onTestFinished(() => made.setOpen(false, details("test")))
  const text = (item: string) =>
    root.querySelector<HTMLElement>(`[data-v="${item}"] span`)!.getBoundingClientRect()
  const middle = (box: DOMRect) => box.top + box.height / 2
  const placed = () => expect.poll(() => positioner.getAttribute("data-side")).not.toBe(null)
  return { made, trigger, shown, positioner, popup, reasons, text, middle, placed }
}

const MID = Math.round(window.innerHeight / 2)

describe("a select's list over its trigger", () => {
  it("lies beside its trigger unless asked", async () => {
    const { trigger, positioner, placed } = select({ top: MID, align: false })
    trigger.click()
    await placed()
    expect(positioner.getAttribute("data-side")).toBe("bottom")
    expect(positioner.style.position).toBe("absolute")
  })

  it("puts the chosen item's text on the text its trigger shows", async () => {
    const { trigger, shown, positioner, text, middle } = select({ top: MID })
    trigger.click()
    await expect.poll(() => positioner.getAttribute("data-side")).toBe("none")
    expect(positioner.style.position).toBe("fixed")
    const at = shown.getBoundingClientRect()
    expect(Math.abs(text("v2").left - at.left)).toBeLessThan(1)
    expect(Math.abs(middle(text("v2")) - middle(at))).toBeLessThan(2)
  })

  it("is measured as it lies, not as its entrance draws it", async () => {
    const { trigger, shown, positioner, popup, text, middle } = select({ top: MID })
    // A design that brings the list in scaled: it is placed while still small.
    popup.style.transform = "scale(0.8)"
    popup.style.transformOrigin = "30% 10%"
    trigger.click()
    await expect.poll(() => positioner.getAttribute("data-side")).toBe("none")
    expect(popup.style.transform).toBe("scale(0.8)")
    popup.style.transform = ""
    const at = shown.getBoundingClientRect()
    expect(Math.abs(text("v2").left - at.left)).toBeLessThan(1)
    expect(Math.abs(middle(text("v2")) - middle(at))).toBeLessThan(2)
  })

  it("puts the first item there when nothing is chosen", async () => {
    const { trigger, shown, positioner, text, middle } = select({ top: MID, value: null })
    trigger.click()
    await expect.poll(() => positioner.getAttribute("data-side")).toBe("none")
    expect(Math.abs(middle(text("v0")) - middle(shown.getBoundingClientRect()))).toBeLessThan(2)
  })

  it("keeps the item there in a list longer than the room above", async () => {
    const { trigger, shown, positioner, popup, text, middle } = select({
      top: MID,
      count: 60,
      value: "v40",
    })
    trigger.click()
    await expect.poll(() => positioner.getAttribute("data-side")).toBe("none")
    expect(popup.scrollTop).toBeGreaterThan(0)
    expect(Math.abs(middle(text("v40")) - middle(shown.getBoundingClientRect()))).toBeLessThan(2)
    // It reaches the viewport's bottom, less its margin, and no further.
    const box = positioner.getBoundingClientRect()
    expect(Math.round(box.bottom)).toBe(document.documentElement.clientHeight - 10)
    expect(box.top).toBeGreaterThanOrEqual(10)
  })

  it("grows towards the room it has as it is scrolled, before its rows move", async () => {
    const { trigger, positioner, popup } = select({ top: MID, count: 60, capped: false })
    trigger.click()
    await expect.poll(() => positioner.getAttribute("data-side")).toBe("none")
    const before = positioner.getBoundingClientRect()
    expect(popup.scrollTop).toBe(0)
    popup.scrollTop = 50
    await expect.poll(() => positioner.getBoundingClientRect().height).toBe(before.height + 50)
    // The rows stayed where they were on the screen: the list grew up, by what was scrolled.
    expect(popup.scrollTop).toBe(0)
    expect(positioner.getBoundingClientRect().bottom).toBe(before.bottom)
    popup.scrollTop = 2000
    await expect.poll(() => positioner.getBoundingClientRect().top).toBe(10)
  })

  it("has arrows while there is more of the list their way, which scroll it under a pointer", async () => {
    const { made, trigger, popup, placed } = select({ top: 40, count: 60, align: false })
    const up = made.scrollArrow("up")
    const down = made.scrollArrow("down")
    onTestFinished(up.mount())
    onTestFinished(down.mount())
    const strip = document.createElement("div")
    strip.style.height = "10px"
    popup.parentElement!.append(strip)
    onTestFinished(() => strip.remove())
    onTestFinished(bind(strip, down.part))
    expect(down.mounted.peek()).toBe(false)
    trigger.click()
    await placed()
    await expect.poll(() => down.mounted.peek()).toBe(true)
    expect(up.mounted.peek()).toBe(false)
    expect(strip.getAttribute("data-direction")).toBe("down")
    expect(strip.getAttribute("data-side")).toBe("bottom")
    expect(strip.hasAttribute("data-visible")).toBe(true)
    // A pointer that moves over it: a row at a time, for as long as it stays.
    const before = popup.scrollTop
    strip.dispatchEvent(new MouseEvent("mousemove", { movementY: 1, bubbles: true }))
    await expect.poll(() => popup.scrollTop).toBeGreaterThan(before + 30)
    await expect.poll(() => up.mounted.peek()).toBe(true)
    strip.dispatchEvent(new MouseEvent("mouseleave"))
    const stopped = popup.scrollTop
    await new Promise((resolve) => setTimeout(resolve, 120))
    expect(popup.scrollTop).toBe(stopped)
    popup.scrollTop = popup.scrollHeight
    await expect.poll(() => down.mounted.peek()).toBe(false)
  })

  it("is the listbox when the popup holds a list, and the list is what scrolls", async () => {
    const { made, trigger, popup, placed } = select({ top: 40, count: 60, align: false })
    const list = document.createElement("div")
    list.style.cssText = "max-height: 100px; overflow-y: auto"
    list.append(...popup.children)
    popup.style.overflow = "visible"
    popup.style.maxHeight = "none"
    popup.append(list)
    onTestFinished(bind(list, made.list))
    const down = made.scrollArrow("down")
    onTestFinished(down.mount())
    expect(list.getAttribute("role")).toBe("listbox")
    expect(popup.getAttribute("role")).toBe("presentation")
    expect(trigger.getAttribute("aria-controls") ?? "s-list").toBe("s-list")
    trigger.click()
    await placed()
    expect(trigger.getAttribute("aria-controls")).toBe("s-list")
    await expect.poll(() => down.mounted.peek()).toBe(true)
    list.scrollTop = list.scrollHeight
    await expect.poll(() => down.mounted.peek()).toBe(false)
  })

  it("names a group by its label, and lets a label stand with no group around it", () => {
    const { made } = select({ top: MID, align: false })
    const root = mount(
      `<div class="g"><div class="l">Fruit</div></div><div class="lone">More</div><div class="line"></div>`
    )
    const group = made.group("s-fruit")
    const element = root.querySelector<HTMLElement>(".g")!
    onTestFinished(bind(element, group.root))
    expect(element.getAttribute("role")).toBe("group")
    expect(element.getAttribute("aria-labelledby")).toBe(null)
    onTestFinished(bind(root.querySelector<HTMLElement>(".l")!, group.label))
    expect(element.getAttribute("aria-labelledby")).toBe("s-fruit-label")
    const lone = root.querySelector<HTMLElement>(".lone")!
    onTestFinished(bind(lone, made.groupLabel))
    expect(lone.getAttribute("role")).toBe("presentation")
    expect(lone.id).toBe("")
    const line = root.querySelector<HTMLElement>(".line")!
    onTestFinished(bind(line, made.separator))
    expect(line.getAttribute("role")).toBe("separator")
  })

  it("lies beside a trigger that is at the viewport's edge", async () => {
    const { trigger, positioner, placed } = select({ top: 4 })
    trigger.click()
    await placed()
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(positioner.getAttribute("data-side")).toBe("bottom")
    expect(positioner.style.position).toBe("absolute")
    expect(positioner.style.height).toBe("")
  })

  it("lies beside its trigger for a finger", async () => {
    const { made, positioner, placed } = select({ top: MID })
    made.setOpen(
      true,
      details("trigger-press", new PointerEvent("pointerdown", { pointerType: "touch" }))
    )
    await placed()
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(positioner.getAttribute("data-side")).not.toBe("none")
  })

  it("closes when the window changes size, and is placed afresh when opened again", async () => {
    const { made, trigger, shown, positioner, reasons, text, middle } = select({ top: MID })
    trigger.click()
    await expect.poll(() => positioner.getAttribute("data-side")).toBe("none")
    window.dispatchEvent(new Event("resize"))
    expect(made.open.peek()).toBe(false)
    expect(reasons.at(-1)).toBe("close: window-resize")
    trigger.style.top = `${MID - 60}px`
    trigger.click()
    await expect
      .poll(() => Math.abs(middle(text("v2")) - middle(shown.getBoundingClientRect())))
      .toBeLessThan(2)
    expect(positioner.getAttribute("data-side")).toBe("none")
  })
})
