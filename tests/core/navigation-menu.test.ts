import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { NAVIGATION_DELAY, createNavigationMenu } from "../../packages/core/src/navigation-menu.ts"
import type { NavigationMenuProps } from "../../packages/core/src/navigation-menu.ts"
import { effect, signal, untracked } from "../../packages/core/src/reactivity.ts"
import { find, focused, mount, style } from "./page.ts"

const PAGE = `
  <button id="before">Before</button>
  <nav id="nav"><ul id="list">
    <li><button id="t-products">Products</button></li>
    <li><button id="t-docs">Docs</button></li>
    <li><a id="pricing" href="#pricing">Pricing</a></li>
  </ul></nav>
  <button id="after">After</button>`

const LINKS: Record<string, string[]> = { products: ["apps", "tools"], docs: ["guide"] }

/** A navigation drawn as an adapter draws one, in plain DOM. */
function navigation(given: Partial<NavigationMenuProps<string>> = {}) {
  style(`
    #viewport > div { width: 200px; height: 80px; }
    #viewport > div[id$="content-1"] { width: 120px; height: 40px; }
    #popup { transition: opacity 80ms linear; }`)
  const root = mount(PAGE)
  const reasons: string[] = []
  const made = createNavigationMenu(
    signal<NavigationMenuProps<string>>({
      id: "n",
      delay: 30,
      closeDelay: 30,
      onValueChange: (_value, by) => void reasons.push(by.reason),
      ...given,
    })
  )
  const stops = [
    bind(find(root, "nav"), made.root),
    bind(find(root, "list"), made.list),
    bind(find(root, "pricing"), made.link()),
  ]
  // The popup, while it is in the page, with the viewport the contents are drawn in.
  let positioner: HTMLElement | undefined
  let undo: (() => void)[] = []
  stops.push(
    effect(() => {
      const mounted = made.mounted.get()
      untracked(() => {
        if (mounted && !positioner) {
          positioner = document.createElement("div")
          positioner.innerHTML = `<div id="popup"><div id="viewport"></div></div>`
          root.append(positioner)
          undo = [
            bind(positioner, made.positioner),
            bind(find(positioner, "popup"), made.popup),
            bind(find(positioner, "viewport"), made.viewport),
          ]
        } else if (!mounted && positioner) {
          for (const each of undo.reverse()) each()
          positioner.remove()
          positioner = undefined
        }
      })
    })
  )
  for (const key of Object.keys(LINKS)) {
    const item = made.item(key)
    stops.push(bind(find(root, `t-${key}`), item.trigger), item.mount())
    let element: HTMLElement | undefined
    let leave: (() => void)[] = []
    // An item's content is drawn in the shared viewport, while it is mounted and there is one.
    stops.push(
      effect(() => {
        const viewport = made.viewportElement.get()
        const wanted = item.mounted.get() && viewport !== undefined
        untracked(() => {
          if (wanted && !element) {
            element = document.createElement("div")
            for (const name of LINKS[key]!) {
              const link = document.createElement("a")
              link.id = name
              link.href = `#${name}`
              link.textContent = name
              element.append(link)
              leave.push(bind(link, made.link()))
            }
            viewport!.append(element)
            leave.push(bind(element, item.content))
          } else if (!wanted && element) {
            for (const each of leave.reverse()) each()
            leave = []
            element.remove()
            element = undefined
          }
        })
      })
    )
  }
  stops.push(made.mount())
  onTestFinished(() => {
    for (const stop of stops.reverse()) stop()
    positioner?.remove()
  })
  return { root, made, reasons }
}

const press = (key: string) => userEvent.keyboard(key.length === 1 ? key : `{${key}}`)
const settled = () => new Promise((resolve) => setTimeout(resolve, 20))
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe("a navigation menu", () => {
  it("a press on a trigger shows its content in the shared viewport, and another hides it", async () => {
    const { root, made, reasons } = navigation()
    const trigger = find(root, "t-products")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(trigger.hasAttribute("aria-controls")).toBe(false)
    trigger.click()
    await settled()
    expect(made.value.peek()).toBe("products")
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    const content = root.querySelector<HTMLElement>("#viewport > div")!
    expect(trigger.getAttribute("aria-controls")).toBe(content.id)
    expect(content.hasAttribute("data-open")).toBe(true)
    // Focus stays on the trigger: Tab is what goes in.
    trigger.focus()
    trigger.click()
    expect(made.value.peek()).toBe(null)
    expect(reasons).toEqual(["trigger-press", "trigger-press"])
  })

  it("moves from one item to the next in the same popup, sized to the content shown", async () => {
    const { root, made } = navigation()
    find(root, "t-products").click()
    await settled()
    const popup = find(root, "popup")
    expect(popup.style.getPropertyValue("--popup-width")).toBe("200px")
    expect(popup.style.getPropertyValue("--popup-height")).toBe("80px")
    find(root, "t-docs").click()
    await settled()
    // The same popup: another trigger of the list is not a press outside it.
    expect(find(root, "popup")).toBe(popup)
    expect(made.value.peek()).toBe("docs")
    expect(popup.style.getPropertyValue("--popup-width")).toBe("120px")
    expect(popup.style.getPropertyValue("--popup-height")).toBe("40px")
    const shown = root.querySelector<HTMLElement>("#viewport > [data-open]")!
    expect(shown.getAttribute("data-activation-direction")).toBe("right")
    find(root, "t-products").click()
    await settled()
    expect(
      root.querySelector("#viewport > [data-open]")!.getAttribute("data-activation-direction")
    ).toBe("left")
    // Placed against the trigger of the item that is open.
    await expect
      .poll(() => Math.round(popup.parentElement!.getBoundingClientRect().left))
      .toBe(Math.round(find(root, "t-products").getBoundingClientRect().left))
  })

  it("Tab goes from a trigger into its content and on to what follows the trigger", async () => {
    const { root, made } = navigation()
    find(root, "t-products").focus()
    await press("Enter")
    await settled()
    expect(focused()).toBe("t-products")
    await press("Tab")
    expect(focused()).toBe("apps")
    await press("Tab")
    expect(focused()).toBe("tools")
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}")
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}")
    expect(focused()).toBe("t-products")
    await press("Tab")
    await press("Tab")
    await press("Tab")
    // Past the content's last stop: on along the list, and the content has gone.
    expect(focused()).toBe("t-docs")
    expect(made.value.peek()).toBe(null)
  })

  it("the arrows go along the list, and the one into a content opens it there", async () => {
    const { root, made } = navigation()
    find(root, "t-products").focus()
    await press("ArrowRight")
    expect(focused()).toBe("t-docs")
    await press("ArrowRight")
    // A link of the list is a stop of the arrows too.
    expect(focused()).toBe("pricing")
    await press("ArrowRight")
    expect(focused()).toBe("pricing")
    await press("ArrowLeft")
    await press("ArrowDown")
    await settled()
    expect(made.value.peek()).toBe("docs")
    expect(focused()).toBe("guide")
    await press("Escape")
    expect(made.value.peek()).toBe(null)
    expect(focused()).toBe("t-docs")
  })

  it("a followed link closes it; a press outside does too", async () => {
    const { root, made, reasons } = navigation()
    find(root, "t-products").click()
    await settled()
    find(root, "apps").click()
    expect(made.value.peek()).toBe(null)
    find(root, "t-docs").click()
    await settled()
    await userEvent.click(find(root, "before"))
    expect(made.value.peek()).toBe(null)
    expect(reasons).toEqual(["trigger-press", "link-press", "trigger-press", "outside-press"])
    expect(find(root, "pricing").hasAttribute("aria-current")).toBe(false)
  })

  it("opens for a pointer that rests on a trigger, stays under it, and goes when it leaves", async () => {
    const { root, made, reasons } = navigation()
    const trigger = find(root, "t-products")
    // Not asked whether it is still closed here: a busy browser can take longer to say the
    // pointer has arrived than the rest lasts. That a pass does not open is hover.test.ts's.
    await userEvent.hover(trigger)
    await wait(NAVIGATION_DELAY + 40)
    expect(made.value.peek()).toBe("products")
    // The press that follows the pointer's opening is not a wish to close.
    trigger.click()
    expect(made.value.peek()).toBe("products")
    await userEvent.hover(find(root, "popup"))
    await wait(80)
    expect(made.value.peek()).toBe("products")
    await userEvent.hover(find(root, "after"))
    await wait(80)
    expect(made.value.peek()).toBe(null)
    expect(reasons).toEqual(["trigger-hover", "trigger-hover"])
  })

  it("marks the link of the page the reader is on", () => {
    const root = mount(`<a id="here" href="#here">Here</a>`)
    const made = createNavigationMenu(signal<NavigationMenuProps<string>>({ id: "n" }))
    onTestFinished(
      bind(
        find(root, "here"),
        made.link(() => ({ active: true }))
      )
    )
    expect(find(root, "here").getAttribute("aria-current")).toBe("page")
    expect(find(root, "here").hasAttribute("data-active")).toBe(true)
  })
})
