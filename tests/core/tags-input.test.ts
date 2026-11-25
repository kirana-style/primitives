import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { effect, signal, untracked } from "../../packages/core/src/reactivity.ts"
import { createTagsInput } from "../../packages/core/src/tags-input.ts"
import type { TagsInputProps } from "../../packages/core/src/tags-input.ts"
import { recorder } from "../../packages/core/src/testing.ts"
import { mount } from "./page.ts"

/** A paste carrying `data`. An engine may not let a made event read what it was made with. */
function pasting(data: DataTransfer): Event {
  const event = new Event("paste", { bubbles: true, cancelable: true })
  Object.defineProperty(event, "clipboardData", { value: data })
  return event
}

/** Tags drawn as an adapter draws them: an element per entry, kept by its key. */
function tags(given: Partial<TagsInputProps> = {}, dir = "ltr") {
  const root = mount(`
    <form><div class="root" dir="${dir}"><div class="list"></div>
      <input class="input" /><button class="clear">Clear</button><input class="hidden" />
    </div><button type="reset">Reset</button></form>`)
  const changed = recorder<string[]>()
  const refused: [string, string][] = []
  const made = createTagsInput(
    signal<TagsInputProps>({
      id: "tg",
      name: "tags",
      defaultValue: ["red", "green"],
      onValueChange: changed.listen,
      onValueInvalid: (text, why) => void refused.push([text, why]),
      ...given,
    })
  )
  const find = <T extends HTMLElement = HTMLElement>(name: string) => root.querySelector<T>(name)!
  onTestFinished(bind(find(".root"), made.root))
  onTestFinished(bind(find(".list"), made.list))
  onTestFinished(bind(find(".input"), made.input))
  onTestFinished(bind(find(".clear"), made.clear))
  onTestFinished(bind(find(".hidden"), made.hiddenInput))
  const drawn = new Map<string, { element: HTMLElement; stop: () => void }>()
  onTestFinished(
    effect(() => {
      const entries = made.entries.get()
      untracked(() => {
        for (const [key, each] of drawn) {
          if (entries.some((entry) => entry.key === key)) continue
          each.stop()
          each.element.remove()
          drawn.delete(key)
        }
        for (const entry of entries) {
          let each = drawn.get(entry.key)
          if (!each) {
            const element = document.createElement("span")
            element.className = "item"
            element.innerHTML = `<span class="text">${entry.value}</span><input class="edit" /><button class="remove">x</button>`
            const stops = [
              bind(element, made.item(entry.key)),
              bind(element.querySelector<HTMLElement>(".text")!, made.itemText(entry.key)),
              bind(element.querySelector<HTMLElement>(".edit")!, made.itemInput(entry.key)),
              bind(element.querySelector<HTMLElement>(".remove")!, made.itemRemove(entry.key)),
            ]
            each = { element, stop: () => stops.forEach((stop) => stop()) }
            drawn.set(entry.key, each)
          }
          find(".list").append(each.element)
        }
      })
    })
  )
  const input = find<HTMLInputElement>(".input")
  const items = () => [...root.querySelectorAll<HTMLElement>(".item")]
  const key = (name: string, on: Element = document.activeElement ?? input) =>
    on.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }))
  const type = (text: string) => {
    input.focus()
    input.value = text
    input.dispatchEvent(new InputEvent("input", { bubbles: true }))
  }
  const sent = () => [...new FormData(root.querySelector("form")!).getAll("tags")]
  return { root, made, find, input, items, key, type, changed, refused, sent }
}

describe("a tags input", () => {
  it("is a list of tags, each sent to a form under the one name", () => {
    const { find, items, sent } = tags()
    expect(find(".list").getAttribute("role")).toBe("list")
    expect(items().map((each) => each.getAttribute("role"))).toEqual(["listitem", "listitem"])
    expect(
      items().map((each) => each.querySelector(".remove")!.getAttribute("aria-label"))
    ).toEqual(["Remove red", "Remove green"])
    expect(sent()).toEqual(["red", "green"])
    expect(find(".clear").hidden).toBe(false)
  })

  it("makes what is typed a tag with Enter, trimmed, and keeps Enter from the form", () => {
    const { input, key, type, made, changed } = tags()
    type("  blue ")
    const enter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })
    input.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(made.value.peek()).toEqual(["red", "green", "blue"])
    expect(input.value).toBe("")
    expect(changed.calls.at(-1)).toMatchObject({ reason: "enter-key", source: "keyboard" })
    // With nothing typed, Enter is the form's.
    const empty = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })
    input.dispatchEvent(empty)
    expect(empty.defaultPrevented).toBe(false)
    void key
  })

  it("ends a tag at a delimiter as it is typed, and cuts a pasted text into tags", () => {
    const { input, type, made } = tags({ defaultValue: [] })
    type("one,tw")
    expect(made.value.peek()).toEqual(["one"])
    expect(input.value).toBe("tw")
    const data = new DataTransfer()
    data.setData("text", "three, four\nfive")
    const paste = pasting(data)
    input.dispatchEvent(paste)
    expect(paste.defaultPrevented).toBe(true)
    expect(made.value.peek()).toEqual(["one", "three", "four", "five"])
    // One text with nothing to cut it at is the browser's to paste.
    const plain = new DataTransfer()
    plain.setData("text", "six")
    const one = pasting(plain)
    input.dispatchEvent(one)
    expect(one.defaultPrevented).toBe(false)
  })

  it("refuses a twin, one too many and what its caller says is no tag, and says why", () => {
    const { type, key, made, refused, input } = tags({
      max: 3,
      validate: (text) => text !== "no",
    })
    type("red")
    key("Enter")
    type("no")
    key("Enter")
    type("blue")
    key("Enter")
    type("pink")
    key("Enter")
    expect(made.value.peek()).toEqual(["red", "green", "blue"])
    expect(refused).toEqual([
      ["red", "duplicate"],
      ["no", "invalid"],
      ["pink", "max"],
    ])
    // What was refused is left in the input to be mended.
    expect(input.value).toBe("pink")
  })

  it("goes back onto the last tag from the start of the input, and takes a tag away from there", () => {
    const { input, items, key, made } = tags({ defaultValue: ["red", "green", "blue"] })
    input.focus()
    key("Backspace")
    expect(made.value.peek()).toHaveLength(3)
    expect(document.activeElement).toBe(items()[2])
    key("ArrowLeft")
    expect(document.activeElement).toBe(items()[1])
    key("Backspace")
    expect(made.value.peek()).toEqual(["red", "blue"])
    expect(document.activeElement!.textContent).toContain("red")
    key("Delete")
    expect(made.value.peek()).toEqual(["blue"])
    expect(document.activeElement!.textContent).toContain("blue")
    key("ArrowRight")
    expect(document.activeElement).toBe(input)
  })

  it("moves the other way where the text reads the other way", () => {
    const { input, items, key } = tags({}, "rtl")
    input.focus()
    key("ArrowRight")
    expect(document.activeElement).toBe(items()[1])
    key("ArrowRight")
    expect(document.activeElement).toBe(items()[0])
    key("ArrowLeft")
    key("ArrowLeft")
    expect(document.activeElement).toBe(input)
  })

  it("edits a tag in place: Enter keeps it, Escape drops it, emptied it is taken away", () => {
    const { items, key, made } = tags()
    const first = () => items()[0]!
    first().focus()
    key("Enter")
    const field = first().querySelector<HTMLInputElement>(".edit")!
    expect(document.activeElement).toBe(field)
    expect(first().querySelector<HTMLElement>(".text")!.hidden).toBe(true)
    field.value = "crimson"
    key("Enter", field)
    expect(made.value.peek()).toEqual(["crimson", "green"])
    first().dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 2 }))
    const again = first().querySelector<HTMLInputElement>(".edit")!
    again.value = "nothing"
    key("Escape", again)
    expect(made.value.peek()).toEqual(["crimson", "green"])
    first().focus()
    key("F2")
    const last = first().querySelector<HTMLInputElement>(".edit")!
    last.value = " "
    key("Enter", last)
    expect(made.value.peek()).toEqual(["green"])
  })

  it("takes a tag away by its button and all of them by Clear, with focus in the input", () => {
    const { items, find, input, made, sent } = tags()
    items()[0]!.querySelector<HTMLButtonElement>(".remove")!.click()
    expect(made.value.peek()).toEqual(["green"])
    expect(document.activeElement).toBe(input)
    find<HTMLButtonElement>(".clear").click()
    expect(made.value.peek()).toEqual([])
    expect(find(".clear").hidden).toBe(true)
    expect(find(".root").hasAttribute("data-empty")).toBe(true)
    expect(sent()).toEqual([])
  })

  it("changes nothing while disabled or read only, may be refused, and resets with its form", () => {
    for (const off of [{ disabled: true }, { readOnly: true }]) {
      const fixed = tags(off)
      fixed.type("blue")
      fixed.key("Enter", fixed.input)
      fixed.items()[0]!.querySelector<HTMLButtonElement>(".remove")!.click()
      expect(fixed.made.value.peek()).toEqual(["red", "green"])
    }
    const refused = tags({ onValueChange: (_value, by) => by.cancel() })
    refused.type("blue")
    refused.key("Enter", refused.input)
    expect(refused.made.value.peek()).toEqual(["red", "green"])
    expect(refused.input.value).toBe("blue")
    const { type, key, root, made, input } = tags()
    type("blue")
    key("Enter", input)
    root.querySelector<HTMLButtonElement>("[type=reset]")!.click()
    expect(made.value.peek()).toEqual(["red", "green"])
  })

  it("makes what is typed a tag as focus leaves, where it is told to", () => {
    const { type, find, made } = tags({ addOnBlur: true })
    type("blue")
    find<HTMLButtonElement>("[type=reset]").focus()
    expect(made.value.peek()).toEqual(["red", "green", "blue"])
  })
})
