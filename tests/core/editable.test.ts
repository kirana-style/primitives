import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { createEditable } from "../../packages/core/src/editable.ts"
import type { EditableProps } from "../../packages/core/src/editable.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { recorder } from "../../packages/core/src/testing.ts"
import { mount } from "./page.ts"

function editable(given: Partial<EditableProps> = {}, tag = "input") {
  const root = mount(`
    <button class="before">Before</button>
    <form><div class="root">
      <span class="preview"></span><${tag} class="input"></${tag}>
      <button class="edit">Edit</button><button class="save">Save</button><button class="drop">Cancel</button>
    </div><button type="reset">Reset</button></form>`)
  const kept = recorder<string>()
  const toggled = recorder<boolean>()
  const made = createEditable(
    signal<EditableProps>({
      id: "ed",
      defaultValue: "Apollo",
      name: "title",
      onValueChange: kept.listen,
      onEditingChange: toggled.listen,
      ...given,
    })
  )
  const find = <T extends HTMLElement = HTMLElement>(name: string) => root.querySelector<T>(name)!
  onTestFinished(bind(find(".root"), made.root))
  onTestFinished(bind(find(".preview"), made.preview))
  onTestFinished(bind(find(".input"), made.input))
  onTestFinished(bind(find(".edit"), made.editTrigger))
  onTestFinished(bind(find(".save"), made.submitTrigger))
  onTestFinished(bind(find(".drop"), made.cancelTrigger))
  const input = find<HTMLInputElement>(".input")
  const key = (name: string, more: KeyboardEventInit = {}) =>
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true, ...more })
    )
  return { root, made, find, input, kept, toggled, key }
}

describe("an editable text", () => {
  it("reads as text, with its input and the edit's buttons hidden", () => {
    const { find, input, made } = editable()
    expect(made.text.peek()).toBe("Apollo")
    expect(find(".preview").hidden).toBe(false)
    expect(find(".preview").getAttribute("tabindex")).toBe("0")
    expect(input.hidden).toBe(true)
    // What a form reads while nothing is edited.
    expect(input.value).toBe("Apollo")
    expect(input.name).toBe("title")
    expect([find(".edit").hidden, find(".save").hidden, find(".drop").hidden]).toEqual([
      false,
      true,
      true,
    ])
  })

  it("is edited as focus reaches it, with its text selected, and kept with Enter", () => {
    const { find, input, key, kept, toggled, made } = editable()
    find(".preview").focus()
    expect(document.activeElement).toBe(input)
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 6])
    expect(find(".root").hasAttribute("data-editing")).toBe(true)
    expect(find(".preview").hidden).toBe(true)
    expect(toggled.calls.at(-1)).toMatchObject({ value: true, reason: "focus" })
    input.value = "Atlas"
    key("Enter")
    expect(kept.calls.at(-1)).toMatchObject({
      value: "Atlas",
      reason: "enter-key",
      source: "keyboard",
    })
    expect(made.value.peek()).toBe("Atlas")
    expect(made.editing.peek()).toBe(false)
    // Focus is back where the edit began, and that starts no second edit.
    expect(document.activeElement).toBe(find(".edit"))
  })

  it("drops what was typed with Escape, and gives focus back to the preview where there is no trigger", () => {
    const { find, input, key, kept, made } = editable()
    find(".edit").remove()
    // As an adapter would: the part is gone with its element.
    find(".preview").focus()
    input.value = "Atlas"
    key("Escape")
    expect(kept.calls).toHaveLength(0)
    expect(made.value.peek()).toBe("Apollo")
    expect(input.value).toBe("Apollo")
    expect(made.editing.peek()).toBe(false)
  })

  it("keeps the edit as focus leaves, or drops it where it is told to, and leaves focus where it went", () => {
    const leaving = editable()
    leaving.find(".preview").focus()
    leaving.input.value = "Atlas"
    leaving.find(".before").focus()
    expect(leaving.made.value.peek()).toBe("Atlas")
    expect(leaving.kept.calls.at(-1)!.reason).toBe("blur")
    expect(document.activeElement).toBe(leaving.find(".before"))
    const dropping = editable({ submitOnBlur: false })
    dropping.find(".preview").focus()
    dropping.input.value = "Atlas"
    dropping.find(".before").focus()
    expect(dropping.made.value.peek()).toBe("Apollo")
  })

  it("starts by a press, by two, or by its trigger alone", () => {
    const click = editable({ activation: "click" })
    expect(click.find(".preview").hasAttribute("tabindex")).toBe(false)
    click.find(".preview").focus()
    expect(click.made.editing.peek()).toBe(false)
    click.find(".preview").dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }))
    expect(click.made.editing.peek()).toBe(true)
    const twice = editable({ activation: "dblclick" })
    twice.find(".preview").dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }))
    expect(twice.made.editing.peek()).toBe(false)
    twice.find(".preview").dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 2 }))
    expect(twice.made.editing.peek()).toBe(true)
    const none = editable({ activation: "none" })
    none.find(".preview").dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 2 }))
    expect(none.made.editing.peek()).toBe(false)
    none.find<HTMLButtonElement>(".edit").click()
    expect(none.made.editing.peek()).toBe(true)
    expect(document.activeElement).toBe(none.input)
  })

  it("is kept and dropped by its buttons, which do not take focus from the input", () => {
    const { find, input, made } = editable({ activation: "none" })
    find<HTMLButtonElement>(".edit").click()
    input.value = "Atlas"
    const down = new PointerEvent("pointerdown", { bubbles: true, cancelable: true })
    find(".drop").dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    find<HTMLButtonElement>(".drop").click()
    expect(made.value.peek()).toBe("Apollo")
    find<HTMLButtonElement>(".edit").click()
    input.value = "Atlas"
    find<HTMLButtonElement>(".save").click()
    expect(made.value.peek()).toBe("Atlas")
  })

  it("stays open on what was typed when its caller refuses the text", () => {
    const { find, input, key, made } = editable({
      onValueChange: (value, by) => {
        if (value === "") by.cancel()
      },
    })
    find(".preview").focus()
    input.value = ""
    key("Enter")
    expect(made.editing.peek()).toBe(true)
    expect(made.value.peek()).toBe("Apollo")
    input.value = "Atlas"
    key("Enter")
    expect(made.editing.peek()).toBe(false)
  })

  it("takes Enter as a new line in a text of several, and keeps the edit with Ctrl", () => {
    const { find, input, key, made } = editable({}, "textarea")
    find(".preview").focus()
    input.value = "Two\nlines"
    key("Enter")
    expect(made.editing.peek()).toBe(true)
    key("Enter", { ctrlKey: true })
    expect(made.value.peek()).toBe("Two\nlines")
  })

  it("shows its placeholder while empty, and is not edited when it cannot be", () => {
    const empty = editable({ defaultValue: "", placeholder: "Untitled" })
    expect(empty.made.text.peek()).toBe("Untitled")
    expect(empty.find(".preview").hasAttribute("data-placeholder")).toBe(true)
    for (const off of [{ disabled: true }, { readOnly: true }]) {
      const fixed = editable(off)
      fixed.find(".preview").focus()
      fixed.find<HTMLButtonElement>(".edit").click()
      expect(fixed.made.editing.peek()).toBe(false)
    }
  })

  it("goes back to the text it began with when its form is reset", () => {
    const { root, find, input, key, made } = editable()
    find(".preview").focus()
    input.value = "Atlas"
    key("Enter")
    root.querySelector<HTMLButtonElement>("[type=reset]")!.click()
    expect(made.value.peek()).toBe("Apollo")
  })
})
