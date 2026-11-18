import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { createAgent } from "../../packages/core/src/agent.ts"
import { createAutocomplete } from "../../packages/core/src/autocomplete.ts"
import { bind } from "../../packages/core/src/bind.ts"
import { createCombobox } from "../../packages/core/src/combobox.ts"
import type {
  Combobox,
  ComboboxEntry,
  ComboboxItemEntry,
  ComboboxProps,
} from "../../packages/core/src/combobox.ts"
import { effect, signal, untracked } from "../../packages/core/src/reactivity.ts"
import type { ReadonlySignal } from "../../packages/core/src/reactivity.ts"
import { find, mount } from "./page.ts"

const PAGE = `
  <form id="form"><label for="input">Fruit</label><input id="input" />
  <button id="toggle" type="button">Open</button><button id="clear" type="button">Clear</button>
  <div id="status"></div></form>
  <div id="positioner"><div id="popup"></div></div>`
const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "apricot", label: "Apricot" },
  { value: "banana", label: "Banana" },
  { value: "blueberry", label: "Blueberry", disabled: true },
  { value: "cherry", label: "Cherry" },
]
const GROUPS = [
  { value: "Fruits", items: FRUITS.slice(0, 3) },
  { value: "Roots", items: [{ value: "beet", label: "Beet" }] },
]

const settled = () => new Promise<void>((resolve) => setTimeout(resolve))

/** A list drawn as an adapter's `Collection` draws one: an entry that stays keeps its element. */
function collection(
  made: Combobox<string>,
  into: HTMLElement,
  entries: ReadonlySignal<readonly ComboboxEntry<string>[]>
) {
  const drawn = new Map<string, { element: HTMLElement; stop: () => void }>()
  const item = (entry: ComboboxItemEntry<string>) => {
    const element = document.createElement("div")
    element.textContent = entry.label
    const stop = bind(
      element,
      made.item(entry.value, () => ({ id: `c-${entry.value}`, disabled: entry.disabled }))
    )
    return { element, stop }
  }
  const stop = effect(() => {
    const next = entries.get()
    untracked(() => {
      const kept = new Set(next.map((each) => each.key))
      for (const [key, each] of drawn) {
        if (kept.has(key)) continue
        each.stop()
        each.element.remove()
        drawn.delete(key)
      }
      next.forEach((entry, at) => {
        let own = drawn.get(entry.key)
        if (!own) {
          if (entry.type === "item") own = item(entry)
          else {
            const element = document.createElement("section")
            element.dataset.group = entry.value
            own = { element, stop: collection(made, element, made.entries(entry)) }
          }
          drawn.set(entry.key, own)
        }
        if (into.children[at] !== own.element) into.insertBefore(own.element, into.children[at]!)
      })
    })
  })
  return () => {
    stop()
    for (const each of drawn.values()) {
      each.stop()
      each.element.remove()
    }
  }
}

function combobox(given: Partial<ComboboxProps<string>> = {}) {
  const root = mount(PAGE)
  const heard: (string | null)[] = []
  const props = signal<ComboboxProps<string>>({
    id: "c",
    items: FRUITS,
    onValueChange: (value) => void heard.push(value),
    ...given,
  })
  const made = createCombobox(props)
  const popup = find(root, "popup")
  for (const stop of [
    made.mount(),
    bind(find(root, "input"), made.input),
    bind(find(root, "toggle"), made.trigger),
    bind(find(root, "clear"), made.clear),
    bind(find(root, "status"), made.status),
    bind(find(root, "positioner"), made.positioner),
    collection(made, popup, made.entries()),
    bind(popup, made.popup),
  ]) {
    onTestFinished(stop)
  }
  const input = find<HTMLInputElement>(root, "input")
  const options = () => [...popup.querySelectorAll<HTMLElement>('[role="option"]')]
  return { root, made, input, popup, heard, props, options }
}

describe("a combobox whose items are data", () => {
  it("gives every item while nothing is typed, each with a key of its own", () => {
    const { made } = combobox({
      items: [...FRUITS, { value: "apple", label: "Another apple" }],
    })
    const entries = made.entries().peek()
    expect(entries.map((each) => each.label)).toEqual([
      "Apple",
      "Apricot",
      "Banana",
      "Blueberry",
      "Cherry",
      "Another apple",
    ])
    expect(new Set(entries.map((each) => each.key)).size).toBe(6)
    expect(entries[3]).toMatchObject({ type: "item", value: "blueberry", disabled: true })
    expect((entries[0] as ComboboxItemEntry<string>).item).toBe(FRUITS[0])
  })

  it("filters them itself: what is left is what is in the page, and a kept item keeps its element", async () => {
    const { input, made, options } = combobox()
    input.focus()
    await userEvent.keyboard("a")
    await settled()
    const apricot = options().find((each) => each.textContent === "Apricot")
    await userEvent.keyboard("p")
    await settled()
    expect(
      made
        .entries()
        .peek()
        .map((each) => each.value)
    ).toEqual(["apple", "apricot"])
    expect(options().map((each) => each.textContent)).toEqual(["Apple", "Apricot"])
    // Not hidden: the ones that went are out of the page.
    expect(options().some((each) => each.hidden)).toBe(false)
    expect(options()[1]).toBe(apricot)
    expect(made.empty.peek()).toBe(false)
    await userEvent.keyboard("x")
    await settled()
    expect(options()).toEqual([])
    expect(made.empty.peek()).toBe(true)
    await userEvent.keyboard("{Backspace}")
    await settled()
    expect(made.empty.peek()).toBe(false)
  })

  it("says it is empty by its data, not by the items that were made", async () => {
    const { input, made } = combobox()
    // A render that was thrown away: an item made, and never put in the page.
    made.item("cherry", () => ({ id: "never" }))
    input.focus()
    await userEvent.keyboard("zz")
    await settled()
    expect(made.empty.peek()).toBe(true)
  })

  it("an item drawn from data does not hide itself, whatever its own text says", async () => {
    const { input, options } = combobox({
      items: [{ value: "de", label: "Deutschland (Germany)" }],
    })
    // The item says less than its label: the label is what was looked through.
    options()[0]!.textContent = "Deutschland"
    input.focus()
    await userEvent.keyboard("germ")
    await settled()
    expect(options().map((each) => each.hidden)).toEqual([false])
  })

  it("asked to, highlights the first item left once it is in the page", async () => {
    const { input, made } = combobox({ autoHighlight: true })
    input.focus()
    await userEvent.keyboard("b")
    await settled()
    expect(input.getAttribute("aria-activedescendant")).toBe("c-banana")
    await userEvent.keyboard("{Backspace}ch")
    await settled()
    expect(input.getAttribute("aria-activedescendant")).toBe("c-cherry")
    await userEvent.keyboard("{Enter}")
    await settled()
    expect(made.value.peek()).toBe("cherry")
    expect(input.value).toBe("Cherry")
  })

  it("filters as its caller says, and not at all for `null`", async () => {
    const { input, made, props } = combobox({ filter: (label, query) => label.startsWith(query) })
    input.focus()
    await userEvent.keyboard("B")
    await settled()
    expect(
      made
        .entries()
        .peek()
        .map((each) => each.value)
    ).toEqual(["banana", "blueberry"])
    // The caller gives what there is for what was typed: nothing is taken out of it.
    props.set({ ...props.peek(), filter: null, items: FRUITS.slice(0, 2) })
    await settled()
    expect(
      made
        .entries()
        .peek()
        .map((each) => each.value)
    ).toEqual(["apple", "apricot"])
  })

  it("keeps a group with its items left, and drops one with none", async () => {
    const { input, made, popup, options } = combobox({ items: GROUPS })
    expect(
      made
        .entries()
        .peek()
        .map((each) => each.type)
    ).toEqual(["group", "group"])
    const roots = made.entries().peek()[1]!
    input.focus()
    await userEvent.keyboard("ap")
    await settled()
    const left = made.entries().peek()
    expect(left.map((each) => each.label)).toEqual(["Fruits"])
    expect(
      made
        .entries(left[0])
        .peek()
        .map((each) => each.value)
    ).toEqual(["apple", "apricot"])
    expect(made.entries(roots).peek()).toEqual([])
    expect([...popup.querySelectorAll("section")].map((each) => each.dataset.group)).toEqual([
      "Fruits",
    ])
    expect(options().map((each) => each.textContent)).toEqual(["Apple", "Apricot"])
    // A value in a group is named from the data too.
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await settled()
    expect(made.value.peek()).toBe("apple")
    expect(input.value).toBe("Apple")
  })

  it("names a value in a group before the list has opened", () => {
    const { input } = combobox({ items: GROUPS, defaultValue: "beet" })
    expect(input.value).toBe("Beet")
  })

  it("names its value once the items that name it have come, and leaves a text that was typed", async () => {
    const { input, props } = combobox({ items: undefined, defaultValue: "beet" })
    expect(input.value).toBe("beet")
    props.set({ ...props.peek(), items: GROUPS })
    await settled()
    expect(input.value).toBe("Beet")
    input.focus()
    await userEvent.keyboard("s")
    props.set({ ...props.peek(), items: FRUITS })
    await settled()
    expect(input.value).toBe("Beets")
  })

  it("leaves items written in the markup to filter themselves", async () => {
    const root = mount(PAGE)
    const made = createCombobox(signal<ComboboxProps<string>>({ id: "c", items: FRUITS }))
    const popup = find(root, "popup")
    // `items` only names the values: nothing asked for the entries.
    for (const each of FRUITS) {
      const element = document.createElement("div")
      element.textContent = each.label
      popup.append(element)
      onTestFinished(
        bind(
          element,
          made.item(each.value, () => ({ id: `c-${each.value}` }))
        )
      )
    }
    onTestFinished(made.mount())
    onTestFinished(bind(find(root, "input"), made.input))
    onTestFinished(bind(find(root, "positioner"), made.positioner))
    onTestFinished(bind(popup, made.popup))
    find(root, "input").focus()
    await userEvent.keyboard("ch")
    await settled()
    const options = [...popup.querySelectorAll<HTMLElement>('[role="option"]')]
    expect(options).toHaveLength(5)
    expect(options.filter((each) => !each.hidden).map((each) => each.textContent)).toEqual([
      "Cherry",
    ])
  })
})

describe("an autocomplete whose suggestions are data", () => {
  it("filters them by its text, and writes the one chosen into the input", async () => {
    const root = mount(PAGE)
    const made = createAutocomplete(
      signal({ id: "c", items: FRUITS, autoHighlight: true })
    ) as Combobox<string>
    const popup = find(root, "popup")
    const input = find<HTMLInputElement>(root, "input")
    for (const stop of [
      made.mount(),
      bind(input, made.input),
      bind(find(root, "positioner"), made.positioner),
      collection(made, popup, made.entries()),
      bind(popup, made.popup),
    ]) {
      onTestFinished(stop)
    }
    input.focus()
    await userEvent.keyboard("ch")
    await settled()
    expect(
      made
        .entries()
        .peek()
        .map((each) => each.value)
    ).toEqual(["cherry"])
    await userEvent.keyboard("{Enter}")
    await settled()
    expect(input.value).toBe("Cherry")
  })
})

describe("a combobox that is only to be read", () => {
  it("says so, keeps focus, and submits its value", () => {
    const { input, root, made } = combobox({ readOnly: true, defaultValue: "banana", name: "f" })
    expect(input.readOnly).toBe(true)
    expect(input.getAttribute("aria-readonly")).toBe("true")
    expect(input.hasAttribute("data-readonly")).toBe(true)
    expect(input.getAttribute("aria-autocomplete")).toBe("none")
    expect(input.disabled).toBe(false)
    const toggle = find<HTMLButtonElement>(root, "toggle")
    expect(toggle.hasAttribute("data-readonly")).toBe(true)
    expect(toggle.disabled).toBe(false)
    // Beside an input the button is not the combobox: the input says it.
    expect(toggle.hasAttribute("aria-readonly")).toBe(false)
    expect(made.hidden.props.peek()).toMatchObject({ name: "f", value: "banana" })
    expect(made.hidden.props.peek().disabled).toBeUndefined()
  })

  it("opens and is gone through, and neither Enter nor a press chooses", async () => {
    const { input, root, made, heard, popup, options } = combobox({
      readOnly: true,
      defaultValue: "banana",
    })
    let sent = 0
    find(root, "form").addEventListener("submit", (event) => {
      event.preventDefault()
      sent++
    })
    input.focus()
    await userEvent.keyboard("{ArrowDown}")
    await settled()
    expect(made.open.peek()).toBe(true)
    expect(popup.getAttribute("aria-readonly")).toBe("true")
    // On the chosen item, every item shown; the arrows move through them.
    expect(input.getAttribute("aria-activedescendant")).toBe("c-banana")
    await userEvent.keyboard("{ArrowUp}")
    expect(input.getAttribute("aria-activedescendant")).toBe("c-apricot")
    // Enter on an item chooses nothing, and is not the form's.
    await userEvent.keyboard("{Enter}")
    options()[0]!.click()
    await settled()
    expect(made.open.peek()).toBe(true)
    expect(made.value.peek()).toBe("banana")
    expect(sent).toBe(0)
    await userEvent.keyboard("{Escape}")
    await settled()
    expect(made.open.peek()).toBe(false)
    expect(input.value).toBe("Banana")
    // Its button opens it too, and a press on the input.
    await userEvent.click(find(root, "toggle"))
    await settled()
    expect(made.open.peek()).toBe(true)
    await userEvent.click(find(root, "toggle"))
    await settled()
    await userEvent.click(input)
    await settled()
    expect(made.open.peek()).toBe(true)
    await userEvent.keyboard("{Escape}")
    await settled()
    expect(heard).toEqual([])
  })

  it("takes nothing typed, and its clear button does nothing", async () => {
    const { input, root, made, heard } = combobox({ readOnly: true, defaultValue: "banana" })
    input.focus()
    await userEvent.keyboard("x")
    await settled()
    // A read-only input takes no text: nothing was typed, so nothing opened.
    expect(made.open.peek()).toBe(false)
    expect(input.value).toBe("Banana")
    await userEvent.click(find(root, "clear"))
    // A script that writes the text is not taken either.
    input.value = "Cherry"
    input.dispatchEvent(new InputEvent("input", { bubbles: true }))
    await settled()
    expect(input.value).toBe("Banana")
    expect(made.value.peek()).toBe("banana")
    expect(heard).toEqual([])
  })

  it("refuses an item pressed in a list its caller holds open", async () => {
    const { made, options, heard } = combobox({ readOnly: true, open: true })
    await settled()
    options()[0]!.click()
    expect(made.value.peek()).toBe(null)
    expect(heard).toEqual([])
  })

  it("keeps its chips: Backspace and a chip's button take nothing away", async () => {
    const { input, made } = combobox({
      readOnly: true,
      multiple: true,
      defaultValues: ["apple", "cherry"],
    })
    const remove = document.createElement("button")
    input.after(remove)
    onTestFinished(() => remove.remove())
    onTestFinished(bind(remove, made.chipRemove("apple")))
    input.focus()
    await userEvent.keyboard("{Backspace}")
    remove.click()
    expect(made.values.peek()).toEqual(["apple", "cherry"])
  })

  it("is one again when it stops being read only", async () => {
    const { input, made, props } = combobox({ readOnly: true })
    props.set({ ...props.peek(), readOnly: false })
    await settled()
    expect(input.readOnly).toBe(false)
    input.focus()
    await userEvent.keyboard("ch")
    await settled()
    expect(made.open.peek()).toBe(true)
    expect(input.value).toBe("ch")
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await settled()
    expect(made.value.peek()).toBe("cherry")
  })

  it("offers an agent nothing it would refuse", async () => {
    const { root, props } = combobox({ readOnly: true, defaultValue: "banana" })
    const agent = createAgent({ root })
    const read = () => agent.snapshot().find((each) => each.component === "combobox")!
    expect(read()).toMatchObject({ value: "Banana", readOnly: true, actions: [] })
    const refused = await agent.act({
      steps: [{ ref: read().ref, action: "setValue", args: ["x"] }],
    })
    expect(refused.ok).toBe(false)
    expect(refused.error).toContain("read only")
    props.set({ ...props.peek(), readOnly: false })
    await settled()
    expect(read().actions).toEqual(["setValue", "clear", "choose"])
    expect(read().readOnly).toBeUndefined()
  })
})

describe("a combobox's status", () => {
  it("is a polite, whole status that stays in the page", () => {
    const { root } = combobox()
    const status = find(root, "status")
    expect(status.getAttribute("role")).toBe("status")
    expect(status.getAttribute("aria-live")).toBe("polite")
    expect(status.getAttribute("aria-atomic")).toBe("true")
  })

  it("coming into the page with its text, changes it once so that it is said, and puts it back", async () => {
    const root = mount(`<div id="status">3 results</div><div id="none"></div>`)
    const made = createCombobox(signal<ComboboxProps<string>>({ id: "c" }))
    const status = find(root, "status")
    const heard: string[] = []
    const observer = new MutationObserver(() => heard.push(status.textContent ?? ""))
    observer.observe(status, { characterData: true, subtree: true })
    onTestFinished(() => observer.disconnect())
    onTestFinished(bind(status, made.status))
    onTestFinished(bind(find(root, "none"), made.status))
    await settled()
    expect(heard).toEqual(["3 results⁠"])
    // What is seen is the same: the mark draws nothing.
    await new Promise((resolve) => setTimeout(resolve, 250))
    expect(status.textContent).toBe("3 results")
    // With no text there is nothing to say, and nothing is written.
    expect(find(root, "none").childNodes).toHaveLength(0)
  })

  it("leaves a text its caller has changed since", async () => {
    const root = mount(`<div id="status">Loading</div>`)
    const made = createCombobox(signal<ComboboxProps<string>>({ id: "c" }))
    const status = find(root, "status")
    const stop = bind(status, made.status)
    await settled()
    status.firstChild!.nodeValue = "3 results"
    stop()
    await new Promise((resolve) => setTimeout(resolve, 250))
    expect(status.textContent).toBe("3 results")
  })
})

describe("what a combobox's value part is given", () => {
  it("is the chosen value and its label, from the items or from the list", async () => {
    const { made, options, input } = combobox({ defaultValue: "banana" })
    expect(made.shown.peek()).toEqual({
      value: "banana",
      label: "Banana",
      values: ["banana"],
      labels: ["Banana"],
    })
    input.focus()
    await userEvent.keyboard("{ArrowDown}")
    await settled()
    options()[0]!.click()
    expect(made.shown.peek().label).toBe("Apple")
    made.setValue(null, { reason: "none" } as never)
    expect(made.shown.peek()).toEqual({ value: null, label: undefined, values: [], labels: [] })
  })

  it("with several values, is each of them in the order chosen", () => {
    const { made } = combobox({ multiple: true, defaultValues: ["cherry", "apple"] })
    expect(made.multiple).toBe(true)
    expect(made.shown.peek()).toEqual({
      value: null,
      label: "Cherry, Apple",
      values: ["cherry", "apple"],
      labels: ["Cherry", "Apple"],
    })
  })
})
