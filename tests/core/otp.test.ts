import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createField } from "../../packages/core/src/field.ts"
import type { Field } from "../../packages/core/src/field.ts"
import { createOtp } from "../../packages/core/src/otp.ts"
import { forElement } from "../../packages/core/src/part.ts"
import type { OtpProps } from "../../packages/core/src/otp.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { find, focused, mount } from "./page.ts"

const PAGE = `
  <form id="form"><button id="before" type="button">Before</button>
  <div id="root"><input id="code" />
    <span id="s0"></span><span id="s1"></span><span id="s2"></span><span id="s3"></span>
  </div><button id="reset" type="reset">Reset</button></form>`

function otp(given: Partial<OtpProps> = {}, field?: Field) {
  const root = mount(PAGE)
  const done: string[] = []
  const made = createOtp(
    signal<OtpProps>({
      id: "code",
      length: 4,
      name: "code",
      onComplete: (v) => void done.push(v),
      ...given,
    }),
    { field }
  )
  onTestFinished(bind(find(root, "root"), made.root))
  onTestFinished(bind(find(root, "code"), made.input))
  for (let index = 0; index < 4; index++) {
    onTestFinished(bind(find(root, `s${index}`), made.slot(index).part))
  }
  const input = find<HTMLInputElement>(root, "code")
  const active = () =>
    [0, 1, 2, 3].filter((index) => find(root, `s${index}`).hasAttribute("data-active"))
  return { root, made, input, done, active }
}

const press = (key: string) => userEvent.keyboard(key.length === 1 ? key : `{${key}}`)
const settled = () => new Promise((resolve) => setTimeout(resolve, 20))

describe("a one-time code", () => {
  it("is one input a phone can fill, and its cells follow what is typed", async () => {
    const { input, made, active, root } = otp()
    expect(input.getAttribute("autocomplete")).toBe("one-time-code")
    expect(input.getAttribute("inputmode")).toBe("numeric")
    expect(input.getAttribute("maxlength")).toBe("4")
    input.focus()
    await settled()
    expect(active()).toEqual([0])
    expect(made.slot(0).caret.peek()).toBe(true)
    await userEvent.keyboard("12")
    await settled()
    expect(made.value.peek()).toBe("12")
    expect(made.slot(0).char.peek()).toBe("1")
    expect(find(root, "s1").hasAttribute("data-filled")).toBe(true)
    expect(active()).toEqual([2])
    await press("Backspace")
    await settled()
    expect(made.value.peek()).toBe("1")
    expect(active()).toEqual([1])
  })

  it("says when every character is in, once", async () => {
    const { input, done, root, active } = otp()
    input.focus()
    await userEvent.keyboard("1234")
    await settled()
    expect(done).toEqual(["1234"])
    expect(find(root, "root").hasAttribute("data-complete")).toBe(true)
    // Full, the caret is after the last character: the last cell shows it.
    expect(active()).toEqual([3])
    await userEvent.keyboard("5")
    expect(input.value).toBe("1234")
    expect(done).toEqual(["1234"])
  })

  it("tells Base UI's `onValueComplete` with the change's details, in place of `onComplete`", async () => {
    const told: [string, string, boolean][] = []
    const { input, done } = otp({
      onValueComplete: (value, by) => void told.push([value, by.reason, by.event !== undefined]),
    })
    input.focus()
    await userEvent.keyboard("1234")
    await settled()
    expect(told).toHaveLength(1)
    expect(told[0]![0]).toBe("1234")
    expect(told[0]![2]).toBe(true)
    // Both given, the older one is not called.
    expect(done).toEqual([])
  })

  it("reads Base UI's `validationType` and its values as the older `mode`, `validationType` winning", () => {
    for (const [given, kept, keyboard] of [
      [{ validationType: "alpha" }, "ab", "text"],
      [{ validationType: "alphabetic" }, "ab", "text"],
      [{ mode: "alpha" }, "ab", "text"],
      [{ validationType: "none" }, "a1b", "text"],
      [{ mode: "text" }, "a1b", "text"],
      [{ validationType: "numeric", mode: "alpha" }, "1", "numeric"],
      [{ validationType: "alphanumeric", mode: "numeric" }, "a1b", "text"],
    ] as const) {
      const { made, input, root } = otp({ ...given, defaultValue: "a1 b" })
      expect(made.value.peek(), JSON.stringify(given)).toBe(kept)
      expect(input.getAttribute("inputmode"), JSON.stringify(given)).toBe(keyboard)
      root.remove()
    }
  })

  it("lets nothing in that a code cannot hold, and keeps what a paste has of one", async () => {
    const { input, made } = otp()
    input.focus()
    await userEvent.keyboard("a1b")
    await settled()
    expect(input.value).toBe("1")
    await userEvent.clear(input)
    input.focus()
    // As a paste arrives: asked of the input before it changes.
    input.dispatchEvent(
      new InputEvent("beforeinput", {
        inputType: "insertFromPaste",
        data: "12-34",
        bubbles: true,
        cancelable: true,
      })
    )
    await settled()
    expect(made.value.peek()).toBe("1234")
  })

  it("takes letters when it is told to", async () => {
    const { input, made } = otp({ mode: "alphanumeric" })
    expect(input.getAttribute("inputmode")).toBe("text")
    input.focus()
    await userEvent.keyboard("a1-b")
    await settled()
    expect(made.value.peek()).toBe("a1b")
  })

  it("takes letters alone, and what a pattern names, from the keys, a paste and its first value", async () => {
    const letters = otp({ mode: "alphabetic", defaultValue: "a1" })
    expect(letters.made.value.peek()).toBe("a")
    expect(letters.input.getAttribute("inputmode")).toBe("text")
    expect(letters.input.hasAttribute("pattern")).toBe(false)
    letters.input.focus()
    await userEvent.keyboard("{End}2B-c")
    await settled()
    expect(letters.made.value.peek()).toBe("aBc")
    letters.root.remove()

    // A pattern is one character's rule, in place of the mode's, and its keyboard is letters'.
    const hex = otp({ pattern: "[A-F0-9]" })
    expect(hex.input.getAttribute("inputmode")).toBe("text")
    hex.input.focus()
    hex.input.dispatchEvent(
      new InputEvent("beforeinput", {
        inputType: "insertFromPaste",
        data: "0a-F9 G",
        bubbles: true,
        cancelable: true,
      })
    )
    await settled()
    expect(hex.made.value.peek()).toBe("0F9")
  })

  it("a press on a cell puts the caret there, and on a filled one selects it", async () => {
    const { root, input, made, active } = otp({ defaultValue: "12" })
    find(root, "s3").dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, cancelable: true })
    )
    await settled()
    expect(focused()).toBe("code")
    // Past what is typed: after the last character.
    expect(active()).toEqual([2])
    find(root, "s0").dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, cancelable: true })
    )
    await settled()
    expect(active()).toEqual([0])
    await userEvent.keyboard("9")
    await settled()
    expect(made.value.peek()).toBe("92")
    expect(input.value).toBe("92")
  })

  it("is submitted with its form, and goes back to its first value on reset", async () => {
    const { root, input, made } = otp({ defaultValue: "12" })
    const sent = () => new FormData(find<HTMLFormElement>(root, "form")).get("code")
    expect(sent()).toBe("12")
    input.focus()
    await userEvent.keyboard("34")
    await settled()
    expect(sent()).toBe("1234")
    find(root, "reset").click()
    await settled()
    expect(made.value.peek()).toBe("12")
    expect(input.value).toBe("12")
  })

  it("shows no caret and takes no press while it is disabled", async () => {
    const { root, input, active } = otp({ disabled: true })
    expect(input.disabled).toBe(true)
    find(root, "s1").dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, cancelable: true })
    )
    await settled()
    expect(active()).toEqual([])
  })

  it("says it is read-only and needed on its root and each cell, as Base UI's", async () => {
    const { root, input } = otp({ readOnly: true, required: true, defaultValue: "12" })
    for (const id of ["root", "s0", "s3"]) {
      expect(find(root, id).hasAttribute("data-readonly")).toBe(true)
      expect(find(root, id).hasAttribute("data-required")).toBe(true)
    }
    expect(input.readOnly).toBe(true)
    // Needed is the field's to check: the input itself never stops a form.
    expect(input.required).toBe(false)
    expect(input.getAttribute("aria-required")).toBe("true")
    // Filled on the root while it has a character; on a cell while the cell has its own.
    expect(find(root, "root").hasAttribute("data-filled")).toBe(true)
    expect(find(root, "s1").hasAttribute("data-filled")).toBe(true)
    expect(find(root, "s2").hasAttribute("data-filled")).toBe(false)
    input.focus()
    await press("3")
    expect(input.value).toBe("12")
    // Focused anywhere on it: the root and every cell say so.
    expect(find(root, "s3").hasAttribute("data-focused")).toBe(true)
    expect(find(root, "s3").hasAttribute("data-complete")).toBe(false)
  })

  it("says it is complete on every cell once every character is in", async () => {
    const { root, input } = otp()
    input.focus()
    await userEvent.keyboard("1234")
    for (const id of ["root", "s0", "s1", "s2", "s3"])
      expect(find(root, id).hasAttribute("data-complete")).toBe(true)
  })

  it("in a field, is its control, and its root and cells carry what the field says", async () => {
    const field = createField(signal({ id: "f" }))
    const holder = document.createElement("div")
    document.body.append(holder)
    onTestFinished(() => holder.remove())
    onTestFinished(bind(holder, field.root))
    const { root, input } = otp({ required: true, name: undefined }, field)
    const STATES = ["touched", "dirty", "valid", "invalid"]
    const said = (element: HTMLElement) =>
      STATES.filter((name) => element.hasAttribute(`data-${name}`)).join(" ")
    const agree = (expected: string) => {
      expect(said(holder)).toBe(expected)
      for (const id of ["root", "s0", "s3"]) expect(said(find(root, id))).toBe(expected)
    }
    agree("")
    expect(field.validate()).toBe(false)
    agree("invalid")
    expect(input.getAttribute("aria-invalid")).toBe("true")
    input.focus()
    expect(holder.hasAttribute("data-focused")).toBe(true)
    await userEvent.keyboard("12")
    await settled()
    agree("dirty valid")
    expect(holder.hasAttribute("data-filled")).toBe(true)
    find(root, "before").focus()
    await settled()
    agree("touched dirty valid")
    expect(find(root, "s0").hasAttribute("data-focused")).toBe(false)
  })

  it("keeps the id its caller gives the input, so a label for it names it", () => {
    const root = mount(`
      <label for="sms">Code</label>
      <div class="root"><input class="input" id="sms" /></div>
      <div class="other"><input class="input" /></div>`)
    const named = createOtp(signal<OtpProps>({ id: "code", length: 4 }))
    const input = root.querySelector<HTMLInputElement>(".root .input")!
    onTestFinished(bind(input, named.input))
    expect(input.id).toBe("sms")
    expect(root.querySelector("label")!.control).toBe(input)
    expect(forElement(named.input.props.peek(), { id: "sms" }, "input").id).toBeUndefined()
    // With none of the caller's, the input is named by its root's id.
    const unnamed = createOtp(signal<OtpProps>({ id: "code2", length: 4 }))
    const other = root.querySelector<HTMLInputElement>(".other .input")!
    onTestFinished(bind(other, unnamed.input))
    expect(other.id).toBe("code2")
  })
})
