import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createOtp } from "../../packages/core/src/otp.ts"
import type { OtpProps } from "../../packages/core/src/otp.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { find, focused, mount } from "./page.ts"

const PAGE = `
  <form id="form"><button id="before" type="button">Before</button>
  <div id="root"><input id="code" />
    <span id="s0"></span><span id="s1"></span><span id="s2"></span><span id="s3"></span>
  </div><button id="reset" type="reset">Reset</button></form>`

function otp(given: Partial<OtpProps> = {}) {
  const root = mount(PAGE)
  const done: string[] = []
  const made = createOtp(
    signal<OtpProps>({
      id: "code",
      length: 4,
      name: "code",
      onComplete: (v) => void done.push(v),
      ...given,
    })
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
})
