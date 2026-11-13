import { describe, expect, it } from "vite-plus/test"

import { bind, write } from "../../packages/core/src/bind.ts"
import { PREVENT } from "../../packages/core/src/part.ts"
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
    // What it did write, it takes away.
    props.set({ id: undefined, title: "part's", "data-open": undefined })
    props.set({ id: undefined, title: undefined, "data-open": undefined })
    expect(button.hasAttribute("title")).toBe(false)
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
