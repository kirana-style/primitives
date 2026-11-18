import { describe, expect, it } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { createAgent } from "../../packages/core/src/agent.ts"
import type { ChangeDetails } from "../../packages/core/src/part.ts"
import { faults, settled } from "../../packages/core/src/testing.ts"
import "../../packages/web/src/index.ts"
import { controllerAround, defineElement } from "../../packages/web/src/runtime.ts"
import { toasterOf } from "../../packages/web/src/toast.ts"
import { mount, style } from "./page.ts"

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

  it("a field's error comes and goes with what is wrong", async () => {
    const root = mount(`
      <kui-field kui-id="t">
        <div kui-part="root">
          <input kui-part="control" required />
          <div kui-part="error" data-testid="said"></div>
        </div>
      </kui-field>`)
    const input = root.querySelector("input")!
    const said = () => root.querySelector('[data-testid="said"]')?.textContent
    const field = root.querySelector<HTMLElement & { invalid: boolean }>("kui-field")!
    await settled()
    expect(said()).toBe(undefined)
    field.invalid = true
    await expect.poll(said).not.toBe(undefined)
    field.invalid = false
    await expect.poll(said).toBe(undefined)
    // Wrong in another way the second time: the message is the new one, not the one it had.
    input.type = "email"
    input.required = false
    input.value = "nobody"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    field.invalid = true
    await expect.poll(said).not.toBe(undefined)
    expect(root.querySelector('[data-testid="said"]')!.childNodes.length).toBeLessThan(2)
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

  it("a list is drawn from its template, and an entry that stays keeps its element", async () => {
    const root = mount(`
      <kui-pagination count="200">
        <nav kui-part="root">
          <button kui-part="previous">Previous</button>
          <template kui-each="items">
            <button kui-part="item" kui-when="page" data-testid="page-{page}">{page}</button>
            <span kui-part="ellipsis" kui-when="ellipsis" data-testid="gap-{key}">…</span>
          </template>
          <button kui-part="next">Next</button>
        </nav>
      </kui-pagination>`)
    await settled()
    const nav = root.querySelector("nav")!
    const drawn = () =>
      [...nav.children].map((each) => each.getAttribute("data-testid") ?? "-").join(" ")
    // The template has left the page: what is there is what a framework would draw.
    expect(nav.querySelector("template")).toBe(null)
    expect(drawn()).toBe("- page-1 page-2 page-3 page-4 page-5 gap-end page-20 -")
    const last = nav.querySelector<HTMLElement>('[data-testid="page-20"]')!
    const fifth = nav.querySelector<HTMLElement>('[data-testid="page-5"]')!
    expect(fifth.textContent).toBe("5")
    expect(nav.querySelector('[data-testid="page-1"]')!.getAttribute("aria-current")).toBe("page")
    fifth.focus()
    fifth.click()
    await settled()
    expect(drawn()).toBe("- page-1 gap-start page-4 page-5 page-6 gap-end page-20 -")
    // Kept entries are the same elements, where they were: focus is not lost.
    expect(nav.querySelector('[data-testid="page-5"]')).toBe(fifth)
    expect(nav.querySelector('[data-testid="page-20"]')).toBe(last)
    expect(document.activeElement).toBe(fifth)
    expect(fifth.getAttribute("aria-current")).toBe("page")
  })

  it("a list in a list, and an entry whose text changes", async () => {
    const root = mount(`
      <kui-calendar locale="en-US" default-focused-value="2026-03-15">
        <div kui-part="root">
          <div kui-part="heading"></div>
          <table kui-part="grid">
            <tbody>
              <template kui-each="weeks">
                <tr>
                  <template kui-each="days">
                    <td kui-part="cell"><button kui-part="day" data-day="{date}">{label}</button></td>
                  </template>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </kui-calendar>
      <kui-toast>
        <div kui-part="viewport">
          <template kui-each="toasts">
            <div kui-part="toast"><div kui-part="title">{title} {unknown}</div></div>
          </template>
        </div>
      </kui-toast>`)
    await settled()
    expect(root.querySelector('[kui-part="heading"]')!.textContent).toBe("March 2026")
    const rows = root.querySelectorAll("tbody tr")
    expect(rows.length).toBeGreaterThan(3)
    expect(rows[0]!.children.length).toBe(7)
    const day = root.querySelector<HTMLElement>('[data-day="2026-03-14"]')!
    expect(day.textContent).toBe("14")
    expect(day.parentElement!.getAttribute("role")).toBe("gridcell")
    const toaster = toasterOf(root.querySelector("kui-toast")!)
    const title = () => root.querySelector('[kui-part="title"]')?.textContent
    const id = toaster.add({ title: "Saving", duration: Infinity })
    // A brace that names nothing of the entry's is the page's own text.
    await expect.poll(title).toBe("Saving {unknown}")
    const toast = root.querySelector('[kui-part="toast"]')
    toaster.update(id, { title: "Saved" })
    await expect.poll(title).toBe("Saved {unknown}")
    expect(root.querySelector('[kui-part="toast"]')).toBe(toast)
    toaster.remove(id)
    await expect.poll(() => root.querySelector('[kui-part="toast"]')).toBe(null)
  })

  it("a toast: a part written empty says what the toast was added with, and is there only for one that has it", async () => {
    const root = mount(`
      <kui-toast kui-id="ts">
        <div kui-part="viewport">
          <template kui-each="toasts">
            <div kui-part="toast" data-testid="{id}">
              <div kui-part="title"></div>
              <div kui-part="description"></div>
              <button kui-part="action"></button>
              <button kui-part="close">Close {title}</button>
            </div>
          </template>
        </div>
      </kui-toast>`)
    await settled()
    const toaster = toasterOf(root.querySelector("kui-toast")!)
    const part = (id: string, name: string) =>
      root.querySelector(`[data-testid="${id}"] [kui-part="${name}"]`)
    const heard: string[] = []
    const plain = toaster.add({ title: "Saved", duration: Infinity })
    const whole = toaster.add({
      title: "Deleted",
      description: "One file",
      priority: "assertive",
      duration: Infinity,
      action: { label: "Undo", onAction: (details) => void heard.push(details.reason) },
    })
    await expect.poll(() => part(whole, "action")?.textContent).toBe("Undo")
    expect(part(whole, "title")!.textContent).toBe("Deleted")
    expect(part(whole, "description")!.textContent).toBe("One file")
    expect(part(whole, "action")!.getAttribute("type")).toBe("button")
    const toast = root.querySelector<HTMLElement>(`[data-testid="${whole}"]`)!
    expect(toast.getAttribute("role")).toBe("alertdialog")
    expect(toast.getAttribute("aria-live")).toBe("assertive")
    expect(toast.getAttribute("aria-describedby")).toBe(`ts-${whole}-description`)
    // One with a title only: no description, no button, and nothing names one.
    expect(part(plain, "title")!.textContent).toBe("Saved")
    expect(part(plain, "description")).toBe(null)
    expect(part(plain, "action")).toBe(null)
    expect(root.querySelector(`[data-testid="${plain}"]`)!.hasAttribute("aria-describedby")).toBe(
      false
    )
    // What the page wrote in a part stays the page's.
    expect(part(plain, "close")!.textContent).toBe("Close Saved")
    // It comes when the toast is given one, and says what it now is.
    toaster.update(plain, { description: "All of it", action: { label: "Open", onAction() {} } })
    await expect.poll(() => part(plain, "action")?.textContent).toBe("Open")
    expect(part(plain, "description")!.textContent).toBe("All of it")
    toaster.update(plain, { action: undefined })
    await expect.poll(() => part(plain, "action")).toBe(null)
    await userEvent.click(part(whole, "action")!)
    expect(heard).toEqual(["action-press"])
    await expect.poll(() => root.querySelector(`[data-testid="${whole}"]`)).toBe(null)
    expect(faults(root)).toEqual([])
  })

  it("a combobox of several: a chip for each chosen value", async () => {
    const root = mount(`
      <kui-combobox multiple default-values="a,b">
        <div kui-part="chips">
          <template kui-each="chips">
            <span kui-part="chip" data-chip="{value}">{value}<button kui-part="chip-remove">x</button></span>
          </template>
          <input kui-part="input" />
        </div>
      </kui-combobox>`)
    await settled()
    const chips = () =>
      [...root.querySelectorAll("[data-chip]")].map((each) => each.getAttribute("data-chip")).join()
    expect(chips()).toBe("a,b")
    expect(root.querySelector('[kui-part="chips"]')!.lastElementChild!.localName).toBe("input")
    root.querySelector<HTMLElement>('[data-chip="a"] button')!.click()
    await expect.poll(chips).toBe("b")
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

  it("an accordion's items with no value are each their own", async () => {
    // With no `kui-value` every item was the same one: a press opened them all.
    const root = mount(
      `<kui-accordion>
         <div kui-part="root">
           ${["a", "b"]
             .map(
               (each) => `<div kui-part="item">
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
    expect(shown()).toBe("")
    expect(a!.id).not.toBe(b!.id)
    a!.click()
    await settled()
    expect(shown()).toBe("Content a")
    b!.click()
    await settled()
    expect(shown()).toBe("Content b")
    expect(faults(root)).toEqual([])
  })

  it("a navigation menu's item with no value has a trigger and a content all the same", async () => {
    const root = mount(`
      <kui-navigation-menu kui-id="n">
        <nav kui-part="root">
          <ul kui-part="list">
            <li kui-part="item">
              <button kui-part="trigger" data-testid="own">A</button>
              <div kui-part="content" data-testid="own-content"><a kui-part="link" href="#x">x</a></div>
            </li>
            <li kui-part="item" kui-value="b">
              <button kui-part="trigger" data-testid="given">B</button>
              <div kui-part="content" data-testid="given-content">b</div>
            </li>
          </ul>
          <div kui-part="portal">
            <div kui-part="positioner">
              <div kui-part="popup"><div kui-part="viewport"></div></div>
            </div>
          </div>
        </nav>
      </kui-navigation-menu>`)
    await settled()
    const own = root.querySelector<HTMLElement>('[data-testid="own"]')!
    expect(own.getAttribute("aria-expanded")).toBe("false")
    own.click()
    await expect.poll(() => document.querySelector('[data-testid="own-content"]')).not.toBe(null)
    expect(own.getAttribute("aria-expanded")).toBe("true")
    expect(document.querySelector('[data-testid="given-content"]')).toBe(null)
    root.querySelector<HTMLElement>('[data-testid="given"]')!.click()
    await expect.poll(() => document.querySelector('[data-testid="own-content"]')).toBe(null)
    expect(own.getAttribute("aria-expanded")).toBe("false")
  })

  it("a slider's thumbs with no index are the values in the order of the elements", async () => {
    const root = mount(`
      <kui-slider default-value="20,50,80">
        <div kui-part="root">
          <div kui-part="control" style="position: relative; width: 200px; height: 20px">
            <div kui-part="thumb" id="low"></div>
            <div kui-part="thumb" id="middle"></div>
            <div kui-part="thumb" id="high"></div>
          </div>
        </div>
      </kui-slider>`)
    await settled()
    const said = () =>
      [...root.querySelectorAll<HTMLElement>('[kui-part="thumb"]')].map(
        (each) => `${each.id}:${each.dataset.index}=${each.getAttribute("aria-valuenow")}`
      )
    expect(said()).toEqual(["low:0=20", "middle:1=50", "high:2=80"])
    const low = root.querySelector<HTMLElement>("#low")!
    low.remove()
    await settled()
    expect(said()).toEqual(["middle:0=20", "high:1=50"])
    root.querySelector("#middle")!.before(low)
    await settled()
    expect(said()).toEqual(["low:0=20", "middle:1=50", "high:2=80"])
    // Thumbs that say which they are keep to it, wherever they are written.
    const told = mount(`
      <kui-slider default-value="20,80">
        <div kui-part="root">
          <div kui-part="control">
            <div kui-part="thumb" kui-index="1"></div>
            <div kui-part="thumb" kui-index="0"></div>
          </div>
        </div>
      </kui-slider>`)
    await settled()
    expect(
      [...told.querySelectorAll('[kui-part="thumb"]')].map((each) =>
        each.getAttribute("aria-valuenow")
      )
    ).toEqual(["80", "20"])
  })

  it("a part's first style starts no transition on markup the page had drawn", async () => {
    style(".glides { transition: translate 20s linear }")
    // The slider waits for the element around it, as a page's markup waits for its script.
    const root = mount(`
      <kui-test-drawn>
        <kui-slider default-value="40">
          <div kui-part="root">
            <div kui-part="control">
              <div kui-part="track"><div kui-part="indicator"></div></div>
              <div kui-part="thumb" class="glides"></div>
            </div>
          </div>
        </kui-slider>
      </kui-test-drawn>`)
    const thumb = root.querySelector<HTMLElement>(".glides")!
    // The browser has styled the thumb before it is a part.
    expect(getComputedStyle(thumb).translate).toBe("none")
    defineElement({ tag: "kui-test-drawn", props: {}, create: () => ({}), changes: {}, parts: {} })
    await settled()
    expect(thumb.style.translate).toBe("-50% -50%")
    expect(thumb.getAnimations()).toEqual([])
  })

  it("a popover: what its positioner, its trigger and its root are asked, by attribute and by property", async () => {
    const root = mount(
      `<div id="within" style="position: fixed; left: 300px; top: 0; width: 400px; height: 400px"></div>
       <kui-popover modal="trap-focus">
         <button kui-part="trigger" kui-open-on-hover kui-delay="0"
           style="position: fixed; left: 300px; top: 100px; width: 80px; height: 20px; padding: 0; border: 0">Open</button>
         <div kui-part="portal">
           <div kui-part="backdrop"></div>
           <div kui-part="positioner" kui-position-method="fixed" kui-collision-boundary="within"
             kui-collision-padding="0" kui-arrow-padding="7" kui-sticky>
             <div kui-part="popup" style="width: 120px; height: 40px">
               <div kui-part="arrow" style="width: 10px; height: 10px"></div>
               <button kui-part="close">Done</button>
             </div>
           </div>
         </div>
       </kui-popover>`
    )
    const host = root.querySelector<HTMLElement & { positioning?: object; open: boolean }>(
      "kui-popover"
    )!
    const trigger = root.querySelector("button")!
    // What no attribute can say: a gap worked out from the anchor.
    host.positioning = {
      sideOffset: ({ anchor }: { anchor: { height: number } }) => anchor.height / 2,
      collisionPadding: { left: 30 },
    }
    trigger.click()
    await settled()
    const portal = document.querySelector<HTMLElement>("body > [data-kirana-portal]")!
    const positioner = portal.querySelector<HTMLElement>('[kui-part="positioner"]')!
    await expect.poll(() => positioner.style.transform).not.toBe("")
    const placed = positioner.getBoundingClientRect()
    expect(getComputedStyle(positioner).position).toBe("fixed")
    // Half the anchor's height under it: the property's function.
    expect(placed.top).toBe(130)
    // Held inside the box its attribute names, with no padding: the attribute's, which comes
    // before the property's.
    expect(placed.left).toBe(300)
    const backdrop = portal.querySelector<HTMLElement>('[kui-part="backdrop"]')!
    expect(backdrop.hasAttribute("data-open")).toBe(true)
    const arrow = portal.querySelector<HTMLElement>('[kui-part="arrow"]')!
    expect(arrow.getAttribute("data-side")).toBe("bottom")
    // It traps focus and holds nothing of the page.
    expect(portal.contains(document.activeElement)).toBe(true)
    expect(root.closest("[inert]")).toBe(null)
    await userEvent.tab()
    expect(portal.contains(document.activeElement)).toBe(true)
    expect(faults(document.body)).toEqual([])
    // A property set since is read when the popup next comes into the page.
    await userEvent.keyboard("{Escape}")
    await expect.poll(() => document.querySelector("[data-kirana-portal]")).toBe(null)
    host.positioning = { sideOffset: () => 40 }
    trigger.click()
    await settled()
    await expect.poll(() => positioner.getBoundingClientRect().top).toBe(160)
    await userEvent.keyboard("{Escape}")
    await expect.poll(() => document.querySelector("[data-kirana-portal]")).toBe(null)
    // The pointer opens it too, where its trigger says so.
    trigger.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }))
    await expect.poll(() => host.open).toBe(true)
    host.open = false
  })
})
