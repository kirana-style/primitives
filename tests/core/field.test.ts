import { describe, expect, it } from "vite-plus/test"

import { bind, write } from "../../packages/core/src/bind.ts"
import { createCheckbox } from "../../packages/core/src/checkbox.ts"
import { createField } from "../../packages/core/src/field.ts"
import type { Field } from "../../packages/core/src/field.ts"
import { createNumberField } from "../../packages/core/src/number-field.ts"
import type { NumberFieldProps } from "../../packages/core/src/number-field.ts"
import { createRadioGroup } from "../../packages/core/src/radio-group.ts"
import type { RadioGroupProps } from "../../packages/core/src/radio-group.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { createSlider } from "../../packages/core/src/slider.ts"
import type { SliderProps } from "../../packages/core/src/slider.ts"
import { createSwitch } from "../../packages/core/src/switch.ts"
import { mount } from "./page.ts"

/** An element by its `data-part`: ids are what these tests are about. */
const part = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-part="${name}"]`)!

const settled = () => new Promise((done) => setTimeout(done))

describe("a field's messages", () => {
  it("give each message shown an id of its own, all named by the control in the page's order", async () => {
    const root = mount(`
      <div data-part="field">
        <input data-part="control" required />
        <p data-part="description"></p>
        <div data-part="missing"></div>
        <div data-part="any"></div>
      </div>`)
    const field = createField(signal({ id: "f", name: "email" }))
    bind(part(root, "field"), field.root)
    bind(part(root, "control"), field.control)
    bind(part(root, "description"), field.description)
    // Made in the other order than they stand in the page.
    const any = field.error()
    const missing = field.error(() => "valueMissing")
    const stops = [any.mount(), missing.mount()]
    expect(field.validate()).toBe(false)
    await settled()
    bind(part(root, "any"), any.part)
    bind(part(root, "missing"), missing.part)
    expect(part(root, "missing").id).toBe("f-error-valueMissing")
    expect(part(root, "any").id).toBe("f-error")
    expect(part(root, "control").getAttribute("aria-describedby")).toBe(
      "f-description f-error-valueMissing f-error"
    )
    for (const stop of stops) stop()
  })

  it("keep a caller's own id, which the control names", async () => {
    const root = mount(`
      <div>
        <input data-part="control" required />
        <div data-part="error" id="mine"></div>
        <div data-part="always"></div>
      </div>`)
    const field = createField(signal({ id: "f" }))
    bind(part(root, "control"), field.control)
    const error = field.error()
    const always = field.error(() => true)
    const stops = [error.mount(), always.mount()]
    void field.validate()
    await settled()
    bind(part(root, "error"), error.part)
    bind(part(root, "always"), always.part)
    expect(part(root, "error").id).toBe("mine")
    expect(part(root, "always").id).toBe("f-error-always")
    expect(part(root, "control").getAttribute("aria-describedby")).toBe("mine f-error-always")
    for (const stop of stops) stop()
  })
})

describe("a control's own id inside a field", () => {
  it("names a native control, and its label follows", () => {
    const root = mount(`<label data-part="label"></label><input data-part="control" id="own" />`)
    const field = createField(signal({ id: "f" }))
    bind(part(root, "label"), field.label)
    expect(part(root, "label").getAttribute("for")).toBe("f-control")
    bind(part(root, "control"), field.control)
    expect(part(root, "control").id).toBe("own")
    expect(part(root, "label").getAttribute("for")).toBe("own")
  })

  it("is the field's when the caller gives none", () => {
    const root = mount(`<label data-part="label"></label><input data-part="control" />`)
    const field = createField(signal({ id: "f" }))
    bind(part(root, "label"), field.label)
    bind(part(root, "control"), field.control)
    expect(part(root, "control").id).toBe("f-control")
    expect(part(root, "label").getAttribute("for")).toBe("f-control")
  })

  it("is written by a server as the caller's, over the field's", () => {
    const root = mount(`<input data-part="control" id="own" />`)
    const field = createField(signal({ id: "f" }))
    write(part(root, "control"), field.control)
    expect(part(root, "control").id).toBe("own")
  })

  it("names a control that joins, and the label is for it until it leaves", () => {
    const root = mount(`<label data-part="label"></label><div data-part="group" id="plan"></div>`)
    const field = createField(signal({ id: "f", name: "plan" }))
    bind(part(root, "label"), field.label)
    const group = createRadioGroup(signal<RadioGroupProps>({ id: "r" }), { field })
    const unbind = bind(part(root, "group"), group.root)
    expect(part(root, "group").id).toBe("plan")
    expect(part(root, "label").getAttribute("for")).toBe("plan")
    expect(part(root, "group").getAttribute("aria-labelledby")).toBe("f-label")
    unbind()
    expect(part(root, "label").getAttribute("for")).toBe("f-control")
  })

  it("is what a number field's buttons control", () => {
    const root = mount(`<input data-part="input" id="count" /><button data-part="up"></button>`)
    const field = createField(signal({ id: "f" }))
    const number = createNumberField(signal<NumberFieldProps>({ id: "n" }), { field })
    const stop = number.mount()
    bind(part(root, "input"), number.input)
    bind(part(root, "up"), number.increment)
    expect(part(root, "input").id).toBe("count")
    expect(part(root, "up").getAttribute("aria-controls")).toBe("count")
    stop()
  })
})

describe("a control's parts inside a field", () => {
  const STATES = ["touched", "dirty", "filled", "focused", "valid", "invalid"]
  /** The field states an element carries, by name. */
  const said = (element: HTMLElement) =>
    STATES.filter((name) => element.hasAttribute(`data-${name}`)).join(" ")

  /** Each part says what the field's root says, at each step, and the root says `expected`. */
  async function follows(field: Field, parts: HTMLElement[], steps: [() => void, string][]) {
    const root = document.createElement("div")
    document.body.append(root)
    const unbind = bind(root, field.root)
    try {
      for (const [act, expected] of steps) {
        act()
        await settled()
        expect(said(root)).toBe(expected)
        for (const each of parts) expect(said(each)).toBe(expected)
      }
    } finally {
      unbind()
      root.remove()
    }
  }

  const outside = () => (document.activeElement as HTMLElement | null)?.blur()

  it("carry a checkbox's, its indicator's and a switch's thumb's, as the field changes", async () => {
    const root = mount(`
      <div data-part="box"><input data-part="input" /></div><span data-part="mark"></span>
      <div data-part="switch"><input data-part="switch-input" /></div><span data-part="thumb"></span>`)
    const field = createField(signal({ id: "f" }))
    const box = createCheckbox(signal({ id: "c", required: true }), { field })
    const stop = box.mount()
    bind(part(root, "box"), box.root)
    bind(part(root, "input"), box.input)
    bind(part(root, "mark"), box.indicator)
    await follows(
      field,
      [part(root, "box"), part(root, "mark")],
      [
        [() => {}, ""],
        [() => part(root, "box").focus(), "focused"],
        [() => part(root, "box").click(), "dirty filled focused"],
        [outside, "touched dirty filled"],
        [() => part(root, "box").click(), "touched"],
        [() => void field.validate(), "touched invalid"],
        [() => part(root, "box").click(), "touched dirty filled valid"],
      ]
    )
    stop()

    const other = createField(signal({ id: "g" }))
    const toggle = createSwitch(signal({ id: "s" }), { field: other })
    bind(part(root, "switch"), toggle.root)
    bind(part(root, "switch-input"), toggle.input)
    bind(part(root, "thumb"), toggle.thumb)
    await follows(
      other,
      [part(root, "switch"), part(root, "thumb")],
      [
        [() => part(root, "switch").focus(), "focused"],
        [() => part(root, "switch").click(), "dirty filled focused"],
        [outside, "touched dirty filled"],
      ]
    )
  })

  it("carry a radio group's, its items' and their indicators'", async () => {
    const root = mount(`
      <div data-part="group">
        <div data-part="a"><input data-part="a-input" /></div><span data-part="a-mark"></span>
      </div>`)
    const field = createField(signal({ id: "f" }))
    const group = createRadioGroup(signal<RadioGroupProps>({ id: "r", required: true }), { field })
    const indicator = group.indicator("a")
    const stops = [group.mount(), indicator.mount()]
    bind(part(root, "group"), group.root)
    bind(part(root, "a"), group.item("a"))
    bind(part(root, "a-input"), group.itemInput("a"))
    bind(part(root, "a-mark"), indicator.part)
    await follows(
      field,
      [part(root, "group"), part(root, "a"), part(root, "a-mark")],
      [
        [() => {}, ""],
        [() => void field.validate(), "invalid"],
        [() => part(root, "a").focus(), "focused invalid"],
        [() => part(root, "a").click(), "dirty filled focused valid"],
        [outside, "touched dirty filled valid"],
      ]
    )
    for (const stop of stops) stop()
  })

  it("carry every part of a slider's", async () => {
    const root = mount(`
      <div data-part="root"><div data-part="control"><div data-part="track">
        <div data-part="indicator"></div><div data-part="thumb"><input data-part="input" /></div>
      </div></div></div>`)
    const field = createField(signal({ id: "f" }))
    const slider = createSlider(signal<SliderProps>({ id: "s", defaultValue: 40 }), { field })
    const stop = slider.mount()
    bind(part(root, "root"), slider.root)
    bind(part(root, "control"), slider.control)
    bind(part(root, "track"), slider.track)
    bind(part(root, "indicator"), slider.indicator)
    bind(part(root, "thumb"), slider.thumb(0))
    bind(part(root, "input"), slider.thumbInput(0))
    const parts = ["root", "control", "track", "indicator", "thumb"].map((name) => part(root, name))
    const key = (name: string) =>
      part(root, "thumb").dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true }))
    // A slider always has a value: its field is filled from the start, as a field says.
    await follows(field, parts, [
      [() => {}, "filled"],
      [() => part(root, "thumb").focus(), "filled focused"],
      [() => key("ArrowRight"), "dirty filled focused"],
      [() => key("ArrowLeft"), "filled focused"],
      [outside, "touched filled"],
    ])
    stop()
  })
})
