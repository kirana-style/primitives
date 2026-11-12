import { describe, expect, it } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { focusScope, isolate, tabbables } from "../../packages/core/src/services/focus.ts"
import { find, focused, mount } from "./page.ts"

const DIALOG = `
  <button id="opener">Open</button>
  <button id="elsewhere">Elsewhere</button>
  <div id="box">
    <p>Text</p>
    <button id="first">First</button>
    <input id="hidden-input" type="hidden" />
    <button id="disabled" disabled>Disabled</button>
    <span id="skipped" tabindex="-1">Skipped</span>
    <a id="link" href="#x">Link</a>
    <button id="undrawn" style="display: none">Not drawn</button>
    <div inert><button id="inert">Inert</button></div>
    <div id="last" tabindex="0">Last</div>
  </div>`

describe("what Tab reaches", () => {
  it("is what is drawn, enabled and not inert, in the page's order", () => {
    const root = mount(DIALOG)
    expect(tabbables(find(root, "box")).map((each) => each.id)).toEqual(["first", "link", "last"])
  })
})

describe("a focus scope", () => {
  it("moves focus to the first stop and gives it back", () => {
    const root = mount(DIALOG)
    find(root, "opener").focus()
    const leave = focusScope(find(root, "box"))
    expect(focused()).toBe("first")
    leave()
    expect(focused()).toBe("opener")
  })

  it("can start on the container, which is made focusable for it", () => {
    const root = mount(DIALOG)
    const box = find(root, "box")
    focusScope(box, { initial: "container" })
    expect(focused()).toBe("box")
    expect(box.getAttribute("tabindex")).toBe("-1")
  })

  it("can start on an element the caller names", () => {
    const root = mount(DIALOG)
    focusScope(find(root, "box"), { initial: () => find(root, "link") })
    expect(focused()).toBe("link")
  })

  it("starts on the container when nothing inside takes focus", () => {
    const root = mount(`<div id="box"><p>Only text</p></div>`)
    focusScope(find(root, "box"))
    expect(focused()).toBe("box")
  })

  it("keeps Tab inside when it traps", async () => {
    const root = mount(DIALOG)
    focusScope(find(root, "box"), { trap: true })
    find(root, "last").focus()
    await userEvent.tab()
    expect(focused()).toBe("first")
    await userEvent.tab({ shift: true })
    expect(focused()).toBe("last")
  })

  it("holds focus on a trapping container with nothing to stop at", async () => {
    const root = mount(`<div id="box"><p>Only text</p></div><button id="after">After</button>`)
    focusScope(find(root, "box"), { trap: true })
    await userEvent.tab()
    expect(focused()).toBe("box")
  })

  it("lets Tab leave when it does not trap", async () => {
    const root = mount(`<div id="box"><input id="in" /></div><input id="after" />`)
    focusScope(find(root, "box"))
    await userEvent.tab()
    expect(focused()).toBe("after")
  })

  it("gives focus back to the element the caller names", () => {
    const root = mount(DIALOG)
    find(root, "opener").focus()
    const leave = focusScope(find(root, "box"), { restore: () => find(root, "elsewhere") })
    leave()
    expect(focused()).toBe("elsewhere")
  })

  it("leaves focus where a person moved it meanwhile", () => {
    const root = mount(DIALOG)
    find(root, "opener").focus()
    const leave = focusScope(find(root, "box"))
    find(root, "elsewhere").focus()
    leave()
    expect(focused()).toBe("elsewhere")
  })
})

describe("isolating a layer", () => {
  const PAGE = `
    <header id="header">Header</header>
    <main id="main">
      <p id="text">Text</p>
      <div id="layer"><button id="inside">Inside</button></div>
      <div id="backdrop"></div>
    </main>
    <div id="live" aria-live="polite"></div>
    <div id="already" inert></div>`

  it("makes everything around it inert, up to the body, and undoes it", () => {
    const root = mount(PAGE)
    const inert = (id: string) => find(root, id).hasAttribute("inert")
    const release = isolate(find(root, "layer"), () => [find(root, "backdrop")])
    expect(inert("header")).toBe(true)
    expect(inert("text")).toBe(true)
    expect(inert("main")).toBe(false)
    expect(inert("layer")).toBe(false)
    expect(inert("backdrop")).toBe(false)
    expect(inert("live")).toBe(false)
    release()
    expect(inert("header")).toBe(false)
    expect(inert("text")).toBe(false)
    // Inert before, and not this layer's to undo.
    expect(inert("already")).toBe(true)
  })

  it("takes what is outside out of Tab's reach", async () => {
    const root = mount(`
      <button id="before">Before</button>
      <div id="layer"><button id="inside">Inside</button></div>`)
    const release = isolate(find(root, "layer"))
    find(root, "inside").focus()
    find(root, "before").focus()
    expect(focused()).toBe("inside")
    release()
    find(root, "before").focus()
    expect(focused()).toBe("before")
  })
})
