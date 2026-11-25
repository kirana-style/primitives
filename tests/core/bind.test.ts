import { describe, expect, it } from "vite-plus/test"

import { bind, write } from "../../packages/core/src/bind.ts"
import { PREVENT, forElement, untype } from "../../packages/core/src/part.ts"
import type { Part, PartProps } from "../../packages/core/src/part.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { find, mount } from "./page.ts"

function part(initial: PartProps, attach: Part["attach"] = () => () => {}) {
  const props = signal(initial)
  return { props, part: { props, attach } satisfies Part }
}

describe("a part on an element, with no framework", () => {
  it("writes its attributes, and follows them", () => {
    const root = mount(`<button id="b" class="mine">B</button>`)
    const button = find(root, "b")
    const { props, part: own } = part({
      "aria-expanded": "false",
      "data-closed": "",
      role: undefined,
    })
    bind(button, own)
    expect(button.getAttribute("aria-expanded")).toBe("false")
    expect(button.getAttribute("data-closed")).toBe("")
    expect(button.hasAttribute("role")).toBe(false)
    props.set({ "aria-expanded": "true", "data-open": "", "data-closed": undefined })
    expect(button.getAttribute("aria-expanded")).toBe("true")
    expect(button.hasAttribute("data-open")).toBe(true)
    expect(button.hasAttribute("data-closed")).toBe(false)
    // What is not the part's stays the caller's.
    expect(button.className).toBe("mine")
  })

  it("never removes an attribute it did not write", () => {
    const root = mount(`<button id="b" title="mine">B</button>`)
    const button = find(root, "b")
    const { props, part: own } = part({ id: undefined, title: undefined, "data-open": "" })
    bind(button, own)
    // A second pass with nothing to say about them still leaves the caller's alone.
    props.set({ id: undefined, title: undefined, "data-open": undefined })
    expect(button.id).toBe("b")
    expect(button.title).toBe("mine")
    expect(button.hasAttribute("data-open")).toBe(false)
    // What it did write, it takes away, and the element's own is back under it.
    props.set({ id: undefined, title: "part's", "data-open": "" })
    props.set({ id: undefined, title: undefined, "data-open": undefined })
    expect(button.title).toBe("mine")
    expect(button.hasAttribute("data-open")).toBe(false)
  })

  it("gives an attribute it wrote over back to the element when it has nothing to say", () => {
    // The element's own, written in its page or by its framework: the part's is over it only
    // while the part has a value, as where a framework draws the element from both.
    const root = mount(`<button id="b" aria-controls="note" data-state="mine">B</button>`)
    const button = find(root, "b")
    const { props, part: own } = part({ "aria-controls": undefined, "data-state": "part's" })
    bind(button, own)
    expect(button.getAttribute("aria-controls")).toBe("note")
    expect(button.getAttribute("data-state")).toBe("part's")
    props.set({ "aria-controls": "panel", "data-state": "part's again" })
    expect(button.getAttribute("aria-controls")).toBe("panel")
    props.set({ "aria-controls": undefined, "data-state": undefined })
    expect(button.getAttribute("aria-controls")).toBe("note")
    expect(button.getAttribute("data-state")).toBe("mine")
    // A value that already said what the part says is the part's own (a server wrote it).
    const sent = find(mount(`<div id="sent" data-open=""></div>`), "sent")
    const open = part({ "data-open": "" })
    bind(sent, open.part)
    open.props.set({ "data-open": undefined })
    expect(sent.hasAttribute("data-open")).toBe(false)
  })

  it("calls the handler the part has now", () => {
    const root = mount(`<button id="b">B</button>`)
    const button = find(root, "b")
    const heard: string[] = []
    const { props, part: own } = part({ onClick: () => void heard.push("first") })
    const unbind = bind(button, own)
    button.click()
    props.set({ onClick: () => void heard.push("second") })
    button.click()
    unbind()
    button.click()
    expect(heard).toEqual(["first", "second"])
  })

  it("hears focus from inside the element", () => {
    const root = mount(`<div id="group"><button id="b">B</button></div>`)
    const heard: string[] = []
    const { part: own } = part({
      onFocus: () => void heard.push("focus"),
      onBlur: () => void heard.push("blur"),
    })
    bind(find(root, "group"), own)
    find(root, "b").focus()
    find(root, "b").blur()
    expect(heard).toEqual(["focus", "blur"])
  })

  it("lets a caller's handler keep the part's out of an event", () => {
    const root = mount(`<button id="b">B</button>`)
    const button = find(root, "b")
    const heard: string[] = []
    let stopIt = true
    button.addEventListener("click", (event) => {
      if (stopIt) (event as unknown as Record<typeof PREVENT, () => void>)[PREVENT]()
    })
    const { part: own } = part({ onClick: () => void heard.push("part") })
    bind(button, own)
    button.click()
    stopIt = false
    button.click()
    expect(heard).toEqual(["part"])
  })

  it("writes a form control's state where a person's change lives", () => {
    const root = mount(`<input id="box" type="checkbox" /><input id="text" />`)
    const box = find<HTMLInputElement>(root, "box")
    const text = find<HTMLInputElement>(root, "text")
    const checked = part({ checked: "" })
    const value = part({ value: "one" })
    bind(box, checked.part)
    bind(text, value.part)
    expect(box.checked).toBe(true)
    expect(text.value).toBe("one")
    // The person's change, then the part's: the property, which the attribute no longer moves.
    box.checked = true
    text.value = "typed"
    checked.props.set({ checked: undefined })
    value.props.set({ value: "two" })
    expect(box.checked).toBe(false)
    expect(text.value).toBe("two")
  })

  it("writes a text as it changes, not again for another attribute's change", () => {
    const root = mount(`<input id="text" />`)
    const text = find<HTMLInputElement>(root, "text")
    const value = part({ value: "o", "aria-expanded": "false" })
    bind(text, value.part)
    // Typed on, and something completed and selected, before the caller gives the text back.
    text.focus()
    text.value = "oslo"
    text.setSelectionRange(2, 4)
    value.props.set({ value: "o", "aria-expanded": "true" })
    expect(text.value).toBe("oslo")
    expect([text.selectionStart, text.selectionEnd]).toEqual([2, 4])
    value.props.set({ value: "os", "aria-expanded": "true" })
    expect(text.value).toBe("os")
  })

  it("writes a style's properties one by one, beside the caller's", () => {
    const root = mount(`<div id="bar" style="color: red"></div>`)
    const bar = find(root, "bar")
    const { props, part: own } = part({ style: { width: "40%", "--offset": "4px" } })
    bind(bar, own)
    expect(bar.style.width).toBe("40%")
    expect(bar.style.getPropertyValue("--offset")).toBe("4px")
    props.set({ style: { width: "60%" } })
    expect(bar.style.width).toBe("60%")
    expect(bar.style.getPropertyValue("--offset")).toBe("")
    expect(bar.style.color).toBe("red")
  })

  it("runs the part's DOM work, and its cleanup", () => {
    const root = mount(`<div id="x"></div>`)
    const log: string[] = []
    const { part: own } = part({}, (element) => {
      log.push(`attach ${element.id}`)
      return () => void log.push("detach")
    })
    const unbind = bind(find(root, "x"), own)
    unbind()
    expect(log).toEqual(["attach x", "detach"])
  })
})

describe("a part written once, for a server", () => {
  it("writes attributes and style, and nothing that listens or works", () => {
    const root = mount(`<div id="x" style="color: red"></div>`)
    const element = find(root, "x")
    const log: string[] = []
    const { part: own } = part(
      {
        role: "progressbar",
        "data-complete": undefined,
        style: { width: "40%" },
        onClick: () => void log.push("click"),
      },
      () => {
        log.push("attach")
        return () => {}
      }
    )
    write(element, own)
    element.click()
    expect(element.getAttribute("role")).toBe("progressbar")
    expect(element.hasAttribute("data-complete")).toBe(false)
    expect(element.getAttribute("style")).toBe("color: red;width: 40%")
    expect(element.hasAttribute("onclick")).toBe(false)
    expect(log).toEqual([])
  })
})

// A part's `type="button"` keeps a `<button>` from submitting its form by accident: it is a
// default, which a caller's own type overrides, and a link (where `type` is a MIME type) never
// takes it.
describe("a part's button type", () => {
  const typed = () => part({ type: "button", "aria-haspopup": "dialog" }).part

  it("goes on a button with no type of its own, bound or written", () => {
    const root = mount(`<button id="a">A</button><button id="b">B</button>`)
    bind(find(root, "a"), typed())
    write(find(root, "b"), typed())
    expect(find(root, "a").getAttribute("type")).toBe("button")
    expect(find(root, "b").getAttribute("type")).toBe("button")
  })

  it("leaves the caller's own type: a submit button submits", () => {
    const root = mount(
      `<form id="f"><button id="a" type="submit">A</button><button id="b" type="reset">B</button></form>`
    )
    const form = find(root, "f") as HTMLFormElement
    let submits = 0
    form.addEventListener("submit", (event) => {
      event.preventDefault()
      submits++
    })
    bind(find(root, "a"), typed())
    write(find(root, "b"), typed())
    expect(find(root, "a").getAttribute("type")).toBe("submit")
    expect(find(root, "b").getAttribute("type")).toBe("reset")
    find(root, "a").click()
    expect(submits).toBe(1)
  })

  it("is not written on a link, bound or written", () => {
    const root = mount(`<a id="a" href="#a">A</a><a id="b" href="#b">B</a>`)
    bind(find(root, "a"), typed())
    write(find(root, "b"), typed())
    for (const id of ["a", "b"]) {
      expect(find(root, id).hasAttribute("type")).toBe(false)
      expect(find(root, id).getAttribute("aria-haspopup")).toBe("dialog")
    }
  })

  it("is fitted to the element and the caller before a framework draws it", () => {
    const own = { type: "button", id: "x" }
    expect(forElement(own, {}, "button")).toBe(own)
    expect(forElement(own, { type: "submit" }, "button")).toEqual({ id: "x" })
    expect(forElement(own, {}, "a")).toEqual({ id: "x" })
    expect(forElement({ type: "checkbox" }, {}, "input")).toEqual({ type: "checkbox" })
    // An element the adapter cannot name yet keeps it, until `untype` sees the element.
    expect(forElement(own, {}, undefined)).toBe(own)
  })

  it("is taken off an element that turned out not to be a button", () => {
    const root = mount(
      `<a id="a" href="#a" type="button">A</a><button id="b" type="button">B</button><a id="c" type="text/html">C</a>`
    )
    for (const id of ["a", "b", "c"]) untype(find(root, id))
    expect(find(root, "a").hasAttribute("type")).toBe(false)
    expect(find(root, "b").getAttribute("type")).toBe("button")
    expect(find(root, "c").getAttribute("type")).toBe("text/html")
  })
})
