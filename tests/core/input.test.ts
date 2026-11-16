import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createField } from "../../packages/core/src/field.ts"
import type { FieldProps } from "../../packages/core/src/field.ts"
import { createInput } from "../../packages/core/src/input.ts"
import type { InputProps } from "../../packages/core/src/input.ts"
import { createLabel } from "../../packages/core/src/label.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { find, focused, mount } from "./page.ts"

describe("an input", () => {
  it("says its state, and tells the caller what was typed and what typed it", async () => {
    const root = mount(
      `<form id="form"><input class="in" value="a" /></form><button id="next">Next</button>`
    )
    const heard: string[] = []
    const props = signal<InputProps>({
      onValueChange: (value, by) => void heard.push(`${value} ${by.reason}`),
    })
    const element = root.querySelector<HTMLInputElement>(".in")!
    onTestFinished(bind(element, createInput(props).input))
    expect(element.hasAttribute("data-filled")).toBe(true)
    expect(element.hasAttribute("data-dirty")).toBe(false)
    element.focus()
    expect(element.hasAttribute("data-focused")).toBe(true)
    await userEvent.keyboard("{End}b")
    expect(heard).toEqual(["ab input-change"])
    expect(element.hasAttribute("data-dirty")).toBe(true)
    expect(element.hasAttribute("data-touched")).toBe(false)
    find(root, "next").focus()
    expect(element.hasAttribute("data-focused")).toBe(false)
    expect(element.hasAttribute("data-touched")).toBe(true)

    // A form's reset puts it back as it was drawn.
    find<HTMLFormElement>(root, "form").reset()
    expect(element.value).toBe("a")
    expect(element.hasAttribute("data-dirty")).toBe(false)
    expect(element.hasAttribute("data-touched")).toBe(false)

    props.set({ disabled: true })
    expect(element.disabled).toBe(true)
    expect(element.hasAttribute("data-disabled")).toBe(true)
  })

  it("is its field's control, and a label there the field's label", async () => {
    const root = mount(
      `<div class="field"><label class="label">Email</label><input class="in" type="email" required /></div>`
    )
    const field = createField(signal<FieldProps>({ id: "f", name: "email" }))
    onTestFinished(field.mount())
    const heard: string[] = []
    const input = createInput(
      signal<InputProps>({ onValueChange: (value) => void heard.push(value) }),
      { field }
    )
    const element = root.querySelector<HTMLInputElement>(".in")!
    const label = root.querySelector<HTMLLabelElement>(".label")!
    onTestFinished(bind(root.querySelector<HTMLElement>(".field")!, field.root))
    onTestFinished(bind(label, createLabel({ field }).label))
    onTestFinished(bind(element, input.input))
    expect(element.id).toBe("f-control")
    expect(element.name).toBe("email")
    expect(label.htmlFor).toBe("f-control")
    expect(element.getAttribute("aria-labelledby")).toBe(null)
    await userEvent.click(label)
    expect(focused()).toBe("f-control")
    await userEvent.keyboard("x")
    expect(heard).toEqual(["x"])
    expect(field.dirty.peek()).toBe(true)
    // The field checks it as it checks its own control.
    expect(field.validate()).toBe(false)
    expect(element.hasAttribute("data-invalid")).toBe(true)
    expect(label.hasAttribute("data-invalid")).toBe(true)
  })
})

describe("a label", () => {
  it("reaches its control, and a second press does not select its text", () => {
    const root = mount(
      `<label class="label" for="c">Name <input id="inner" /></label><input id="c" />`
    )
    const label = root.querySelector<HTMLElement>(".label")!
    onTestFinished(bind(label, createLabel().label))
    const down = (target: Element, detail: number) => {
      const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true, detail })
      target.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(down(label, 1)).toBe(false)
    expect(down(label, 2)).toBe(true)
    // A word in an input inside the label is still selected by a double press.
    expect(down(find(root, "inner"), 2)).toBe(false)
    label.click()
    expect(focused()).toBe("c")
  })
})
