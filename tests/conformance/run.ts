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

/**
 * A serialized page without what only a browser adds: the geometry it measures, and the name a
 * part takes from an optional part (a progress bar's label, a fieldset's legend, a field's
 * description), which is known once that part is in the page.
 */
const withoutStyles = (dom: string) =>
  dom
    .replace(/ style="[^"]*"/g, "")
    .replace(/ aria-labelledby="[^"]*-(label|legend)"/g, "")
    .replace(/ aria-describedby="[^"]*-description"/g, "")
    // Whether a field has a value is its control's to say, once the control is in the page.
    .replace(/ data-filled/g, "")
    .replace(/\nfocus: .*$/s, "")

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
            // One spelling of a declaration: a server writes `width:40%`, a browser `width: 40%`.
            .map((part) => {
              const colon = part.indexOf(":")
              return colon < 0
                ? part.trim()
                : `${part.slice(0, colon).trim()}: ${part.slice(colon + 1).trim()}`
            })
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

  async simple({ page, snapshot, id, present, attribute, focused }) {
    await snapshot("at rest")
    expect((await attribute("b1", "type")) === "button", "a button is never a submit by accident")
    await id("b1").click()
    // What the caller draws from its own state arrives in its framework's time.
    await settled(page)
    expect((await id("b1").textContent())?.trim() === "Count 1", "a press reaches the caller")

    expect((await attribute("b2", "disabled")) === null, "kept in the tab order: not `disabled`")
    expect((await attribute("b2", "aria-disabled")) === "true", "but said to be disabled")
    expect((await attribute("b2", "data-disabled")) === "", "and marked for a style")
    await id("b2").focus()
    expect((await focused()) === "b2", "it takes focus")

    expect((await attribute("b3", "role")) === "button", "another element is given the role")
    expect((await attribute("b3", "tabindex")) === "0", "and a place in the tab order")
    await id("b3").focus()
    await page.keyboard.press("Enter")
    await settled(page)
    expect((await id("b1").textContent())?.trim() === "Count 2", "Enter presses it")
    await page.keyboard.press("Space")
    await settled(page)
    expect((await id("b1").textContent())?.trim() === "Count 3", "Space presses it")

    expect((await attribute("g1", "aria-pressed")) === "false", "a toggle starts off")
    await id("g1").click()
    await snapshot("buttons pressed")
    expect((await attribute("g1", "aria-pressed")) === "true", "a press turns it on")
    expect((await attribute("g1", "data-pressed")) === "", "pressed: data-pressed")

    expect((await attribute("sp1", "role")) === "separator", "role=separator")
    expect((await attribute("sp1", "aria-orientation")) === "horizontal", "horizontal by default")
    expect((await attribute("sp2", "data-orientation")) === "vertical", "or vertical")

    const width = (testid: string) =>
      id(testid).evaluate((element) => (element as HTMLElement).style.width)
    expect((await attribute("pr1", "role")) === "progressbar", "role=progressbar")
    expect((await attribute("pr1", "aria-valuenow")) === "40", "the value")
    expect((await attribute("pr1", "aria-valuetext")) === "40%", "as it is written")
    expect((await attribute("pr1", "aria-labelledby")) === "pr1-label", "named by its label")
    expect((await attribute("pr1", "data-progressing")) === "", "under way")
    expect((await width("pr1-fill")) === "40%", "the filled part is the value's share")
    expect((await id("pr1-value").textContent()) === "40%", "the value is written")
    expect((await attribute("pr2", "aria-valuenow")) === null, "not known: no value")
    expect((await attribute("pr2", "data-indeterminate")) === "", "and said so")
    expect((await width("pr2-fill")) === "", "with no width of its own")
    await id("pr1-more").click()
    await snapshot("progress complete")
    expect((await attribute("pr1", "data-complete")) === "", "at the end of the range: complete")
    expect((await width("pr1-fill")) === "100%", "the filled part follows")

    expect((await attribute("m1", "role")) === "meter", "role=meter")
    expect((await attribute("m1", "aria-valuenow")) === "30", "a meter's value")
    expect((await width("m1-fill")) === "50%", "its share of its own range")
    expect((await id("m1-value").textContent()) === "50%", "written as a share")
    expect((await attribute("m1", "data-progressing")) === null, "a meter is not a task")

    expect(await present("av1-fallback"), "with no picture, the stand-in shows")
    await id("av-load").click()
    await id("av1-image").waitFor({ state: "attached", timeout: 3000 })
    await page.waitForFunction(() => document.querySelectorAll("img").length === 1)
    await snapshot("pictures loaded")
    expect(!(await present("av1-fallback")), "a loaded picture replaces its stand-in")
    expect(!(await present("av2-image")), "a picture that cannot load is never drawn")
    expect(await present("av2-fallback"), "its stand-in stays")

    await id("ad1-trigger").click()
    await snapshot("alert dialog open")
    expect((await attribute("ad1-popup", "role")) === "alertdialog", "role=alertdialog")
    expect((await focused()) === "ad1-cancel", "focus moves in")
    await page.mouse.click(5, 5)
    await page.waitForTimeout(200)
    expect(await present("ad1-popup"), "a press outside does not dismiss an alert dialog")
    await id("ad1-cancel").click()
    await snapshot("alert dialog answered")
    expect(!(await present("ad1-popup")), "its own button closes it")
    expect((await focused()) === "ad1-trigger", "focus returns to the trigger")
  },

  async direction({ page, snapshot, id, present, attribute, focused }) {
    // How far the popup's edge is from its trigger's, on the side the text starts from.
    const edges = () =>
      page.evaluate(() => {
        const box = (testid: string) =>
          document.querySelector(`[data-testid="${testid}"]`)!.getBoundingClientRect()
        const trigger = box("dp1-trigger")
        const popup = box("dp1-positioner")
        return {
          left: Math.round(popup.left - trigger.left),
          right: Math.round(popup.right - trigger.right),
        }
      })
    const centred = () =>
      id("ds1-thumb").evaluate((element) =>
        (element as HTMLElement).style.getPropertyValue("translate")
      )
    await snapshot("right to left")
    expect((await attribute("dir-box", "dir")) === "rtl", "the page says right to left")
    expect((await centred()) === "50% -50%", "the thumb is centred the other way")
    await id("dt1-one").focus()
    await page.keyboard.press("ArrowLeft")
    expect((await focused()) === "dt1-two", "ArrowLeft: the next tab")
    await page.keyboard.press("ArrowRight")
    expect((await focused()) === "dt1-one", "ArrowRight: the tab before")
    await id("ds1-thumb").focus()
    await page.keyboard.press("ArrowLeft")
    expect((await attribute("ds1-thumb", "aria-valuenow")) === "41", "ArrowLeft: a step up")
    await page.keyboard.press("ArrowRight")
    expect((await attribute("ds1-thumb", "aria-valuenow")) === "40", "ArrowRight: a step down")

    await id("dp1-trigger").click()
    await page.waitForFunction(() =>
      document
        .querySelector<HTMLElement>('[data-testid="dp1-positioner"]')
        ?.style.transform.startsWith("translate")
    )
    await snapshot("a popup right to left")
    expect(
      (await attribute("dp1-positioner", "dir")) === "rtl",
      "a popup moved to the end of the page keeps its direction"
    )
    expect((await edges()).right === 0, "and starts at its trigger's right edge")
    await page.keyboard.press("Escape")
    await page.waitForFunction(() => !document.querySelector('[data-testid="dp1-popup"]'))
    expect(!(await present("dp1-popup")), "it closes")

    await id("dir-turn").click()
    await snapshot("turned left to right")
    expect((await attribute("dir-box", "dir")) === "ltr", "the page turned")
    expect((await centred()) === "-50% -50%", "the thumb follows the provider")
    await id("dt1-one").focus()
    await page.keyboard.press("ArrowRight")
    expect((await focused()) === "dt1-two", "ArrowRight: the next tab")
    await id("ds1-thumb").focus()
    await page.keyboard.press("ArrowRight")
    expect((await attribute("ds1-thumb", "aria-valuenow")) === "41", "ArrowRight: a step up")
    await id("dp1-trigger").click()
    await page.waitForFunction(() =>
      document
        .querySelector<HTMLElement>('[data-testid="dp1-positioner"]')
        ?.style.transform.startsWith("translate")
    )
    expect(
      (await attribute("dp1-positioner", "dir")) === null,
      "nothing is written where the page's direction already reaches"
    )
    expect((await edges()).left === 0, "and it starts at its trigger's left edge")
  },

  async slider({ page, snapshot, id, attribute, focused }) {
    const inline = (testid: string, name: string) =>
      id(testid).evaluate(
        (element, property) => (element as HTMLElement).style.getPropertyValue(property),
        name
      )
    const submitted = (testid: string) =>
      id(testid).evaluate((element) => element.querySelector("input")?.value)
    const at = async (testid: string, share: number) => {
      const box = (await id(testid).boundingBox())!
      return [box.x + box.width * share, box.y + box.height / 2] as const
    }
    await snapshot("at rest")
    expect((await attribute("sl1", "role")) === "group", "the root groups the parts")
    expect((await attribute("sl1-thumb", "role")) === "slider", "the thumb is the slider")
    expect((await attribute("sl1-thumb", "aria-valuenow")) === "40", "its value")
    expect((await attribute("sl1-thumb", "aria-valuemin")) === "0", "its range starts at 0")
    expect((await attribute("sl1-thumb", "aria-valuemax")) === "100", "and ends at 100")
    expect((await attribute("sl1-thumb", "aria-orientation")) === "horizontal", "horizontal")
    expect((await attribute("sl1-thumb", "tabindex")) === "0", "in the tab order")
    expect((await inline("sl1-thumb", "inset-inline-start")) === "40%", "placed by its value")
    expect((await inline("sl1-fill", "width")) === "40%", "the filled part reaches it")
    expect((await id("sl1-value").textContent())?.trim() === "40", "the value is written")
    expect((await submitted("sl1-thumb")) === "40", "a form reads it")

    await id("sl1-thumb").focus()
    await page.keyboard.press("ArrowRight")
    expect((await attribute("sl1-thumb", "aria-valuenow")) === "41", "ArrowRight: a step up")
    await page.keyboard.press("Shift+ArrowRight")
    expect((await attribute("sl1-thumb", "aria-valuenow")) === "51", "with Shift: a large step")
    await page.keyboard.press("PageDown")
    expect((await attribute("sl1-thumb", "aria-valuenow")) === "41", "Page Down: a large step down")
    await page.keyboard.press("ArrowDown")
    expect((await attribute("sl1-thumb", "aria-valuenow")) === "40", "ArrowDown: a step down")
    await page.keyboard.press("Home")
    expect((await attribute("sl1-thumb", "aria-valuenow")) === "0", "Home: the start")
    await page.keyboard.press("ArrowLeft")
    expect((await attribute("sl1-thumb", "aria-valuenow")) === "0", "and no further")
    await page.keyboard.press("End")
    await snapshot("moved by the keyboard")
    expect((await attribute("sl1-thumb", "aria-valuenow")) === "100", "End: the end")
    expect((await submitted("sl1-thumb")) === "100", "the form's value follows")

    await page.mouse.move(...(await at("sl1-control", 0.25)))
    await page.mouse.down()
    await snapshot("held by a pointer")
    expect(
      (await attribute("sl1-thumb", "aria-valuenow")) === "25",
      "a press on the track moves it"
    )
    expect((await attribute("sl1", "data-dragging")) === "", "held: data-dragging")
    expect((await focused()) === "sl1-thumb", "the thumb has focus")
    await page.mouse.move(...(await at("sl1-control", 0.6)))
    expect((await attribute("sl1-thumb", "aria-valuenow")) === "60", "and it follows the pointer")
    await page.mouse.up()
    await snapshot("let go")
    expect((await attribute("sl1", "data-dragging")) === null, "let go: no data-dragging")

    expect((await id("sl2-value").textContent())?.trim() === "20 – 80", "a range is written whole")
    expect((await inline("sl2-fill", "inset-inline-start")) === "20%", "filled from the first")
    expect((await inline("sl2-fill", "width")) === "60%", "to the last")
    expect((await attribute("sl2-to", "data-index")) === "1", "each thumb says which it is")
    await page.mouse.move(...(await at("sl2-control", 0.72)))
    await page.mouse.down()
    await page.mouse.up()
    await settled(page)
    expect((await id("sl2-output").textContent())?.trim() === "20,70", "the nearest thumb, by step")
    expect((await focused()) === "sl2-to", "and it has focus")
    await id("sl2-from").focus()
    await page.keyboard.press("End")
    await snapshot("a range moved")
    expect((await id("sl2-output").textContent())?.trim() === "70,70", "a thumb stops at the next")

    expect((await attribute("sl3-thumb", "aria-orientation")) === "vertical", "vertical")
    expect((await attribute("sl3-thumb", "aria-disabled")) === "true", "disabled is said")
    expect((await attribute("sl3-thumb", "tabindex")) === "-1", "and out of the tab order")
    expect((await inline("sl3-thumb", "bottom")) === "30%", "placed from the bottom")
    expect((await inline("sl3-fill", "height")) === "30%", "filled from the bottom")
    await id("sl3-control").click({ position: { x: 10, y: 10 }, force: true })
    expect((await attribute("sl3-thumb", "aria-valuenow")) === "30", "a disabled slider stays")
  },

  async field({ page, snapshot, id, present, attribute, focused }) {
    const text = async (testid: string) => (await id(testid).textContent())?.trim()
    await snapshot("at rest")
    expect((await attribute("fd1-label", "for")) === "fd1-control", "the label names the control")
    expect((await attribute("fd1-control", "id")) === "fd1-control", "by its id")
    expect((await attribute("fd1-control", "name")) === "email", "the field names it in the form")
    expect(
      (await attribute("fd1-control", "aria-describedby")) === "fd1-description",
      "the description is said with it"
    )
    expect((await attribute("fs1", "aria-labelledby")) === "fs1-legend", "a legend names its group")
    expect((await attribute("f1", "novalidate")) === "", "the browser's own bubbles are off")
    expect((await text("fd1-validity")) === "unchecked", "nothing is checked yet")

    await id("fd1-label").click()
    expect((await focused()) === "fd1-control", "a press on the label reaches the control")
    expect((await attribute("fd1", "data-focused")) === "", "focused: on every part")
    await page.keyboard.type("a")
    expect((await attribute("fd1", "data-dirty")) === "", "changed: dirty")
    expect((await attribute("fd1-label", "data-filled")) === "", "and filled")
    expect((await attribute("fd1", "data-invalid")) === null, "not checked as it is typed")
    await page.keyboard.press("Tab")
    await snapshot("touched")
    expect((await attribute("fd1", "data-touched")) === "", "left: touched")
    expect((await attribute("fd1", "data-focused")) === null, "and no longer focused")

    await id("f1-submit").click()
    await id("fd1-error").waitFor({ state: "attached", timeout: 3000 })
    await snapshot("invalid on submit")
    expect((await attribute("fd1", "data-invalid")) === "", "a submit checks the field")
    expect((await attribute("fd1-control", "aria-invalid")) === "true", "and says it is wrong")
    expect(((await text("fd1-error")) ?? "") !== "", "with the browser's message")
    expect(
      (await attribute("fd1-control", "aria-describedby")) === "fd1-description fd1-error",
      "which is said with the control"
    )
    expect((await text("fd1-validity")) === "invalid", "the validity is the caller's to draw")
    expect((await focused()) === "fd1-control", "focus goes to the first invalid control")
    expect((await text("f1-sent")) === "", "and nothing is sent")

    await page.keyboard.type("@b.co")
    await id("fd1-error").waitFor({ state: "detached", timeout: 3000 })
    await snapshot("put right")
    expect(
      (await attribute("fd1", "data-valid")) === "",
      "found wrong, it is checked as it changes"
    )
    expect(!(await present("fd1-error")), "and the message leaves")

    await id("fd2-control").focus()
    await page.keyboard.type("admin")
    expect(!(await present("fd2-error")), "checked on blur: not while typing")
    await page.keyboard.press("Tab")
    await id("fd2-error").waitFor({ state: "attached", timeout: 3000 })
    await snapshot("the field's own check")
    expect((await text("fd2-error")) === "Taken", "the field's own message")
    await id("fd2-control").fill("someone")
    await id("fd2-error").waitFor({ state: "detached", timeout: 3000 })

    await id("f1-submit").click()
    await settled(page)
    expect(
      (await text("f1-sent")) === '{"email":"a@b.co","user":"someone"}',
      "all valid: the values are the caller's"
    )

    await id("f1-reject").click()
    await id("fd2-error").waitFor({ state: "attached", timeout: 3000 })
    await snapshot("rejected from outside")
    expect((await text("fd2-error")) === "Reserved", "an error from outside shows on its field")
    expect((await attribute("fd2", "data-invalid")) === "", "which is invalid")
    await id("fd2-control").focus()
    await page.keyboard.type("1")
    await id("fd2-error").waitFor({ state: "detached", timeout: 3000 })
    expect((await attribute("fd2", "data-invalid")) === null, "until its value changes")
  },

  // The controls that are not native ones, each inside a field of a form.
  async "field-controls"({ page, snapshot, id, present, attribute, focused }) {
    const text = async (testid: string) => (await id(testid).textContent())?.trim()
    const input = (testid: string, name: string) =>
      id(testid).evaluate(
        (element, wanted) => element.querySelector("input")?.getAttribute(wanted) ?? null,
        name
      )
    await snapshot("at rest")
    expect((await input("fc1-box", "name")) === "terms", "a box takes its field's name")
    expect((await input("fc1-box", "id")) === "fc1-control", "and the id its label is for")
    expect((await input("fc1-box", "required")) === null, "its hidden input is never required")
    expect((await attribute("fc1-box", "aria-labelledby")) === "fc1-label", "named by the label")
    expect((await attribute("fc2-group", "aria-labelledby")) === "fc2-label", "a group too")
    expect((await input("fc2-free", "name")) === "plan", "its radios take the field's name")
    expect(
      (await attribute("fc3-thumb", "aria-disabled")) === "true",
      "a field disables its control"
    )
    expect((await attribute("fc3-slider", "data-disabled")) === "", "and marks it")
    expect((await attribute("fc5-trigger", "aria-labelledby")) === "fc5-label", "a select too")

    await id("f2-submit").click()
    await id("fc5-error").waitFor({ state: "attached", timeout: 3000 })
    await snapshot("invalid on submit")
    expect(
      ((await text("fc1-error")) ?? "") !== "",
      "a required box says so, in the browser's words"
    )
    expect((await attribute("fc1-box", "aria-invalid")) === "true", "and is marked invalid")
    expect((await attribute("fc1-box", "data-invalid")) === "", "for a style too")
    expect(
      (await attribute("fc1-box", "aria-describedby")) === "fc1-error",
      "the message is said with the box"
    )
    expect(((await text("fc2-error")) ?? "") !== "", "a required group too")
    expect(((await text("fc5-error")) ?? "") !== "", "and a required select")
    expect((await focused()) === "fc1-box", "focus goes to the first invalid control")
    expect((await text("f2-sent")) === "", "and nothing is sent")

    await id("fc1-label").click()
    await id("fc1-error").waitFor({ state: "detached", timeout: 3000 })
    expect((await attribute("fc1-box", "aria-checked")) === "true", "a press on the label ticks it")
    expect((await attribute("fc1", "data-valid")) === "", "which puts the field right")
    expect((await attribute("fc1", "data-dirty")) === "", "and dirty")

    await id("fc2-label").click()
    expect((await focused()) === "fc2-free", "a press on a group's label goes to the group")
    expect((await attribute("fc2", "data-focused")) === "", "which is then focused")
    await page.keyboard.press("ArrowDown")
    await id("fc2-error").waitFor({ state: "detached", timeout: 3000 })
    expect((await attribute("fc2-pro", "aria-checked")) === "true", "an arrow chooses")
    expect((await attribute("fc2", "data-focused")) === "", "focus is still in the group")

    await id("fc4-label").click()
    expect(
      (await attribute("fc4-switch", "aria-checked")) === "true",
      "a label turns its switch on"
    )
    expect((await attribute("fc4", "data-filled")) === "", "which then has a value")

    await id("fc5-label").click()
    expect((await focused()) === "fc5-trigger", "a press on a select's label goes to its trigger")
    expect((await attribute("fc2", "data-touched")) === "", "the group was left: touched")
    expect(!(await present("fc5-popup")), "and does not open it")
    await page.keyboard.press("ArrowDown")
    await id("fc5-Apple").click()
    await id("fc5-error").waitFor({ state: "detached", timeout: 3000 })
    await snapshot("put right")
    expect((await attribute("fc5", "data-valid")) === "", "a chosen value puts the select right")

    await id("f2-submit").click()
    await settled(page)
    expect(
      (await text("f2-sent")) === '{"terms":"on","plan":"pro","alerts":"on","fruit":"Apple"}',
      "all valid: every control's value is sent, a disabled one's left out"
    )
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
    const scrolled = await page.evaluate(() => window.scrollY)
    await page.mouse.down()
    await gone("h2-popup")
    await page.mouse.up()
    expect(
      (await page.evaluate(() => window.scrollY)) === scrolled,
      "the page stays where it is when a press closes a tooltip"
    )
    await away()
    await snapshot("tooltip closed by a press")

    await page.waitForTimeout(450)
    // From a known scroll position: the popup's available height is measured from the viewport.
    await page.evaluate(() => window.scrollTo(0, 0))
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
        // A length that is the value itself is in what the server sent, not measured later.
        const width = await page.evaluate(
          () => document.querySelector<HTMLElement>('[data-testid="pr1-fill"]')?.style.width
        )
        if (width !== "40%") {
          failed++
          console.log(`FAIL  ${label}  the server wrote the progress bar's width, got "${width}"`)
        }
        const place = await page.evaluate(() =>
          document
            .querySelector<HTMLElement>('[data-testid="sl1-thumb"]')
            ?.style.getPropertyValue("inset-inline-start")
        )
        if (place !== "40%") {
          failed++
          console.log(`FAIL  ${label}  the server wrote the slider thumb's place, got "${place}"`)
        }
        // What a provider states is known on a server, which has no layout to read it from.
        const centred = await page.evaluate(() =>
          document
            .querySelector<HTMLElement>('[data-testid="ds1-thumb"]')
            ?.style.getPropertyValue("translate")
        )
        if (centred !== "50% -50%") {
          failed++
          console.log(`FAIL  ${label}  the server centred a right-to-left thumb, got "${centred}"`)
        }
        await context.close()
      }
      for (const [name, scenario] of Object.entries(scenarios)) {
        const context = await browser.newContext({ viewport: { width: 1000, height: 800 } })
        const page = await context.newPage()
        const errors: string[] = []
        page.on("pageerror", (error) => errors.push(error.message))
        page.on("console", (message) => {
          // Firefox's note on a popup that follows its anchor as the page scrolls: that is what
          // a positioned popup does, and nothing went wrong.
          if (message.text().includes("scroll-linked positioning effect")) return
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
