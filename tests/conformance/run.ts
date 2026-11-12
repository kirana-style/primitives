/**
 * The conformance run: one set of scenarios, played on every adapter's fixture page in a real
 * browser. Each scenario asserts the behaviour (keyboard, focus, presence, forms), and after each
 * step the page's DOM is serialized; at the end the serializations are compared across adapters,
 * state by state. The adapters differ in nothing a stylesheet, a test or a tool can see, or the
 * run fails. Every `data-*` attribute met is also held to the vocabulary.
 *
 *   bun tests/conformance/run.ts [adapter…]      default: every fixture that is built
 *
 * It serves each fixture's `dist/` itself and stops its servers and its browser before it exits.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { chromium, firefox, webkit } from "playwright"
import type { Page } from "playwright"

import type { PartDefinition } from "../../packages/core/src/part.ts"
import { vocabulary } from "../../packages/core/src/vocabulary.ts"

const ENGINES = { chromium, firefox, webkit }
const ROOT = join(import.meta.dirname, "../..")
const OUT = join(import.meta.dirname, "out")
const ALL = ["react", "vue", "svelte", "solid", "angular"]

const asked = process.argv.slice(2)
// `--browser firefox`, or several (`--browser chromium,firefox,webkit`): the whole run once in each.
const flag = asked.indexOf("--browser")
const engines = (flag < 0 ? "chromium" : asked.splice(flag, 2)[1]!).split(
  ","
) as (keyof typeof ENGINES)[]
const adapters = (asked.length > 0 ? asked : ALL).filter((each) => {
  const built = existsSync(join(ROOT, "fixtures", each, "dist/index.html"))
  if (!built) console.log(`skipped ${each}: fixtures/${each}/dist is not built`)
  return built
})
if (adapters.length === 0) {
  console.error("no fixture is built: run `vp run build` first")
  process.exit(1)
}

// Each adapter's page, and the same page rendered on a server and hydrated, where it is built.
const subjects = adapters.flatMap((adapter) => {
  const page = { adapter, label: adapter, path: "/", hydrated: false }
  return existsSync(join(ROOT, "fixtures", adapter, "dist/ssr.html"))
    ? [page, { adapter, label: `${adapter}+ssr`, path: "/ssr.html", hydrated: true }]
    : [page]
})

/** A serialized page without its inline styles: the geometry only a browser can measure. */
const withoutStyles = (dom: string) =>
  dom.replace(/ style="[^"]*"/g, "").replace(/\nfocus: .*$/s, "")

function serve(adapter: string) {
  const dist = join(ROOT, "fixtures", adapter, "dist")
  return Bun.serve({
    port: 0,
    async fetch(request) {
      const path = new URL(request.url).pathname
      const file = Bun.file(join(dist, path === "/" ? "index.html" : path))
      return (await file.exists()) ? new Response(file) : new Response("not found", { status: 404 })
    },
  })
}

/** The page as a stylesheet, a test or a tool sees it, without what only a framework writes. */
function serialize(): string {
  // `data-hk` is Solid's hydration key, on what a server rendered.
  const SKIP = new Set(["ng-version", "data-testid", "data-hk"])
  const lines: string[] = []
  const walk = (node: Node, depth: number) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // A run of text nodes is one text: how many nodes hold it, and the comments a framework
      // leaves between them, are its own business.
      const inRun = (each: Node | null): each is Node =>
        each?.nodeType === Node.TEXT_NODE || each?.nodeType === Node.COMMENT_NODE
      let before = node.previousSibling
      while (before?.nodeType === Node.COMMENT_NODE) before = before.previousSibling
      if (before?.nodeType === Node.TEXT_NODE) return
      let run = ""
      for (let each: Node | null = node; inRun(each); each = each.nextSibling) {
        if (each.nodeType === Node.TEXT_NODE) run += each.textContent
      }
      const text = run.replace(/\s+/g, " ").trim()
      if (text) lines.push(`${"  ".repeat(depth)}"${text}"`)
      return
    }
    if (!(node instanceof Element) || node.tagName === "SCRIPT") return
    const attributes = [...node.attributes]
      // An Angular directive's selector stays on its element (`kuidialogtrigger`): how the
      // adapter is written, the one difference an Angular page is allowed.
      .filter((each) => !SKIP.has(each.name) && !/^(_ng|kui)/.test(each.name))
      .map((each) => {
        let value = each.value
        // An empty `class` or `style` is a framework's leftover, not a difference.
        if ((each.name === "class" || each.name === "style") && value.trim() === "") return ""
        // A class is a list of tokens: the space a server leaves around them is not a difference.
        if (each.name === "class") value = value.trim().replace(/\s+/g, " ")
        if (each.name === "style") {
          value = value
            .split(";")
            .map((part) => part.trim())
            .filter(Boolean)
            .sort()
            .join("; ")
        }
        return value === "" ? each.name : `${each.name}="${value}"`
      })
      .filter(Boolean)
      .sort()
    // A form control's live state is its properties: whether a framework also wrote the
    // attribute is its own business.
    if (node instanceof HTMLInputElement) {
      for (const name of ["checked", "value"]) {
        const index = attributes.findIndex((each) => each === name || each.startsWith(`${name}=`))
        if (index >= 0) attributes.splice(index, 1)
      }
      if (node.checked) attributes.push("checked")
      if (node.value !== "" && node.value !== "on") attributes.push(`value="${node.value}"`)
      attributes.sort()
    }
    const testid = node.getAttribute("data-testid")
    lines.push(
      `${"  ".repeat(depth)}<${node.tagName.toLowerCase()}${testid ? `#${testid}` : ""}${attributes.map((each) => ` ${each}`).join("")}>`
    )
    for (const child of node.childNodes) walk(child, depth + 1)
  }
  walk(document.querySelector("main")!, 0)
  for (const portal of document.querySelectorAll("body > [data-kirana-portal]")) walk(portal, 0)
  const active = document.activeElement
  lines.push(
    `focus: ${active?.getAttribute("data-testid") ?? active?.getAttribute("id") ?? active?.tagName.toLowerCase()}`
  )
  const root = document.querySelector("main")!.closest("body > *")
  lines.push(`page inert: ${root?.hasAttribute("inert") ?? false}`)
  lines.push(`page scroll: ${document.documentElement.style.overflow || "auto"}`)
  return lines.join("\n")
}

class Failure extends Error {}

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Failure(message)
}

interface Run {
  page: Page
  /** Waits for motion to end, then records the DOM under `name`. */
  snapshot(name: string): Promise<void>
  id(testid: string): ReturnType<Page["locator"]>
  /** Whether an element with this test id is in the page. */
  present(testid: string): Promise<boolean>
  attribute(testid: string, name: string): Promise<string | null>
  focused(): Promise<string | null>
}

async function settled(page: Page) {
  // A turn of the event loop first: a framework that renders in a task of its own (Angular
  // without zones) has not started yet when the click returns.
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 20)))
  await page.waitForFunction(
    () =>
      document.querySelector("[data-starting-style], [data-ending-style]") === null &&
      document.getAnimations().length === 0,
    undefined,
    { timeout: 5000 }
  )
}

const scenarios: Record<string, (run: Run) => Promise<void>> = {
  async collapsible({ page, snapshot, id, present, attribute }) {
    await snapshot("at rest")
    expect(!(await present("c1-panel")), "a closed panel is not in the page")
    expect((await attribute("c1-trigger", "aria-expanded")) === "false", "closed: aria-expanded")
    expect((await attribute("c1-trigger", "type")) === "button", "a trigger is type=button")

    await id("c1-trigger").click()
    // The first frame of the entrance: in the page, at its starting style or already moving.
    expect(await present("c1-panel"), "an opened panel is in the page at once")
    expect(
      await page.evaluate(() =>
        document
          .getAnimations()
          .some((each) => each instanceof CSSTransition && each.transitionProperty === "height")
      ),
      "the entrance is a CSS transition from the starting style"
    )
    await snapshot("open")
    expect((await attribute("c1-trigger", "aria-expanded")) === "true", "open: aria-expanded")
    expect((await attribute("c1-trigger", "data-panel-open")) === "", "open: data-panel-open")
    expect(
      (await attribute("c1-trigger", "aria-controls")) === (await attribute("c1-panel", "id")),
      "the trigger names its panel"
    )
    const height = await id("c1-panel").evaluate((element) =>
      (element as HTMLElement).style.getPropertyValue("--collapsible-panel-height")
    )
    expect(height === "auto", `an open panel follows its content, got "${height}"`)

    await id("c2-trigger").click()
    await snapshot("nested open")
    expect((await attribute("c1-panel", "data-open")) === "", "the outer panel stays open")
    expect((await attribute("c2-panel", "data-open")) === "", "the nested panel opens on its own")

    await id("c1-trigger").click()
    expect(await present("c1-panel"), "a closing panel stays for its exit")
    await snapshot("closed again")
    expect(!(await present("c1-panel")), "a closed panel leaves the page after its exit")

    // Interrupted: opened and closed before the entrance ends.
    await id("c1-trigger").click()
    await id("c1-trigger").click()
    await snapshot("interrupted")
    expect(!(await present("c1-panel")), "an interrupted entrance still ends closed")
    await id("c1-trigger").click()
    await page.waitForTimeout(40)
    await id("c1-trigger").click()
    await page.waitForTimeout(40)
    await id("c1-trigger").click()
    await snapshot("interrupted twice, open")
    expect((await attribute("c1-panel", "data-open")) === "", "reopened mid-exit ends open")
    await id("c1-trigger").click()
    await settled(page)
  },

  async "collapsible-controlled"({ snapshot, id, present, attribute }) {
    expect(await present("c3-panel"), "a kept panel is in the page while closed")
    expect((await attribute("c3-panel", "hidden")) === "", "a kept, closed panel is hidden")
    expect(await present("c4-panel"), "a panel open from the start is in the page")

    await id("c3-outside").click()
    await snapshot("controlled open from outside")
    expect((await attribute("c3-panel", "hidden")) === null, "opened: not hidden")
    expect((await attribute("c3-panel", "data-open")) === "", "opened from outside")

    await id("c3-trigger").click()
    await snapshot("controlled closed by its trigger")
    expect(
      (await attribute("c3-panel", "hidden")) === "",
      "closed again: hidden, still in the page"
    )

    await id("c4-trigger").click({ force: true })
    await snapshot("disabled")
    expect(
      (await attribute("c4-panel", "data-open")) === "",
      "a disabled collapsible does not toggle"
    )
    expect((await attribute("c4-trigger", "disabled")) === "", "a disabled trigger is disabled")
  },

  // The form controls: a box with a hidden native input inside it, which a form and a label reach.
  async controls({ page, snapshot, id, attribute, focused }) {
    const form = (name: string) =>
      page.evaluate(
        (field) =>
          new FormData(document.querySelector<HTMLFormElement>('[data-testid="f1-form"]')!).getAll(
            field
          ),
        name
      )
    await snapshot("at rest")
    expect((await attribute("x1", "role")) === "checkbox", "role=checkbox")
    expect((await attribute("x1", "aria-checked")) === "false", "unchecked: aria-checked")
    expect((await attribute("x1", "data-unchecked")) === "", "unchecked: data-unchecked")
    expect((await attribute("x1", "tabindex")) === "0", "the box takes focus")
    expect((await id("x1").locator(".mark").count()) === 0, "no mark while unchecked")
    expect((await form("terms")).length === 0, "an unchecked box is not submitted")

    await id("x1").click()
    await snapshot("checkbox checked by a press")
    expect((await attribute("x1", "aria-checked")) === "true", "checked: aria-checked")
    expect((await attribute("x1", "data-checked")) === "", "checked: data-checked")
    expect((await id("x1").locator(".mark").count()) === 1, "the mark is in the page")
    expect((await form("terms")).join() === "on", "a checked box is submitted as `on`")

    await id("x1-label").click({ position: { x: 40, y: 8 } })
    await snapshot("checkbox unchecked through its label")
    expect((await attribute("x1", "aria-checked")) === "false", "a press on the label toggles once")

    await id("x1").focus()
    await page.keyboard.press("Space")
    expect((await attribute("x1", "aria-checked")) === "true", "Space checks")
    await page.keyboard.press("Enter")
    expect((await attribute("x1", "aria-checked")) === "true", "Enter does nothing")
    await page.keyboard.press("Space")
    await snapshot("checkbox toggled by Space")
    expect((await attribute("x1", "aria-checked")) === "false", "Space unchecks")

    expect((await attribute("x2", "aria-disabled")) === "true", "a disabled box says so")
    await id("x2").click({ force: true })
    expect((await attribute("x2", "aria-checked")) === "true", "a disabled box does not toggle")
    expect(
      (await attribute("x3", "aria-checked")) === "mixed",
      "indeterminate is aria-checked=mixed"
    )
    expect((await attribute("x3", "data-indeterminate")) === "", "and data-indeterminate")
    expect((await attribute("x3", "data-checked")) === null, "neither checked")
    expect((await attribute("x3", "data-unchecked")) === null, "nor unchecked")
    expect(
      await id("x3")
        .locator("input")
        .evaluate((input) => (input as HTMLInputElement).indeterminate),
      "the native input is indeterminate too"
    )

    expect((await attribute("w1", "role")) === "switch", "role=switch")
    await id("w1").click()
    await snapshot("switch on")
    expect((await id("w1-output").textContent()) === "on", "the caller hears the switch")
    expect((await attribute("w1", "aria-checked")) === "true", "on: aria-checked")
    expect((await form("alerts")).join() === "on", "an on switch is submitted")
    await id("w1-label").click()
    await snapshot("switch off through a label that names it")
    expect((await id("w1-output").textContent()) === "off", "`<label for>` reaches the switch")

    expect((await attribute("r1", "role")) === "radiogroup", "role=radiogroup")
    expect((await attribute("r1-pro", "aria-checked")) === "true", "the default value is chosen")
    expect((await attribute("r1-pro", "tabindex")) === "0", "the chosen item is the tab stop")
    expect((await attribute("r1-free", "tabindex")) === "-1", "the others are not")
    expect((await form("plan")).join() === "pro", "the chosen value is submitted")
    await id("r1-pro").focus()
    await page.keyboard.press("ArrowDown")
    expect((await focused()) === "r1-max", "ArrowDown skips a disabled item")
    expect((await attribute("r1-max", "aria-checked")) === "true", "and chooses as it moves")
    await page.keyboard.press("ArrowDown")
    expect((await focused()) === "r1-free", "and wraps to the first")
    await page.keyboard.press("ArrowLeft")
    expect((await focused()) === "r1-max", "ArrowLeft goes back")
    await snapshot("radio moved by arrows")
    expect((await form("plan")).join() === "max", "one value is submitted")
    expect((await id("r1").locator(".dot").count()) === 1, "one mark is in the page")
    await id("r1-team").click({ force: true })
    expect(
      (await attribute("r1-team", "aria-checked")) === "false",
      "a disabled item is not chosen"
    )
    await id("r1-pro").click()
    await snapshot("radio chosen by a press")
    expect((await form("plan")).join() === "pro", "a press chooses")
  },

  async tabs({ page, snapshot, id, present, attribute, focused }) {
    await snapshot("at rest")
    expect((await attribute("t1-list", "role")) === "tablist", "role=tablist")
    expect((await attribute("t1-account", "role")) === "tab", "role=tab")
    expect((await attribute("t1-account", "aria-selected")) === "true", "the default tab is active")
    expect((await attribute("t1-account", "data-active")) === "", "active: data-active")
    expect((await attribute("t1-account", "tabindex")) === "0", "the active tab is the tab stop")
    expect((await attribute("t1-password", "tabindex")) === "-1", "the others are not")
    expect(
      (await attribute("t1-account", "aria-controls")) ===
        (await attribute("t1-panel-account", "id")),
      "the active tab names its panel"
    )
    expect(
      (await attribute("t1-panel-account", "aria-labelledby")) ===
        (await attribute("t1-account", "id")),
      "the panel is labelled by its tab"
    )
    expect(!(await present("t1-panel-password")), "an inactive panel is not in the page")
    const mark = () =>
      page.evaluate(() => {
        const element = document.querySelector<HTMLElement>('[data-testid="t1-mark"]')!
        const active = document.querySelector(
          '[data-testid="t1"] > [role="tablist"] > [data-active]'
        )!
        return {
          width: element.style.getPropertyValue("--active-tab-width"),
          tab: `${active.getBoundingClientRect().width}px`,
        }
      })
    expect((await mark()).width === (await mark()).tab, "the mark carries the active tab's width")

    await id("t1-password").click()
    await snapshot("another tab chosen by a press")
    expect((await attribute("t1-password", "aria-selected")) === "true", "a press activates")
    expect(await present("t1-panel-password"), "its panel is in the page")
    expect(!(await present("t1-panel-account")), "the other panel left it")
    expect(
      (await attribute("t1", "data-activation-direction")) === "right",
      "it came from the right"
    )
    expect((await mark()).width === (await mark()).tab, "the mark follows the active tab")

    await page.keyboard.press("ArrowRight")
    expect((await focused()) === "t1-team", "ArrowRight skips a disabled tab")
    expect(
      (await attribute("t1-password", "aria-selected")) === "true",
      "focus alone does not activate"
    )
    expect((await attribute("t1-team", "tabindex")) === "0", "the focused tab is the tab stop")
    await page.keyboard.press("ArrowRight")
    expect((await focused()) === "t1-account", "and wraps to the first")
    await page.keyboard.press("End")
    expect((await focused()) === "t1-team", "End goes to the last")
    await page.keyboard.press("Home")
    expect((await focused()) === "t1-account", "Home goes to the first")
    await page.keyboard.press("ArrowDown")
    expect((await focused()) === "t1-account", "a horizontal list ignores up and down")
    await page.keyboard.press("Enter")
    await snapshot("a tab chosen by the keyboard")
    expect((await attribute("t1-account", "aria-selected")) === "true", "Enter activates")
    expect((await attribute("t1", "data-activation-direction")) === "left", "it came from the left")

    // The same component inside itself: each list moves among its own tabs.
    await id("t2-two").click()
    await snapshot("a nested tab chosen")
    expect((await attribute("t2-two", "aria-selected")) === "true", "the inner tabs change")
    expect((await attribute("t1-account", "aria-selected")) === "true", "the outer tabs do not")
    await page.keyboard.press("ArrowRight")
    expect((await focused()) === "t2-one", "the arrows stay within the inner list")
  },

  async accordion({ page, snapshot, id, present, attribute, focused }) {
    await snapshot("at rest")
    expect(!(await present("a1-one-panel")), "a closed panel is not in the page")
    expect(
      (await attribute("a1-one-trigger", "aria-expanded")) === "false",
      "closed: aria-expanded"
    )
    expect(await present("a2-x-panel"), "a default value opens its item")

    await id("a1-one-trigger").click()
    await snapshot("one open")
    expect((await attribute("a1-one", "data-open")) === "", "the item is open")
    expect((await attribute("a1-one-panel", "role")) === "region", "the panel is a region")
    expect(
      (await attribute("a1-one-panel", "aria-labelledby")) ===
        (await attribute("a1-one-trigger", "id")),
      "labelled by its trigger"
    )
    expect(
      (await id("a1-one-panel").evaluate((element) =>
        (element as HTMLElement).style.getPropertyValue("--accordion-panel-height")
      )) === "auto",
      "an open panel follows its content"
    )

    await id("a1-two-trigger").click()
    await snapshot("another open, the first closed")
    expect(await present("a1-two-panel"), "the second opens")
    expect(!(await present("a1-one-panel")), "opening one closes the other")

    await page.keyboard.press("ArrowDown")
    expect((await focused()) === "a1-four-trigger", "ArrowDown skips a disabled item")
    await page.keyboard.press("ArrowDown")
    expect((await focused()) === "a1-one-trigger", "and wraps to the first")
    await page.keyboard.press("End")
    expect((await focused()) === "a1-four-trigger", "End goes to the last")
    await page.keyboard.press("ArrowUp")
    expect((await focused()) === "a1-two-trigger", "ArrowUp goes back")
    await page.keyboard.press("Enter")
    await snapshot("closed by the keyboard")
    expect(!(await present("a1-two-panel")), "an open item closes again")
    await id("a1-three-trigger").click({ force: true })
    expect(!(await present("a1-three-panel")), "a disabled item does not open")

    await id("a2-y-trigger").click()
    await snapshot("several open")
    expect(await present("a2-x-panel"), "with `multiple`, the first stays open")
    expect(await present("a2-y-panel"), "beside the second")
  },

  // Popups the pointer opens: a tooltip and a hover card.
  async hover({ page, snapshot, id, present, attribute, focused }) {
    const away = () => page.mouse.move(900, 700)
    const shown = (testid: string) => id(testid).waitFor({ state: "attached", timeout: 3000 })
    const gone = (testid: string) => id(testid).waitFor({ state: "detached", timeout: 3000 })
    await away()
    await snapshot("at rest")
    expect(!(await present("h1-popup")), "a closed tooltip is not in the page")
    expect((await attribute("h1-trigger", "aria-describedby")) === null, "and describes nothing")

    await id("h1-trigger").hover()
    expect(!(await present("h1-popup")), "a tooltip waits before it opens")
    await shown("h1-popup")
    await snapshot("tooltip open")
    expect((await attribute("h1-popup", "role")) === "tooltip", "role=tooltip")
    expect(
      (await attribute("h1-trigger", "aria-describedby")) === (await attribute("h1-popup", "id")),
      "the tooltip describes its trigger while it shows"
    )
    expect((await attribute("h1-popup", "data-side")) === "top", "a tooltip sits above by default")
    expect((await attribute("h1-popup", "data-instant")) === null, "it waited: not instant")
    const arrow = await page.evaluate(() => {
      const trigger = document.querySelector('[data-testid="h1-trigger"]')!.getBoundingClientRect()
      const point = document.querySelector('[data-testid="h1-arrow"]')!.getBoundingClientRect()
      return Math.abs(point.left + point.width / 2 - (trigger.left + trigger.width / 2))
    })
    expect(arrow < 1, `the arrow points at the trigger's centre, off by ${arrow}`)

    // The next one opens at once: a person reading a row of them does not wait at each.
    await id("h2-trigger").hover()
    await shown("h2-popup")
    await gone("h1-popup")
    await snapshot("the next tooltip, opened at once")
    expect((await attribute("h2-popup", "data-instant")) === "delay", "it skipped its wait")

    // From the trigger up onto the popup: the strip between the two keeps it open.
    const box = (await id("h2-popup").boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 4, { steps: 4 })
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 })
    expect(await present("h2-popup"), "the pointer can travel onto the popup")
    await away()
    await gone("h2-popup")
    await snapshot("tooltip closed by the pointer leaving")
    expect(
      (await attribute("h2-trigger", "aria-describedby")) === null,
      "it describes nothing again"
    )

    await page.waitForTimeout(450)
    await id("h0").focus()
    await page.keyboard.press("Tab")
    expect((await focused()) === "h1-trigger", "Tab reaches the trigger")
    await shown("h1-popup")
    await snapshot("tooltip opened by the keyboard")
    expect((await attribute("h1-popup", "data-instant")) === "focus", "focus opens at once")
    await page.keyboard.press("Escape")
    await gone("h1-popup")
    expect((await focused()) === "h1-trigger", "Escape closes it and focus stays")
    await page.keyboard.press("Tab")
    await page.waitForTimeout(450)

    await id("h2-trigger").hover()
    await shown("h2-popup")
    await page.mouse.down()
    await gone("h2-popup")
    await page.mouse.up()
    await away()
    await snapshot("tooltip closed by a press")

    await page.waitForTimeout(450)
    await id("v1-trigger").hover()
    await shown("v1-popup")
    await snapshot("hover card open")
    expect((await attribute("v1-popup", "role")) === null, "a hover card is not a tooltip")
    expect((await attribute("v1-trigger", "aria-describedby")) === null, "and describes nothing")
    expect((await attribute("v1-popup", "data-side")) === "bottom", "placed where it was asked")
    await id("v1-link").hover()
    await page.waitForTimeout(250)
    expect(await present("v1-popup"), "the pointer can use what the card holds")
    await away()
    await page.waitForTimeout(40)
    expect(await present("v1-popup"), "a hover card waits before it closes")
    await gone("v1-popup")
    await snapshot("hover card closed")
  },

  // A part drawn as the caller's own element: `render` on React, `child` on Svelte, the
  // directive on the caller's element on Angular.
  async composition({ page, snapshot, id, present, attribute }) {
    await snapshot("at rest")
    expect(
      (await attribute("k1-trigger", "type")) === "button",
      "the part's `type` wins over the caller's"
    )
    expect((await attribute("k1-trigger", "aria-expanded")) === "false", "the part's ARIA wins")
    expect(
      (await attribute("k1-trigger", "class"))?.trim() === "mine",
      "the caller's class is kept"
    )

    await id("k1-trigger").click()
    await snapshot("opened through the caller's element")
    expect(
      (await id("k1-trigger").textContent())?.trim() === "Composed 1",
      "the caller's handler ran"
    )
    expect((await attribute("k1-trigger", "aria-expanded")) === "true", "and the part's after it")
    const style = () =>
      id("k1-panel").evaluate((element) => ({
        color: (element as HTMLElement).style.color,
        height: (element as HTMLElement).style.getPropertyValue("--collapsible-panel-height"),
      }))
    expect((await style()).color === "red", "the caller's style is on the panel")
    expect((await style()).height === "auto", "beside the geometry the core wrote")

    await id("k1-lock").check()
    await id("k1-trigger").click()
    await snapshot("the caller prevented the part's handler")
    expect(
      (await id("k1-trigger").textContent())?.trim() === "Composed 2",
      "the caller's handler ran again"
    )
    expect(await present("k1-panel"), "preventKiranaHandler() kept the panel open")
    expect((await attribute("k1-trigger", "aria-expanded")) === "true", "the state did not change")
    expect((await style()).color === "blue", "the caller's style changed")
    expect(
      (await style()).height === "auto",
      "and the core's geometry survived the caller's new style"
    )

    await id("k1-lock").uncheck()
    await id("k1-trigger").click()
    await snapshot("closed through the caller's element")
    expect(!(await present("k1-panel")), "unlocked, the part's handler runs again")
    await settled(page)
  },

  async dialog({ page, snapshot, id, present, attribute, focused }) {
    expect(!(await present("d1-popup")), "a closed dialog is not in the page")
    await id("d1-trigger").click()
    expect(
      await page.evaluate(() =>
        document
          .getAnimations()
          .some((each) => each instanceof CSSTransition && each.transitionProperty === "opacity")
      ),
      "the dialog's entrance is a CSS transition from the starting style"
    )
    await snapshot("open")
    expect((await attribute("d1-popup", "role")) === "dialog", "role=dialog")
    expect(
      (await focused()) === "d1-input",
      `focus goes to the first tabbable, got ${await focused()}`
    )
    const labelled = await attribute("d1-popup", "aria-labelledby")
    expect(labelled !== null, "the popup is labelled by its title")
    expect(
      (await page.evaluate((title) => document.getElementById(title!)?.textContent, labelled)) ===
        "Edit profile",
      "aria-labelledby names the title"
    )
    expect(
      (await page.evaluate(() => document.documentElement.style.overflow)) === "hidden",
      "the page does not scroll under a modal dialog"
    )
    expect(
      (await page.evaluate(() => getComputedStyle(document.body).pointerEvents)) !== "none",
      "modality never sets pointer-events on the page"
    )

    await page.keyboard.press("Shift+Tab")
    expect((await focused()) === "d1-close", "Shift+Tab from the first wraps to the last")
    await page.keyboard.press("Tab")
    expect((await focused()) === "d1-input", "Tab from the last wraps to the first")

    await id("d2-trigger").click()
    await snapshot("nested open")
    expect((await attribute("d1-popup", "data-nested-dialog-open")) === "", "the parent knows")
    expect(
      (await id("d1-popup").evaluate((element) =>
        (element as HTMLElement).style.getPropertyValue("--nested-dialogs")
      )) === "1",
      "--nested-dialogs counts the dialogs above"
    )
    expect((await focused()) === "d2-close", "focus moves into the nested dialog")

    await page.keyboard.press("Escape")
    await snapshot("nested closed by Escape")
    expect(await present("d1-popup"), "Escape closes only the top dialog")
    expect(!(await present("d2-popup")), "the nested dialog left the page")
    expect((await focused()) === "d2-trigger", "focus returns to the nested dialog's trigger")

    await page.keyboard.press("Escape")
    await snapshot("closed by Escape")
    expect(!(await present("d1-popup")), "Escape closes the dialog")
    expect((await focused()) === "d1-trigger", "focus returns to the trigger")
    expect(
      await page.evaluate(() => document.querySelector("[inert]") === null),
      "nothing is left inert"
    )
    expect(
      (await page.evaluate(() => document.documentElement.style.overflow)) === "",
      "the page scrolls again"
    )

    await id("d1-trigger").click()
    await settled(page)
    await page.mouse.click(5, 5)
    await snapshot("closed by a press outside")
    expect(!(await present("d1-popup")), "a press on the backdrop closes the dialog")

    await id("d1-trigger").click()
    await settled(page)
    await id("d1-close").click()
    await snapshot("closed by its close button")
    expect(!(await present("d1-popup")), "the close button closes the dialog")
  },

  async popover({ page, snapshot, id, present, attribute, focused }) {
    await id("p1-trigger").click()
    await snapshot("open")
    expect((await attribute("p1-popup", "data-side")) === "bottom", "placed below its trigger")
    expect((await attribute("p1-popup", "data-align")) === "start", "aligned to the start")
    const geometry = await page.evaluate(() => {
      const trigger = document.querySelector('[data-testid="p1-trigger"]')!.getBoundingClientRect()
      const positioner = document.querySelector<HTMLElement>('[data-testid="p1-positioner"]')!
      const box = positioner.getBoundingClientRect()
      return {
        gap: Math.round(box.top - trigger.bottom),
        left: Math.round(box.left - trigger.left),
        anchor: positioner.style.getPropertyValue("--anchor-width"),
        width: `${trigger.width}px`,
        origin: positioner.style.getPropertyValue("--transform-origin"),
        available: positioner.style.getPropertyValue("--available-height"),
      }
    })
    expect(geometry.gap === 8, `the gap is the side offset, got ${geometry.gap}`)
    expect(geometry.left === 0, `start-aligned with the trigger, got ${geometry.left}`)
    expect(geometry.anchor === geometry.width, "--anchor-width is the trigger's width")
    expect(geometry.origin !== "" && geometry.available !== "", "the geometry variables are set")
    expect((await focused()) === "p1-close", "focus moves into the popover")

    await page.keyboard.press("Escape")
    await snapshot("closed by Escape")
    expect(!(await present("p1-popup")), "Escape closes the popover")
    expect((await focused()) === "p1-trigger", "focus returns to the trigger")

    await id("p1-trigger").click()
    await settled(page)
    await page.mouse.click(700, 20)
    await snapshot("closed by a press outside")
    expect(!(await present("p1-popup")), "a press outside closes the popover")

    await id("p1-trigger").click()
    await settled(page)
    await id("p1-trigger").click()
    await snapshot("closed by its trigger")
    expect(
      !(await present("p1-popup")),
      "the trigger toggles: one press closes, not close-and-reopen"
    )
  },

  async select({ page, snapshot, id, present, attribute, focused }) {
    const output = () => id("s1-output").textContent()
    const submitted = () =>
      page.evaluate(() =>
        new FormData(document.querySelector<HTMLFormElement>('[data-testid="s1-form"]')!).get(
          "fruit"
        )
      )
    expect((await id("s1-value").textContent()) === "Banana", "the trigger shows the value's label")
    expect((await submitted()) === "Banana", "the value is submitted with the form")
    expect((await attribute("s1-trigger", "role")) === "combobox", "the trigger is a combobox")

    await id("s1-trigger").click()
    await snapshot("open")
    expect((await attribute("s1-popup", "role")) === "listbox", "the popup is a listbox")
    expect((await attribute("s1-Banana", "aria-selected")) === "true", "the value is selected")
    expect(
      (await attribute("s1-Banana", "data-highlighted")) === "",
      "opening highlights the value"
    )
    expect((await focused()) === "s1-Banana", "and focuses it")
    const width = await page.evaluate(() => {
      const trigger = document.querySelector('[data-testid="s1-trigger"]')!.getBoundingClientRect()
      const popup = document.querySelector('[data-testid="s1-popup"]')!.getBoundingClientRect()
      return popup.width >= trigger.width
    })
    expect(width, "the popup is at least as wide as its trigger (--anchor-width)")

    await page.keyboard.press("ArrowDown")
    expect((await focused()) === "s1-Cherry", "ArrowDown skips a disabled item")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    expect((await focused()) === "s1-Grape", "ArrowDown stops at the last item")
    await page.keyboard.press("Home")
    expect((await focused()) === "s1-Apple", "Home goes to the first item")
    await page.keyboard.press("End")
    expect((await focused()) === "s1-Grape", "End goes to the last item")
    await page.keyboard.type("ch")
    expect((await focused()) === "s1-Cherry", "typing finds an item by its label")
    await page.waitForTimeout(600)
    await page.keyboard.press("a")
    expect((await focused()) === "s1-Apple", "a letter finds the next item that starts with it")
    await page.keyboard.press("a")
    expect((await focused()) === "s1-Apricot", "the same letter again walks on")
    await snapshot("highlight moved")
    expect((await attribute("s1-Banana", "data-highlighted")) === null, "one item is highlighted")

    await page.keyboard.press("Enter")
    await snapshot("chosen by Enter")
    expect(!(await present("s1-popup")), "choosing closes the list")
    expect((await output()) === "Apricot", "the caller hears the new value")
    expect((await id("s1-value").textContent()) === "Apricot", "the trigger shows it")
    expect((await submitted()) === "Apricot", "the form submits it")
    expect((await focused()) === "s1-trigger", "focus returns to the trigger")

    await page.keyboard.press("ArrowDown")
    await settled(page)
    expect(await present("s1-popup"), "ArrowDown on the trigger opens the list")
    await id("s1-Cherry").hover()
    expect((await attribute("s1-Cherry", "data-highlighted")) === "", "the pointer highlights")
    await id("s1-Blueberry").click({ force: true })
    expect(await present("s1-popup"), "a disabled item is not chosen")
    await id("s1-Cherry").click()
    await snapshot("chosen by a press")
    expect((await output()) === "Cherry", "a press chooses")

    await id("s1-trigger").click()
    await settled(page)
    await page.keyboard.press("Escape")
    await snapshot("closed by Escape")
    expect((await output()) === "Cherry", "Escape keeps the value")
    expect((await focused()) === "s1-trigger", "focus returns to the trigger")
  },
}

const DECLARED = new Set<string>(["data-testid", "data-fixture", "data-kirana-portal", "data-hk"])
const VARIABLES = new Set<string>()
for (const component of Object.values(vocabulary)) {
  for (const part of Object.values<PartDefinition>(component)) {
    for (const state of Object.values(part.states ?? {})) DECLARED.add(state.attribute)
    for (const name of Object.keys(part.variables ?? {})) VARIABLES.add(name)
  }
}

mkdirSync(OUT, { recursive: true })
let failed = 0

for (const engine of engines) {
  const browser = await ENGINES[engine].launch({
    // A page that draws no frames must behave the same: nothing here waits for one.
    args: engine === "chromium" ? ["--disable-gpu", "--disable-software-rasterizer"] : [],
  })
  const servers: Record<string, ReturnType<typeof serve>> = {}
  const snapshots: Record<string, Map<string, string>> = {}
  // What each server sent, before any script ran.
  const sent: Record<string, string> = {}
  console.log(`\n${engine}`)

  try {
    for (const subject of subjects) {
      const { adapter, label, path } = subject
      const server = (servers[adapter] ??= serve(adapter))
      const recorded = new Map<string, string>()
      snapshots[label] = recorded
      if (subject.hydrated) {
        // With scripts off: the page as the server rendered it.
        const context = await browser.newContext({
          javaScriptEnabled: false,
          viewport: { width: 1000, height: 800 },
        })
        const page = await context.newPage()
        await page.goto(`http://localhost:${server.port}${path}`)
        sent[label] = withoutStyles(await page.evaluate(serialize))
        await context.close()
      }
      for (const [name, scenario] of Object.entries(scenarios)) {
        const context = await browser.newContext({ viewport: { width: 1000, height: 800 } })
        const page = await context.newPage()
        const errors: string[] = []
        page.on("pageerror", (error) => errors.push(error.message))
        page.on("console", (message) => {
          if (message.type() === "error" || message.type() === "warning")
            errors.push(message.text())
        })
        await page.goto(`http://localhost:${server.port}${path}`)
        await page.waitForSelector("main")
        const id = (testid: string) => page.locator(`[data-testid="${testid}"]`)
        const run: Run = {
          page,
          id,
          present: async (testid) => (await id(testid).count()) > 0,
          attribute: (testid, attribute) => id(testid).getAttribute(attribute),
          focused: () =>
            page.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? null),
          async snapshot(step) {
            await settled(page)
            recorded.set(`${name} / ${step}`, await page.evaluate(serialize))
            const undeclared = await page.evaluate(
              (declared) => [
                ...new Set(
                  [...document.querySelectorAll("main *, [data-kirana-portal] *")].flatMap(
                    (element) =>
                      [...element.attributes]
                        .map((each) => each.name)
                        .filter((each) => each.startsWith("data-") && !declared.includes(each))
                  )
                ),
              ],
              [...DECLARED]
            )
            expect(undeclared.length === 0, `not in the vocabulary: ${undeclared.join(", ")}`)
            const unnamed = await page.evaluate(
              (variables) => [
                ...new Set(
                  [
                    ...document.querySelectorAll<HTMLElement>("main *, [data-kirana-portal] *"),
                  ].flatMap((element) =>
                    [...element.style].filter(
                      (each) => each.startsWith("--") && !variables.includes(each)
                    )
                  )
                ),
              ],
              [...VARIABLES]
            )
            expect(unnamed.length === 0, `variables not in the vocabulary: ${unnamed.join(", ")}`)
          },
        }
        try {
          await scenario(run)
          expect(errors.length === 0, `the page reported: ${errors.join(" | ")}`)
          console.log(`ok    ${label}  ${name}`)
        } catch (error) {
          failed++
          const message = error instanceof Error ? error.message.split("\n")[0] : String(error)
          console.log(`FAIL  ${label}  ${name}: ${message}`)
        }
        await context.close()
      }
      writeFileSync(
        join(OUT, `${engine}-${label}.txt`),
        [...recorded].map(([step, dom]) => `### ${step}\n${dom}\n`).join("\n")
      )
    }

    // The same state, the same DOM, whatever rendered it.
    const [reference, ...others] = subjects.map((each) => each.label) as [string, ...string[]]
    // A page rendered on a server is, before its scripts run, the page at rest: nothing but the
    // geometry the client measures is missing, and hydration finds nothing to correct.
    const rest = withoutStyles(snapshots[reference]!.get("collapsible / at rest") ?? "")
    for (const [label, dom] of Object.entries(sent)) {
      if (dom === rest) {
        console.log(`same  ${label} as its server sent it = ${reference} at rest`)
        continue
      }
      failed++
      console.log(`DIFF  ${label} as its server sent it, against ${reference} at rest`)
      const a = rest.split("\n")
      const b = dom.split("\n")
      for (let line = 0; line < Math.max(a.length, b.length); line++) {
        if (a[line] === b[line]) continue
        console.log(`      ${reference}: ${a[line]?.trim()}\n      ${label}: ${b[line]?.trim()}`)
        break
      }
    }
    for (const adapter of others) {
      let different = 0
      for (const [step, expected] of snapshots[reference]!) {
        const actual = snapshots[adapter]!.get(step)
        if (actual === expected) continue
        different++
        failed++
        console.log(`DIFF  ${adapter} against ${reference}  ${step}`)
        if (actual === undefined) continue
        const a = expected.split("\n")
        const b = actual.split("\n")
        for (let line = 0; line < Math.max(a.length, b.length); line++) {
          if (a[line] === b[line]) continue
          console.log(
            `      ${reference}: ${a[line]?.trim()}\n      ${adapter}: ${b[line]?.trim()}`
          )
          break
        }
      }
      if (different === 0) {
        console.log(`same  ${adapter} = ${reference}  (${snapshots[reference]!.size} states)`)
      }
    }
  } finally {
    await browser.close()
    for (const server of Object.values(servers)) await server.stop(true)
  }
}

console.log(failed === 0 ? "\nconformance: passed" : `\nconformance: ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
