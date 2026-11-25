import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { forElement } from "../../packages/core/src/part.ts"
import { createPasswordInput } from "../../packages/core/src/password-input.ts"
import type { PasswordInputProps } from "../../packages/core/src/password-input.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { recorder } from "../../packages/core/src/testing.ts"
import { mount } from "./page.ts"

function password(given: Partial<PasswordInputProps> = {}) {
  const root = mount(`
    <form><div class="root">
      <input class="input" id="pw" value="hunter2" /><button class="toggle"><i class="mark"></i></button>
    </div><button type="reset">Reset</button></form>`)
  const shown = recorder<boolean>()
  const made = createPasswordInput(
    signal<PasswordInputProps>({ onVisibleChange: shown.listen, ...given })
  )
  const find = <T extends HTMLElement = HTMLElement>(name: string) => root.querySelector<T>(name)!
  onTestFinished(bind(find(".root"), made.root))
  onTestFinished(bind(find(".input"), made.input))
  onTestFinished(bind(find(".toggle"), made.toggle))
  onTestFinished(bind(find(".mark"), made.indicator))
  return {
    root,
    made,
    find,
    shown,
    input: find<HTMLInputElement>(".input"),
    toggle: find<HTMLButtonElement>(".toggle"),
  }
}

describe("a password input", () => {
  it("is a password nothing corrects, with a button that says what it would do", () => {
    const { input, toggle } = password()
    expect(input.type).toBe("password")
    expect(input.getAttribute("spellcheck")).toBe("false")
    expect(input.getAttribute("autocapitalize")).toBe("off")
    expect(toggle.getAttribute("aria-label")).toBe("Show password")
    expect(toggle.type).toBe("button")
  })

  it("tells its state by its name alone, so a screen reader says it once", () => {
    const { toggle } = password()
    expect(toggle.hasAttribute("aria-pressed")).toBe(false)
    toggle.click()
    expect(toggle.getAttribute("aria-label")).toBe("Hide password")
    expect(toggle.hasAttribute("aria-pressed")).toBe(false)
    expect(toggle.hasAttribute("data-visible")).toBe(true)
  })

  it("is shown and hidden by its button, focus and the caret left where they are", () => {
    const { input, toggle, shown, find } = password()
    input.focus()
    input.setSelectionRange(2, 5)
    const down = new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerType: "mouse",
    })
    toggle.dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    toggle.click()
    expect(input.type).toBe("text")
    expect(document.activeElement).toBe(input)
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 5])
    expect(toggle.getAttribute("aria-label")).toBe("Hide password")
    expect(find(".root").hasAttribute("data-visible")).toBe(true)
    expect(find(".mark").hasAttribute("data-visible")).toBe(true)
    expect(shown.calls.at(-1)).toMatchObject({ value: true, reason: "toggle-press" })
    toggle.click()
    expect(input.type).toBe("password")
  })

  it("is hidden again as its form is submitted or reset", () => {
    const { root, input, toggle, shown } = password()
    const form = root.querySelector("form")!
    form.addEventListener("submit", (event) => event.preventDefault())
    toggle.click()
    form.requestSubmit()
    expect(input.type).toBe("password")
    expect(shown.calls.at(-1)!.reason).toBe("form-submit")
    toggle.click()
    root.querySelector<HTMLButtonElement>("[type=reset]")!.click()
    expect(input.type).toBe("password")
  })

  it("may be refused, or held by its caller, and does nothing while disabled", () => {
    const refused = password({ onVisibleChange: (_visible, by) => by.cancel() })
    refused.toggle.click()
    expect(refused.input.type).toBe("password")
    const off = password({ disabled: true })
    expect(off.toggle.disabled).toBe(true)
    expect(off.input.disabled).toBe(true)
  })

  it("says what is typed, as an input does", () => {
    const typed = recorder<string>()
    const { input } = password({ onValueChange: typed.listen })
    input.value = "x"
    input.dispatchEvent(new InputEvent("input", { bubbles: true }))
    expect(typed.calls.at(-1)!.value).toBe("x")
    expect(input.hasAttribute("data-dirty")).toBe(true)
  })

  it("is named in the page's words: by toggleLabels, or by the toggle's own aria-label", () => {
    const worded = password({ toggleLabels: { show: "Afficher", hide: "Masquer" } })
    expect(worded.toggle.getAttribute("aria-label")).toBe("Afficher")
    worded.toggle.click()
    expect(worded.toggle.getAttribute("aria-label")).toBe("Masquer")
    // The caller's own label wins over the part's default, shown or hidden.
    const root = mount(
      `<div><input class="input" /><button class="toggle" aria-label="Mot de passe"></button></div>`
    )
    const made = createPasswordInput(signal<PasswordInputProps>({}))
    const toggle = root.querySelector<HTMLButtonElement>(".toggle")!
    onTestFinished(bind(root.querySelector<HTMLElement>(".input")!, made.input))
    onTestFinished(bind(toggle, made.toggle))
    expect(toggle.getAttribute("aria-label")).toBe("Mot de passe")
    toggle.click()
    expect(made.visible.peek()).toBe(true)
    expect(toggle.getAttribute("aria-label")).toBe("Mot de passe")
    // A framework lays the part's props over its caller's the same way.
    const own = made.toggle.props.peek()
    expect(
      forElement(own, { "aria-label": "Mot de passe" }, "button")["aria-label"]
    ).toBeUndefined()
    expect(forElement(own, {}, "button")["aria-label"]).toBe("Hide password")
  })

  it("follows the state with the label a server wrote for it", () => {
    // What a server sent: the part's own label, which is not the caller's.
    const root = mount(
      `<div><input class="input" /><button class="toggle" aria-label="Show password"></button></div>`
    )
    const made = createPasswordInput(signal<PasswordInputProps>({}))
    const toggle = root.querySelector<HTMLButtonElement>(".toggle")!
    onTestFinished(bind(root.querySelector<HTMLElement>(".input")!, made.input))
    onTestFinished(bind(toggle, made.toggle))
    toggle.click()
    expect(toggle.getAttribute("aria-label")).toBe("Hide password")
  })
})
