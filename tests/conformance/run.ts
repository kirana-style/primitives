/**
 * The conformance run: one set of scenarios, played on every adapter's fixture page in a real
 * browser. Each scenario asserts the behaviour (keyboard, focus, presence, forms), and after each
 * step the page's DOM is serialized; at the end the serializations are compared across adapters,
 * state by state. The adapters differ in nothing a stylesheet, a test or a tool can see, or the
 * run fails. Every `data-*` attribute met is also held to the vocabulary.
 *
 *   bun tests/conformance/run.ts [adapter…]      default: every fixture that is built
 *   bun tests/conformance/run.ts react --only menu --slow 6
 *   bun tests/conformance/run.ts --jobs 1        one subject at a time (default: up to 6 at once)
 *
 * It serves each fixture's `dist/` itself and stops its servers and its browser before it exits.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { availableParallelism } from "node:os"
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
/** An option with a value, taken out of what was asked. */
function option(name: string): string | undefined {
  const at = asked.indexOf(name)
  return at < 0 ? undefined : asked.splice(at, 2)[1]
}
// `--only menu`: one scenario. `--slow 6`: Chromium's processor six times slower, as a shared
// runner's is: what depends on how fast a framework draws shows there.
// `--jobs 1`: one subject at a time (the default plays several at once, each in its own
// browser context; a fault that only shows under load is looked at alone).
const jobsAsked = option("--jobs") ?? process.env.CONFORMANCE_JOBS
/**
 * How many subjects at once. Chromium carries six, measured: 352 s one at a time, 120 s with six
 * and its timed scenarios alone, every run passing. Firefox gained nothing from three and failed one run in two, on scenarios
 * that time a press or a frame: it and WebKit play one at a time unless asked.
 */
const jobsFor = (engine: string) =>
  Math.max(1, Number(jobsAsked ?? Math.min(engine === "chromium" ? 6 : 1, availableParallelism())))
// Scenarios that measure a wait or look for one frame (a tooltip's delay, a dialog's first
// style): played with nothing else on the machine, or what is measured is the machine and not
// the component. Firefox failed both with six pages at once.
const TIMED = new Set(["hover", "dialog"])
let playing = 0
let held = false
let asking = 0
const waiting: (() => void)[] = []
const turn = () => new Promise<void>((resolve) => void waiting.push(resolve))
const wake = () => {
  for (const each of waiting.splice(0)) each()
}

/** With the others. Waits while a timed scenario has, or is asking for, the machine. */
async function together(run: () => Promise<void>): Promise<void> {
  while (held || asking > 0) await turn()
  playing++
  try {
    await run()
  } finally {
    playing--
    wake()
  }
}

/** With nothing else being played. */
async function alone(run: () => Promise<void>): Promise<void> {
  asking++
  while (held || playing > 0) await turn()
  asking--
  held = true
  try {
    await run()
  } finally {
    held = false
    wake()
  }
}

const only = option("--only")
const slow = Number(option("--slow") ?? 1)
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
// Then the second page (`src/Open.*`), the same two ways: no id is given on it, and a popover is
// open when it is first drawn.
const subjects = adapters.flatMap((adapter) => {
  const built = (file: string) => existsSync(join(ROOT, "fixtures", adapter, "dist", file))
  const all = [
    { adapter, label: adapter, path: "/", hydrated: false, second: false },
    { adapter, label: `${adapter}+ssr`, path: "/ssr.html", hydrated: true, second: false },
    { adapter, label: `${adapter} second`, path: "/open.html", hydrated: false, second: true },
    {
      adapter,
      label: `${adapter}+ssr second`,
      path: "/open-ssr.html",
      hydrated: true,
      second: true,
    },
  ]
  // React once more as a development build in StrictMode: every effect run, undone and run
  // again, every ref handed over twice, and React's own warnings (a hydration mismatch, a
  // controlled input) reported as errors.
  if (adapter === "react") {
    all.push(
      {
        adapter,
        label: "react+strict",
        path: "/strict/index.html",
        hydrated: false,
        second: false,
      },
      {
        adapter,
        label: "react+strict+ssr",
        path: "/strict/ssr.html",
        hydrated: true,
        second: false,
      },
      {
        adapter,
        label: "react+strict second",
        path: "/strict/open.html",
        hydrated: false,
        second: true,
      },
      {
        adapter,
        label: "react+strict+ssr second",
        path: "/strict/open-ssr.html",
        hydrated: true,
        second: true,
      }
    )
  }
  return all.filter((each) => each.path === "/" || built(each.path.slice(1)))
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
  // `data-hk` is Solid's hydration key, on what a server rendered; `ngh`, `ng-server-context` and
  // `jsaction` are Angular's (the last marks a listener whose events it replays after hydration).
  const SKIP = new Set([
    "ng-version",
    "data-testid",
    "data-hk",
    "ngh",
    "ng-server-context",
    "jsaction",
  ])
  const lines: string[] = []
  // A page whose ids are generated: each framework writes its own (`_r_1_`, `v-0`, `kui-3`), so
  // an id is named by where it first stands in the page, and one that is not in the page (a
  // popup a server did not draw) by that.
  const generated = document.querySelector("main")!.hasAttribute("data-generated-ids")
  const names = new Map<string, string>()
  if (generated) {
    for (const each of document.querySelectorAll("main [id], body > [data-kirana-portal] [id]"))
      if (!names.has(each.id)) names.set(each.id, `id-${names.size + 1}`)
  }
  const REFERENCES = new Set([
    "id",
    "for",
    "aria-controls",
    "aria-labelledby",
    "aria-describedby",
    "aria-details",
  ])
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
        if (generated && REFERENCES.has(each.name)) {
          value = value
            .split(/\s+/)
            .filter(Boolean)
            .map((token) => names.get(token) ?? "id-absent")
            .join(" ")
        }
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

    // A form's reset reaches each control as it reaches a native one: back to where it began,
    // whether the control holds its value (the box, the group) or its caller does (the switch).
    await id("x1").click()
    await id("w1").click()
    await id("r1-free").click()
    expect((await form("terms")).join() === "on", "before the reset: the box is checked")
    expect((await form("plan")).join() === "free", "before the reset: another plan")
    await id("f1-reset").click()
    await snapshot("after the form's reset")
    expect((await attribute("x1", "aria-checked")) === "false", "reset: the box is unchecked")
    expect((await form("terms")).length === 0, "reset: and not submitted")
    expect((await id("w1-output").textContent()) === "off", "reset: the switch's caller hears it")
    expect((await attribute("w1", "aria-checked")) === "false", "reset: the switch is off")
    expect((await form("alerts")).length === 0, "reset: and not submitted")
    expect((await attribute("r1-pro", "aria-checked")) === "true", "reset: the first plan again")
    expect((await attribute("r1-free", "aria-checked")) === "false", "reset: and only that one")
    expect((await form("plan")).join() === "pro", "reset: the form submits it")
    expect((await attribute("r1-pro", "tabindex")) === "0", "reset: it is the tab stop again")
    // The native inputs and the controls still agree: a press after a reset is heard.
    await id("x1").click()
    expect((await attribute("x1", "aria-checked")) === "true", "a press after a reset checks")
    expect((await form("terms")).join() === "on", "and is submitted")
    await id("w1").click()
    await id("r1-max").click()
    await snapshot("pressed after the reset")
    expect((await id("w1-output").textContent()) === "on", "the switch too")
    expect((await form("plan")).join() === "max", "and the group")
    await id("f1-reset").click()
    await snapshot("after a second reset")
    expect((await form("terms")).length === 0, "a second reset: the box")
    expect((await form("alerts")).length === 0, "a second reset: the switch")
    expect((await form("plan")).join() === "pro", "a second reset: the group")
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

    // The press itself may bring the trigger into view: that is not the list's doing.
    await id("s1-trigger").scrollIntoViewIfNeeded()
    const scrolled = await page.evaluate(() => window.scrollY)
    await id("s1-trigger").click()
    await snapshot("open")
    expect(
      (await page.evaluate(() => window.scrollY)) === scrolled,
      "opening the list does not scroll the page"
    )
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

  async menu({ page, snapshot, id, present, attribute, focused }) {
    const output = async () => ((await id("mn1-output").textContent()) ?? "").trim()
    const key = async (name: string) => {
      await page.keyboard.press(name)
      await settled(page)
    }
    // With room under it: where its popups go is then the same whatever the page's scroll.
    await id("mn1-trigger").evaluate((element) => element.scrollIntoView({ block: "start" }))
    expect((await attribute("mn1-trigger", "aria-haspopup")) === "menu", "the trigger has a menu")
    expect((await attribute("mn1-trigger", "aria-expanded")) === "false", "which is closed")

    const scroll = () => page.evaluate(() => window.scrollY)
    const before = await scroll()
    await id("mn1-trigger").focus()
    await key("Enter")
    await snapshot("open from the keyboard")
    expect((await scroll()) === before, "opening the menu does not scroll the page")
    expect((await attribute("mn1-popup", "role")) === "menu", "the popup is a menu")
    expect(
      (await attribute("mn1-popup", "aria-labelledby")) === "mn1-trigger",
      "named by its trigger"
    )
    expect((await focused()) === "mn1-new", "from the keyboard, the first item has focus")
    expect((await attribute("mn1-new", "data-highlighted")) === "", "and the highlight")
    expect(
      (await attribute("mn1-lone", "role")) === "presentation",
      "a label in no group is plain text"
    )
    expect(
      (await attribute("mn1-group", "aria-labelledby")) === "mn1-g-label",
      "a group is named by its label"
    )

    await key("ArrowDown")
    expect((await focused()) === "mn1-print", "ArrowDown passes a disabled item")
    await key("ArrowDown")
    expect((await focused()) === "mn1-wrap", "a separator is not a stop")
    expect((await attribute("mn1-wrap", "role")) === "menuitemcheckbox", "a checkbox item")
    expect((await attribute("mn1-wrap", "aria-checked")) === "true", "checked by its default")
    await key("Enter")
    await snapshot("a checkbox item unchecked")
    expect((await attribute("mn1-wrap", "aria-checked")) === "false", "Enter toggles it")
    expect(await present("mn1-popup"), "and the menu stays open")
    await key(" ")
    expect((await attribute("mn1-wrap", "aria-checked")) === "true", "Space toggles it back")

    await key("ArrowDown")
    expect((await focused()) === "mn1-list", "into the radio group")
    expect((await attribute("mn1-list", "aria-checked")) === "true", "the value is checked")
    await key("ArrowDown")
    await key("Enter")
    await snapshot("a radio item chosen")
    expect((await attribute("mn1-grid", "aria-checked")) === "true", "Enter chooses a radio item")
    expect((await attribute("mn1-list", "aria-checked")) === "false", "one at a time")
    expect((await output()) === "none grid", "the caller hears the value")
    expect(await present("mn1-popup"), "and the menu stays open")

    await key("ArrowDown")
    expect((await focused()) === "mn1-share", "a submenu's trigger is an item")
    expect((await attribute("mn1-share", "aria-haspopup")) === "menu", "that has a menu")
    await key("ArrowDown")
    expect((await focused()) === "mn1-new", "past the last item, the first")
    await key("ArrowUp")
    expect((await focused()) === "mn1-share", "and back")
    await key("ArrowLeft")
    expect(!(await present("mn1s-popup")), "the arrow against the text opens nothing")

    await key("ArrowRight")
    await snapshot("a submenu open")
    expect((await scroll()) === before, "nor does moving through it or opening a submenu")
    expect((await focused()) === "mn1s-mail", "ArrowRight opens the submenu on its first item")
    expect((await attribute("mn1-share", "aria-expanded")) === "true", "its trigger says so")
    expect((await attribute("mn1-share", "data-highlighted")) === "", "and keeps the highlight")
    const beside = await page.evaluate(() => {
      const trigger = document.querySelector('[data-testid="mn1-share"]')!.getBoundingClientRect()
      const popup = document.querySelector('[data-testid="mn1s-popup"]')!.getBoundingClientRect()
      return popup.left >= trigger.right - 1
    })
    expect(beside, "the submenu is beside its trigger")
    await page.keyboard.type("p")
    expect((await focused()) === "mn1s-mail", "a letter typed in a submenu is not its menu's")
    await key("ArrowLeft")
    expect((await focused()) === "mn1-share", "ArrowLeft goes back to the trigger")
    expect(!(await present("mn1s-popup")), "and closes the submenu")
    expect(await present("mn1-popup"), "not the menu")

    await key("Enter")
    expect((await focused()) === "mn1s-mail", "Enter opens it too")
    await key("Escape")
    expect((await focused()) === "mn1-share", "Escape closes one menu")
    expect(await present("mn1-popup"), "at a time")
    await key("ArrowRight")
    await key("ArrowDown")
    await key("Enter")
    await snapshot("chosen in a submenu")
    expect(!(await present("mn1s-popup")), "an item chosen in a submenu closes it")
    expect(!(await present("mn1-popup")), "and every menu it was opened from")
    expect((await output()) === "link grid", "the item's own press is heard")
    expect((await focused()) === "mn1-trigger", "focus returns to the trigger")

    await id("mn1-trigger").click()
    await snapshot("open from a pointer")
    expect((await focused()) === "mn1-popup", "from a pointer, the menu itself has focus")
    await id("mn1-print").hover()
    expect((await focused()) === "mn1-print", "the pointer moves the highlight and focus")
    await id("mn1-open").hover()
    await settled(page)
    expect((await attribute("mn1-print", "data-highlighted")) === null, "and takes it away")
    expect((await attribute("mn1-open", "data-highlighted")) === null, "a disabled item has none")
    await id("mn1-share").hover()
    await page.waitForTimeout(250)
    await settled(page)
    expect(await present("mn1s-popup"), "a pointer resting on a submenu's trigger opens it")
    expect((await focused()) === "mn1-share", "focus stays on the trigger")
    await id("mn1s-mail").hover()
    await snapshot("a submenu open from a pointer")
    expect((await focused()) === "mn1s-mail", "until the pointer goes in")
    expect((await attribute("mn1-share", "data-popup-open")) === "", "the trigger shows it is open")
    await id("mn1-print").hover()
    await settled(page)
    expect(!(await present("mn1s-popup")), "the pointer on another item closes the submenu")
    await id("mn1-new").click()
    await settled(page)
    expect(!(await present("mn1-popup")), "a pressed item closes the menu")
    expect((await output()) === "new grid", "and is heard")

    await id("mn1-trigger").click()
    await settled(page)
    await page.keyboard.type("p")
    expect((await focused()) === "mn1-print", "typing finds an item by its name")
    await page.waitForTimeout(600)
    await page.keyboard.type("n")
    // "⌘N" beside New is not part of its name; "N" finds it by "New".
    expect((await focused()) === "mn1-new", "not by the shortcut drawn beside it")
    await key("Tab")
    expect(!(await present("mn1-popup")), "Tab closes the menu")
    expect((await focused()) === "mn1-trigger", "and its trigger has focus")

    await id("mn1-trigger").click()
    await settled(page)
    await id("mn1-output").click()
    await snapshot("closed by a press outside")
    expect(!(await present("mn1-popup")), "a press outside closes the menu")
  },

  async "context-menu"({ page, snapshot, id, present, attribute, focused }) {
    const key = async (name: string) => {
      await page.keyboard.press(name)
      await settled(page)
    }
    /** Where the popup is, from the area's corner. */
    const at = () =>
      page.evaluate(() => {
        const area = document.querySelector<HTMLElement>('[data-testid="cm1-area"]')!
        const box = area.getBoundingClientRect()
        const popup = document.querySelector('[data-testid="cm1-popup"]')!.getBoundingClientRect()
        // From inside the area's border, where a press is counted from.
        return [popup.left - box.left - area.clientLeft, popup.top - box.top - area.clientTop]
      })
    // Within a pixel: the popup is put on whole pixels, the area may not be on one.
    const near = async (x: number, y: number) => {
      const [left, top] = await at()
      return Math.abs(left! - x) <= 1 && Math.abs(top! - y) <= 1
    }
    await id("cm1-area").evaluate((element) => element.scrollIntoView({ block: "center" }))
    const scrolled = await page.evaluate(() => window.scrollY)
    expect((await attribute("cm1-area", "aria-haspopup")) === null, "the area is not a button")

    await id("cm1-area").click({ button: "right", position: { x: 40, y: 30 } })
    await snapshot("open at the pointer")
    expect(await present("cm1-popup"), "a secondary press opens the menu")
    expect(await near(40, 30), "where the pointer is")
    expect((await attribute("cm1-popup", "role")) === "menu", "it is a menu")
    expect((await attribute("cm1-popup", "aria-labelledby")) === null, "named by no trigger")
    expect((await attribute("cm1-area", "data-popup-open")) === "", "the area shows it is open")
    expect((await focused()) === "cm1-popup", "the menu has focus")
    expect((await page.evaluate(() => window.scrollY)) === scrolled, "and the page has not moved")
    await key("ArrowDown")
    expect((await focused()) === "cm1-copy", "the arrows move through it")

    await id("cm1-area").click({ button: "right", position: { x: 150, y: 60 } })
    await snapshot("moved to a second press")
    expect(await present("cm1-popup"), "a second press leaves it open")
    expect(await near(150, 60), "and moves it there")

    await key("End")
    await key("Enter")
    await snapshot("chosen")
    expect(!(await present("cm1-popup")), "a chosen item closes it")
    expect((await id("mb1-output").textContent()) === "cm1-paste", "and is heard")

    await id("cm1-area").click({ button: "right", position: { x: 20, y: 20 } })
    await settled(page)
    await id("cm1-area").click({ position: { x: 250, y: 100 } })
    await snapshot("closed by a press in the area")
    expect(!(await present("cm1-popup")), "a plain press in the area closes it")
  },

  async listbox({ page, snapshot, id, attribute, focused }) {
    const key = async (name: string) => {
      await page.keyboard.press(name)
      await settled(page)
    }
    const output = () => id("lb1-output").textContent()
    expect((await attribute("lb1", "role")) === "listbox", "the list is a listbox")
    expect((await attribute("lb1", "tabindex")) === "0", "and one stop for Tab")
    expect((await attribute("lb1-Banana", "aria-selected")) === "true", "its value is chosen")

    await id("lb1").focus()
    await settled(page)
    await snapshot("focus in the list")
    expect((await focused()) === "lb1-Banana", "focus goes to the chosen item")
    expect((await attribute("lb1", "tabindex")) === "-1", "the list is then no stop of its own")
    await key("ArrowDown")
    expect((await focused()) === "lb1-Cherry", "ArrowDown passes a disabled item")
    await key(" ")
    await snapshot("another chosen")
    expect((await output()) === "Cherry", "Space chooses, one at a time")
    expect((await attribute("lb1-Banana", "aria-selected")) === "false", "the other is let go")
    await page.keyboard.type("ap")
    expect((await focused()) === "lb1-Apple", "typing finds an item")
    await key("Enter")
    expect((await output()) === "Apple", "Enter chooses too")
    await id("lb1-Grape").click()
    await settled(page)
    expect((await output()) === "Grape", "and a press")
    expect((await focused()) === "lb1-Grape", "which takes focus there")
    await id("lb1-Blueberry").click({ force: true })
    await settled(page)
    expect((await output()) === "Grape", "a disabled item is not chosen")

    expect((await attribute("lb2", "aria-multiselectable")) === "true", "a list of several")
    expect((await attribute("lb2-group", "aria-labelledby")) === "lb2-g-label", "a named group")
    await id("lb2-free").click()
    await id("lb2-team").click()
    await id("lb2-free").click()
    await snapshot("several, one taken away")
    expect((await attribute("lb2-team", "aria-selected")) === "true", "a press adds")
    expect((await attribute("lb2-free", "aria-selected")) === "false", "and takes away")
  },

  async combobox({ page, snapshot, id, present, attribute, focused }) {
    const key = async (name: string) => {
      await page.keyboard.press(name)
      await settled(page)
    }
    const output = () => id("cb1-output").textContent()
    const submitted = () =>
      page.evaluate(() =>
        new FormData(document.querySelector<HTMLFormElement>('[data-testid="cb1-form"]')!).get(
          "pick"
        )
      )
    const shown = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[data-testid="cb1-popup"] [role="option"]')]
          .filter((each) => each.getClientRects().length > 0)
          .map((each) => each.id.replace("cb1-", ""))
          .join()
      )
    const text = () => id("cb1-input").inputValue()
    await id("cb1-input").scrollIntoViewIfNeeded()
    const scrolled = await page.evaluate(() => window.scrollY)
    expect((await attribute("cb1-input", "role")) === "combobox", "the input is a combobox")
    expect((await attribute("cb1-input", "aria-expanded")) === "false", "which is closed")

    await id("cb1-input").focus()
    await page.keyboard.type("ap")
    await settled(page)
    await snapshot("filtered by what is typed")
    // "Grape" holds it too.
    expect(
      (await shown()) === "Apple,Apricot,Grape",
      "typing opens the list on what holds the text"
    )
    expect((await focused()) === "cb1-input", "focus stays in the input")
    expect(
      (await attribute("cb1-input", "aria-activedescendant")) === "cb1-Apple",
      "which names the first shown item"
    )
    expect((await attribute("cb1-Apple", "data-highlighted")) === "", "the highlighted one")
    expect((await page.evaluate(() => window.scrollY)) === scrolled, "the page has not moved")
    await key("ArrowDown")
    expect(
      (await attribute("cb1-input", "aria-activedescendant")) === "cb1-Apricot",
      "ArrowDown moves the highlight"
    )
    await page.keyboard.type("x")
    await settled(page)
    await snapshot("nothing shown")
    expect((await shown()) === "", "nothing holds the text")
    expect(await present("cb1-empty"), "and the list says so")
    await key("Backspace")
    expect(!(await present("cb1-empty")), "until something does again")

    await key("Enter")
    await snapshot("chosen by Enter")
    expect(!(await present("cb1-popup")), "Enter chooses the highlighted item and closes")
    expect((await output()) === "Apple", "the caller hears the value")
    expect((await text()) === "Apple", "the input says it")
    expect((await submitted()) === "Apple", "the form submits it")
    expect((await focused()) === "cb1-input", "focus is still in the input")

    await key("ArrowDown")
    await snapshot("open on every item")
    expect(
      (await shown()) === "Apple,Apricot,Banana,Blueberry,Cherry,Grape",
      "opened, all are shown"
    )
    expect(
      (await attribute("cb1-input", "aria-activedescendant")) === "cb1-Apple",
      "on the chosen one"
    )
    expect((await attribute("cb1-Apple", "aria-selected")) === "true", "which is selected")
    await page.keyboard.type("z")
    await settled(page)
    await key("Escape")
    expect(!(await present("cb1-popup")), "Escape closes")
    expect((await text()) === "Apple", "and the input says what is chosen again")

    await id("cb1-trigger").click()
    await settled(page)
    expect(await present("cb1-popup"), "the button opens the list")
    expect((await focused()) === "cb1-input", "with focus in the input")
    await id("cb1-Blueberry").click({ force: true })
    await settled(page)
    expect(await present("cb1-popup"), "a disabled item is not chosen")
    await id("cb1-Cherry").hover()
    expect((await attribute("cb1-Cherry", "data-highlighted")) === "", "the pointer highlights")
    await id("cb1-Cherry").click()
    await snapshot("chosen by a press")
    expect((await output()) === "Cherry", "a press chooses")
    expect((await focused()) === "cb1-input", "and focus never left the input")

    await id("cb1-input").fill("")
    await settled(page)
    expect((await output()) === "none", "emptied, nothing is chosen")
    // At the page's corner: under the input, the open list may cover what is there.
    await page.mouse.click(2, 2)
    await snapshot("closed by a press outside")
    expect(!(await present("cb1-popup")), "a press outside closes the list")
  },

  async "menu-more"({ page, snapshot, id, present, attribute, focused }) {
    const key = async (name: string) => {
      await page.keyboard.press(name)
      await settled(page)
    }
    const centre = (testid: string) =>
      id(testid).evaluate((element) => {
        const box = element.getBoundingClientRect()
        return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
      })
    await id("mm1-trigger").evaluate((element) => element.scrollIntoView({ block: "center" }))

    // One press: down on the trigger, across to an item, and let go there.
    const from = await centre("mm1-trigger")
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await settled(page)
    expect(await present("mm1-popup"), "the menu opens as the button goes down")
    expect((await focused()) === "mm1-popup", "and has focus, not the pressed button")
    await page.waitForTimeout(250)
    const to = await centre("mm1-plain")
    await page.mouse.move(to.x, to.y, { steps: 4 })
    expect(
      (await attribute("mm1-plain", "data-highlighted")) === "",
      "the press travels to an item"
    )
    await page.mouse.up()
    await settled(page)
    expect(!(await present("mm1-popup")), "letting go there chooses it")

    await id("mm1-trigger").click()
    await snapshot("a modal menu open")
    expect(await present("mm1-popup"), "a plain press opens it, and its click does not close it")
    expect(
      (await page.evaluate(() => getComputedStyle(document.documentElement).overflow)) === "hidden",
      "a modal menu holds the page's scroll"
    )
    expect((await attribute("mm1-link", "role")) === "menuitem", "a link is an item")
    await id("mm1-outside").click()
    await snapshot("closed by a press that reached nothing")
    expect(!(await present("mm1-popup")), "a press outside closes it")
    expect((await id("mm1-output").textContent()) === "0", "and reaches nothing")
    await id("mm1-outside").click()
    await settled(page)
    expect((await id("mm1-output").textContent()) === "1", "the next press is the page's")

    await id("mm1-trigger").focus()
    await key("Enter")
    await key("End")
    expect((await focused()) === "mm1-link", "the arrows reach a link item")
    await key("Enter")
    expect(page.url().endsWith("#mm1-linked"), "Enter follows the link")
    expect(!(await present("mm1-popup")), "and closes the menu")

    expect((await attribute("vb1", "aria-orientation")) === "vertical", "a bar that is a column")
    await id("vb1-one").focus()
    await key("ArrowDown")
    expect((await focused()) === "vb1-two", "ArrowDown goes down its triggers")
    await key("ArrowRight")
    await snapshot("a column's menu open")
    expect((await focused()) === "vb1b-x", "ArrowRight opens the menu")
    expect((await attribute("vb1b-positioner", "data-side")) === "right", "beside its trigger")
    await key("ArrowLeft")
    expect((await focused()) === "vb1-two", "ArrowLeft closes it")
  },

  async toolbar({ page, snapshot, id, attribute, focused }) {
    const key = async (name: string) => {
      await page.keyboard.press(name)
      await settled(page)
    }
    const output = () => id("tg1-output").textContent()
    expect((await attribute("tg1", "role")) === "group", "a toggle group is a group")
    expect((await attribute("tg1-left", "aria-pressed")) === "true", "its value is pressed")

    await id("tg1-left").focus()
    await key("ArrowRight")
    expect((await focused()) === "tg1-centre", "ArrowRight goes to the next toggle")
    await key("ArrowRight")
    expect((await focused()) === "tg1-right", "past a disabled one")
    await key("ArrowRight")
    expect((await focused()) === "tg1-left", "and round")
    await snapshot("focus in the group")
    expect((await attribute("tg1-left", "tabindex")) === "0", "the group is one stop")
    expect((await attribute("tg1-right", "tabindex")) === "-1", "at the toggle focus is on")
    await key("ArrowRight")
    await key(" ")
    await snapshot("another pressed")
    expect((await output()) === "centre", "a press takes the place of the other")
    expect((await attribute("tg1-left", "aria-pressed")) === "false", "one at a time")
    await key(" ")
    await settled(page)
    expect((await output()) === "", "pressed again, none is")

    expect((await attribute("tb1", "role")) === "toolbar", "a toolbar")
    expect((await attribute("tb1-line", "aria-orientation")) === "vertical", "its line stands")
    await id("tb1-save").focus()
    await key("ArrowRight")
    expect((await focused()) === "tb1-link", "the arrows pass a disabled button")
    await key("ArrowRight")
    expect((await focused()) === "tb1-zoom", "and reach an input")
    await key("Home")
    await key("ArrowRight")
    expect((await focused()) === "tb1-zoom", "whose arrows are its own inside its text")
    await key("End")
    await key("ArrowRight")
    expect((await focused()) === "tb1-bold", "until the caret is at the end")
    await key(" ")
    await key("ArrowRight")
    await key(" ")
    await snapshot("toggles in a toolbar")
    expect((await attribute("tb1-bold", "aria-pressed")) === "true", "a group in it holds several")
    expect((await attribute("tb1-italic", "aria-pressed")) === "true", "each pressed")
    await key("ArrowRight")
    expect((await focused()) === "tb1-pin", "out of the group, on along the toolbar")
    await key("Enter")
    expect((await attribute("tb1-pin", "aria-pressed")) === "true", "a toggle of its own")
    await key("ArrowRight")
    expect((await focused()) === "tb1-save", "and round")
    expect((await attribute("tb1-pin", "tabindex")) === "-1", "one stop for the whole toolbar")
  },

  async "scroll-area"({ page, snapshot, id, present, attribute }) {
    const box = (testid: string) =>
      id(testid).evaluate((element) => {
        const { top, left, width, height } = element.getBoundingClientRect()
        return { top, left, width, height }
      })
    await id("sa1").scrollIntoViewIfNeeded()
    await snapshot("nothing to scroll")
    expect(!(await present("sa1-y")), "with nothing to scroll there is no scrollbar")
    expect((await attribute("sa1-view", "tabindex")) === null, "and the viewport is no stop")

    await id("sa1-grow").click()
    await page.waitForSelector('[data-testid="sa1-y-thumb"]')
    await settled(page)
    await snapshot("content that grew")
    expect(await present("sa1-x"), "content that grows late brings its scrollbars")
    expect(await present("sa1-corner"), "and the corner where they meet")
    expect((await attribute("sa1-view", "tabindex")) === "0", "the viewport is a stop for the keys")
    expect((await attribute("sa1", "data-has-overflow-y")) === "", "the area says there is more")
    const thumb = await box("sa1-y-thumb")
    // 120 of 480 pixels are seen: a quarter of a track of 108 (the corner taken off).
    expect(
      Math.abs(thumb.height - 27) <= 1.5,
      `the thumb is the share that is seen (${thumb.height})`
    )

    await id("sa1-view").evaluate((element) => void (element.scrollTop = 360))
    await page.waitForFunction(
      () => document.querySelector('[data-testid="sa1"]')?.hasAttribute("data-scrolling") === true
    )
    const moved = await box("sa1-y-thumb")
    expect(Math.abs(moved.top - thumb.top - 81) <= 1.5, "and moves with the scroll, to its end")
    await page.waitForFunction(
      () => document.querySelector('[data-testid="sa1"]')?.hasAttribute("data-scrolling") === false
    )
    await snapshot("scrolled")

    // A drag of the horizontal thumb, by a real pointer.
    const across = await box("sa1-x-thumb")
    await page.mouse.move(across.left + across.width / 2, across.top + 4)
    await page.mouse.down()
    await page.mouse.move(across.left + across.width / 2 + 40, across.top + 4, { steps: 4 })
    await page.mouse.up()
    const left = await id("sa1-view").evaluate((element) => element.scrollLeft)
    expect(left > 100, `dragging a thumb scrolls the viewport (${left})`)
    await page.waitForFunction(
      () => document.querySelector('[data-testid="sa1"]')?.hasAttribute("data-scrolling") === false
    )

    await id("sa1-grow").click()
    await page.waitForSelector('[data-testid="sa1-y"]', { state: "detached" })
    await snapshot("nothing to scroll again")
    expect(!(await present("sa1-corner")), "content that shrinks takes them away")
  },

  async "navigation-menu"({ page, snapshot, id, present, attribute, focused }) {
    const key = async (name: string) => {
      await page.keyboard.press(name)
      await settled(page)
    }
    const popupWidth = () =>
      id("nm1-popup").evaluate((element) => element.style.getPropertyValue("--popup-width"))
    await id("nm1").evaluate((element) => element.scrollIntoView({ block: "start" }))
    expect(
      (await attribute("nm1-products", "aria-expanded")) === "false",
      "a trigger says it is closed"
    )
    expect(
      (await attribute("nm1-pricing", "aria-current")) === "page",
      "the reader's page is marked"
    )

    await id("nm1-products").focus()
    await key("Enter")
    await snapshot("an item open")
    expect(await present("nm1-products-content"), "Enter shows the item's content")
    expect((await attribute("nm1-products", "aria-expanded")) === "true", "its trigger says so")
    expect((await focused()) === "nm1-products", "and keeps focus")
    expect((await popupWidth()) === "200px", "the popup is given the content's size")
    const inside = await id("nm1-products-content").evaluate(
      (element) => element.parentElement?.getAttribute("data-testid") === "nm1-viewport"
    )
    expect(inside, "the content is drawn in the shared viewport, with nothing around it")

    await key("Tab")
    expect((await focused()) === "nm1-apps", "Tab goes into the content")
    await key("Tab")
    expect((await focused()) === "nm1-tools", "through it")
    await key("Tab")
    expect((await focused()) === "nm1-docs", "and on to what follows the trigger")
    expect(!(await present("nm1-popup")), "the content has gone")

    await key("ArrowDown")
    await snapshot("another item, from the keyboard")
    expect((await focused()) === "nm1-guide", "the arrow into a content opens it and goes in")
    expect((await popupWidth()) === "120px", "the popup takes this content's size")
    await key("Escape")
    expect((await focused()) === "nm1-docs", "Escape closes it and gives focus to its trigger")
    await key("ArrowRight")
    expect((await focused()) === "nm1-pricing", "the arrows go along the list, links too")
    await key("ArrowLeft")
    await key("ArrowLeft")
    expect((await focused()) === "nm1-products", "and back")

    await id("nm1-products").click()
    await settled(page)
    expect(await present("nm1-products-content"), "a press shows an item")
    await id("nm1-docs").click()
    await page.waitForSelector('[data-testid="nm1-products-content"]', { state: "detached" })
    await snapshot("moved to the next item")
    expect(await present("nm1-docs-content"), "a press on another trigger shows that one")
    expect(
      (await attribute("nm1-docs-content", "data-activation-direction")) === "right",
      "which says where it came from"
    )
    expect((await popupWidth()) === "120px", "in the same popup, resized")
    await id("nm1-guide").click()
    await settled(page)
    expect(!(await present("nm1-popup")), "a followed link closes the menu")
    expect(page.url().endsWith("#guide"), "and is followed")

    await id("nm1-products").hover()
    await page.waitForSelector('[data-testid="nm1-products-content"]')
    await snapshot("opened by the pointer")
    await page.mouse.move(2, 2)
    await page.waitForSelector('[data-testid="nm1-popup"]', { state: "detached" })
    expect(!(await present("nm1-products-content")), "the pointer leaving closes it")
  },

  async virtual({ page, snapshot, id, present, attribute, focused }) {
    const key = async (name: string) => {
      await page.keyboard.press(name)
      await settled(page)
    }
    const drawn = () =>
      page.evaluate(() => document.querySelectorAll('[data-testid="vl1"] [role="option"]').length)
    // Focus is on a row the moment it is in the page; what a framework draws for it (that it
    // is highlighted) comes with its next render. Under load that is not at once.
    const until = async (testid: string) => {
      await page.waitForFunction(
        (wanted) => document.activeElement?.getAttribute("data-testid") === wanted,
        testid
      )
      await settled(page)
    }
    await id("vl1").scrollIntoViewIfNeeded()
    const scrolled = await page.evaluate(() => window.scrollY)
    expect((await drawn()) <= 13, "a window of the ten thousand rows is in the page")
    expect(
      (await attribute("vl1-3", "aria-setsize")) === "10000",
      "each row says how many there are"
    )
    expect((await attribute("vl1-3", "aria-posinset")) === "4", "and its place among them")

    await id("vl1").focus()
    await settled(page)
    expect((await focused()) === "vl1-0", "focus goes to the first row")
    await key("End")
    await until("vl1-9999")
    await snapshot("the last of ten thousand rows")
    expect((await drawn()) <= 13, "End brings the last row in, and still only a window is drawn")
    expect(!(await present("vl1-0")), "the first rows have gone")
    await key("ArrowUp")
    expect((await focused()) === "vl1-9998", "the arrows go on from there")
    await page.keyboard.type("row 4321")
    await until("vl1-4321")
    expect(
      (await attribute("vl1-4321", "data-highlighted")) === "",
      "typing a name finds a row far away"
    )
    await page.waitForTimeout(600)
    await key(" ")
    await snapshot("a row far away chosen")
    expect((await attribute("vl1-4321", "aria-selected")) === "true", "Space chooses it")
    expect((await page.evaluate(() => window.scrollY)) === scrolled, "the page has not moved")

    await id("cp1-input").focus()
    expect(
      (await attribute("cp1-input", "aria-expanded")) === "true",
      "a palette's list is always there"
    )
    await page.keyboard.type("p")
    await settled(page)
    const shown = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[data-testid="cp1-list"] [role="option"]')]
          .filter((each) => each.getClientRects().length > 0)
          .map((each) => each.id.replace("cp1-", ""))
          .join()
      )
    expect((await shown()) === "Open,Print", "typing filters it")
    expect(
      (await attribute("cp1-input", "aria-activedescendant")) === "cp1-Open",
      "the first shown is highlighted"
    )
    await key("ArrowDown")
    await key("Enter")
    await snapshot("a command chosen")
    expect(
      (await id("cp1-output").textContent()) === "Print",
      "Enter tells the caller what was chosen"
    )
    expect((await id("cp1-input").inputValue()) === "p", "and the input keeps what was typed")
    await page.keyboard.type("zz")
    await settled(page)
    expect(await present("cp1-empty"), "nothing found is said")

    expect(
      (await attribute("fcb-label", "for")) === (await attribute("fcb-input", "id")),
      "a field's label is for its combobox's input"
    )
    expect((await attribute("fcb-input", "aria-required")) === "true", "which says it is required")
    expect(!(await present("fcb-clear")), "with nothing to clear there is no clear button")
    await id("fcb-label").click()
    expect((await focused()) === "fcb-input", "a press on the label goes to the input")
    await page.keyboard.type("os")
    await settled(page)
    await key("Enter")
    await snapshot("a combobox in a field, chosen")
    expect((await id("fcb-input").inputValue()) === "Oslo", "an item chosen is the input's text")
    expect(await present("fcb-clear"), "and can be cleared")
    await id("fcb-clear").click()
    await settled(page)
    expect((await id("fcb-input").inputValue()) === "", "the clear button empties it")
    expect((await focused()) === "fcb-input", "and leaves focus in the input")
    expect(!(await present("fcb-clear")), "then goes")

    const sent = () =>
      page.evaluate(() =>
        new FormData(document.querySelector<HTMLFormElement>('[data-testid="cbm-form"]')!)
          .getAll("tags")
          .join()
      )
    expect(await present("cbm-chip-New"), "several values are chips beside the input")
    expect((await sent()) === "New", "each is sent with the form")
    await id("cbm-input").focus()
    await page.keyboard.type("pr")
    await settled(page)
    await key("Enter")
    await snapshot("a second value chosen")
    expect(await present("cbm-chip-Print"), "an item chosen is added")
    expect(await present("cbm-popup"), "and the list stays open")
    expect((await id("cbm-input").inputValue()) === "", "what was typed has been used")
    expect((await attribute("cbm-Print", "aria-selected")) === "true", "the item says it is chosen")
    expect((await sent()) === "New,Print", "both are sent")
    await key("Backspace")
    expect(!(await present("cbm-chip-Print")), "Backspace in the empty input takes the last away")
    await id("cbm-remove-New").click()
    await settled(page)
    await snapshot("no value left")
    expect(!(await present("cbm-chip-New")), "a chip's button takes its value away")
    expect((await focused()) === "cbm-input", "and leaves focus in the input")
    expect((await sent()) === "", "with none chosen, nothing is sent")
  },

  async widgets({ page, snapshot, id, attribute, focused }) {
    const key = async (name: string) => {
      await page.keyboard.press(name)
      await settled(page)
    }
    const cell = (index: number) =>
      id(`otp1-${index}`).evaluate((element) => ({
        // Its own text, whatever a framework keeps around it.
        text: [...element.childNodes]
          .filter((each) => each.nodeType === 3)
          .map((each) => each.nodeValue)
          .join("")
          .trim(),
        caret: element.querySelector(".otp-caret") !== null,
      }))
    const sent = () =>
      page.evaluate(() =>
        new FormData(document.querySelector<HTMLFormElement>('[data-testid="otp1-form"]')!).get(
          "code"
        )
      )
    await id("otp1").scrollIntoViewIfNeeded()
    expect(
      (await attribute("otp1-input", "autocomplete")) === "one-time-code",
      "the code is one input a phone can fill"
    )
    await id("otp1-input").focus()
    await settled(page)
    expect((await attribute("otp1-0", "data-active")) === "", "focused, the first cell is active")
    expect((await cell(0)).caret, "and shows a caret while it is empty")
    await page.keyboard.type("12")
    await settled(page)
    await snapshot("two characters in")
    expect((await cell(0)).text === "1", "a cell shows its character")
    expect(!(await cell(0)).caret, "and no caret once it has one")
    expect((await attribute("otp1-1", "data-filled")) === "", "a filled cell says so")
    expect((await attribute("otp1-2", "data-active")) === "", "the next cell is the active one")
    expect((await cell(2)).caret, "with the caret")
    await page.keyboard.type("x")
    await settled(page)
    expect((await sent()) === "12", "what a code cannot hold never goes in")
    await page.keyboard.type("34")
    await settled(page)
    await snapshot("every character in")
    expect((await id("otp1-output").textContent()) === "1234", "the caller hears the finished code")
    expect((await attribute("otp1", "data-complete")) === "", "the code says it is complete")
    expect((await sent()) === "1234", "and it is sent with the form")
    await key("Backspace")
    expect((await cell(3)).text === "", "Backspace takes the last character")
    expect((await attribute("otp1", "data-complete")) === null, "and it is complete no more")

    const share = () => attribute("rs1-bar", "aria-valuenow")
    const width = (testid: string) =>
      id(testid).evaluate((element) => Math.round(element.getBoundingClientRect().width))
    expect(
      (await attribute("rs1-bar", "role")) === "separator",
      "a bar between panels is a separator"
    )
    expect((await attribute("rs1-bar", "aria-orientation")) === "vertical", "which stands")
    expect((await share()) === "25", "and says the share of the panel before it")
    expect((await width("rs1-a")) === 100, "the panels share what the bar leaves")
    await id("rs1-bar").focus()
    await key("ArrowRight")
    await snapshot("moved by an arrow")
    expect((await share()) === "35", "an arrow moves the bar")
    expect(
      (await id("rs1-output").textContent()) === "35,65",
      "the caller hears each panel's share"
    )
    expect((await width("rs1-a")) === 140, "and the panels follow")
    const bar = await id("rs1-bar").evaluate((element) => {
      const box = element.getBoundingClientRect()
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    })
    await page.mouse.move(bar.x, bar.y)
    await page.mouse.down()
    await page.mouse.move(bar.x + 40, bar.y, { steps: 4 })
    await page.mouse.up()
    await settled(page)
    await snapshot("dragged")
    expect((await share()) === "45", "a drag moves it as far as the pointer goes")
    expect((await focused()) === "rs1-bar", "and leaves focus on the bar")
    await key("Home")
    expect((await share()) === "10", "Home takes the panel to its least")
  },

  async pieces({ page, snapshot, id, present, attribute, focused }) {
    const key = async (name: string) => {
      await page.keyboard.press(name)
      await settled(page)
    }
    /** Waits for what a scroll or a timer brings: neither is done when the press returns. */
    const until = async (read: () => Promise<unknown>, wanted: unknown, message: string) => {
      const from = Date.now()
      let got = await read()
      while (got !== wanted && Date.now() - from < 3000) {
        await page.waitForTimeout(25)
        got = await read()
      }
      expect(got === wanted, `${message} (it is ${String(got)})`)
      await settled(page)
    }
    await id("qr1").scrollIntoViewIfNeeded()
    expect((await attribute("qr1-frame", "role")) === "img", "a code is an image")
    expect(
      (await attribute("qr1-frame", "viewBox")) === "0 0 25 25",
      "a module to the unit, in the smallest version that holds the text"
    )
    expect(
      ((await attribute("qr1-pattern", "d")) ?? "").startsWith("M0 0h7v1h-7z"),
      "its dark modules are one path, from the finder in the corner"
    )
    const drawn = await id("qr1-frame").evaluate((element) => element.getBoundingClientRect().width)
    expect(drawn === 96, `the drawing fills what the design gives it (${drawn})`)

    const tall = () => id("au1").evaluate((element) => element.getBoundingClientRect().height)
    expect((await tall()) === 30, `a text area begins a line tall (${await tall()})`)
    await id("au1").focus()
    await page.keyboard.type("one")
    await key("Enter")
    await page.keyboard.type("two")
    await until(tall, 50, "it grows with its text")
    await snapshot("a text area two lines tall")
    for (let line = 0; line < 6; line++) await page.keyboard.press("Enter")
    await until(tall, 120, "and stops at what the design allows")
    await key("ControlOrMeta+a")
    await key("Backspace")
    await until(tall, 30, "and shrinks again when the text goes")

    const slide = () => id("cr1-output").textContent()
    expect((await attribute("cr1", "role")) === "region", "a carousel is a region")
    expect((await attribute("cr1", "aria-roledescription")) === "carousel", "called a carousel")
    expect((await attribute("cr1-0", "aria-roledescription")) === "slide", "of slides")
    expect((await attribute("cr1-0", "data-current")) === "", "the first is where it begins")
    expect((await attribute("cr1-previous", "disabled")) === "", "with nothing before it")
    expect((await attribute("cr1-next", "disabled")) === null, "and more after")
    await id("cr1-next").click()
    await until(slide, "1", "Next goes on a slide")
    await until(() => attribute("cr1-1", "data-current"), "", "which is the current one")
    await until(() => attribute("cr1-previous", "disabled"), null, "and Previous can be pressed")
    expect((await attribute("cr1-dot-1", "aria-current")) === "true", "its button says so")
    const scrolled = await id("cr1-view").evaluate((element) => element.scrollLeft)
    expect(scrolled === 300, `the view has scrolled to it (${scrolled})`)
    await snapshot("the second slide")
    await id("cr1-dot-2").click()
    await until(slide, "2", "a slide's button goes to it")
    await until(() => attribute("cr1-next", "disabled"), "", "the last has nothing after it")
    await id("cr1-view").focus()
    await key("ArrowLeft")
    await until(slide, "1", "the arrows move it when the view has focus")
    await key("Home")
    await until(slide, "0", "and Home goes to the first")
    await id("cr1-view").evaluate((element) => element.scrollTo({ left: 600 }))
    await until(slide, "2", "scrolled by hand, it says where it came to rest")
    await id("cr1-view").evaluate((element) => element.scrollTo({ left: 0 }))
    await until(slide, "0", "and back")

    expect((await attribute("ts1", "role")) === "region", "the toasts are a region")
    expect((await attribute("ts1", "aria-live")) === "polite", "that is read when it changes")
    expect(!(await present("ts1-toast-1")), "with nothing in it to begin with")
    await id("ts1-add").click()
    await settled(page)
    expect(await present("ts1-toast-1"), "a toast is drawn when it is added")
    expect(
      (await attribute("ts1-toast-1", "data-type")) === "success",
      "of the kind it was added as"
    )
    expect(
      (await attribute("ts1-toast-1", "aria-labelledby")) === "ts1-toast-1-title",
      "named by its title"
    )
    expect(
      (await attribute("ts1-toast-1", "aria-describedby")) === "ts1-toast-1-description",
      "and described by what it says"
    )
    await snapshot("a toast")
    await id("ts1-add").click()
    await settled(page)
    const order = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid="ts1"] > [role="dialog"]')]
        .map(
          (each) =>
            `${each.getAttribute("data-testid")}:${(each as HTMLElement).style.getPropertyValue("--toast-index")}`
        )
        .join(" ")
    )
    expect(order === "ts1-toast-2:0 ts1-toast-1:1", `the newest is first (${order})`)
    await snapshot("two toasts")
    await id("ts1-toast-2-close").click()
    await until(() => present("ts1-toast-2"), false, "its button closes it, once its motion ends")
    await until(
      () => id("ts1-toast-1").evaluate((each) => each.style.getPropertyValue("--toast-index")),
      "0",
      "and the one behind comes forward"
    )
    await id("ts1-brief").click()
    await settled(page)
    expect(await present("ts1-toast-3"), "a brief toast is drawn")
    await until(() => present("ts1-toast-3"), false, "and leaves when its time is up")
    await key("F6")
    expect((await focused()) === "ts1", "F6 goes to the toasts")
    await key("Tab")
    expect((await focused()) === "ts1-toast-1", "where each is a stop")
    await key("Escape")
    await until(() => present("ts1-toast-1"), false, "and Escape closes the one focus is on")
    expect((await focused()) === "ts1", "focus stays with the toasts")
    await snapshot("no toast left")
  },
  async menubar({ page, snapshot, id, present, attribute, focused }) {
    const key = async (name: string) => {
      await page.keyboard.press(name)
      await settled(page)
    }
    await id("mb1").evaluate((element) => element.scrollIntoView({ block: "start" }))
    expect((await attribute("mb1", "role")) === "menubar", "the bar is a menubar")
    expect((await attribute("mb1-file", "role")) === "menuitem", "a menu's trigger is its item")
    expect((await attribute("mb1-file", "aria-haspopup")) === "menu", "that has a menu")
    expect((await attribute("mb1-help", "tabindex")) === "0", "before focus, any can take it")

    await id("mb1-file").focus()
    await key("ArrowRight")
    expect((await focused()) === "mb1-edit", "ArrowRight goes to the next trigger")
    await key("ArrowRight")
    expect((await focused()) === "mb1-help", "past a disabled one")
    await key("ArrowRight")
    expect((await focused()) === "mb1-file", "and round")
    await snapshot("focus in the bar")
    expect((await attribute("mb1-file", "tabindex")) === "0", "the bar is one stop")
    expect((await attribute("mb1-help", "tabindex")) === "-1", "at the trigger focus was on")

    await key("ArrowDown")
    await snapshot("a menu open")
    expect((await focused()) === "mb1f-new", "ArrowDown opens the menu on its first item")
    await key("ArrowRight")
    await snapshot("the next menu in its place")
    expect(!(await present("mb1f-popup")), "ArrowRight closes it")
    expect((await focused()) === "mb1e-undo", "and opens the next, on its first item")

    await key("ArrowDown")
    await key("ArrowRight")
    expect((await focused()) === "mb1em-next", "on a submenu's trigger, the arrow opens it")
    expect(await present("mb1e-popup"), "and its menu stays")
    await key("ArrowLeft")
    expect((await focused()) === "mb1e-find", "the arrow back closes the submenu only")
    await key("ArrowRight")
    await key("ArrowRight")
    await snapshot("across from a submenu")
    expect((await focused()) === "mb1h-about", "from an item that opens nothing, across")
    expect(!(await present("mb1em-popup")), "the submenu has closed")
    expect(!(await present("mb1e-popup")), "and its menu")
    await key("ArrowLeft")
    expect((await focused()) === "mb1e-undo", "ArrowLeft goes back, past the disabled menu")
    await key("Escape")
    expect((await focused()) === "mb1-edit", "Escape gives focus to the menu's trigger")
    expect(!(await present("mb1e-popup")), "and nothing is open")

    await id("mb1-help").hover()
    await settled(page)
    expect(!(await present("mb1h-popup")), "with nothing open, the pointer opens nothing")
    await id("mb1-file").click()
    await settled(page)
    expect(await present("mb1f-popup"), "a press opens a menu")
    await id("mb1-help").hover()
    await snapshot("another opened by the pointer")
    expect(await present("mb1h-popup"), "the pointer on another trigger opens that one")
    expect(!(await present("mb1f-popup")), "in place of the first")
    await id("mb1h-about").click()
    await snapshot("chosen")
    expect(!(await present("mb1h-popup")), "a chosen item closes the menu")
    expect((await id("mb1-output").textContent()) === "mb1h-about", "and is heard")
    expect((await focused()) === "mb1-help", "focus is on its trigger")
  },
}

/** The second page's scenarios: generated ids, and a popover open when the page is first drawn. */
const second: Record<string, (run: Run) => Promise<void>> = {
  async ids({ page, snapshot, id, attribute }) {
    await id("o-p-popup").waitFor()
    await snapshot("at rest")
    const named = (testid: string) => attribute(testid, "id")
    expect(await named("o-c-panel"), "an open panel has an id nobody gave it")
    expect(
      (await attribute("o-c-trigger", "aria-controls")) === (await named("o-c-panel")),
      "and its trigger names it"
    )
    expect(
      (await attribute("o-t-one", "aria-controls")) === (await named("o-t-panel-one")),
      "a tab names its panel"
    )
    expect(
      (await attribute("o-t-panel-one", "aria-labelledby")) === (await named("o-t-one")),
      "and the panel its tab"
    )
    expect(
      (await attribute("o-f-label", "for")) === (await named("o-f-control")),
      "a label names its control"
    )
    expect(
      (await attribute("o-f-control", "aria-describedby")) === (await named("o-f-description")),
      "and the control its description"
    )
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll("[id]")].map((each) => each.id)
    )
    expect(new Set(ids).size === ids.length, `every id is its own: ${ids.join(" ")}`)
    await id("o-t-two").click()
    await snapshot("another tab")
    expect(
      (await attribute("o-t-two", "aria-controls")) === (await named("o-t-panel-two")),
      "a panel drawn later is named the same way"
    )
  },

  async "open-popup"({ page, snapshot, id, present, attribute }) {
    await id("o-p-popup").waitFor()
    await snapshot("open when first drawn")
    expect((await attribute("o-p-trigger", "aria-expanded")) === "true", "the trigger says open")
    expect(
      (await attribute("o-p-trigger", "aria-controls")) === (await attribute("o-p-popup", "id")),
      "and names the popup"
    )
    expect((await attribute("o-p-popup", "data-side")) === "bottom", "it is placed")
    const gap = await page.evaluate(() => {
      const box = (testid: string) =>
        document.querySelector(`[data-testid="${testid}"]`)!.getBoundingClientRect()
      return Math.round(box("o-p-positioner").top - box("o-p-trigger").bottom)
    })
    expect(gap === 8, `below its trigger by its offset, got ${gap}`)
    await page.keyboard.press("Escape")
    await id("o-p-popup").waitFor({ state: "detached" })
    await snapshot("closed")
    expect((await attribute("o-p-trigger", "aria-expanded")) === "false", "Escape closes it")
    await id("o-p-trigger").click()
    await id("o-p-popup").waitFor()
    expect(await present("o-p-close"), "and a press opens it again")
  },

  // What only shows once the page is in a browser.
  async late({ page, snapshot, id, present, attribute }) {
    await id("o-p-popup").waitFor()
    // The popover that is open from the start lies over this section.
    await page.keyboard.press("Escape")
    await id("o-p-popup").waitFor({ state: "detached" })
    // A caller that opens the panel as the page mounts is heard, not dropped.
    await id("o-l-panel").waitFor({ timeout: 3000 })
    await snapshot("opened as the page mounted")
    expect((await attribute("o-l-trigger", "aria-expanded")) === "true", "the trigger says open")
    expect((await attribute("o-l-panel", "data-open")) === "", "and the panel")
    await id("o-l-trigger").click()
    await snapshot("closed by its trigger")
    expect(!(await present("o-l-panel")), "and a press closes it")

    // A `<fieldset disabled>` disables a box as it does a native control, and lets it go.
    expect((await attribute("o-s-box", "aria-disabled")) === "true", "disabled by its fieldset")
    expect((await attribute("o-s-box", "data-disabled")) === "", "and marked")
    expect((await attribute("o-s-box", "tabindex")) === "-1", "out of Tab's way")
    await id("o-s-box").click({ force: true })
    expect((await attribute("o-s-box", "aria-checked")) === "false", "a press does nothing")
    await id("o-s-unlock").click()
    await snapshot("fieldset enabled")
    expect((await attribute("o-s-box", "aria-disabled")) === null, "enabled with its fieldset")
    await id("o-s-box").click()
    await snapshot("box checked")
    expect((await attribute("o-s-box", "aria-checked")) === "true", "and a press checks it")
    await id("o-s-unlock").click()
    await snapshot("fieldset disabled again")
    expect((await attribute("o-s-box", "aria-disabled")) === "true", "and disabled again")
    expect((await attribute("o-s-box", "aria-checked")) === "true", "keeping its value")

    // A caller that holds an input's value and rewrites what is typed: every key lands, in
    // order, and the field follows the value.
    await id("o-h-control").click()
    await page.keyboard.type("kirana ui", { delay: 15 })
    await snapshot("typed into a held input")
    expect((await id("o-h-control").inputValue()) === "KIRANA UI", "the caller's value is shown")
    expect((await id("o-h-output").textContent()) === "KIRANA UI", "and the caller has it")
    expect((await attribute("o-h-control", "data-filled")) === "", "the field knows it is filled")
    expect((await attribute("o-h-control", "data-dirty")) === "", "and changed")
    for (let key = 0; key < 9; key++) await page.keyboard.press("Backspace")
    await snapshot("held input emptied")
    expect((await id("o-h-control").inputValue()) === "", "emptied key by key")
    expect((await attribute("o-h-control", "data-filled")) === null, "and no longer filled")
  },
}

const DECLARED = new Set<string>(["data-testid", "data-fixture", "data-kirana-portal", "data-hk"])
const VARIABLES = new Set<string>()
// States whose value is the caller's own: a row's place, the kind a toast was added as.
const FREE = ["data-index", "data-type"]
const VALUES: Record<string, string[]> = {}
for (const component of Object.values(vocabulary)) {
  for (const part of Object.values<PartDefinition>(component)) {
    for (const state of Object.values(part.states ?? {})) {
      DECLARED.add(state.attribute)
      // A state marked by being there is written empty; one with values takes only those.
      const allowed = (VALUES[state.attribute] ??= [])
      for (const each of state.values ?? [""]) if (!allowed.includes(each)) allowed.push(each)
    }
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
    // One subject: an adapter's page, one way it is served. What it says is kept until its turn
    // to be printed, so the report reads in the same order however many are played at once.
    const play = async (subject: (typeof subjects)[number], log: (line: string) => void) => {
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
        if (subject.second) {
          // An id the server wrote is the id the client makes: nothing is renamed by hydration.
          const ids = () =>
            [...document.querySelectorAll("main [data-testid]")].map(
              (each) => `${each.getAttribute("data-testid")}=${each.id}`
            )
          // But for what a caller draws only once the page has mounted.
          const late = (list: string[]) => list.filter((each) => !each.startsWith("o-l-panel="))
          const before = late(await page.evaluate(ids))
          const live = await browser.newContext({ viewport: { width: 1000, height: 800 } })
          const hydrated = await live.newPage()
          await hydrated.goto(`http://localhost:${server.port}${path}`)
          await hydrated.locator('[data-testid="o-p-popup"]').waitFor()
          const after = late(await hydrated.evaluate(ids))
          await live.close()
          if (before.join() !== after.join() || !before.some((each) => !each.endsWith("="))) {
            failed++
            log(`FAIL  ${label}  ids changed in hydration: ${before} -> ${after}`)
          }
        }
        // A length that is the value itself is in what the server sent, not measured later.
        const width = await page.evaluate(
          () => document.querySelector<HTMLElement>('[data-testid="pr1-fill"]')?.style.width
        )
        if (!subject.second && width !== "40%") {
          failed++
          log(`FAIL  ${label}  the server wrote the progress bar's width, got "${width}"`)
        }
        const place = await page.evaluate(() =>
          document
            .querySelector<HTMLElement>('[data-testid="sl1-thumb"]')
            ?.style.getPropertyValue("inset-inline-start")
        )
        if (!subject.second && place !== "40%") {
          failed++
          log(`FAIL  ${label}  the server wrote the slider thumb's place, got "${place}"`)
        }
        // What a provider states is known on a server, which has no layout to read it from.
        const centred = await page.evaluate(() =>
          document
            .querySelector<HTMLElement>('[data-testid="ds1-thumb"]')
            ?.style.getPropertyValue("translate")
        )
        if (!subject.second && centred !== "50% -50%") {
          failed++
          log(`FAIL  ${label}  the server centred a right-to-left thumb, got "${centred}"`)
        }
        await context.close()
      }
      for (const [name, scenario] of Object.entries(subject.second ? second : scenarios)) {
        if (only && name !== only) continue
        const context = await browser.newContext({ viewport: { width: 1000, height: 800 } })
        const page = await context.newPage()
        if (slow > 1 && engine === "chromium") {
          const session = await context.newCDPSession(page)
          await session.send("Emulation.setCPUThrottlingRate", { rate: slow })
        }
        const errors: string[] = []
        page.on("pageerror", (error) => errors.push(error.message))
        page.on("console", (message) => {
          // Firefox's note on a popup that follows its anchor as the page scrolls: that is what
          // a positioned popup does, and nothing went wrong.
          if (message.text().includes("scroll-linked positioning effect")) return
          if (message.type() === "error" || message.type() === "warning")
            errors.push(message.text())
        })
        // What a browser reports to the window and not as an exception (a resize observer that
        // could not deliver within a frame): heard here whether or not the browser's tools say it.
        await page.addInitScript(() => {
          window.addEventListener("error", (event) => {
            if (!event.error) console.error(`window error: ${event.message}`)
          })
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
            // Faults met in other libraries, held out of every state of every component.
            const faults = await page.evaluate(
              ({ values, free }) => {
                const found: string[] = []
                const scope = [...document.querySelectorAll("main *, [data-kirana-portal] *")]
                const called = (element: Element) =>
                  element.getAttribute("data-testid") ?? element.tagName.toLowerCase()
                const ids = new Map<string, number>()
                for (const element of scope) {
                  if (element.id) ids.set(element.id, (ids.get(element.id) ?? 0) + 1)
                  for (const each of element.attributes) {
                    // `data-x="false"` matches `[data-x]`: a state that is off is absent.
                    const allowed = values[each.name]
                    // A thumb's `data-index` is a number: the one state that is neither.
                    if (allowed && !free.includes(each.name) && !allowed.includes(each.value))
                      found.push(`${called(element)} has ${each.name}="${each.value}"`)
                  }
                  // A reference names an element that is in the page.
                  for (const attribute of [
                    "aria-controls",
                    "aria-labelledby",
                    "aria-describedby",
                    "for",
                  ]) {
                    for (const named of (element.getAttribute(attribute) ?? "")
                      .split(" ")
                      .filter(Boolean)) {
                      if (!document.getElementById(named))
                        found.push(
                          `${called(element)} ${attribute} names "${named}", which is not in the page`
                        )
                    }
                  }
                }
                for (const [repeated, count] of ids)
                  if (count > 1) found.push(`${count} elements have the id "${repeated}"`)
                // Modality is `inert` on what is behind, never the page made unpressable.
                for (const root of [document.documentElement, document.body]) {
                  if (root.style.pointerEvents !== "")
                    found.push(
                      `${root.tagName.toLowerCase()} has pointer-events: ${root.style.pointerEvents}`
                    )
                }
                return [...new Set(found)]
              },
              { values: VALUES, free: FREE }
            )
            expect(faults.length === 0, faults.join("; "))
          },
        }
        try {
          await (TIMED.has(name) ? alone : together)(() => scenario(run))
          expect(errors.length === 0, `the page reported: ${errors.join(" | ")}`)
          log(`ok    ${label}  ${name}`)
        } catch (error) {
          failed++
          // The whole of it when one scenario was asked for: what was pressed, and why not.
          const whole = error instanceof Error ? error.message : String(error)
          const message = only ? whole : whole.split("\n")[0]
          log(`FAIL  ${label}  ${name}: ${message}`)
          // Where the page stood when it failed: a failure that comes one run in several is
          // read from this, since it cannot be replayed.
          const stood = await page
            .evaluate(() => ({
              focus:
                document.activeElement?.getAttribute("data-testid") ??
                document.activeElement?.tagName,
              focused: document.hasFocus(),
              shown: document.visibilityState,
            }))
            .catch(() => undefined)
          log(
            `      the page then: ${JSON.stringify(stood)}; it reported: ${errors.join(" | ") || "nothing"}`
          )
        }
        await context.close()
      }
      writeFileSync(
        join(OUT, `${engine}-${label}.txt`),
        [...recorded].map(([step, dom]) => `### ${step}\n${dom}\n`).join("\n")
      )
    }

    // Their place in what is compared is theirs before any is played.
    for (const subject of subjects) snapshots[subject.label] = new Map()
    const said = subjects.map(() => [] as string[])
    const done = subjects.map(() => false)
    let printed = 0
    let next = 0
    const worker = async () => {
      while (next < subjects.length) {
        const at = next++
        await play(subjects[at]!, (line) => void said[at]!.push(line))
        done[at] = true
        while (printed < subjects.length && done[printed]) {
          for (const line of said[printed]!) console.log(line)
          printed++
        }
      }
    }
    const jobs = Math.min(jobsFor(engine), subjects.length)
    await Promise.all(Array.from({ length: jobs }, worker))

    const firstDifference = (a: string, b: string, one: string, other: string) => {
      const left = a.split("\n")
      const right = b.split("\n")
      for (let line = 0; line < Math.max(left.length, right.length); line++) {
        if (left[line] === right[line]) continue
        console.log(`      ${one}: ${left[line]?.trim()}\n      ${other}: ${right[line]?.trim()}`)
        break
      }
    }
    // The same state, the same DOM, whatever rendered it: the first page's subjects against each
    // other, then the second page's.
    for (const group of [false, true]) {
      const labels = subjects.filter((each) => each.second === group).map((each) => each.label)
      const [reference, ...others] = labels
      if (!reference) continue
      const served = Object.entries(sent).filter(([label]) => labels.includes(label))
      // With one scenario asked for, the page at rest may not have been recorded.
      if (!group && snapshots[reference]!.has("collapsible / at rest")) {
        // A page rendered on a server is, before its scripts run, the page at rest: nothing but
        // the geometry the client measures is missing, and hydration finds nothing to correct.
        const rest = withoutStyles(snapshots[reference]!.get("collapsible / at rest") ?? "")
        for (const [label, dom] of served) {
          if (dom === rest) {
            console.log(`same  ${label} as its server sent it = ${reference} at rest`)
            continue
          }
          failed++
          console.log(`DIFF  ${label} as its server sent it, against ${reference} at rest`)
          firstDifference(rest, dom, reference, label)
        }
      } else {
        // The second page has a popup open, which no server draws (it is moved to the end of
        // the page by the browser): what the servers sent is compared with each other.
        const [first, ...rest] = served
        for (const [label, dom] of rest) {
          if (dom === first![1]) {
            console.log(`same  ${label} as its server sent it = ${first![0]} as its server sent it`)
            continue
          }
          failed++
          console.log(`DIFF  ${label} as its server sent it, against ${first![0]}'s`)
          firstDifference(first![1], dom, first![0], label)
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
          if (actual !== undefined) firstDifference(expected, actual, reference, adapter)
        }
        if (different === 0) {
          console.log(`same  ${adapter} = ${reference}  (${snapshots[reference]!.size} states)`)
        }
      }
    }
  } finally {
    await browser.close()
    for (const server of Object.values(servers)) await server.stop(true)
  }
}

console.log(failed === 0 ? "\nconformance: passed" : `\nconformance: ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
