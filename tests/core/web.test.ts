import { describe, expect, it } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { createAgent } from "../../packages/core/src/agent.ts"
import type { ChangeDetails } from "../../packages/core/src/part.ts"
import { faults, settled } from "../../packages/core/src/testing.ts"
import "../../packages/web/src/index.ts"
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
