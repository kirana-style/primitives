import { describe, expect, it } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { createCheckbox } from "../../packages/core/src/checkbox.ts"
import type { CheckboxProps } from "../../packages/core/src/checkbox.ts"
import { createField } from "../../packages/core/src/field.ts"
import type { ChangeDetails } from "../../packages/core/src/part.ts"
import { createRadioGroup } from "../../packages/core/src/radio-group.ts"
import type { RadioGroupProps } from "../../packages/core/src/radio-group.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { createSelect } from "../../packages/core/src/select.ts"
import type { SelectProps } from "../../packages/core/src/select.ts"
import {
  createFormControl,
  inDisabledFieldset,
  onFormReset,
} from "../../packages/core/src/services/form-control.ts"
import { createSlider } from "../../packages/core/src/slider.ts"
import type { SliderProps } from "../../packages/core/src/slider.ts"
import { find, mount } from "./page.ts"

const submitted = (form: HTMLFormElement) =>
  [...new FormData(form)].map(([name, value]) => `${name}=${String(value)}`)

/** A checkbox drawn with no framework, in whatever markup holds `#box` and `#box-input`. */
function checkbox(root: ParentNode, given: Partial<CheckboxProps> = {}) {
  const props = signal<CheckboxProps>({ id: "c", name: "agree", ...given })
  const made = createCheckbox(props)
  const box = find(root, "box")
  const input = find<HTMLInputElement>(root, "box-input")
  bind(box, made.root)
  bind(input, made.input)
  return { props, made, box, input }
}

const BOX = `<span id="box"><input id="box-input" /></span>`

describe("a form's reset, heard by a control", () => {
  it("hears the form around it, and the form it names", () => {
    const root = mount(`
      <form id="around"><input id="in" /></form>
      <form id="named"></form>
      <input id="out" form="named" />
      <form id="other"></form>`)
    const heard: string[] = []
    onFormReset(find(root, "in"), () => void heard.push("in"))
    onFormReset(find(root, "out"), () => void heard.push("out"))
    find<HTMLFormElement>(root, "other").reset()
    expect(heard).toEqual([])
    find<HTMLFormElement>(root, "around").reset()
    expect(heard).toEqual(["in"])
    find<HTMLFormElement>(root, "named").reset()
    expect(heard).toEqual(["in", "out"])
  })

  it("does not hear a reset a listener cancelled", () => {
    const root = mount(
      `<form id="f"><input id="in" /><button id="r" type="reset">R</button></form>`
    )
    let heard = 0
    onFormReset(find(root, "in"), () => void heard++)
    // "Are you sure?", answered no: added after the control's, as a page's own would be.
    const refuse = (event: Event) => event.preventDefault()
    find(root, "f").addEventListener("reset", refuse)
    find(root, "r").click()
    expect(heard).toBe(0)
    find(root, "f").removeEventListener("reset", refuse)
    find(root, "r").click()
    expect(heard).toBe(1)
  })

  it("runs before the browser puts the native controls back", () => {
    const root = mount(`<form id="f"><input id="in" value="first" /></form>`)
    const input = find<HTMLInputElement>(root, "in")
    input.value = "typed"
    let seen = ""
    onFormReset(input, () => {
      seen = input.value
    })
    find<HTMLFormElement>(root, "f").reset()
    expect(seen).toBe("typed")
    expect(input.value).toBe("first")
  })

  it("stops when it is let go", () => {
    const root = mount(`<form id="f"><input id="in" /></form>`)
    let heard = 0
    const stop = onFormReset(find(root, "in"), () => void heard++)
    stop()
    find<HTMLFormElement>(root, "f").reset()
    expect(heard).toBe(0)
  })

  it("hears a form inside a shadow tree", () => {
    const root = mount(`<div id="host"></div>`)
    const shadow = find(root, "host").attachShadow({ mode: "open" })
    shadow.innerHTML = `<form><input /></form>`
    let heard = 0
    onFormReset(shadow.querySelector("input")!, () => void heard++)
    shadow.querySelector("form")!.reset()
    expect(heard).toBe(1)
  })

  it("takes an element that is not in the page yet", async () => {
    const root = mount(`<form id="f"></form>`)
    const input = document.createElement("input")
    let heard = 0
    onFormReset(input, () => void heard++)
    find(root, "f").append(input)
    await Promise.resolve()
    find<HTMLFormElement>(root, "f").reset()
    expect(heard).toBe(1)
  })

  it("tells a control of several elements once", () => {
    const root = mount(`<form id="f"><input id="a" /><input id="b" /></form>`)
    let heard = 0
    const control = createFormControl(() => void heard++)
    control.attach(find(root, "a"))
    control.attach(find(root, "b"))
    find<HTMLFormElement>(root, "f").reset()
    find<HTMLFormElement>(root, "f").reset()
    expect(heard).toBe(2)
  })
})

describe("a disabled fieldset", () => {
  it("disables what is inside it, at any depth, but for its legend", () => {
    const root = mount(`
      <fieldset disabled id="outer">
        <legend><input id="legend" /></legend>
        <fieldset><input id="deep" /></fieldset>
        <input id="in" />
      </fieldset>
      <fieldset><input id="free" /></fieldset>`)
    expect(inDisabledFieldset(find(root, "in"))).toBe(true)
    expect(inDisabledFieldset(find(root, "deep"))).toBe(true)
    expect(inDisabledFieldset(find(root, "legend"))).toBe(false)
    expect(inDisabledFieldset(find(root, "free"))).toBe(false)
    // The browser's own answer, for the same four.
    for (const id of ["in", "deep", "legend", "free"]) {
      expect(inDisabledFieldset(find(root, id)), id).toBe(find(root, id).matches(":disabled"))
    }
  })

  it("is followed as it changes", async () => {
    const root = mount(`<fieldset id="set"><input id="in" /></fieldset>`)
    const control = createFormControl(() => {})
    const leave = control.attach(find(root, "in"))
    expect(control.disabled.peek()).toBe(false)
    find<HTMLFieldSetElement>(root, "set").disabled = true
    await Promise.resolve()
    expect(control.disabled.peek()).toBe(true)
    find<HTMLFieldSetElement>(root, "set").disabled = false
    await Promise.resolve()
    expect(control.disabled.peek()).toBe(false)
    leave()
  })
})

describe("a checkbox in a form", () => {
  it("goes back to unchecked on reset, and the form with it", () => {
    const root = mount(`<form id="f">${BOX}</form>`)
    const form = find<HTMLFormElement>(root, "f")
    const { made, box, input } = checkbox(root)
    box.click()
    expect(submitted(form)).toEqual(["agree=on"])
    form.reset()
    expect(made.checked.peek()).toBe(false)
    expect(input.checked).toBe(false)
    expect(box.getAttribute("aria-checked")).toBe("false")
    expect(submitted(form)).toEqual([])
  })

  it("goes back to checked when it began checked", () => {
    const root = mount(`<form id="f">${BOX}<button id="r" type="reset">R</button></form>`)
    const form = find<HTMLFormElement>(root, "f")
    const { made, box, input } = checkbox(root, { defaultChecked: true })
    box.click()
    expect(made.checked.peek()).toBe(false)
    find(root, "r").click()
    expect(made.checked.peek()).toBe(true)
    expect(input.checked).toBe(true)
    expect(box.hasAttribute("data-checked")).toBe(true)
    expect(submitted(form)).toEqual(["agree=on"])
  })

  it("says why, and a caller who refuses keeps the value in the form too", () => {
    const root = mount(`<form id="f">${BOX}</form>`)
    const form = find<HTMLFormElement>(root, "f")
    const reasons: string[] = []
    const { made, box, input } = checkbox(root, {
      onCheckedChange(_checked: boolean, details: ChangeDetails) {
        reasons.push(details.reason)
        if (details.reason === "form-reset") details.cancel()
      },
    })
    box.click()
    form.reset()
    expect(reasons).toEqual(["press", "form-reset"])
    expect(made.checked.peek()).toBe(true)
    expect(input.checked).toBe(true)
    expect(submitted(form)).toEqual(["agree=on"])
  })

  it("ends unchecked when its caller holds the value and answers a moment later", async () => {
    // As React's state, Svelte's binding and Angular's model do: the new value comes back
    // after the browser has reset the input.
    const root = mount(`<form id="f">${BOX}<button id="r" type="reset">R</button></form>`)
    const form = find<HTMLFormElement>(root, "f")
    const { props, made, box, input } = checkbox(root, { checked: false })
    props.set({
      ...props.peek(),
      onCheckedChange: (next: boolean) =>
        void setTimeout(() => props.set({ ...props.peek(), checked: next }), 5),
    })
    box.click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(made.checked.peek()).toBe(true)
    expect(input.checked).toBe(true)
    find(root, "r").click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(made.checked.peek()).toBe(false)
    expect(input.checked).toBe(false)
    expect(submitted(form)).toEqual([])
    // And a press after it is heard: the input and the control agree.
    box.click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(made.checked.peek()).toBe(true)
    expect(submitted(form)).toEqual(["agree=on"])
  })

  it("keeps its input with a caller who holds the value and ignores the reset", async () => {
    const root = mount(`<form id="f">${BOX}</form>`)
    const form = find<HTMLFormElement>(root, "f")
    const { made, input } = checkbox(root, { checked: true, defaultChecked: false })
    form.reset()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(made.checked.peek()).toBe(true)
    expect(input.checked).toBe(true)
    expect(submitted(form)).toEqual(["agree=on"])
  })

  it("follows a value its caller changes, whatever draws the input", () => {
    const root = mount(`<form id="f">${BOX}</form>`)
    const { props, box, input } = checkbox(root, { checked: false })
    // A press moved the input's own state; the caller then says otherwise.
    box.click()
    props.set({ ...props.peek(), checked: true })
    expect(input.checked).toBe(true)
    props.set({ ...props.peek(), checked: false })
    expect(input.checked).toBe(false)
  })

  it("stays as it is when the reset is cancelled", () => {
    const root = mount(`<form id="f">${BOX}<button id="r" type="reset">R</button></form>`)
    const { made, box, input } = checkbox(root)
    find(root, "f").addEventListener("reset", (event) => event.preventDefault())
    box.click()
    find(root, "r").click()
    expect(made.checked.peek()).toBe(true)
    expect(input.checked).toBe(true)
  })

  it("is reset by the form it names, from outside it", () => {
    const root = mount(`<form id="far"></form>${BOX}`)
    const form = find<HTMLFormElement>(root, "far")
    const { made, box } = checkbox(root, { form: "far" })
    box.click()
    expect(submitted(form)).toEqual(["agree=on"])
    form.reset()
    expect(made.checked.peek()).toBe(false)
    expect(submitted(form)).toEqual([])
  })

  it("is disabled by a fieldset around it, and says so", async () => {
    const root = mount(`<form id="f"><fieldset id="set" disabled>${BOX}</fieldset></form>`)
    const { made, box } = checkbox(root)
    expect(box.getAttribute("aria-disabled")).toBe("true")
    expect(box.hasAttribute("data-disabled")).toBe(true)
    expect(box.getAttribute("tabindex")).toBe("-1")
    box.click()
    expect(made.checked.peek()).toBe(false)
    find<HTMLFieldSetElement>(root, "set").disabled = false
    await Promise.resolve()
    expect(box.hasAttribute("aria-disabled")).toBe(false)
    expect(box.getAttribute("tabindex")).toBe("0")
    box.click()
    expect(made.checked.peek()).toBe(true)
  })

  it("is ticked once by a press inside a label around it", () => {
    const root = mount(`<label id="label">${BOX}<span id="text">Agree</span></label>`)
    const { made, box } = checkbox(root)
    const changes: boolean[] = []
    made.checked.subscribe(() => void changes.push(made.checked.peek()))
    box.click()
    expect(changes).toEqual([true])
    find(root, "text").click()
    expect(changes).toEqual([true, false])
  })
})

describe("the other controls in a form", () => {
  it("a radio group goes back to the value it began with, or to none", () => {
    const root = mount(`
      <form id="f"><div id="group">
        <span id="a"><input id="a-input" /></span>
        <span id="b"><input id="b-input" /></span>
      </div></form>`)
    const form = find<HTMLFormElement>(root, "f")
    const heard: (string | null)[] = []
    const props = signal<RadioGroupProps<string>>({
      id: "g",
      name: "size",
      onValueChange: (value) => void heard.push(value),
    })
    const group = createRadioGroup(props)
    bind(find(root, "group"), group.root)
    for (const each of ["a", "b"]) {
      bind(find(root, each), group.item(each))
      bind(find(root, `${each}-input`), group.itemInput(each))
    }
    find(root, "b").click()
    expect(submitted(form)).toEqual(["size=b"])
    form.reset()
    expect(group.value.peek()).toBe(null)
    expect(heard).toEqual(["b", null])
    expect(submitted(form)).toEqual([])
    expect(find(root, "b").getAttribute("aria-checked")).toBe("false")
  })

  it("a slider goes back to the value it began with", () => {
    const root = mount(`
      <form id="f"><div id="slider"><div id="control"><div id="thumb">
        <input id="thumb-input" />
      </div></div></div></form>`)
    const form = find<HTMLFormElement>(root, "f")
    const heard: string[] = []
    const props = signal<SliderProps>({
      id: "s",
      name: "volume",
      defaultValue: 30,
      onValueChange: (value, details) => void heard.push(`${String(value)} ${details.reason}`),
    })
    const slider = createSlider(props)
    bind(find(root, "slider"), slider.root)
    bind(find(root, "thumb"), slider.thumb(0))
    bind(find(root, "thumb-input"), slider.thumbInput(0))
    find(root, "thumb").dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }))
    expect(submitted(form)).toEqual(["volume=100"])
    form.reset()
    expect(slider.values.peek()).toEqual([30])
    expect(heard.at(-1)).toBe("30 form-reset")
    expect(submitted(form)).toEqual(["volume=30"])
    expect(find(root, "thumb").getAttribute("aria-valuenow")).toBe("30")
  })

  it("a select goes back to the value it began with, heard through its trigger", () => {
    const root = mount(`<form id="f"><button id="trigger">Pick</button></form>`)
    const props = signal<SelectProps<string>>({ id: "s", defaultValue: "apple" })
    const select = createSelect(props)
    bind(find(root, "trigger"), select.trigger)
    select.setValue("pear", { reason: "test", event: undefined, cancel() {}, canceled: false })
    expect(select.value.peek()).toBe("pear")
    find<HTMLFormElement>(root, "f").reset()
    expect(select.value.peek()).toBe("apple")
  })

  it("a select in a disabled fieldset says it is disabled", () => {
    const root = mount(`<fieldset disabled><button id="trigger">Pick</button></fieldset>`)
    const select = createSelect(signal<SelectProps<string>>({ id: "s" }))
    bind(find(root, "trigger"), select.trigger)
    expect(find(root, "trigger").hasAttribute("data-disabled")).toBe(true)
  })
})

describe("a field in a form", () => {
  it("is as new after a reset: untouched, clean, unchecked, filled by the default", () => {
    const root = mount(`
      <form id="f"><div id="field">
        <input id="control" value="first" required />
      </div></form>`)
    const field = createField(signal({ id: "n", name: "name" }))
    const control = find<HTMLInputElement>(root, "control")
    bind(find(root, "field"), field.root)
    bind(control, field.control)
    control.focus()
    control.value = ""
    control.dispatchEvent(new Event("input", { bubbles: true }))
    control.blur()
    void field.validate()
    expect(field.touched.peek()).toBe(true)
    expect(field.dirty.peek()).toBe(true)
    expect(field.filled.peek()).toBe(false)
    expect(field.invalid.peek()).toBe(true)
    find<HTMLFormElement>(root, "f").reset()
    expect(control.value).toBe("first")
    expect(field.touched.peek()).toBe(false)
    expect(field.dirty.peek()).toBe(false)
    expect(field.filled.peek()).toBe(true)
    expect(field.invalid.peek()).toBe(false)
    expect(find(root, "field").hasAttribute("data-invalid")).toBe(false)
  })

  it("is reset with the control that joined it", () => {
    const root = mount(`<form id="f"><div id="field">${BOX}</div></form>`)
    const field = createField(signal({ id: "n", name: "agree" }))
    bind(find(root, "field"), field.root)
    const props = signal<CheckboxProps>({ id: "c", required: true })
    const made = createCheckbox(props, { field })
    const box = find(root, "box")
    bind(box, made.root)
    bind(find(root, "box-input"), made.input)
    box.click()
    box.click()
    void field.validate()
    expect(field.dirty.peek()).toBe(false)
    expect(field.invalid.peek()).toBe(true)
    box.focus()
    box.blur()
    expect(field.touched.peek()).toBe(true)
    find<HTMLFormElement>(root, "f").reset()
    expect(field.touched.peek()).toBe(false)
    expect(field.invalid.peek()).toBe(false)
  })
})
