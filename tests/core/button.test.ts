import { afterEach, describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind, write } from "../../packages/core/src/bind.ts"
import { createButton } from "../../packages/core/src/button.ts"
import type { ButtonProps } from "../../packages/core/src/button.ts"
import { forElement } from "../../packages/core/src/part.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { find, mount } from "./page.ts"

const press = (key: string) => userEvent.keyboard(key === " " ? "[Space]" : `{${key}}`)

/** A non-native button bound on the element `id`, and the presses it heard. */
function button(root: HTMLElement, id: string, given: ButtonProps = {}) {
  const made = createButton(signal<ButtonProps>({ nativeButton: false, ...given }))
  const element = find(root, id)
  const presses: Event[] = []
  element.addEventListener("click", (event) => presses.push(event))
  onTestFinished(bind(element, made.root))
  return { made, element, presses }
}

describe("a button drawn as a link that navigates", () => {
  // A press on a link follows it: the page's hash is put back after each test.
  const hash = location.hash
  afterEach(() => history.replaceState(null, "", hash || location.pathname + location.search))

  it("stays a link: no button role and no tab stop of its own", () => {
    const root = mount(`<a id="go" href="#go">Go</a><area id="map" href="#map" />`)
    for (const id of ["go", "map"]) {
      const { element } = button(root, id)
      expect(element.hasAttribute("role")).toBe(false)
      expect(element.hasAttribute("tabindex")).toBe(false)
      expect(element.getAttribute("href")).toBe(`#${id}`)
    }
  })

  it("keeps the role its caller gives it", () => {
    const root = mount(`<a id="go" href="#go" role="link">Go</a>`)
    expect(button(root, "go").element.getAttribute("role")).toBe("link")
  })

  it("is followed once by Enter, and not pressed by Space", async () => {
    const root = mount(`<a id="go" href="#go">Go</a>`)
    const { element, presses } = button(root, "go")
    element.focus()
    await press("Enter")
    expect(presses).toHaveLength(1)
    await press(" ")
    expect(presses).toHaveLength(1)
  })

  it("is still blocked, and out of the tab order, while disabled", async () => {
    const root = mount(`<a id="go" href="#blocked">Go</a>`)
    const { element, presses } = button(root, "go", { disabled: true })
    expect(element.getAttribute("tabindex")).toBe("-1")
    expect(element.getAttribute("aria-disabled")).toBe("true")
    expect(element.hasAttribute("role")).toBe(false)
    element.focus()
    await press("Enter")
    expect(presses.map((each) => each.defaultPrevented)).toEqual([true])
    expect(location.hash).not.toBe("#blocked")
  })

  it("comes back to the tab order as a link when it is enabled again", () => {
    const root = mount(`<a id="go" href="#go">Go</a>`)
    const props = signal<ButtonProps>({ nativeButton: false, disabled: true })
    onTestFinished(bind(find(root, "go"), createButton(props).root))
    props.set({ nativeButton: false })
    expect(find(root, "go").hasAttribute("tabindex")).toBe(false)
  })

  it("is written as a link by a server, which knows the element", () => {
    const root = mount(`<a id="go" href="#go">Go</a>`)
    write(find(root, "go"), createButton(signal({ nativeButton: false })).root)
    expect(find(root, "go").hasAttribute("role")).toBe(false)
    expect(find(root, "go").hasAttribute("tabindex")).toBe(false)
  })

  it("is fitted before it is drawn where the tag and the href are known", () => {
    const own = createButton(signal({ nativeButton: false })).root.props.peek()
    expect(forElement(own, { href: "/x" }, "a").role).toBeUndefined()
    expect(forElement(own, { href: "/x" }, "a").tabindex).toBeUndefined()
    // Not known yet (a render function, a snippet): the element puts it right once drawn.
    expect(forElement(own, { href: "/x" }, undefined).role).toBe("button")
    expect(forElement(own, {}, "a").role).toBe("button")
    expect(forElement(own, { href: "/x" }, "div").role).toBe("button")
  })

  it("loses the button role once its element turns out to be a link", () => {
    const root = mount(`<a id="go" href="#go">Go</a>`)
    const made = createButton(signal({ nativeButton: false }))
    expect(made.root.props.peek().role).toBe("button")
    onTestFinished(made.root.attach(find(root, "go")))
    expect(made.root.props.peek().role).toBeUndefined()
    expect(made.root.props.peek().tabindex).toBeUndefined()
  })
})

describe("a button drawn on another element", () => {
  it("is given a button's role, tab stop and keys: a link with no href too", async () => {
    const root = mount(`<span id="s">S</span><a id="a">A</a>`)
    for (const id of ["s", "a"]) {
      const { element, presses } = button(root, id)
      expect(element.getAttribute("role")).toBe("button")
      expect(element.getAttribute("tabindex")).toBe("0")
      element.focus()
      await press("Enter")
      await press(" ")
      expect(presses).toHaveLength(2)
    }
  })
})
