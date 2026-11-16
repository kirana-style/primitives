import { describe, expect, it } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { createAgent } from "../../packages/core/src/agent.ts"
import type { ChangeDetails } from "../../packages/core/src/part.ts"
import { faults, settled } from "../../packages/core/src/testing.ts"
import "../../packages/web/src/index.ts"
import { controllerAround, defineElement } from "../../packages/web/src/runtime.ts"
import { mount } from "./page.ts"

type Told = CustomEvent<Record<string, unknown> & { details: ChangeDetails }>

/** What an element told, as `"open true trigger-press"`. */
function hear(root: HTMLElement, event: string, prop: string): string[] {
  const heard: string[] = []
  root.addEventListener(event, (told) => {
    const { detail } = told as Told
    heard.push(`${prop} ${String(detail[prop])} ${detail.details.reason}`)
  })
  return heard
}

const COLLAPSIBLE = `
  <kui-collapsible kui-id="c">
    <div kui-part="root">
      <button kui-part="trigger">More</button>
      <div kui-part="panel" id="panel">Text</div>
    </div>
  </kui-collapsible>`

describe("the components as custom elements", () => {
  it("a collapsible: its parts are the page's own elements, and a closed panel is not in the page", async () => {
    const root = mount(COLLAPSIBLE)
    const host = root.querySelector<HTMLElement & { open: boolean }>("kui-collapsible")!
    const trigger = root.querySelector("button")!
    const heard = hear(root, "open-change", "open")
    // The element holds the component and draws nothing.
    expect(getComputedStyle(host).display).toBe("contents")
    expect(host.attributes.length).toBe(2)
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(trigger.type).toBe("button")
    expect(root.querySelector('[kui-part="panel"]')).toBe(null)
    trigger.click()
    await settled()
    const panel = root.querySelector<HTMLElement>('[kui-part="panel"]')!
    expect(panel.hasAttribute("data-open")).toBe(true)
    expect(panel.previousElementSibling).toBe(trigger)
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id)
    expect(host.open).toBe(true)
    expect(heard).toEqual(["open true trigger-press"])
    expect(faults(root)).toEqual([])
    // As a property, too.
    host.open = false
    await settled()
    expect(root.querySelector('[kui-part="panel"]')).toBe(null)
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
  })

  it("is refused by a listener that prevents the change, starts as its attributes say, and keeps a panel it is told to", async () => {
    const root = mount(
      COLLAPSIBLE.replace("<kui-collapsible", "<kui-collapsible default-open") +
        COLLAPSIBLE.replace('kui-id="c"', 'kui-id="k"').replace(
          'kui-part="panel"',
          'kui-part="panel" kui-keep-mounted'
        )
    )
    const [first, kept] = [...root.querySelectorAll("kui-collapsible")]
    expect(first!.querySelector('[kui-part="panel"]')).not.toBe(null)
    first!.addEventListener("open-change", (event) => event.preventDefault())
    first!.querySelector("button")!.click()
    await settled()
    expect(first!.querySelector('[kui-part="panel"]')).not.toBe(null)
    // Kept in the page while closed, and hidden by its own part.
    const panel = kept!.querySelector<HTMLElement>('[kui-part="panel"]')!
    expect(panel.hidden).toBe(true)
  })

  it("a switch, a checkbox and radios: real buttons, and a form's own controls", async () => {
    const root = mount(
      `<form>
         <kui-switch kui-id="w" name="wifi"><button kui-part="root" aria-label="Wi-Fi"><span kui-part="thumb"></span></button></kui-switch>
         <kui-checkbox name="terms" value="yes" default-checked><button kui-part="root" aria-label="Terms"><span kui-part="indicator">✓</span></button></kui-checkbox>
         <kui-radio-group name="plan" default-value="pro">
           <div kui-part="root">
             <button kui-part="item" kui-value="free" aria-label="Free"><span kui-part="indicator"></span></button>
             <button kui-part="item" kui-value="pro" aria-label="Pro"><span kui-part="indicator"></span></button>
           </div>
         </kui-radio-group>
       </form>`
    )
    const form = root.querySelector("form")!
    const [wifi, terms, free, pro] = [...root.querySelectorAll<HTMLButtonElement>("button")]
    expect(wifi!.getAttribute("role")).toBe("switch")
    expect(wifi!.getAttribute("aria-checked")).toBe("false")
    expect(terms!.getAttribute("aria-checked")).toBe("true")
    expect(terms!.querySelector('[kui-part="indicator"]')).not.toBe(null)
    expect(pro!.getAttribute("aria-checked")).toBe("true")
    expect(free!.querySelector('[kui-part="indicator"]')).toBe(null)
    expect(pro!.querySelector('[kui-part="indicator"]')).not.toBe(null)
    expect([...new FormData(form).entries()]).toEqual([
      ["terms", "yes"],
      ["plan", "pro"],
    ])
    // By the keyboard: they are buttons.
    wifi!.focus()
    await userEvent.keyboard(" ")
    terms!.click()
    free!.click()
    await settled()
    expect(wifi!.getAttribute("aria-checked")).toBe("true")
    expect(wifi!.querySelector("span")!.hasAttribute("data-checked")).toBe(true)
    expect(terms!.querySelector('[kui-part="indicator"]')).toBe(null)
    expect(free!.getAttribute("aria-checked")).toBe("true")
    expect([...new FormData(form).entries()]).toEqual([
      ["wifi", "on"],
      ["plan", "free"],
    ])
    form.reset()
    await settled()
    expect(wifi!.getAttribute("aria-checked")).toBe("false")
    expect(terms!.getAttribute("aria-checked")).toBe("true")
    expect(pro!.getAttribute("aria-checked")).toBe("true")
    expect(faults(root)).toEqual([])
  })

  it("tabs: a part for each value, and the arrows between them", async () => {
    const root = mount(
      `<kui-tabs default-value="a">
         <div kui-part="root">
           <div kui-part="list"><button kui-part="tab" kui-value="a">One</button><button kui-part="tab" kui-value="b">Two</button></div>
           <div kui-part="panel" kui-value="a">First</div><div kui-part="panel" kui-value="b">Second</div>
         </div>
       </kui-tabs>`
    )
    const [one, two] = [...root.querySelectorAll<HTMLElement>('[kui-part="tab"]')]
    const shown = () =>
      [...root.querySelectorAll('[kui-part="panel"]')].map((each) => each.textContent).join()
    const heard = hear(root, "value-change", "value")
    await settled()
    expect(one!.getAttribute("aria-selected")).toBe("true")
    expect(shown()).toBe("First")
    one!.focus()
    await userEvent.keyboard("{ArrowRight}{Enter}")
    await settled()
    expect(two!.getAttribute("aria-selected")).toBe("true")
    expect(shown()).toBe("Second")
    expect(heard.length).toBe(1)
    expect(heard[0]).toContain("value b")
    expect(faults(root)).toEqual([])
  })

  it("an accordion: each item's parts share the item", async () => {
    const root = mount(
      `<kui-accordion default-value="b">
         <div kui-part="root">
           ${["a", "b"]
             .map(
               (each) => `<div kui-part="item" kui-value="${each}">
                 <h3 kui-part="header"><button kui-part="trigger">${each}</button></h3>
                 <div kui-part="panel">Content ${each}</div>
               </div>`
             )
             .join("")}
         </div>
       </kui-accordion>`
    )
    const [a, b] = [...root.querySelectorAll("button")]
    const shown = () =>
      [...root.querySelectorAll('[kui-part="panel"]')].map((each) => each.textContent).join()
    await settled()
    expect(shown()).toBe("Content b")
    expect(b!.getAttribute("aria-expanded")).toBe("true")
    a!.click()
    await settled()
    // One at a time, unless it is told otherwise.
    expect(shown()).toBe("Content a")
    expect(a!.closest('[kui-part="item"]')!.hasAttribute("data-open")).toBe(true)
    expect(faults(root)).toEqual([])
  })

  it("a dialog: drawn at the end of the page while it is open, and out of it when it closes", async () => {
    const root = mount(
      `<kui-dialog>
         <button kui-part="trigger">Open</button>
         <div kui-part="portal">
           <div kui-part="backdrop"></div>
           <div kui-part="popup"><h2 kui-part="title">Settings</h2><button kui-part="close">Done</button></div>
         </div>
       </kui-dialog>`
    )
    const trigger = root.querySelector("button")!
    expect(root.querySelector('[kui-part="portal"]')).toBe(null)
    trigger.click()
    await settled()
    const portal = document.querySelector<HTMLElement>("body > [data-kirana-portal]")!
    const popup = portal.querySelector<HTMLElement>('[kui-part="popup"]')!
    expect(popup.getAttribute("role")).toBe("dialog")
    expect(popup.getAttribute("aria-labelledby")).toBe(popup.querySelector("h2")!.id)
    expect(popup.contains(document.activeElement)).toBe(true)
    expect(faults(document.body)).toEqual([])
    await userEvent.keyboard("{Escape}")
    await settled()
    await expect.poll(() => document.querySelector("[data-kirana-portal]")).toBe(null)
    expect(document.activeElement).toBe(trigger)
    // And again: it is put back, not made anew.
    trigger.click()
    await settled()
    expect(document.querySelector("body > [data-kirana-portal]")).toBe(portal)
    popup.querySelector("button")!.click()
    await settled()
    await expect.poll(() => document.querySelector("[data-kirana-portal]")).toBe(null)
  })

  it("takes parts that are added later, and lets go of ones that leave", async () => {
    const root = mount(
      `<kui-collapsible><div kui-part="root"><button kui-part="trigger">More</button></div></kui-collapsible>`
    )
    const trigger = root.querySelector("button")!
    const panel = document.createElement("div")
    panel.setAttribute("kui-part", "panel")
    trigger.after(panel)
    await expect.poll(() => panel.isConnected).toBe(false)
    trigger.click()
    await settled()
    expect(panel.isConnected).toBe(true)
    expect(panel.hasAttribute("data-open")).toBe(true)
    trigger.remove()
    await settled()
    trigger.click()
    expect(panel.hasAttribute("data-open")).toBe(true)
  })

  it("a component waits for the one around it, whichever was defined first", () => {
    const seen: unknown[] = []
    mount(`<kui-test-outer><p><kui-test-inner></kui-test-inner></p></kui-test-outer>`)
    defineElement({
      tag: "kui-test-inner",
      props: {},
      create(_props, host) {
        seen.push(controllerAround(host, "kui-test-outer"))
        return {}
      },
      changes: {},
      parts: {},
    })
    // The one around it has no element yet: it has not begun, and neither has this one.
    expect(seen).toEqual([])
    const outer = { name: "outer" }
    defineElement({
      tag: "kui-test-outer",
      props: {},
      create: () => outer,
      changes: {},
      parts: {},
    })
    expect(seen).toEqual([outer])
  })

  it("a control in a field is the field's, and its parts stay its own", async () => {
    const root = mount(`
      <kui-field kui-id="f" name="level">
        <div kui-part="root">
          <label kui-part="label">Level</label>
          <kui-slider default-value="10">
            <div kui-part="root">
              <div kui-part="control" id="held">
                <div kui-part="track"><div kui-part="thumb"></div></div>
              </div>
            </div>
          </kui-slider>
          <kui-checkbox><span kui-part="root" id="box"></span></kui-checkbox>
        </div>
      </kui-field>`)
    await settled()
    // A slider has a part called `control` too: it is the slider's, not the field's control.
    const control = root.querySelector("#held")!
    expect(control.hasAttribute("name")).toBe(false)
    expect(control.id).toBe("held")
    // The slider's hidden input carries the field's name.
    expect(root.querySelector<HTMLInputElement>('[kui-part="thumb"] input')!.name).toBe("level")
    root.querySelector<HTMLElement>("#box")!.click()
    await settled()
    expect(root.querySelector('kui-field > [kui-part="root"]')!.hasAttribute("data-dirty")).toBe(
      true
    )
  })

  it("a part writes what it has to say, unless the page wrote something there", async () => {
    const root = mount(`
      <kui-progress value="40">
        <div kui-part="root"><span kui-part="value" id="said"></span></div>
      </kui-progress>
      <kui-meter value="3" max="6">
        <div kui-part="root"><span kui-part="value" id="own">Half</span></div>
      </kui-meter>`)
    await settled()
    expect(root.querySelector("#said")!.textContent).toBe("40%")
    expect(root.querySelector("#own")!.textContent).toBe("Half")
    root.querySelector<HTMLElement & { value: number }>("kui-progress")!.value = 60
    await settled()
    expect(root.querySelector("#said")!.textContent).toBe("60%")
  })

  it("a select: its chosen text, and the hidden input a form reads as its last child", async () => {
    const root = mount(`
      <kui-select kui-id="s" name="fruit" default-value="b">
        <button kui-part="trigger"><span kui-part="value" kui-placeholder="Pick"></span></button>
        <div kui-part="portal">
          <div kui-part="positioner">
            <div kui-part="popup">
              <div kui-part="item" kui-value="a"><span kui-part="item-text">Apple</span></div>
              <div kui-part="item" kui-value="b" kui-label="Banana">
                <span kui-part="item-text">Banana</span>
                <span kui-part="item-indicator">✓</span>
              </div>
            </div>
          </div>
        </div>
      </kui-select>`)
    const host = root.querySelector<HTMLElement & { open: boolean }>("kui-select")!
    const heard = hear(root, "value-change", "value")
    await settled()
    const input = host.lastElementChild as HTMLInputElement
    expect(input.localName).toBe("input")
    expect(input.name).toBe("fruit")
    expect(input.value).toBe("b")
    expect(document.querySelector('[kui-part="popup"]')).toBe(null)
    host.open = true
    await settled()
    expect(root.querySelector('[kui-part="value"]')!.textContent).toBe("Banana")
    // A mark is in the page only for the chosen item.
    expect(document.querySelectorAll('[kui-part="item-indicator"]').length).toBe(1)
    document.querySelector<HTMLElement>('[kui-value="a"]')!.click()
    await settled()
    expect(heard).toEqual(["value a item-press"])
    expect(input.value).toBe("a")
    expect(root.querySelector('[kui-part="value"]')!.textContent).toBe("Apple")
  })

  it("a menu's checkbox item has props of its own, told from its element", async () => {
    const root = mount(`
      <kui-menu default-open>
        <button kui-part="trigger">File</button>
        <div kui-part="portal">
          <div kui-part="positioner">
            <div kui-part="popup">
              <div kui-part="checkbox-item" kui-checked="false" kui-close-on-click="false" id="wrap">
                <span kui-part="checkbox-item-indicator">✓</span> Wrap
              </div>
            </div>
          </div>
        </div>
      </kui-menu>`)
    await settled()
    const item = document.querySelector<HTMLElement>("#wrap")!
    // Told from the item, which is drawn at the page's end.
    const heard = hear(document.body, "checked-change", "checked")
    expect(item.getAttribute("aria-checked")).toBe("false")
    expect(item.querySelector('[kui-part="checkbox-item-indicator"]')).toBe(null)
    item.click()
    await settled()
    // A value its element was given is held there.
    expect(item.getAttribute("kui-checked")).toBe("true")
    expect(item.getAttribute("aria-checked")).toBe("true")
    expect(item.querySelector('[kui-part="checkbox-item-indicator"]')).not.toBe(null)
    expect(heard.length).toBe(1)
    // And one the page writes later is followed.
    item.setAttribute("kui-checked", "false")
    await expect.poll(() => item.getAttribute("aria-checked")).toBe("false")
    root.querySelector<HTMLElement & { open: boolean }>("kui-menu")!.open = false
    await settled()
  })

  it("a navigation menu's content is drawn in the one viewport, and goes back", async () => {
    const root = mount(`
      <kui-navigation-menu kui-id="n">
        <nav kui-part="root">
          <ul kui-part="list">
            <li kui-part="item" kui-value="a">
              <button kui-part="trigger">A</button>
              <div kui-part="content" data-testid="content"><a kui-part="link" href="#x">x</a></div>
            </li>
          </ul>
          <div kui-part="portal">
            <div kui-part="positioner">
              <div kui-part="popup"><div kui-part="viewport" data-testid="view"></div></div>
            </div>
          </div>
        </nav>
      </kui-navigation-menu>`)
    await settled()
    // A part names its element: it is found by something of the page's own.
    const CONTENT = '[data-testid="content"]'
    const host = root.querySelector<HTMLElement & { value: string | null }>("kui-navigation-menu")!
    expect(root.querySelector(CONTENT)).toBe(null)
    host.value = "a"
    await expect.poll(() => document.querySelector(CONTENT)).not.toBe(null)
    const drawn = document.querySelector(CONTENT)!
    expect(drawn.parentElement!.getAttribute("data-testid")).toBe("view")
    expect(drawn.hasAttribute("data-open")).toBe(true)
    host.value = null
    await expect.poll(() => document.querySelector(CONTENT)).toBe(null)
  })

  it("is read and used by the agent bridge like any other adapter's", async () => {
    const root = mount(
      `<kui-switch><button kui-part="root" aria-label="Wi-Fi"></button></kui-switch>`
    )
    const sources: string[] = []
    root.addEventListener("checked-change", (told) =>
      sources.push((told as Told).detail.details.source)
    )
    const agent = createAgent({ root })
    expect(agent.snapshot().map(({ ref: _ref, ...rest }) => rest)).toEqual([
      { component: "switch", label: "Wi-Fi", checked: false, actions: ["setChecked", "toggle"] },
    ])
    const result = await agent.act({ steps: [{ ref: "Wi-Fi", action: "toggle" }] })
    expect(result.steps[0]!.now?.checked).toBe(true)
    expect(sources).toEqual(["agent"])
  })
})
