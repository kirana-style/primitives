import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createField } from "../../packages/core/src/field.ts"
import type { Field } from "../../packages/core/src/field.ts"
import { details } from "../../packages/core/src/part.ts"
import { effect, signal } from "../../packages/core/src/reactivity.ts"
import { createSelect } from "../../packages/core/src/select.ts"
import type { SelectProps } from "../../packages/core/src/select.ts"
import { find, focused, mount, style } from "./page.ts"

/** A select whose trigger is `top` from the viewport's top, with `count` items 30 tall. */
function select(given: {
  top: number
  count?: number
  value?: string | null
  /** Several values: what is chosen to begin with. */
  values?: string[]
  align?: boolean
  /** Whether the design holds the list to the room beside its trigger. */
  capped?: boolean
}) {
  const { top, count = 5, value = "v2", values, align = true, capped = true } = given
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
      ...(values ? { multiple: true, defaultValues: values } : { defaultValue: value }),
      onOpenChange: (open, by) => void reasons.push(`${open ? "open" : "close"}: ${by.reason}`),
    })
  )
  made.alignItemWithTrigger.set(align)
  const trigger = root.querySelector<HTMLElement>(".trigger")!
  const shown = root.querySelector<HTMLElement>(".value")!
  const positioner = root.querySelector<HTMLElement>(".positioner")!
  const popup = root.querySelector<HTMLElement>(".popup")!
  if (values) shown.textContent = values.map((each) => `Item ${each}`).join(", ") || "Pick"
  else shown.textContent = value === null ? "Pick" : `Item ${value}`
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

  it("with several values, puts the first chosen item there, in the items' order", async () => {
    const { trigger, shown, positioner, text, middle } = select({ top: MID, values: ["v3", "v1"] })
    trigger.click()
    await expect.poll(() => positioner.getAttribute("data-side")).toBe("none")
    const at = shown.getBoundingClientRect()
    expect(Math.abs(text("v1").left - at.left)).toBeLessThan(1)
    expect(Math.abs(middle(text("v1")) - middle(at))).toBeLessThan(2)
  })

  it("with several values and none chosen, puts the first item there, as with one value", async () => {
    const { trigger, shown, positioner, text, middle } = select({ top: MID, values: [] })
    trigger.click()
    await expect.poll(() => positioner.getAttribute("data-side")).toBe("none")
    expect(positioner.style.position).toBe("fixed")
    const at = shown.getBoundingClientRect()
    expect(Math.abs(text("v0").left - at.left)).toBeLessThan(1)
    expect(Math.abs(middle(text("v0")) - middle(at))).toBeLessThan(2)
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

const FRUITS = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry"]
const press = (key: string) => userEvent.keyboard(key.length === 1 ? key : `{${key}}`)
const settled = () => new Promise((resolve) => setTimeout(resolve, 10))

/**
 * A select in a form, drawn as an adapter draws one, in plain DOM: its value part says the
 * label, or "Pick". Blueberry is disabled.
 */
function picker(given: Partial<SelectProps<string>> = {}, around: { field?: Field } = {}) {
  const root = mount(`
    <form id="form"><div id="field">
      <button id="trigger"><span id="value"></span></button><input id="hidden" />
    </div></form>
    <div id="positioner"><div id="popup">${FRUITS.map(
      (each) => `<div id="o-${each}"><span>${each}</span></div>`
    ).join("")}</div></div>`)
  const heard: string[][] = []
  const props = signal<SelectProps<string>>({
    id: "s",
    onValuesChange: (next) => void heard.push(next),
    ...given,
  })
  const made = createSelect(props, around)
  // Found before they are bound: a part that writes `id` renames its element.
  const shown = find(root, "value")
  const trigger = find(root, "trigger")
  const popup = find(root, "popup")
  const form = find<HTMLFormElement>(root, "form")
  const options = new Map(FRUITS.map((each) => [each, find(root, `o-${each}`)]))
  const stops = [
    made.mount(),
    bind(trigger, made.trigger),
    bind(shown, made.valuePart),
    effect(() => void (shown.textContent = made.label.get() ?? "Pick")),
    bind(find(root, "positioner"), made.positioner),
    bind(popup, made.popup),
  ]
  // With a name, its hidden input is drawn.
  if (made.named.peek()) stops.push(bind(find(root, "hidden"), made.input))
  else find(root, "hidden").remove()
  for (const [each, element] of options) {
    stops.push(
      bind(
        element,
        made.item(each, () => ({ disabled: each === "Blueberry" }))
      ),
      bind(element.querySelector("span")!, made.itemText(each))
    )
  }
  onTestFinished(() => {
    made.setOpen(false, details("test"))
    for (const stop of stops.reverse()) stop()
  })
  return {
    root,
    made,
    props,
    heard,
    shown,
    form,
    trigger,
    popup,
    option: (name: string) => options.get(name)!,
    sent: () => new FormData(form).getAll("fruit"),
  }
}

describe("a select of several values", () => {
  it("adds what is pressed, takes it away when pressed again, and stays open", async () => {
    const { made, heard, shown, trigger, popup, option } = picker({ multiple: true })
    expect(shown.textContent).toBe("Pick")
    expect(trigger.hasAttribute("data-placeholder")).toBe(true)
    trigger.click()
    await settled()
    expect(popup.getAttribute("aria-multiselectable")).toBe("true")
    option("Cherry").click()
    expect(made.values.peek()).toEqual(["Cherry"])
    expect(made.open.peek()).toBe(true)
    option("Apple").click()
    expect(made.values.peek()).toEqual(["Cherry", "Apple"])
    expect(heard).toEqual([["Cherry"], ["Cherry", "Apple"]])
    expect(made.open.peek()).toBe(true)
    // Each chosen item says so, and no other.
    for (const each of FRUITS) {
      const on = each === "Apple" || each === "Cherry"
      expect(option(each).getAttribute("aria-selected")).toBe(String(on))
      expect(option(each).hasAttribute("data-selected")).toBe(on)
    }
    // The trigger names them in the items' order, not the order they were chosen in.
    expect(shown.textContent).toBe("Apple, Cherry")
    expect(made.shown.peek()).toEqual({
      value: null,
      label: "Apple, Cherry",
      values: ["Apple", "Cherry"],
      labels: ["Apple", "Cherry"],
    })
    expect(trigger.hasAttribute("data-placeholder")).toBe(false)
    expect(shown.hasAttribute("data-placeholder")).toBe(false)
    option("Cherry").click()
    expect(made.values.peek()).toEqual(["Apple"])
    expect(shown.textContent).toBe("Apple")
    // A disabled item is not chosen.
    option("Blueberry").click()
    option("Apple").click()
    expect(made.values.peek()).toEqual([])
    expect(made.open.peek()).toBe(true)
    expect(shown.textContent).toBe("Pick")
    expect(shown.hasAttribute("data-placeholder")).toBe(true)
  })

  it("says so on the list inside its popup, when there is one", () => {
    const { root, made, popup } = picker({ multiple: true })
    const list = document.createElement("div")
    root.append(list)
    onTestFinished(bind(list, made.list))
    expect(list.getAttribute("aria-multiselectable")).toBe("true")
    expect(popup.getAttribute("role")).toBe("presentation")
    expect(popup.hasAttribute("aria-multiselectable")).toBe(false)
    // One value: neither says it.
    const one = picker()
    expect(one.popup.hasAttribute("aria-multiselectable")).toBe(false)
  })

  it("opens on the first chosen item, and the keys move and choose as with one value", async () => {
    const { made, trigger, option } = picker({
      multiple: true,
      defaultValues: ["Cherry", "Banana"],
    })
    trigger.focus()
    // Closed, a letter chooses nothing: it would have to add or take away.
    await press("a")
    expect(made.values.peek()).toEqual(["Cherry", "Banana"])
    expect(made.open.peek()).toBe(false)
    await press("ArrowDown")
    await settled()
    expect(focused()).toBe("o-Banana")
    expect(option("Banana").hasAttribute("data-highlighted")).toBe(true)
    // Past the disabled one.
    await press("ArrowDown")
    expect(focused()).toBe("o-Cherry")
    await press("Enter")
    expect(made.values.peek()).toEqual(["Banana"])
    expect(made.open.peek()).toBe(true)
    expect(focused()).toBe("o-Cherry")
    await press(" ")
    expect(made.values.peek()).toEqual(["Banana", "Cherry"])
    await press("Home")
    expect(focused()).toBe("o-Apple")
    await press("End")
    expect(focused()).toBe("o-Cherry")
    await userEvent.keyboard("ap")
    expect(focused()).toBe("o-Apple")
    await userEvent.keyboard("r")
    expect(focused()).toBe("o-Apricot")
    await press("Enter")
    expect(made.values.peek()).toEqual(["Banana", "Cherry", "Apricot"])
    await press("Tab")
    expect(made.open.peek()).toBe(false)
    expect(focused()).toBe("trigger")
  })

  it("sends one input for each value, none with nothing chosen, and goes back on reset", async () => {
    const { made, form, trigger, option, sent, shown } = picker({
      multiple: true,
      name: "fruit",
      defaultValues: ["Banana"],
    })
    expect(sent()).toEqual(["Banana"])
    trigger.click()
    await settled()
    option("Apple").click()
    option("Cherry").click()
    expect(sent()).toEqual(["Banana", "Apple", "Cherry"])
    expect(form.querySelectorAll('input[type="hidden"]').length).toBe(3)
    option("Banana").click()
    option("Apple").click()
    option("Cherry").click()
    expect(sent()).toEqual([])
    expect(form.querySelectorAll('input[type="hidden"]').length).toBe(1)
    option("Apricot").click()
    form.reset()
    expect(made.values.peek()).toEqual(["Banana"])
    expect(sent()).toEqual(["Banana"])
    expect(shown.textContent).toBe("Banana")
  })

  it("in a field, is its control, and `required` asks for at least one", async () => {
    const field = createField(signal({ id: "f", name: "fruit" }))
    const { root, made, trigger, option, sent, form } = picker(
      { multiple: true, required: true },
      { field }
    )
    onTestFinished(bind(find(root, "field"), field.root))
    expect(trigger.id).toBe(field.controlId)
    expect(trigger.getAttribute("aria-required")).toBe("true")
    expect(made.named.peek()).toBe(true)
    expect(await field.validate()).toBe(false)
    expect(field.validity.peek().state.valueMissing).toBe(true)
    trigger.click()
    await settled()
    option("Apple").click()
    option("Cherry").click()
    expect(await field.validate()).toBe(true)
    expect(field.filled.peek()).toBe(true)
    expect(field.dirty.peek()).toBe(true)
    expect(sent()).toEqual(["Apple", "Cherry"])
    option("Apple").click()
    expect(await field.validate()).toBe(true)
    option("Cherry").click()
    expect(await field.validate()).toBe(false)
    option("Cherry").click()
    form.reset()
    expect(made.values.peek()).toEqual([])
    expect(field.dirty.peek()).toBe(false)
    expect(field.filled.peek()).toBe(false)
  })

  it("leaves things as they were when its caller refuses the change", async () => {
    const field = createField(signal({ id: "f" }))
    const { made, trigger, option, shown } = picker(
      {
        multiple: true,
        defaultValues: ["Apple"],
        onValuesChange: (_next, by) => by.cancel(),
      },
      { field }
    )
    trigger.click()
    await settled()
    option("Cherry").click()
    option("Apple").click()
    expect(made.values.peek()).toEqual(["Apple"])
    expect(option("Cherry").getAttribute("aria-selected")).toBe("false")
    expect(option("Apple").getAttribute("aria-selected")).toBe("true")
    expect(shown.textContent).toBe("Apple")
    expect(field.dirty.peek()).toBe(false)
    expect(made.open.peek()).toBe(true)
  })

  it("a caller who holds the values and answers later: nothing is read back", async () => {
    const field = createField(signal({ id: "f" }))
    const asked: string[][] = []
    const { made, props, form, trigger, option, shown } = picker(
      {
        multiple: true,
        required: true,
        values: [],
        onValuesChange: (next) => void asked.push(next),
      },
      { field }
    )
    const answer = () => props.set({ ...props.peek(), values: asked.at(-1)! })
    trigger.click()
    await settled()
    option("Cherry").click()
    // The caller has not answered: the select still holds what it was given, and stays open.
    expect(asked).toEqual([["Cherry"]])
    expect(made.values.peek()).toEqual([])
    expect(option("Cherry").getAttribute("aria-selected")).toBe("false")
    expect(made.open.peek()).toBe(true)
    // Its field was told what was asked for.
    expect(field.filled.peek()).toBe(true)
    expect(await field.validate()).toBe(true)
    answer()
    expect(option("Cherry").getAttribute("aria-selected")).toBe("true")
    expect(shown.textContent).toBe("Cherry")
    option("Apple").click()
    answer()
    expect(made.values.peek()).toEqual(["Cherry", "Apple"])
    expect(shown.textContent).toBe("Apple, Cherry")
    // A reset asks for what it began with, and its field is told that, not what is still held.
    form.reset()
    expect(asked.at(-1)).toEqual([])
    expect(made.values.peek()).toEqual(["Cherry", "Apple"])
    expect(field.filled.peek()).toBe(false)
    answer()
    expect(shown.textContent).toBe("Pick")
  })
})

describe("a read-only select", () => {
  it("says so on its trigger and its listbox, and stays a stop for Tab", async () => {
    const { props, trigger, popup } = picker({ readOnly: true, defaultValue: "Banana" })
    expect(trigger.getAttribute("aria-readonly")).toBe("true")
    expect(trigger.hasAttribute("data-readonly")).toBe(true)
    expect(popup.getAttribute("aria-readonly")).toBe("true")
    expect((trigger as HTMLButtonElement).disabled).toBe(false)
    props.set({ ...props.peek(), readOnly: false })
    expect(trigger.hasAttribute("aria-readonly")).toBe(false)
    expect(trigger.hasAttribute("data-readonly")).toBe(false)
    expect(popup.hasAttribute("aria-readonly")).toBe(false)
  })

  it("opens to be read and moved through, and chooses nothing", async () => {
    const chosen: (string | null)[] = []
    const { made, trigger, popup, option, shown } = picker({
      readOnly: true,
      defaultValue: "Banana",
      onValueChange: (next) => void chosen.push(next),
    })
    trigger.click()
    await settled()
    expect(made.open.peek()).toBe(true)
    expect(document.activeElement).toBe(option("Banana"))
    await userEvent.keyboard("{ArrowDown}")
    expect(document.activeElement).not.toBe(option("Banana"))
    // A press and Enter on another item: the list stays as it is, open, with its value.
    option("Cherry").click()
    await userEvent.keyboard("{Enter}")
    expect(made.value.peek()).toBe("Banana")
    expect(made.open.peek()).toBe(true)
    expect(chosen).toEqual([])
    expect(shown.textContent).toBe("Banana")
    expect(option("Cherry").getAttribute("aria-selected")).toBe("false")
    expect(popup.getAttribute("aria-readonly")).toBe("true")
    await userEvent.keyboard("{Escape}")
    expect(made.open.peek()).toBe(false)
    expect(focused()).toBe("trigger")
  })

  it("adds and takes away nothing where it holds several values", async () => {
    const { made, heard, trigger, option } = picker({
      readOnly: true,
      multiple: true,
      defaultValues: ["Banana"],
    })
    trigger.click()
    await settled()
    option("Apple").click()
    option("Banana").click()
    expect(made.values.peek()).toEqual(["Banana"])
    expect(heard).toEqual([])
  })

  it("is not changed by a letter typed on its closed trigger", () => {
    const chosen: (string | null)[] = []
    const { made, trigger } = picker({
      readOnly: true,
      defaultValue: "Banana",
      items: { Apple: "Apple", Banana: "Banana", Cherry: "Cherry" },
      onValueChange: (next) => void chosen.push(next),
    })
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "c", bubbles: true }))
    expect(made.value.peek()).toBe("Banana")
    expect(chosen).toEqual([])
  })

  it("is still submitted, and still goes back with its form", async () => {
    const { made, props, form, trigger, option } = picker({ name: "fruit", defaultValue: "Banana" })
    trigger.click()
    await settled()
    option("Cherry").click()
    props.set({ ...props.peek(), readOnly: true })
    expect(new FormData(form).get("fruit")).toBe("Cherry")
    form.reset()
    expect(made.value.peek()).toBe("Banana")
    expect(new FormData(form).get("fruit")).toBe("Banana")
  })
})

describe("a select's items given as a record", () => {
  const NAMES = { Cherry: "Sour cherry", Apple: "Green apple", Banana: "Ripe banana" }

  it("names the value from it before the list has ever been opened", () => {
    const { shown, made } = picker({ items: NAMES, defaultValue: "Apple" })
    expect(shown.textContent).toBe("Green apple")
    expect(made.shown.peek()).toEqual({
      value: "Apple",
      label: "Green apple",
      values: ["Apple"],
      labels: ["Green apple"],
    })
    // A value it does not name is named by its item, or by itself.
    const other = picker({ items: NAMES, defaultValue: "toString" })
    expect(other.shown.textContent).toBe("toString")
  })

  it("lets a letter choose while the list is closed, as a list of items does", async () => {
    const { made, trigger } = picker({ items: NAMES })
    trigger.focus()
    await press("r")
    expect(made.value.peek()).toBe("Banana")
    expect(made.open.peek()).toBe(false)
  })

  it("names several values in its order", () => {
    const { shown, made } = picker({
      items: NAMES,
      multiple: true,
      defaultValues: ["Banana", "Cherry"],
    })
    expect(shown.textContent).toBe("Sour cherry, Ripe banana")
    expect(made.shown.peek().values).toEqual(["Cherry", "Banana"])
  })
})
