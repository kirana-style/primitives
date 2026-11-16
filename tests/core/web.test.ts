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

describe("the components as custom elements", () => {
  it("a collapsible: its parts are the page's own elements", async () => {
    const root = mount(
      `<kui-collapsible><button kui-part="trigger">More</button><div kui-part="panel">Text</div></kui-collapsible>`
    )
    const trigger = root.querySelector("button")!
    const panel = root.querySelector<HTMLElement>('[kui-part="panel"]')!
    const element = root.firstElementChild as HTMLElement & { open: boolean }
    const heard = hear(root, "open-change", "open")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(trigger.type).toBe("button")
    expect(panel.hidden).toBe(true)
    trigger.click()
    await settled()
    expect(panel.hidden).toBe(false)
    expect(panel.hasAttribute("data-open")).toBe(true)
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id)
    expect(element.open).toBe(true)
    expect(heard).toEqual(["open true trigger-press"])
    expect(faults(root)).toEqual([])
    // As a property, too.
    element.open = false
    await settled()
    expect(panel.hidden).toBe(true)
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
  })

  it("is refused by a listener that prevents the change, and starts as its attributes say", async () => {
    const root = mount(
      `<kui-collapsible default-open><button kui-part="trigger">More</button><div kui-part="panel">Text</div></kui-collapsible>`
    )
    const panel = root.querySelector<HTMLElement>('[kui-part="panel"]')!
    expect(panel.hidden).toBe(false)
    root.addEventListener("open-change", (event) => event.preventDefault())
    root.querySelector("button")!.click()
    await settled()
    expect(panel.hidden).toBe(false)
  })

  it("a switch and a checkbox: a form's own controls", async () => {
    const root = mount(
      `<form><label id="l">Wi-Fi</label>
         <kui-switch name="wifi" aria-labelledby="l"><span kui-part="thumb"></span></kui-switch>
         <kui-checkbox name="terms" value="yes" default-checked aria-label="Terms"><span kui-part="indicator">✓</span></kui-checkbox>
       </form>`
    )
    const form = root.querySelector("form")!
    const wifi = root.querySelector<HTMLElement>("kui-switch")!
    const terms = root.querySelector<HTMLElement>("kui-checkbox")!
    const mark = root.querySelector<HTMLElement>('[kui-part="indicator"]')!
    expect(wifi.getAttribute("role")).toBe("switch")
    expect(wifi.getAttribute("aria-checked")).toBe("false")
    expect(terms.getAttribute("aria-checked")).toBe("true")
    expect(mark.hidden).toBe(false)
    expect([...new FormData(form).entries()]).toEqual([["terms", "yes"]])
    wifi.click()
    terms.click()
    await settled()
    expect(wifi.getAttribute("aria-checked")).toBe("true")
    expect(wifi.querySelector("span")!.hasAttribute("data-checked")).toBe(true)
    expect(mark.hidden).toBe(true)
    expect([...new FormData(form).entries()]).toEqual([["wifi", "on"]])
    form.reset()
    await settled()
    expect(wifi.getAttribute("aria-checked")).toBe("false")
    expect(terms.getAttribute("aria-checked")).toBe("true")
    expect(faults(root)).toEqual([])
  })

  it("tabs: a part for each value, and the arrows between them", async () => {
    const root = mount(
      `<kui-tabs default-value="a">
         <div kui-part="list"><button kui-part="tab" value="a">One</button><button kui-part="tab" value="b">Two</button></div>
         <div kui-part="panel" value="a">First</div><div kui-part="panel" value="b">Second</div>
       </kui-tabs>`
    )
    const [one, two] = [...root.querySelectorAll<HTMLElement>('[kui-part="tab"]')]
    const [first, second] = [...root.querySelectorAll<HTMLElement>('[kui-part="panel"]')]
    const heard = hear(root, "value-change", "value")
    await settled()
    expect(one!.getAttribute("aria-selected")).toBe("true")
    expect(first!.hidden).toBe(false)
    expect(second!.hidden).toBe(true)
    one!.focus()
    await userEvent.keyboard("{ArrowRight}{Enter}")
    await settled()
    expect(two!.getAttribute("aria-selected")).toBe("true")
    expect(second!.hidden).toBe(false)
    expect(first!.hidden).toBe(true)
    expect(heard.length).toBe(1)
    expect(heard[0]).toContain("value b")
    expect(faults(root)).toEqual([])
  })

  it("a dialog: drawn at the end of the page while it is open, and back when it closes", async () => {
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
    const portal = root.querySelector<HTMLElement>('[kui-part="portal"]')!
    const popup = root.querySelector<HTMLElement>('[kui-part="popup"]')!
    expect(portal.hidden).toBe(true)
    expect(portal.closest("kui-dialog")).not.toBe(null)
    trigger.click()
    await settled()
    expect(portal.parentElement!.hasAttribute("data-kirana-portal")).toBe(true)
    expect(portal.parentElement!.parentElement).toBe(document.body)
    expect(popup.getAttribute("role")).toBe("dialog")
    expect(popup.getAttribute("aria-labelledby")).toBe(popup.querySelector("h2")!.id)
    expect(popup.contains(document.activeElement)).toBe(true)
    expect(faults(document.body)).toEqual([])
    await userEvent.keyboard("{Escape}")
    await settled()
    await expect.poll(() => portal.closest("kui-dialog")).not.toBe(null)
    expect(portal.hidden).toBe(true)
    expect(document.activeElement).toBe(trigger)
    expect(document.querySelector("[data-kirana-portal]")).toBe(null)
  })

  it("takes parts that are added later, and lets go of ones that leave", async () => {
    const root = mount(
      `<kui-collapsible><button kui-part="trigger">More</button></kui-collapsible>`
    )
    const element = root.firstElementChild!
    const trigger = root.querySelector("button")!
    const panel = document.createElement("div")
    panel.setAttribute("kui-part", "panel")
    element.append(panel)
    await expect.poll(() => panel.hidden).toBe(true)
    trigger.click()
    await settled()
    expect(panel.hasAttribute("data-open")).toBe(true)
    trigger.remove()
    await settled()
    trigger.click()
    expect(panel.hasAttribute("data-open")).toBe(true)
  })

  it("is read and used by the agent bridge like any other adapter's", async () => {
    const root = mount(`<kui-switch aria-label="Wi-Fi"></kui-switch>`)
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
