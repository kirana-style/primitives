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
    // As most of these tests type and press Enter: the tests of typing without it say so.
    autoHighlight: true,
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

  it("its clear button empties the value and the text, and focus is in the input", async () => {
    const { root, made, input, heard } = combobox({ defaultValue: "Banana" })
    const clear = document.createElement("button")
    clear.id = "clear"
    root.append(clear)
    onTestFinished(bind(clear, made.clear))
    expect(made.clearable.peek()).toBe(true)
    await userEvent.click(clear)
    expect(made.value.peek()).toBe(null)
    expect(input.value).toBe("")
    expect(focused()).toBe("input")
    expect(heard).toEqual([null])
    expect(made.clearable.peek()).toBe(false)
  })

  it("goes back to its first value when its form is reset", async () => {
    const { root, made, input } = combobox({ defaultValue: "Banana", name: "fruit" })
    input.focus()
    await userEvent.clear(input)
    await userEvent.keyboard("ch")
    await settled()
    await press("Enter")
    expect(made.value.peek()).toBe("Cherry")
    find<HTMLFormElement>(root, "form").reset()
    expect(made.value.peek()).toBe("Banana")
    expect(input.value).toBe("Banana")
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

  it("names its value from a record of items, before the list has ever been opened", async () => {
    const names = { Cherry: "Sour cherry", Apple: "Green apple" }
    const { input, root, made } = combobox({ items: names, defaultValue: "Cherry", name: "fruit" })
    expect(input.value).toBe("Sour cherry")
    // A value it does not name says itself, and an inherited key is not a label.
    expect(combobox({ items: names, defaultValue: "toString" }).input.value).toBe("toString")
    input.focus()
    await userEvent.clear(input)
    find<HTMLFormElement>(root, "form").reset()
    expect(made.value.peek()).toBe("Cherry")
    expect(input.value).toBe("Sour cherry")
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

describe("a combobox whose list is always in the page", () => {
  function palette() {
    const root = mount(`<input id="input" /><div id="list"></div>`)
    const heard: (string | null)[] = []
    const made = createCombobox(
      signal<ComboboxProps<string>>({
        id: "p",
        inline: true,
        autoHighlight: true,
        onValueChange: (value) => void heard.push(value),
      })
    )
    const host = find(root, "list")
    for (const each of ["New file", "Open", "Print"]) {
      const element = document.createElement("div")
      element.textContent = each
      host.append(element)
      onTestFinished(
        bind(
          element,
          made.item(each, () => ({ id: `p-${each.replace(" ", "-")}` }))
        )
      )
    }
    onTestFinished(bind(find(root, "input"), made.input))
    onTestFinished(bind(host, made.popup))
    const input = find<HTMLInputElement>(root, "input")
    const shown = () =>
      [...host.querySelectorAll<HTMLElement>('[role="option"]')]
        .filter((each) => !each.hidden)
        .map((each) => each.textContent)
    return { root, made, input, heard, shown }
  }

  it("is filtered as its input is typed in, and Enter tells the caller what was chosen", async () => {
    const { made, input, heard, shown } = palette()
    expect(made.mounted.peek()).toBe(true)
    expect(input.getAttribute("aria-expanded")).toBe("true")
    expect(input.getAttribute("aria-controls")).toBe("p-popup")
    input.focus()
    await userEvent.keyboard("p")
    await settled()
    expect(shown()).toEqual(["Open", "Print"])
    expect(input.getAttribute("aria-activedescendant")).toBe("p-Open")
    await press("ArrowDown")
    await press("Enter")
    expect(heard).toEqual(["Print"])
    // The input keeps what was typed: the caller decides what choosing does.
    expect(input.value).toBe("p")
    await press("Escape")
    expect(shown()).toEqual(["Open", "Print"])
  })
})

describe("a combobox of several values", () => {
  function several(given: Partial<ComboboxProps<string>> = {}) {
    const heard: string[][] = []
    const made = combobox({
      multiple: true,
      name: "fruit",
      onValuesChange: (next) => void heard.push(next),
      ...given,
    })
    const hidden = document.createElement("input")
    find(made.root, "form").append(hidden)
    onTestFinished(bind(hidden, made.made.hidden))
    const sent = () => new FormData(find<HTMLFormElement>(made.root, "form")).getAll("fruit")
    return { ...made, heard, sent }
  }

  it("adds what is chosen, keeps the list open, and empties what was typed", async () => {
    const { input, made, heard, sent, root } = several()
    input.focus()
    await userEvent.keyboard("ch")
    await settled()
    await press("Enter")
    expect(made.values.peek()).toEqual(["Cherry"])
    expect(made.open.peek()).toBe(true)
    expect(input.value).toBe("")
    await userEvent.keyboard("ap")
    await settled()
    await press("Enter")
    expect(made.values.peek()).toEqual(["Cherry", "Apple"])
    expect(heard).toEqual([["Cherry"], ["Cherry", "Apple"]])
    // Each chosen item says so; each value is sent.
    expect(root.querySelector("#c-Apple")!.getAttribute("aria-selected")).toBe("true")
    expect(root.querySelector("#c-Cherry")!.getAttribute("aria-selected")).toBe("true")
    expect(sent()).toEqual(["Cherry", "Apple"])
    // Chosen again, it is taken away.
    root.querySelector<HTMLElement>("#c-Cherry")!.click()
    expect(made.values.peek()).toEqual(["Apple"])
    expect(sent()).toEqual(["Apple"])
  })

  it("Backspace in an empty input takes the last value away, and not while there is text", async () => {
    const { input, made } = several({ defaultValues: ["Apple", "Banana"] })
    input.focus()
    await userEvent.keyboard("x")
    await press("Backspace")
    expect(made.values.peek()).toEqual(["Apple", "Banana"])
    await press("Backspace")
    expect(made.values.peek()).toEqual(["Apple"])
    await press("Backspace")
    await press("Backspace")
    expect(made.values.peek()).toEqual([])
  })

  /** Chips drawn as an adapter draws them: one for each value, kept by value, before the input. */
  function withChips(given: Partial<ComboboxProps<string>> = {}) {
    const made = several(given)
    const chips = new Map<string, { element: HTMLElement; stop: () => void }>()
    const stop = effect(() => {
      const values = made.made.values.get()
      untracked(() => {
        for (const [value, each] of chips) {
          if (values.includes(value)) continue
          each.stop()
          each.element.remove()
          chips.delete(value)
        }
        for (const value of values) {
          if (chips.has(value)) continue
          const element = document.createElement("span")
          element.id = `chip-${value}`
          element.textContent = value
          made.input.before(element)
          chips.set(value, { element, stop: bind(element, made.made.chip(value)) })
        }
      })
    })
    onTestFinished(() => {
      stop()
      for (const each of chips.values()) each.stop()
    })
    return made
  }

  it("goes between its chips by the arrows, from the start of the input and back", async () => {
    const { input, made, root } = withChips({ defaultValues: ["Apple", "Banana", "Cherry"] })
    expect(find(root, "chip-Apple").getAttribute("tabindex")).toBe("-1")
    input.focus()
    await press("ArrowLeft")
    expect(focused()).toBe("chip-Cherry")
    await press("ArrowLeft")
    expect(focused()).toBe("chip-Banana")
    await press("Home")
    expect(focused()).toBe("chip-Apple")
    await press("ArrowLeft")
    expect(focused()).toBe("chip-Apple")
    await press("ArrowRight")
    await press("ArrowRight")
    expect(focused()).toBe("chip-Cherry")
    // Forward from the last chip is the input.
    await press("ArrowRight")
    expect(focused()).toBe("input")
    // With text before the caret the arrow is the input's own.
    await userEvent.keyboard("ch")
    await settled()
    expect(made.open.peek()).toBe(true)
    await press("ArrowLeft")
    expect(focused()).toBe("input")
    expect(input.selectionStart).toBe(1)
    await press("ArrowLeft")
    await press("ArrowLeft")
    expect(focused()).toBe("chip-Cherry")
    // The list closed as focus went to the chip; what was typed stays.
    expect(made.open.peek()).toBe(false)
    expect(input.value).toBe("ch")
    expect(made.values.peek()).toEqual(["Apple", "Banana", "Cherry"])
  })

  it("Backspace in the empty input goes onto the last chip, and on a chip takes it away", async () => {
    const { input, made, sent } = withChips({ defaultValues: ["Apple", "Banana", "Cherry"] })
    input.focus()
    await press("Backspace")
    // Seen before it goes: nothing is taken away yet.
    expect(focused()).toBe("chip-Cherry")
    expect(made.values.peek()).toEqual(["Apple", "Banana", "Cherry"])
    await press("Backspace")
    expect(made.values.peek()).toEqual(["Apple", "Banana"])
    expect(sent()).toEqual(["Apple", "Banana"])
    // Focus is on the chip that takes its place: the one before.
    expect(focused()).toBe("chip-Banana")
    await press("ArrowLeft")
    await press("Delete")
    // Delete takes the one after.
    expect(made.values.peek()).toEqual(["Banana"])
    expect(focused()).toBe("chip-Banana")
    await press("Backspace")
    expect(made.values.peek()).toEqual([])
    expect(focused()).toBe("input")
  })

  it("read only, its chips are gone through and none is taken away", async () => {
    const { input, made } = withChips({ defaultValues: ["Apple", "Banana"], readOnly: true })
    input.focus()
    await press("Backspace")
    expect(focused()).toBe("chip-Banana")
    await press("Backspace")
    await press("Delete")
    expect(made.values.peek()).toEqual(["Apple", "Banana"])
    // Down from a chip is the input, with the list open to be read.
    await press("ArrowDown")
    expect(focused()).toBe("input")
    expect(made.open.peek()).toBe(true)
  })

  it("goes back onto its chips by the arrow that points back in the reading direction", async () => {
    const { input, root } = withChips({ defaultValues: ["Apple", "Banana"] })
    root.dir = "rtl"
    input.focus()
    await press("ArrowLeft")
    expect(focused()).toBe("input")
    await press("ArrowRight")
    expect(focused()).toBe("chip-Banana")
    await press("ArrowRight")
    expect(focused()).toBe("chip-Apple")
    await press("ArrowLeft")
    await press("ArrowLeft")
    expect(focused()).toBe("input")
  })

  it("a letter typed on a chip goes into the input", async () => {
    const { input } = withChips({ defaultValues: ["Apple"] })
    input.focus()
    await press("ArrowLeft")
    expect(focused()).toBe("chip-Apple")
    await userEvent.keyboard("b")
    expect(focused()).toBe("input")
    expect(input.value).toBe("b")
  })

  it("a chip's button takes its value away and leaves focus in the input", async () => {
    const { root, made, sent } = several({ defaultValues: ["Apple", "Banana", "Cherry"] })
    const remove = document.createElement("button")
    remove.id = "remove"
    root.append(remove)
    onTestFinished(bind(remove, made.chipRemove("Banana")))
    await userEvent.click(remove)
    expect(made.values.peek()).toEqual(["Apple", "Cherry"])
    expect(focused()).toBe("input")
    expect(sent()).toEqual(["Apple", "Cherry"])
    expect(remove.getAttribute("tabindex")).toBe("-1")
  })

  it("sends nothing with nothing chosen, clears all at once, and goes back on reset", async () => {
    const { root, input, made, sent } = several({ defaultValues: ["Apple"] })
    const clear = document.createElement("button")
    root.append(clear)
    onTestFinished(bind(clear, made.clear))
    clear.click()
    expect(made.values.peek()).toEqual([])
    expect(sent()).toEqual([])
    expect(made.clearable.peek()).toBe(false)
    input.focus()
    await userEvent.keyboard("ban")
    await settled()
    await press("Enter")
    expect(sent()).toEqual(["Banana"])
    find<HTMLFormElement>(root, "form").reset()
    expect(made.values.peek()).toEqual(["Apple"])
    // Left without choosing, the text is not a value: it goes.
    await userEvent.keyboard("zz")
    await press("Escape")
    expect(input.value).toBe("")
  })
})

describe("what a combobox highlights as one types", () => {
  it("highlights nothing unless asked to: Enter chooses once an arrow has gone to an item", async () => {
    const { input, made, shown } = combobox({ autoHighlight: false })
    input.focus()
    await userEvent.keyboard("ch")
    await settled()
    expect(made.open.peek()).toBe(true)
    expect(shown()).toEqual(["Cherry"])
    expect(input.hasAttribute("aria-activedescendant")).toBe(false)
    // Nothing to choose: the list stays, and so does what was typed.
    await press("Enter")
    expect(made.value.peek()).toBe(null)
    expect(made.open.peek()).toBe(true)
    expect(input.value).toBe("ch")
    await press("ArrowDown")
    expect(input.getAttribute("aria-activedescendant")).toBe("c-Cherry")
    await press("Enter")
    expect(made.value.peek()).toBe("Cherry")
    expect(made.open.peek()).toBe(false)
  })

  it("is off unless it is given, and a list opened with nothing typed is still on its chosen item", async () => {
    const root = mount(PAGE)
    const made = createCombobox(signal<ComboboxProps<string>>({ id: "d", defaultValue: "Banana" }))
    const input = find<HTMLInputElement>(root, "input")
    const popup = document.createElement("div")
    for (const fruit of FRUITS) {
      const element = document.createElement("div")
      element.textContent = fruit
      popup.append(element)
      onTestFinished(
        bind(
          element,
          made.item(fruit, () => ({ id: `d-${fruit}` }))
        )
      )
    }
    root.append(popup)
    onTestFinished(bind(input, made.input))
    onTestFinished(bind(popup, made.popup))
    onTestFinished(made.mount())
    input.focus()
    await press("ArrowDown")
    await settled()
    expect(input.getAttribute("aria-activedescendant")).toBe("d-Banana")
    await press("Escape")
    await settled()
    // Typed at, nothing is highlighted: not the first shown, and not the chosen one.
    await userEvent.keyboard("{Backspace}")
    await settled()
    expect(made.open.peek()).toBe(true)
    expect(input.value).toBe("Banan")
    expect(input.hasAttribute("aria-activedescendant")).toBe(false)
  })

  it("asked to, keeps the first shown item highlighted as the text changes", async () => {
    const { input } = combobox({ autoHighlight: true })
    input.focus()
    await userEvent.keyboard("a")
    await settled()
    expect(input.getAttribute("aria-activedescendant")).toBe("c-Apple")
    await userEvent.keyboard("pr")
    await settled()
    expect(input.getAttribute("aria-activedescendant")).toBe("c-Apricot")
  })
})

/** A combobox as an adapter draws one whose popup holds more than items: its own markup. */
function drawn(html: string, given: Partial<ComboboxProps<string>> = {}) {
  const root = mount(html)
  const reasons: string[] = []
  const made = createCombobox(
    signal<ComboboxProps<string>>({
      id: "c",
      onOpenChange: (_open, by) => void reasons.push(by.reason),
      ...given,
    })
  )
  const box = (element: Element) => element.getBoundingClientRect()
  return { root, made, reasons, box }
}

describe("where a combobox's list is placed", () => {
  // The chips' box is 300 wide, and its input starts 120 into it.
  const CHIPS = `
    <div id="chips" style="position: fixed; left: 40px; top: 60px; width: 300px; height: 30px; box-sizing: border-box; padding-left: 120px">
      <input id="input" style="width: 100px; box-sizing: border-box" />
    </div>
    <div id="other" style="position: fixed; left: 20px; top: 200px; width: 150px; height: 20px"></div>
    <div id="positioner"><div id="popup" style="height: 40px; min-width: var(--anchor-width)"></div></div>`

  function chips(withBox: boolean) {
    const made = drawn(CHIPS, { multiple: true, defaultOpen: true })
    const { root } = made
    const positioner = find(root, "positioner")
    // Found before it is bound: the part gives it an id of its own.
    const popup = find(root, "popup")
    if (withBox) onTestFinished(bind(find(root, "chips"), made.made.chips))
    onTestFinished(bind(find(root, "input"), made.made.input))
    onTestFinished(bind(positioner, made.made.positioner))
    onTestFinished(bind(popup, made.made.popup))
    onTestFinished(made.made.mount())
    const placed = () =>
      expect.poll(() => positioner.style.getPropertyValue("--anchor-width")).not.toBe("")
    return { ...made, positioner, popup, placed }
  }

  it("is under the chips' box and as wide, when its input is in one", async () => {
    const { popup, positioner, placed, box } = chips(true)
    await placed()
    expect(positioner.style.getPropertyValue("--anchor-width")).toBe("300px")
    expect(box(positioner).left).toBe(40)
    expect(box(positioner).top).toBe(90)
    expect(box(popup).width).toBe(300)
  })

  it("is under the input when there is no box", async () => {
    const { root, positioner, placed, box } = chips(false)
    await placed()
    expect(positioner.style.getPropertyValue("--anchor-width")).toBe("100px")
    expect(box(positioner).left).toBe(box(find(root, "input")).left)
  })

  it("is against the anchor its positioner names, before the box", async () => {
    const { root, made, positioner, placed, box } = chips(true)
    await placed()
    made.positioning.set({ anchor: find(root, "other") })
    await expect.poll(() => positioner.style.getPropertyValue("--anchor-width")).toBe("150px")
    expect(box(positioner).left).toBe(20)
    expect(box(positioner).top).toBe(220)
    // Named no more, it is under the box again.
    made.positioning.set({})
    await expect.poll(() => positioner.style.getPropertyValue("--anchor-width")).toBe("300px")
    expect(box(positioner).top).toBe(90)
  })
})

describe("a combobox whose input is inside its popup", () => {
  const PAGE_INSIDE = `
    <button id="before" type="button">Before</button>
    <button id="toggle" type="button" style="position: fixed; left: 40px; top: 60px; width: 160px; height: 30px; padding: 0; border: 0">Pick</button>
    <button id="after" type="button" style="position: fixed; left: 300px; top: 400px">After</button>`

  /** The popup is drawn while the combobox is mounted, as a portal draws it: at the page's end. */
  function inside(given: Partial<ComboboxProps<string>> = {}) {
    const made = drawn(PAGE_INSIDE, given)
    const { root } = made
    const toggle = find(root, "toggle")
    let undo: (() => void)[] = []
    let positioner: HTMLElement | undefined
    const stops = [
      bind(toggle, made.made.trigger),
      effect(() => {
        const mounted = made.made.mounted.get()
        untracked(() => {
          if (mounted && !positioner) {
            if (given.presentation) {
              const backdrop = document.createElement("div")
              backdrop.id = "backdrop"
              root.append(backdrop)
              undo.push(bind(backdrop, made.made.backdrop), () => backdrop.remove())
            }
            positioner = document.createElement("div")
            positioner.id = "positioner"
            // A design's usual lines: as wide as its anchor at least, the input as wide as it.
            positioner.innerHTML = `<div class="popup" style="min-width: var(--anchor-width); width: max-content">
              <input id="search" style="width: 100%; box-sizing: border-box" />
              <div class="list"></div></div>`
            root.append(positioner)
            const list = positioner.querySelector<HTMLElement>(".list")!
            for (const fruit of FRUITS) {
              const element = document.createElement("div")
              element.textContent = fruit
              list.append(element)
              undo.push(
                bind(
                  element,
                  made.made.item(fruit, () => ({ id: `c-${fruit}` }))
                )
              )
            }
            // Children before what holds them, as some frameworks hand them over.
            undo.push(
              bind(find(positioner, "search"), made.made.input),
              bind(list, made.made.list),
              bind(positioner.querySelector<HTMLElement>(".popup")!, made.made.popup),
              bind(positioner, made.made.positioner)
            )
          } else if (!mounted && positioner) {
            for (const each of undo.reverse()) each()
            undo = []
            positioner.remove()
            positioner = undefined
          }
        })
      }),
      made.made.mount(),
    ]
    onTestFinished(() => {
      for (const each of undo.reverse()) each()
      for (const stop of stops.reverse()) stop()
      positioner?.remove()
    })
    const placed = () =>
      expect
        .poll(() => find(root, "positioner").style.getPropertyValue("--anchor-width"))
        .not.toBe("")
    return { ...made, toggle, placed }
  }

  it("as a sheet, is not placed, keeps focus in its input with the page inert, and closes by a swipe or its backdrop", async () => {
    const { root, made, toggle, reasons } = inside({ presentation: "sheet" })
    toggle.click()
    await settled()
    await settled()
    const positioner = find(root, "positioner")
    const popup = positioner.querySelector<HTMLElement>(".popup")!
    const backdrop = find(root, "backdrop")
    for (const each of [positioner, popup, backdrop]) {
      expect(each.getAttribute("data-presentation")).toBe("sheet")
    }
    expect(positioner.getAttribute("style")).toBe(null)
    expect(positioner.hasAttribute("data-side")).toBe(false)
    expect(focused()).toBe("search")
    expect(find(root, "before").hasAttribute("inert")).toBe(true)
    backdrop.dispatchEvent(
      new PointerEvent("pointerdown", { button: 0, bubbles: true, cancelable: true })
    )
    expect(made.open.peek()).toBe(false)
    await expect.poll(() => find(root, "before").hasAttribute("inert")).toBe(false)
    toggle.click()
    await settled()
    await settled()
    // Dragged down from a row, far enough: it closes, and the row is not chosen.
    const row = find(root, "c-Banana")
    const box = row.getBoundingClientRect()
    const at = (type: string, dy: number, on: EventTarget) =>
      on.dispatchEvent(
        new PointerEvent(type, {
          clientX: box.left + 5,
          clientY: box.top + 5 + dy,
          button: 0,
          pointerId: 3,
          pointerType: "touch",
          bubbles: true,
          cancelable: true,
        })
      )
    at("pointerdown", 0, row)
    for (const dy of [20, 60, 120, 200]) {
      at("pointermove", dy, document)
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    await new Promise((resolve) => setTimeout(resolve, 120))
    at("pointerup", 200, document)
    row.click()
    expect(made.open.peek()).toBe(false)
    expect(made.value.peek()).toBe(null)
    expect(reasons.slice(-1)).toEqual(["swipe"])
  })

  it("has its button as the combobox: a stop for Tab that says what it opens", async () => {
    const { toggle } = inside()
    await settled()
    expect(toggle.getAttribute("role")).toBe("combobox")
    expect(toggle.hasAttribute("tabindex")).toBe(false)
    expect(toggle.getAttribute("aria-haspopup")).toBe("dialog")
    expect(toggle.getAttribute("aria-expanded")).toBe("false")
    expect(toggle.hasAttribute("aria-controls")).toBe(false)
  })

  it("leaves a button beside an input as it was: for a pointer, and not a stop", async () => {
    const { root } = combobox()
    await settled()
    const toggle = find(root, "toggle")
    expect(toggle.getAttribute("tabindex")).toBe("-1")
    expect(toggle.hasAttribute("role")).toBe(false)
    expect(toggle.getAttribute("aria-haspopup")).toBe("listbox")
    expect(toggle.hasAttribute("aria-expanded")).toBe(false)
  })

  it("is placed against its button, gives its input focus, and stays a sane width", async () => {
    const { root, toggle, placed, box } = inside()
    await settled()
    await userEvent.click(toggle)
    await settled()
    await placed()
    const positioner = find(root, "positioner")
    const popup = root.querySelector<HTMLElement>(".popup")!
    // Against the button, not against the input it holds.
    expect(positioner.style.getPropertyValue("--anchor-width")).toBe("160px")
    expect(box(positioner).left).toBe(40)
    expect(box(positioner).top).toBe(90)
    // As wide as its content, and its button at least: not as wide as an input that is as
    // wide as it is.
    expect(box(popup).width).toBeGreaterThanOrEqual(160)
    expect(box(popup).width).toBeLessThan(400)
    expect(focused()).toBe("search")
    // What each part says of the others.
    expect(toggle.getAttribute("aria-expanded")).toBe("true")
    expect(toggle.getAttribute("aria-controls")).toBe("c-popup")
    expect(popup.getAttribute("role")).toBe("dialog")
    expect(root.querySelector(".list")!.getAttribute("role")).toBe("listbox")
    const search = find<HTMLInputElement>(root, "search")
    expect(search.getAttribute("role")).toBe("combobox")
    expect(search.getAttribute("aria-controls")).toBe("c-list")
  })

  it("gives focus back to its button on Escape, and on a press outside", async () => {
    const { made, toggle, reasons, root } = inside()
    await settled()
    await userEvent.click(toggle)
    await settled()
    expect(focused()).toBe("search")
    await press("Escape")
    await settled()
    expect(made.open.peek()).toBe(false)
    expect(focused()).toBe("toggle")
    await press("ArrowDown")
    await settled()
    expect(made.open.peek()).toBe(true)
    expect(focused()).toBe("search")
    find(root, "before").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))
    await settled()
    expect(made.open.peek()).toBe(false)
    expect(focused()).toBe("toggle")
    expect(reasons).toEqual(["trigger-press", "escape-key", "list-navigation", "outside-press"])
  })

  it("Tab from its input goes on from its button, as from a dialog that closes", async () => {
    const { made, toggle } = inside()
    await settled()
    await userEvent.click(toggle)
    await settled()
    expect(focused()).toBe("search")
    // The popup is at the page's end: Tab would leave the page from there.
    await userEvent.tab()
    await settled()
    expect(made.open.peek()).toBe(false)
    expect(focused()).toBe("after")
    await userEvent.click(toggle)
    await settled()
    await userEvent.tab({ shift: true })
    await settled()
    expect(made.open.peek()).toBe(false)
    expect(focused()).toBe("before")
  })

  it("keeps focus where a person took it", async () => {
    const { made, toggle, root } = inside()
    await settled()
    await userEvent.click(toggle)
    await settled()
    // Focus leaves for another control: the popup closes, and does not take it back.
    find(root, "after").focus()
    await settled()
    expect(made.open.peek()).toBe(false)
    expect(focused()).toBe("after")
  })

  it("chooses with its input's text only what is looked for: empty before, empty after", async () => {
    const { made, toggle, root } = inside({ defaultValue: "Banana", autoHighlight: true })
    await settled()
    await userEvent.click(toggle)
    await settled()
    const search = () => find<HTMLInputElement>(root, "search")
    // The chosen value is the button's to show: the input starts empty, on the chosen item.
    expect(search().value).toBe("")
    expect(search().getAttribute("aria-activedescendant")).toBe("c-Banana")
    await userEvent.keyboard("ch")
    await settled()
    expect(search().getAttribute("aria-activedescendant")).toBe("c-Cherry")
    // Emptied, the value stays: the text was never it.
    await userEvent.keyboard("{Backspace}{Backspace}")
    await settled()
    expect(made.value.peek()).toBe("Banana")
    await userEvent.keyboard("ch")
    await settled()
    await press("Enter")
    await settled()
    expect(made.value.peek()).toBe("Cherry")
    expect(made.open.peek()).toBe(false)
    expect(focused()).toBe("toggle")
    await userEvent.click(toggle)
    await settled()
    expect(search().value).toBe("")
    // A press on the input is the input's: it keeps focus and its caret.
    await userEvent.click(search())
    expect(focused()).toBe("search")
    expect(made.open.peek()).toBe(true)
  })
})

describe("a combobox whose values are objects", () => {
  interface City {
    code: string
    name: string
  }
  const CITIES: City[] = [
    { code: "osl", name: "Oslo" },
    { code: "osa", name: "Osaka" },
    { code: "par", name: "Paris" },
  ]

  /** Items that draw no text of their own (a flag each), and a hidden input in a form. */
  function cities(given: Partial<ComboboxProps<City>>) {
    const root = mount(
      `<form id="form"><input id="input" /><input id="hidden" /></form>
       <div id="positioner"><div id="popup">${CITIES.map(
         (each) => `<div id="o-${each.code}"><span class="flag"></span></div>`
       ).join("")}</div></div>`
    )
    const made = createCombobox(
      signal<ComboboxProps<City>>({ id: "o", name: "city", autoHighlight: true, ...given })
    )
    onTestFinished(made.mount())
    onTestFinished(bind(find(root, "input"), made.input))
    onTestFinished(bind(find(root, "hidden"), made.hidden))
    onTestFinished(bind(find(root, "positioner"), made.positioner))
    onTestFinished(bind(find(root, "popup"), made.popup))
    for (const each of CITIES) {
      onTestFinished(
        bind(
          find(root, `o-${each.code}`),
          made.item(each, () => ({ id: `o-${each.code}` }))
        )
      )
    }
    const sent = () => new FormData(find<HTMLFormElement>(root, "form")).getAll("city")
    const shown = () =>
      [...root.querySelectorAll<HTMLElement>('[role="option"]')]
        .filter((each) => !each.hidden)
        .map((each) => each.id)
    return { root, made, sent, shown, input: find<HTMLInputElement>(root, "input") }
  }

  it("shows, filters by and sends what itemToStringLabel and itemToStringValue make of them", async () => {
    const { input, made, sent, shown } = cities({
      defaultValue: CITIES[2],
      itemToStringLabel: (city) => city.name,
      itemToStringValue: (city) => city.code,
    })
    expect(input.value).toBe("Paris")
    expect(sent()).toEqual(["par"])
    input.focus()
    input.select()
    await userEvent.keyboard("osa")
    await settled()
    expect(shown()).toEqual(["o-osa"])
    await press("Enter")
    expect(made.value.peek()).toBe(CITIES[1])
    expect(input.value).toBe("Osaka")
    expect(sent()).toEqual(["osa"])
  })

  it("with several values, sends each by itemToStringValue", async () => {
    const { sent, made } = cities({
      multiple: true,
      defaultValues: [CITIES[0]!, CITIES[2]!],
      itemToStringLabel: (city) => city.name,
      itemToStringValue: (city) => city.code,
    })
    expect(sent()).toEqual(["osl", "par"])
    expect(made.shown.peek().labels).toEqual(["Oslo", "Paris"])
  })

  it("with nothing given, names an object shaped { value, label } by its label and sends its value", () => {
    const tea = { value: "tea", label: "Green tea" }
    const { input, sent } = cities({ defaultValue: tea as unknown as City })
    expect(input.value).toBe("Green tea")
    expect(sent()).toEqual(["tea"])
  })
})
