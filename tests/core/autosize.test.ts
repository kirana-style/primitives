import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { createAutosize } from "../../packages/core/src/autosize.ts"
import type { AutosizeProps } from "../../packages/core/src/autosize.ts"
import { bind } from "../../packages/core/src/bind.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { find, mount, style } from "./page.ts"

function area(css = "", html = `<textarea id="note" rows="1"></textarea>`) {
  style(`
    #note { display: block; box-sizing: border-box; width: 200px; padding: 4px;
      border: 1px solid; font: 14px/20px monospace; resize: none; ${css} }`)
  const root = mount(`<form id="form">${html}</form>`)
  const props = signal<AutosizeProps>({})
  const made = createAutosize(props)
  const note = find<HTMLTextAreaElement>(root, "note")
  onTestFinished(bind(note, made.textarea))
  const tall = () => note.getBoundingClientRect().height
  return { root, note, props, made, tall }
}

const later = () => new Promise((resolve) => setTimeout(resolve, 30))

describe("a text area as tall as its text", () => {
  it("begins a line tall, and grows and shrinks as its text is typed", async () => {
    const { note, tall } = area()
    expect(tall()).toBe(30)
    await userEvent.click(note)
    await userEvent.keyboard("one{Enter}two{Enter}three")
    expect(tall()).toBe(70)
    await userEvent.keyboard("{Backspace>6}")
    expect(tall()).toBe(50)
  })

  it("is as tall as the text it is in the page with", () => {
    const { tall } = area("", `<textarea id="note" rows="1">one\ntwo\nthree\nfour</textarea>`)
    expect(tall()).toBe(90)
  })

  it("never beats the least and the most the design allows", async () => {
    const { note, tall } = area("min-height: 50px; max-height: 90px;")
    expect(tall()).toBe(50)
    await userEvent.click(note)
    await userEvent.keyboard("1{Enter}2{Enter}3{Enter}4{Enter}5{Enter}6")
    expect(tall()).toBe(90)
  })

  it("counts its padding and border whichever way its box is sized", async () => {
    const { note, tall } = area("box-sizing: content-box;")
    // Twenty of text, eight of padding, two of border.
    expect(tall()).toBe(30)
    await userEvent.click(note)
    await userEvent.keyboard("one{Enter}two")
    expect(tall()).toBe(50)
  })

  it("measures a text no key typed: a caller's value, or `update()`", async () => {
    const { note, props, made, tall } = area()
    note.value = "one\ntwo\nthree"
    expect(tall()).toBe(30)
    made.update()
    expect(tall()).toBe(70)
    note.value = "one"
    props.set({ value: "one" })
    await later()
    expect(tall()).toBe(30)
  })

  it("wraps again when it is made narrower, and goes back with its form's reset", async () => {
    const { root, note, tall } = area()
    await userEvent.click(note)
    await userEvent.keyboard("a line that is long enough to wrap once")
    const wide = tall()
    note.style.width = "100px"
    await later()
    await later()
    expect(tall()).toBeGreaterThan(wide)
    find<HTMLFormElement>(root, "form").reset()
    await later()
    expect(tall()).toBe(30)
  })

  it("leaves no height behind when it is let go", () => {
    style(`#note { height: 44px; }`)
    const root = mount(`<textarea id="note"></textarea>`)
    const made = createAutosize(signal<AutosizeProps>({}))
    const note = find(root, "note")
    const stop = bind(note, made.textarea)
    expect(note.style.height).not.toBe("")
    stop()
    expect(note.style.height).toBe("")
  })
})
