import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { createAutocomplete } from "../../packages/core/src/autocomplete.ts"
import type { AutocompleteProps } from "../../packages/core/src/autocomplete.ts"
import { bind } from "../../packages/core/src/bind.ts"
import { effect, signal, untracked } from "../../packages/core/src/reactivity.ts"
import { find, mount } from "./page.ts"

const settled = () => new Promise<void>((resolve) => setTimeout(resolve))

function autocomplete(given: Partial<AutocompleteProps> = {}) {
  const root = mount(
    `<form id="form"><input id="input" /></form><div id="positioner"><div id="list"></div></div>`
  )
  const heard: string[] = []
  const reasons: string[] = []
  let sent = 0
  const props = signal<AutocompleteProps>({
    id: "a",
    name: "city",
    onValueChange: (value, by) => void heard.push(`${value} ${by.reason}`),
    onOpenChange: (open, by) => void reasons.push(`${open ? "open" : "close"}: ${by.reason}`),
    ...given,
  })
  const made = createAutocomplete(props)
  const input = find<HTMLInputElement>(root, "input")
  const list = find(root, "list")
  const form = find<HTMLFormElement>(root, "form")
  form.addEventListener("submit", (event) => {
    event.preventDefault()
    sent++
  })
  for (const each of ["Oslo", "Osaka", "Paris"]) {
    const element = document.createElement("div")
    element.textContent = each
    list.append(element)
    onTestFinished(
      bind(
        element,
        made.item(each, () => ({ id: `a-${each}` }))
      )
    )
  }
  onTestFinished(made.mount())
  onTestFinished(bind(input, made.input))
  onTestFinished(bind(find(root, "positioner"), made.positioner))
  onTestFinished(bind(list, made.popup))
  const shown = () =>
    [...list.querySelectorAll<HTMLElement>('[role="option"]')]
      .filter((each) => !each.hidden)
      .map((each) => each.textContent)
  const press = async (key: string) => {
    await userEvent.keyboard(`{${key}}`)
    await settled()
  }
  return { made, input, list, form, heard, reasons, shown, press, sent: () => sent, props }
}

describe("an autocomplete", () => {
  it("is an input of its form: its text is its value", () => {
    const { input, made } = autocomplete({ defaultValue: "Rome" })
    expect(input.name).toBe("city")
    expect(input.value).toBe("Rome")
    expect(made.named.peek()).toBe(false)
    expect(input.getAttribute("role")).toBe("combobox")
  })

  it("suggests for what is typed, and takes none of it until asked", async () => {
    const { input, made, shown, press, sent } = autocomplete()
    input.focus()
    await userEvent.keyboard("os")
    await settled()
    expect(made.open.peek()).toBe(true)
    expect(shown()).toEqual(["Oslo", "Osaka"])
    // No suggestion is on: Enter is the form's, with the text as typed.
    expect(input.getAttribute("aria-activedescendant")).toBe(null)
    await press("Enter")
    expect(sent()).toBe(1)
    expect(input.value).toBe("os")
    expect(made.open.peek()).toBe(false)
  })

  it("writes a suggestion into the input when it is chosen, and keeps nothing chosen", async () => {
    const { input, made, heard, press, sent, list } = autocomplete()
    input.focus()
    await userEvent.keyboard("os")
    await settled()
    await press("ArrowDown")
    await press("ArrowDown")
    expect(input.getAttribute("aria-activedescendant")).toBe("a-Osaka")
    await press("Enter")
    expect(input.value).toBe("Osaka")
    expect(heard.at(-1)).toBe("Osaka item-press")
    expect(made.open.peek()).toBe(false)
    expect(sent()).toBe(0)
    expect(made.value.peek()).toBe(null)
    expect(list.querySelector('[aria-selected="true"]')).toBe(null)
  })

  it("keeps what was typed when the list closes", async () => {
    const { input, made, press } = autocomplete()
    input.focus()
    await userEvent.keyboard("par")
    await settled()
    await press("Escape")
    expect(made.open.peek()).toBe(false)
    expect(input.value).toBe("par")
  })

  it("opens for a press on its input only when asked", async () => {
    const first = autocomplete()
    await userEvent.click(first.input)
    expect(first.made.open.peek()).toBe(false)
    const second = autocomplete({ openOnInputClick: true })
    await userEvent.click(second.input)
    expect(second.made.open.peek()).toBe(true)
  })

  it("shows every suggestion when it is not to filter", async () => {
    const { input, shown } = autocomplete({ mode: "none" })
    input.focus()
    await userEvent.keyboard("zz")
    await settled()
    expect(shown()).toEqual(["Oslo", "Osaka", "Paris"])
  })

  it("says its text in its part, so a server draws it", () => {
    const made = createAutocomplete(signal<AutocompleteProps>({ id: "a", defaultValue: "Rome" }))
    // No element, no page: what a server reads.
    expect(made.input.props.peek().value).toBe("Rome")
  })

  it("hides a group while none of its suggestions is shown, and lets a label stand alone", async () => {
    const { made, input, list } = autocomplete()
    const group = made.group("a-far")
    const element = document.createElement("div")
    const label = document.createElement("div")
    const item = document.createElement("div")
    item.textContent = "Lima"
    element.append(label, item)
    list.append(element)
    onTestFinished(bind(element, group.root))
    onTestFinished(bind(label, group.label))
    onTestFinished(
      bind(
        item,
        made.item("Lima", () => ({ id: "a-Lima" }), group)
      )
    )
    const lone = document.createElement("div")
    list.append(lone)
    onTestFinished(bind(lone, made.groupLabel))
    expect(element.getAttribute("role")).toBe("group")
    expect(element.getAttribute("aria-labelledby")).toBe("a-far-label")
    expect(lone.getAttribute("role")).toBe("presentation")
    expect(element.hidden).toBe(false)
    input.focus()
    await userEvent.keyboard("os")
    await settled()
    expect(element.hidden).toBe(true)
    await userEvent.keyboard("{Backspace}{Backspace}li")
    await settled()
    expect(element.hidden).toBe(false)
  })

  it("goes back to the text it began with when its form is reset", async () => {
    const { input, form, made } = autocomplete({ defaultValue: "Rome" })
    input.focus()
    await userEvent.keyboard("{Control>}a{/Control}Par")
    await settled()
    form.reset()
    await settled()
    expect(made.inputValue.peek()).toBe("Rome")
    expect(input.value).toBe("Rome")
  })

  it("asked to, highlights the first suggestion as one types, and Enter takes it", async () => {
    const { input, made, press, sent } = autocomplete({ autoHighlight: true })
    input.focus()
    await userEvent.keyboard("os")
    await settled()
    expect(input.getAttribute("aria-activedescendant")).toBe("a-Oslo")
    await userEvent.keyboard("a")
    await settled()
    expect(input.getAttribute("aria-activedescendant")).toBe("a-Osaka")
    await press("Enter")
    expect(input.value).toBe("Osaka")
    expect(made.open.peek()).toBe(false)
    expect(sent()).toBe(0)
  })
})

describe("an autocomplete that completes in its input", () => {
  const selected = (input: HTMLInputElement) =>
    input.value.slice(input.selectionStart ?? 0, input.selectionEnd ?? 0)

  it("writes the rest of the first suggestion after what is typed, selected, and Enter takes it", async () => {
    const { input, made, heard, shown, press, sent } = autocomplete({ mode: "both" })
    expect(input.getAttribute("aria-autocomplete")).toBe("both")
    input.focus()
    await userEvent.keyboard("o")
    await settled()
    expect(input.value).toBe("oslo")
    expect(selected(input)).toBe("slo")
    expect(input.getAttribute("aria-activedescendant")).toBe("a-Oslo")
    // The text is what was typed: the list is filtered by it, and the caller hears it.
    expect(made.inputValue.peek()).toBe("o")
    expect(heard.at(-1)).toBe("o input-change")
    expect(shown()).toEqual(["Oslo", "Osaka"])
    // Typing on replaces the completion with the next.
    await userEvent.keyboard("sa")
    await settled()
    expect(input.value).toBe("osaka")
    expect(selected(input)).toBe("ka")
    expect(input.getAttribute("aria-activedescendant")).toBe("a-Osaka")
    await press("Enter")
    expect(input.value).toBe("Osaka")
    expect(made.inputValue.peek()).toBe("Osaka")
    expect(input.selectionStart).toBe(5)
    expect(made.open.peek()).toBe(false)
    expect(sent()).toBe(0)
  })

  it("does not complete again what Backspace took away", async () => {
    const { input, made } = autocomplete({ mode: "both" })
    input.focus()
    await userEvent.keyboard("osa")
    await settled()
    expect(input.value).toBe("osaka")
    await userEvent.keyboard("{Backspace}")
    await settled()
    expect(input.value).toBe("osa")
    await userEvent.keyboard("{Backspace}")
    await settled()
    expect(input.value).toBe("os")
    expect(made.inputValue.peek()).toBe("os")
    // A letter typed again completes again.
    await userEvent.keyboard("l")
    await settled()
    expect(input.value).toBe("oslo")
  })

  it("Tab keeps the completion, Escape takes it away", async () => {
    const first = autocomplete({ mode: "both" })
    first.input.focus()
    await userEvent.keyboard("pa")
    await settled()
    await userEvent.keyboard("{Escape}")
    await settled()
    expect(first.input.value).toBe("pa")
    expect(first.made.inputValue.peek()).toBe("pa")
    await userEvent.keyboard("r")
    await settled()
    expect(first.input.value).toBe("paris")
    await userEvent.tab()
    await settled()
    expect(first.input.value).toBe("paris")
    expect(first.made.inputValue.peek()).toBe("paris")
    expect(first.heard.at(-1)).toBe("paris input-blur")
  })

  it("does not complete into a word an input method is composing", async () => {
    const { input } = autocomplete({ mode: "both" })
    input.focus()
    input.value = "o"
    input.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertCompositionText",
        isComposing: true,
        data: "o",
      })
    )
    await settled()
    expect(input.value).toBe("o")
    expect(input.getAttribute("aria-activedescendant")).toBe(null)
  })

  it("with `inline`, completes and shows every suggestion", async () => {
    const { input, shown } = autocomplete({ mode: "inline" })
    expect(input.getAttribute("aria-autocomplete")).toBe("inline")
    input.focus()
    await userEvent.keyboard("p")
    await settled()
    expect(input.value).toBe("paris")
    expect(shown()).toEqual(["Oslo", "Osaka", "Paris"])
  })

  it("writes the suggestion the arrows go to into the input, and filters by what was typed", async () => {
    const { input, made, shown, press } = autocomplete({ mode: "both" })
    input.focus()
    await userEvent.keyboard("o")
    await settled()
    await press("ArrowDown")
    expect(input.getAttribute("aria-activedescendant")).toBe("a-Osaka")
    expect(input.value).toBe("Osaka")
    expect(made.inputValue.peek()).toBe("o")
    expect(shown()).toEqual(["Oslo", "Osaka"])
    await press("Enter")
    expect(made.inputValue.peek()).toBe("Osaka")
  })

  it("completes for a caller who holds the text and answers later", async () => {
    const held = signal("")
    const { input, props } = autocomplete({ mode: "both" })
    props.set({
      ...props.peek(),
      value: held.peek(),
      onValueChange: (next) => void setTimeout(() => held.set(next)),
    })
    onTestFinished(
      effect(() => {
        const value = held.get()
        untracked(() => props.set({ ...props.peek(), value }))
      })
    )
    input.focus()
    // A key at a time: each answer comes before the next key, as a person types.
    await userEvent.keyboard("o")
    await settled()
    await userEvent.keyboard("s")
    await settled()
    expect(input.value).toBe("oslo")
    expect(selected(input)).toBe("lo")
    expect(input.getAttribute("aria-activedescendant")).toBe("a-Oslo")
  })

  it("read only, completes nothing", async () => {
    const { input } = autocomplete({ mode: "both", readOnly: true })
    expect(input.getAttribute("aria-autocomplete")).toBe("none")
  })
})
