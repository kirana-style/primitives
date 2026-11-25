import { describe, expect, it } from "vite-plus/test"

import { bind, write } from "../../packages/core/src/bind.ts"
import { createField } from "../../packages/core/src/field.ts"
import { createNumberField } from "../../packages/core/src/number-field.ts"
import type { NumberFieldProps } from "../../packages/core/src/number-field.ts"
import { createRadioGroup } from "../../packages/core/src/radio-group.ts"
import type { RadioGroupProps } from "../../packages/core/src/radio-group.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
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
