import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createCombobox } from "../../packages/core/src/combobox.ts"
import type { ComboboxProps } from "../../packages/core/src/combobox.ts"
import { effect, signal, untracked } from "../../packages/core/src/reactivity.ts"
import { find, focused, mount } from "./page.ts"

const PAGE = `
  <form id="form"><button id="before" type="button">Before</button>
  <input id="input" /><button id="toggle" type="button">Open</button></form>
  <button id="after">After</button>`
const FRUITS = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry"]

/** A combobox drawn as an adapter draws one, in plain DOM: its list while it is `mounted`. */
function combobox(given: Partial<ComboboxProps<string>> = {}) {
  const root = mount(PAGE)
  const heard: (string | null)[] = []
  const reasons: string[] = []
  const props = signal<ComboboxProps<string>>({
    id: "c",
    onValueChange: (value) => void heard.push(value),
    onOpenChange: (_open, by) => void reasons.push(by.reason),
    ...given,
  })
  const made = createCombobox(props)
  const stops = [bind(find(root, "input"), made.input), bind(find(root, "toggle"), made.trigger)]
  let positioner: HTMLElement | undefined
  let undo: (() => void)[] = []
  stops.push(
    effect(() => {
      const mounted = made.mounted.get()
      untracked(() => {
        if (mounted && !positioner) {
          positioner = document.createElement("div")
          const popup = document.createElement("div")
          positioner.append(popup)
          for (const fruit of FRUITS) {
            const element = document.createElement("div")
            element.textContent = fruit
            popup.append(element)
            undo.push(
              bind(
                element,
                made.item(fruit, () => ({ id: `c-${fruit}`, disabled: fruit === "Blueberry" }))
              )
            )
          }
          root.append(positioner)
          undo.push(bind(positioner, made.positioner), bind(popup, made.popup))
        } else if (!mounted && positioner) {
          for (const each of undo.reverse()) each()
          undo = []
          positioner.remove()
          positioner = undefined
        }
      })
    }),
    made.mount()
  )
  onTestFinished(() => {
    for (const each of undo.reverse()) each()
    for (const stop of stops.reverse()) stop()
    positioner?.remove()
  })
  const input = find<HTMLInputElement>(root, "input")
  const shown = () =>
    [...root.querySelectorAll<HTMLElement>('[role="option"]')]
      .filter((each) => !each.hidden)
      .map((each) => each.textContent)
  return {
    root,
    made,
    input,
    heard,
    reasons,
    shown,
    props,
    set: (next: ComboboxProps<string>) => props.set(next),
  }
}

const press = (key: string) => userEvent.keyboard(key.length === 1 ? key : `{${key}}`)
const settled = () => new Promise((resolve) => setTimeout(resolve))

describe("a combobox", () => {
  it("filters its list by what is typed, with focus staying in the input", async () => {
    const { input, made, shown } = combobox()
    expect(input.getAttribute("role")).toBe("combobox")
    expect(input.getAttribute("aria-expanded")).toBe("false")
    input.focus()
    await userEvent.keyboard("ap")
    await settled()
    expect(made.open.peek()).toBe(true)
    expect(shown()).toEqual(["Apple", "Apricot"])
    expect(focused()).toBe("input")
    // The first shown item is highlighted, and the input names it.
    expect(input.getAttribute("aria-activedescendant")).toBe("c-Apple")
    expect(input.getAttribute("aria-controls")).toBe("c-popup")
    await press("ArrowDown")
    expect(input.getAttribute("aria-activedescendant")).toBe("c-Apricot")
    await press("ArrowDown")
    // Past the end it stays; the filtered and the disabled are not stops.
    expect(input.getAttribute("aria-activedescendant")).toBe("c-Apricot")
    await userEvent.keyboard("x")
    expect(shown()).toEqual([])
    expect(made.empty.peek()).toBe(true)
    expect(input.hasAttribute("aria-activedescendant")).toBe(false)
  })

  it("Enter chooses the highlighted item: the value, the input's text, and closed", async () => {
    const { input, made, heard, reasons } = combobox()
    input.focus()
    await userEvent.keyboard("ch")
    await settled()
    await press("Enter")
    expect(made.value.peek()).toBe("Cherry")
    expect(input.value).toBe("Cherry")
    expect(made.open.peek()).toBe(false)
    expect(heard).toEqual(["Cherry"])
    expect(reasons).toEqual(["input-change", "item-press"])
    expect(focused()).toBe("input")
  })

  it("opens on every item when nothing was typed, on the chosen one", async () => {
    const { input, shown, root } = combobox({ defaultValue: "Banana" })
    expect(input.value).toBe("Banana")
    input.focus()
    await press("ArrowDown")
    await settled()
    expect(shown()).toEqual(FRUITS)
    expect(input.getAttribute("aria-activedescendant")).toBe("c-Banana")
    expect(root.querySelector("#c-Banana")!.getAttribute("aria-selected")).toBe("true")
    await press("ArrowDown")
    // Blueberry is disabled.
    expect(input.getAttribute("aria-activedescendant")).toBe("c-Cherry")
  })

  it("left without choosing, the input says what is chosen again", async () => {
    const { input, made, reasons } = combobox({ defaultValue: "Banana" })
    input.focus()
    await userEvent.keyboard("{Backspace}{Backspace}")
    await settled()
    expect(input.value).toBe("Bana")
    await press("Escape")
    expect(made.open.peek()).toBe(false)
    expect(input.value).toBe("Banana")
    expect(made.value.peek()).toBe("Banana")
    expect(reasons).toEqual(["input-change", "escape-key"])
  })

  it("emptied, nothing is chosen", async () => {
    const { input, made, heard } = combobox({ defaultValue: "Banana" })
    input.focus()
    await userEvent.clear(input)
    expect(made.value.peek()).toBe(null)
    expect(heard).toEqual([null])
    await press("Escape")
    expect(input.value).toBe("")
  })

  it("a press on an item chooses it without taking focus from the input", async () => {
    const { input, made, root } = combobox()
    await userEvent.click(input)
    await settled()
    expect(made.open.peek()).toBe(true)
    await userEvent.click(root.querySelector<HTMLElement>("#c-Apricot")!)
    expect(made.value.peek()).toBe("Apricot")
    expect(input.value).toBe("Apricot")
    expect(focused()).toBe("input")
    // A disabled item is not chosen.
    await userEvent.click(input)
    await settled()
    root.querySelector<HTMLElement>("#c-Blueberry")!.click()
    expect(made.value.peek()).toBe("Apricot")
  })

  it("its button opens and closes the list, and focus is in the input", async () => {
    const { root, made, reasons } = combobox()
    await userEvent.click(find(root, "toggle"))
    expect(made.open.peek()).toBe(true)
    expect(focused()).toBe("input")
    await userEvent.click(find(root, "toggle"))
    expect(made.open.peek()).toBe(false)
    expect(reasons).toEqual(["trigger-press", "trigger-press"])
  })

  it("closes when focus leaves it", async () => {
    const { input, made, reasons } = combobox()
    input.focus()
    await press("ArrowDown")
    await settled()
    await press("Tab")
    expect(made.open.peek()).toBe(false)
    expect(reasons.at(-1)).toBe("focus-out")
  })

  it("a caller who holds the text and answers later: the highlight follows what is shown", async () => {
    let answer: (() => void) | undefined
    // Held by the caller, as a framework's bound value is: given back a moment later.
    const held = combobox({
      inputValue: "",
      onInputValueChange: (next) =>
        void (answer = () => held.set({ ...held.props.peek(), inputValue: next })),
    })
    held.input.focus()
    await userEvent.keyboard("ap")
    answer!()
    await settled()
    expect(held.shown()).toEqual(["Apple", "Apricot"])
    expect(held.input.getAttribute("aria-activedescendant")).toBe("c-Apple")
    await userEvent.keyboard("x")
    // Asked for, not yet given: the list still shows what the caller has.
    expect(held.shown()).toEqual(["Apple", "Apricot"])
    answer!()
    await settled()
    expect(held.shown()).toEqual([])
    expect(held.input.hasAttribute("aria-activedescendant")).toBe(false)
    // Enter with nothing highlighted chooses nothing, and is not the form's while it is open.
    await press("Enter")
    expect(held.made.value.peek()).toBe(null)
  })

  it("filters as its caller says, or not at all", async () => {
    const starts = combobox({ filter: (label, query) => label.startsWith(query) })
    starts.input.focus()
    await userEvent.keyboard("B")
    await settled()
    expect(starts.shown()).toEqual(["Banana", "Blueberry"])
    await press("Escape")
    const all = combobox({ filter: null })
    all.input.focus()
    await userEvent.keyboard("zz")
    await settled()
    expect(all.shown()).toEqual(FRUITS)
  })

  it("a caller who holds the value and answers later still sees the text it chose", async () => {
    const held = signal<string | null>("Banana")
    const { input, made } = combobox({
      value: "Banana",
      onValueChange: (next) => held.set(next),
    })
    input.focus()
    await userEvent.clear(input)
    await userEvent.keyboard("ch")
    await settled()
    await press("Enter")
    // The core has not been given the new value yet: the input says what was chosen.
    expect(made.value.peek()).toBe("Banana")
    expect(held.peek()).toBe("Cherry")
    expect(input.value).toBe("Cherry")
  })
})
