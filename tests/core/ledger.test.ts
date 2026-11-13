import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { bindable } from "../../packages/core/src/bindable.ts"
import { createCheckbox } from "../../packages/core/src/checkbox.ts"
import type { CheckboxProps } from "../../packages/core/src/checkbox.ts"
import { createCollapsible } from "../../packages/core/src/collapsible.ts"
import type { CollapsibleProps } from "../../packages/core/src/collapsible.ts"
import { details } from "../../packages/core/src/part.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { createSelect } from "../../packages/core/src/select.ts"
import type { SelectProps } from "../../packages/core/src/select.ts"
import { isolate } from "../../packages/core/src/services/focus.ts"
import { pushLayer } from "../../packages/core/src/services/layers.ts"
import { textOf } from "../../packages/core/src/services/typeahead.ts"
import { find, mount } from "./page.ts"

/**
 * Faults met in other headless libraries, or noted by them, each held out of this one by a test
 * here when no service's own file is its place.
 */

describe("a default", () => {
  it("is read once: changing it later moves nothing", () => {
    const given = signal<{ value?: string; defaultValue: string }>({ defaultValue: "a" })
    const value = bindable({
      value: () => given.get().value,
      defaultValue: given.peek().defaultValue,
    })
    given.set({ defaultValue: "b" })
    expect(value.peek()).toBe("a")
  })

  it("does not open again a panel a person closed", () => {
    const props = signal<CollapsibleProps>({ id: "c", defaultOpen: true })
    const collapsible = createCollapsible(props)
    collapsible.setOpen(false, details("trigger-press"))
    // A caller that derives the default from state that changes.
    props.set({ id: "c", defaultOpen: false })
    props.set({ id: "c", defaultOpen: true })
    expect(collapsible.open.peek()).toBe(false)
  })
})

describe("a press outside a layer", () => {
  const PAGE = `<button id="outside">Outside</button><div id="layer"><button id="in">In</button></div>`
  const event = (type: string) => new PointerEvent(type, { bubbles: true })

  function layer(root: HTMLElement) {
    const heard: string[] = []
    onTestFinished(
      pushLayer({
        element: find(root, "layer"),
        kind: "popover",
        onOutsidePress: () => void heard.push("outside"),
      })
    )
    return heard
  }

  it("is decided where the press begins: inside, then let go outside, is not one", () => {
    const root = mount(PAGE)
    const heard = layer(root)
    // A drag that selects text, or a slider's thumb let go beyond the popup's edge.
    find(root, "in").dispatchEvent(event("pointerdown"))
    find(root, "outside").dispatchEvent(event("pointerup"))
    find(root, "outside").dispatchEvent(new MouseEvent("click", { bubbles: true }))
    expect(heard).toEqual([])
  })

  it("is one as soon as it begins outside, wherever it ends", () => {
    const root = mount(PAGE)
    const heard = layer(root)
    find(root, "outside").dispatchEvent(event("pointerdown"))
    find(root, "in").dispatchEvent(event("pointerup"))
    expect(heard).toEqual(["outside"])
  })
})

describe("two layers isolating at once", () => {
  const PAGE = `
    <header id="header">Header</header>
    <div id="first"><button>First</button></div>
    <div id="second"><button>Second</button></div>
    <div id="page-own" inert></div>`

  it("keeps the page inert until the last one lets go, whichever closes first", () => {
    const root = mount(PAGE)
    const inert = (id: string) => find(root, id).hasAttribute("inert")
    const first = isolate(find(root, "first"))
    const second = isolate(find(root, "second"))
    expect(inert("header")).toBe(true)
    expect(inert("first")).toBe(true)
    expect(inert("second")).toBe(false)
    // The one under closes first: the one on top still holds the page.
    first()
    expect(inert("header")).toBe(true)
    expect(inert("first")).toBe(true)
    second()
    expect(inert("header")).toBe(false)
    expect(inert("first")).toBe(false)
    expect(inert("page-own")).toBe(true)
  })

  it("lifts a layer that was in the page when the one under it opened, and puts it back", () => {
    const root = mount(PAGE)
    const inert = (id: string) => find(root, id).hasAttribute("inert")
    const first = isolate(find(root, "first"))
    expect(inert("second")).toBe(true)
    const second = isolate(find(root, "second"))
    expect(inert("second")).toBe(false)
    // The one on top closes: the one under holds the page again, the other layer with it.
    second()
    expect(inert("second")).toBe(true)
    expect(inert("first")).toBe(false)
    first()
    expect(inert("second")).toBe(false)
  })

  it("gives the page back once, however often a release is called", () => {
    const root = mount(PAGE)
    const inert = (id: string) => find(root, id).hasAttribute("inert")
    const first = isolate(find(root, "first"))
    const second = isolate(find(root, "second"))
    first()
    first()
    expect(inert("header")).toBe(true)
    second()
    expect(inert("header")).toBe(false)
  })
})

describe("an element's text", () => {
  it("leaves out what is hidden, and what is hidden from assistive technology", () => {
    const root = mount(`
      <span id="row">
        Copy <kbd aria-hidden="true">⌘C</kbd><span hidden>draft</span>
        <b>link</b>
      </span>`)
    expect(textOf(find(root, "row"))).toBe("Copy link")
  })
})

describe("a select's values", () => {
  const by = () => details("test")

  it("are whatever the caller gives: an object, an empty string, and null for none", () => {
    const apple = { id: 1 }
    const pear = { id: 2 }
    const heard: unknown[] = []
    const select = createSelect(
      signal<SelectProps<{ id: number } | "">>({
        id: "s",
        name: "fruit",
        onValueChange: (value) => void heard.push(value),
      })
    )
    select.setValue(apple, by())
    expect(select.value.peek()).toBe(apple)
    expect(select.selected(apple).peek()).toBe(true)
    // Equal by identity, not by looks.
    expect(select.selected({ id: 1 }).peek()).toBe(false)
    select.setValue(pear, by())
    select.setValue("", by())
    expect(select.value.peek()).toBe("")
    expect(select.selected("").peek()).toBe(true)
    expect(select.valuePart.props.peek()["data-placeholder"]).toBe(undefined)
    select.setValue(null, by())
    expect(select.valuePart.props.peek()["data-placeholder"]).toBe("")
    expect(heard).toEqual([apple, pear, "", null])
  })

  it("has no popup in the page while it is closed", () => {
    const select = createSelect(signal<SelectProps<string>>({ id: "s" }))
    const stop = select.mount()
    onTestFinished(stop)
    expect(select.mounted.peek()).toBe(false)
    select.setOpen(true, by())
    expect(select.mounted.peek()).toBe(true)
  })

  it("names a chosen row by its text without what is hidden in it", async () => {
    const root = mount(`<span id="text">Copy <kbd aria-hidden="true">⌘C</kbd></span>`)
    const select = createSelect(signal<SelectProps<string>>({ id: "s", defaultValue: "copy" }))
    onTestFinished(select.itemText("copy").attach(find(root, "text")))
    await Promise.resolve()
    expect(select.label.peek()).toBe("Copy")
  })
})

describe("a caller's own attributes on a control", () => {
  it("keeps an aria-invalid the caller wrote, outside a field", () => {
    const root = mount(`<span id="box" aria-invalid="true"><input id="box-input" /></span>`)
    const props = signal<CheckboxProps>({ id: "c" })
    const made = createCheckbox(props)
    const box = find(root, "box")
    bind(box, made.root)
    bind(find(root, "box-input"), made.input)
    box.click()
    props.set({ id: "c", disabled: true })
    props.set({ id: "c" })
    expect(box.getAttribute("aria-invalid")).toBe("true")
  })
})
