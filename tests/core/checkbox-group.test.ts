import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { createCheckbox } from "../../packages/core/src/checkbox.ts"
import type { CheckboxProps } from "../../packages/core/src/checkbox.ts"
import { createCheckboxGroup } from "../../packages/core/src/checkbox-group.ts"
import type { CheckboxGroupProps } from "../../packages/core/src/checkbox-group.ts"
import { createField } from "../../packages/core/src/field.ts"
import type { Field } from "../../packages/core/src/field.ts"
import type { ChangeDetails } from "../../packages/core/src/part.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { mount } from "./page.ts"

const FRUITS = ["apple", "banana", "cherry"]
const tick = () => new Promise((resolve) => setTimeout(resolve))

/**
 * A group in a form, drawn as an adapter draws one, in plain DOM: a parent box, then a box for
 * each fruit, each with its hidden input as its last child.
 */
function group(
  given: Partial<CheckboxGroupProps> = {},
  options: {
    field?: Field
    /** Each box's own props, by its value; `all` is the parent's. */
    boxes?: Record<string, Partial<CheckboxProps>>
    /** The markup around the group, with `$` where the group goes. */
    around?: string
    parent?: boolean
  } = {}
) {
  const { parent = true } = options
  const names = [...(parent ? ["all"] : []), ...FRUITS]
  const markup = `<div id="group">${names
    .map((each) => `<span id="${each}"><input id="${each}-input" /></span>`)
    .join("")}</div>`
  const root = mount(`<form id="form">${(options.around ?? "$").replace("$", markup)}</form>`)
  const heard: string[][] = []
  const reasons: string[] = []
  const props = signal<CheckboxGroupProps>({
    id: "g",
    allValues: FRUITS,
    onValueChange(next, by) {
      heard.push(next)
      reasons.push(by.reason)
    },
    ...given,
  })
  const made = createCheckboxGroup(props, { field: options.field })
  const form = root.querySelector<HTMLFormElement>("#form")!
  // Found before they are bound: a part that writes `id` renames its element.
  const element = root.querySelector<HTMLElement>("#group")!
  const boxes = new Map(names.map((each) => [each, root.querySelector<HTMLElement>(`#${each}`)!]))
  const inputs = new Map(
    names.map((each) => [each, root.querySelector<HTMLInputElement>(`#${each}-input`)!])
  )
  const own = new Map<string, ReturnType<typeof signal<CheckboxProps>>>()
  onTestFinished(bind(element, made.root))
  for (const each of names) {
    const box = signal<CheckboxProps>({
      id: `box-${each}`,
      name: "fruit",
      ...(each === "all" ? { parent: true } : { value: each }),
      ...options.boxes?.[each],
    })
    own.set(each, box)
    const checkbox = createCheckbox(box, { field: options.field, group: made })
    onTestFinished(checkbox.mount())
    onTestFinished(bind(boxes.get(each)!, checkbox.root))
    onTestFinished(bind(inputs.get(each)!, checkbox.input))
  }
  const box = (name: string) => boxes.get(name)!
  return {
    made,
    props,
    form,
    element,
    heard,
    reasons,
    box,
    own: (name: string) => own.get(name)!,
    input: (name: string) => inputs.get(name)!,
    said: (name: string) => box(name).getAttribute("aria-checked"),
    sent: () => new FormData(form).getAll("fruit"),
  }
}

describe("a checkbox group", () => {
  it("holds the values of its checked boxes, each box named by its value", () => {
    const { made, heard, reasons, box, said, element } = group({ defaultValue: ["banana"] })
    expect(element.getAttribute("role")).toBe("group")
    expect(["apple", "banana", "cherry"].map(said)).toEqual(["false", "true", "false"])
    expect(box("banana").hasAttribute("data-checked")).toBe(true)
    box("cherry").click()
    expect(made.value.peek()).toEqual(["banana", "cherry"])
    box("banana").click()
    expect(made.value.peek()).toEqual(["cherry"])
    expect(heard).toEqual([["banana", "cherry"], ["cherry"]])
    expect(reasons).toEqual(["press", "press"])
    expect(["apple", "banana", "cherry"].map(said)).toEqual(["false", "false", "true"])
  })

  it("is pressed with Space, and through a box's own hidden input, as a lone box is", () => {
    const { made, box, input } = group()
    box("apple").dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true })
    )
    expect(made.value.peek()).toEqual(["apple"])
    expect(input("apple").checked).toBe(true)
    // What a `<label>` does: it presses the native input.
    input("cherry").click()
    expect(made.value.peek()).toEqual(["apple", "cherry"])
  })

  it("follows a caller who holds the value, and leaves the boxes as they were when refused", () => {
    const { made, props, box, said, input } = group({
      value: ["apple"],
      onValueChange: (_next, by) => by.cancel(),
    })
    box("banana").click()
    expect(made.value.peek()).toEqual(["apple"])
    expect(said("banana")).toBe("false")
    // The native input was pressed: it is put back to what the group says.
    expect(input("banana").checked).toBe(false)
    props.set({ ...props.peek(), value: ["banana", "cherry"] })
    expect(["apple", "banana", "cherry"].map(said)).toEqual(["false", "true", "true"])
    expect(input("apple").checked).toBe(false)
    expect(input("cherry").checked).toBe(true)
  })

  it("asks a box's own callback first, which may refuse before the group hears of it", () => {
    const asked: boolean[] = []
    const { made, heard, box } = group(
      {},
      {
        boxes: {
          apple: {
            onCheckedChange(next: boolean, by: ChangeDetails) {
              asked.push(next)
              by.cancel()
            },
          },
          banana: { onCheckedChange: (next: boolean) => void asked.push(next) },
        },
      }
    )
    box("apple").click()
    expect(heard).toEqual([])
    box("banana").click()
    expect(asked).toEqual([true, true])
    expect(made.value.peek()).toEqual(["banana"])
  })

  it("disables every box, and a disabled or read-only box of its own is not changed", () => {
    const { made, props, box, element, input } = group(
      { defaultValue: ["cherry"] },
      { boxes: { apple: { disabled: true }, banana: { readOnly: true } } }
    )
    box("apple").click()
    box("banana").click()
    expect(made.value.peek()).toEqual(["cherry"])
    expect(box("cherry").getAttribute("tabindex")).toBe("0")
    props.set({ ...props.peek(), disabled: true })
    expect(element.hasAttribute("data-disabled")).toBe(true)
    for (const each of ["all", "apple", "banana", "cherry"]) {
      expect(box(each).getAttribute("aria-disabled")).toBe("true")
      expect(box(each).hasAttribute("data-disabled")).toBe(true)
      expect(input(each).disabled).toBe(true)
    }
    box("cherry").click()
    box("all").click()
    expect(made.value.peek()).toEqual(["cherry"])
  })

  it("submits each checked box under its name, and never the parent", () => {
    const { box, sent, input } = group({ defaultValue: ["banana"] })
    expect(sent()).toEqual(["banana"])
    expect(input("all").hasAttribute("name")).toBe(false)
    box("all").click()
    expect(sent()).toEqual(["apple", "banana", "cherry"])
  })

  it("goes back to the values it began with when its form is reset, heard once", async () => {
    const { made, form, heard, reasons, box, said, sent, input } = group({
      defaultValue: ["banana"],
    })
    box("apple").click()
    box("banana").click()
    expect(sent()).toEqual(["apple"])
    form.reset()
    expect(made.value.peek()).toEqual(["banana"])
    expect(heard.at(-1)).toEqual(["banana"])
    // Every box's input is in the form; the group is asked once.
    expect(reasons.filter((each) => each === "form-reset")).toEqual(["form-reset"])
    await tick()
    expect(["apple", "banana", "cherry"].map(said)).toEqual(["false", "true", "false"])
    expect(["apple", "banana", "cherry"].map((each) => input(each).checked)).toEqual([
      false,
      true,
      false,
    ])
    expect(said("all")).toBe("mixed")
    expect(sent()).toEqual(["banana"])
  })

  it("keeps a caller's value through a reset the caller refuses", async () => {
    const { made, form, input } = group({
      value: ["apple", "cherry"],
      onValueChange: (_next, by) => by.cancel(),
    })
    form.reset()
    await tick()
    expect(made.value.peek()).toEqual(["apple", "cherry"])
    expect(["apple", "banana", "cherry"].map((each) => input(each).checked)).toEqual([
      true,
      false,
      true,
    ])
  })

  it("follows a `<fieldset disabled>` around it, box by box", async () => {
    const { made, form, box } = group({}, { around: `<fieldset id="set">$</fieldset>` })
    const set = form.querySelector<HTMLFieldSetElement>("#set")!
    set.disabled = true
    await tick()
    expect(box("apple").getAttribute("aria-disabled")).toBe("true")
    box("apple").click()
    expect(made.value.peek()).toEqual([])
    set.disabled = false
    await tick()
    box("apple").click()
    expect(made.value.peek()).toEqual(["apple"])
  })

  it("leaves a box with no value its own state, and still disables it", () => {
    const root = mount(`<div id="group"><span id="lone"><input id="lone-input" /></span></div>`)
    const props = signal<CheckboxGroupProps>({ id: "g" })
    const made = createCheckboxGroup(props)
    const lone = createCheckbox(signal<CheckboxProps>({ id: "lone" }), { group: made })
    const box = root.querySelector<HTMLElement>("#lone")!
    onTestFinished(bind(root.querySelector<HTMLElement>("#group")!, made.root))
    onTestFinished(bind(box, lone.root))
    onTestFinished(bind(root.querySelector<HTMLElement>("#lone-input")!, lone.input))
    box.click()
    expect(lone.checked.peek()).toBe(true)
    expect(made.value.peek()).toEqual([])
    props.set({ ...props.peek(), disabled: true })
    expect(box.getAttribute("aria-disabled")).toBe("true")
  })
})

describe("a checkbox group's parent", () => {
  it("is checked when every box is, mixed when some are, and says what it stands for", async () => {
    const { box, said, input, made } = group({ defaultValue: ["banana"] })
    expect(said("all")).toBe("mixed")
    expect(box("all").hasAttribute("data-indeterminate")).toBe(true)
    expect(box("all").hasAttribute("data-parent")).toBe(true)
    expect(input("all").indeterminate).toBe(true)
    // Each box of `allValues` has an id made from the group's, and the parent names them.
    expect(box("all").getAttribute("aria-controls")).toBe("g-0 g-1 g-2")
    expect(["apple", "banana", "cherry"].map((each) => box(each).id)).toEqual(["g-0", "g-1", "g-2"])
    box("apple").click()
    box("cherry").click()
    expect(said("all")).toBe("true")
    expect(box("all").hasAttribute("data-checked")).toBe(true)
    expect(input("all").indeterminate).toBe(false)
    expect(input("all").checked).toBe(true)
    made.setValue([], { reason: "test" } as ChangeDetails)
    expect(said("all")).toBe("false")
  })

  it("names every box before there is a page, and after only those that are in it", async () => {
    const props = signal<CheckboxGroupProps>({ id: "g", allValues: FRUITS })
    const made = createCheckboxGroup(props)
    const parent = createCheckbox(signal<CheckboxProps>({ id: "p", parent: true }), {
      group: made,
    })
    // What a server writes.
    expect(parent.root.props.peek()["aria-controls"]).toBe("g-0 g-1 g-2")
    const root = mount(`<div id="group"><span id="one"></span></div>`)
    const one = createCheckbox(signal<CheckboxProps>({ id: "o", value: "banana" }), {
      group: made,
    })
    onTestFinished(bind(root.querySelector<HTMLElement>("#group")!, made.root))
    onTestFinished(bind(root.querySelector<HTMLElement>("#one")!, one.root))
    await tick()
    expect(parent.root.props.peek()["aria-controls"]).toBe("g-1")
  })

  it("sets every box, then none, from boxes that were all on or all off", () => {
    const { made, box, heard } = group()
    box("all").click()
    expect(made.value.peek()).toEqual(["apple", "banana", "cherry"])
    box("all").click()
    expect(made.value.peek()).toEqual([])
    box("all").click()
    expect(heard).toEqual([["apple", "banana", "cherry"], [], ["apple", "banana", "cherry"]])
  })

  it("goes round from a mixed set: all, none, and back to the set it started from", () => {
    const { made, box, said } = group({ defaultValue: ["banana"] })
    box("all").click()
    expect(made.value.peek()).toEqual(["apple", "banana", "cherry"])
    box("all").click()
    expect(made.value.peek()).toEqual([])
    box("all").click()
    expect(made.value.peek()).toEqual(["banana"])
    expect(said("all")).toBe("mixed")
    box("all").click()
    expect(made.value.peek()).toEqual(["apple", "banana", "cherry"])
    // A box pressed since is the set it comes back to.
    box("apple").click()
    expect(made.value.peek()).toEqual(["banana", "cherry"])
    box("all").click()
    box("all").click()
    box("all").click()
    expect(made.value.peek()).toEqual(["banana", "cherry"])
  })

  it("leaves a disabled box as it is: checked it stays on, unchecked it stays off", () => {
    const { made, box } = group(
      { defaultValue: ["apple"] },
      { boxes: { apple: { disabled: true }, banana: { disabled: true } } }
    )
    // Every box it can turn on is: banana cannot be.
    box("all").click()
    expect(made.value.peek()).toEqual(["apple", "cherry"])
    box("all").click()
    expect(made.value.peek()).toEqual(["apple"])
  })

  it("stays where it was when the group's caller refuses", () => {
    let refuse = true
    const { made, box } = group({
      defaultValue: ["banana"],
      onValueChange: (_next, by) => void (refuse && by.cancel()),
    })
    box("all").click()
    expect(made.value.peek()).toEqual(["banana"])
    refuse = false
    // Refused, it did not move on: the next press is still "all".
    box("all").click()
    expect(made.value.peek()).toEqual(["apple", "banana", "cherry"])
  })
})

describe("a checkbox group in a field", () => {
  function inField(given: Partial<CheckboxGroupProps> = {}) {
    const field = createField(signal({ id: "f", name: "fruit" }))
    const label = mount(`<label id="label">Fruit</label>`).querySelector<HTMLElement>("#label")!
    onTestFinished(bind(label, field.label))
    const made = group(given, { field, boxes: { apple: { name: undefined } }, parent: false })
    return { field, label, ...made }
  }

  it("is the field's control: named by its label, and its boxes take the field's name", () => {
    const { field, element, box, input, label } = inField()
    expect(element.id).toBe(field.controlId)
    expect(element.getAttribute("aria-labelledby")).toBe(label.id)
    // No box takes the id the label is `for`, or its label.
    for (const each of FRUITS) {
      expect(input(each).id).toBe(`box-${each}`)
      expect(box(each).hasAttribute("aria-labelledby")).toBe(false)
    }
    expect(input("apple").name).toBe("fruit")
    label.click()
    expect(document.activeElement).toBe(box("apple"))
  })

  it("tells the field what it holds: filled, dirty, focused, and clean again after a reset", async () => {
    const { field, form, element, box } = inField({ defaultValue: ["banana"] })
    expect(field.filled.peek()).toBe(true)
    expect(field.dirty.peek()).toBe(false)
    box("apple").click()
    expect(field.dirty.peek()).toBe(true)
    // Every part says the field's state, the boxes too.
    expect(element.hasAttribute("data-dirty")).toBe(true)
    expect(box("cherry").hasAttribute("data-dirty")).toBe(true)
    box("apple").click()
    box("banana").click()
    expect(field.filled.peek()).toBe(false)
    box("banana").focus()
    expect(field.focused.peek()).toBe(true)
    // From one box to another, focus has not left the group.
    box("cherry").focus()
    expect(field.focused.peek()).toBe(true)
    expect(field.touched.peek()).toBe(false)
    box("cherry").blur()
    expect(field.touched.peek()).toBe(true)
    form.reset()
    await tick()
    expect(field.dirty.peek()).toBe(false)
    expect(field.filled.peek()).toBe(true)
  })

  it("is checked by the field's own rule, on the values it holds", () => {
    const field = createField(
      signal({
        id: "f",
        validate: (value: string) => (value.split(",").length < 2 ? "Pick two" : null),
      })
    )
    const { box } = group({}, { field, parent: false })
    box("apple").click()
    expect(field.validate()).toBe(false)
    expect(field.errors.peek()).toEqual(["Pick two"])
    box("cherry").click()
    expect(field.invalid.peek()).toBe(false)
  })
})
