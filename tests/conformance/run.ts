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

import { chromium } from "playwright"
import type { Page } from "playwright"

import type { PartDefinition } from "../../packages/core/src/part.ts"
import { vocabulary } from "../../packages/core/src/vocabulary.ts"

const ROOT = join(import.meta.dirname, "../..")
const OUT = join(import.meta.dirname, "out")
const ALL = ["react", "svelte", "angular"]

const asked = process.argv.slice(2)
const adapters = (asked.length > 0 ? asked : ALL).filter((each) => {
  const built = existsSync(join(ROOT, "fixtures", each, "dist/index.html"))
  if (!built) console.log(`skipped ${each}: fixtures/${each}/dist is not built`)
  return built
})
if (adapters.length === 0) {
  console.error("no fixture is built: run `vp run build` first")
  process.exit(1)
}

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
  const SKIP = new Set(["ng-version", "data-testid"])
  const lines: string[] = []
  const walk = (node: Node, depth: number) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.replace(/\s+/g, " ").trim()
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

const DECLARED = new Set<string>(["data-testid", "data-fixture", "data-kirana-portal"])
for (const component of Object.values(vocabulary)) {
  for (const part of Object.values<PartDefinition>(component)) {
    for (const state of Object.values(part.states ?? {})) {
      DECLARED.add(typeof state === "string" ? state : state.attribute)
    }
  }
}

mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({
  // A page that draws no frames must behave the same: nothing here waits for one.
  args: ["--disable-gpu", "--disable-software-rasterizer"],
})
const servers: ReturnType<typeof serve>[] = []
const snapshots: Record<string, Map<string, string>> = {}
let failed = 0

try {
  for (const adapter of adapters) {
    const server = serve(adapter)
    servers.push(server)
    const recorded = new Map<string, string>()
    snapshots[adapter] = recorded
    for (const [name, scenario] of Object.entries(scenarios)) {
      const context = await browser.newContext({ viewport: { width: 1000, height: 800 } })
      const page = await context.newPage()
      const errors: string[] = []
      page.on("pageerror", (error) => errors.push(error.message))
      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") errors.push(message.text())
      })
      await page.goto(`http://localhost:${server.port}/`)
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
        },
      }
      try {
        await scenario(run)
        expect(errors.length === 0, `the page reported: ${errors.join(" | ")}`)
        console.log(`ok    ${adapter}  ${name}`)
      } catch (error) {
        failed++
        const message = error instanceof Error ? error.message.split("\n")[0] : String(error)
        console.log(`FAIL  ${adapter}  ${name}: ${message}`)
      }
      await context.close()
    }
    writeFileSync(
      join(OUT, `${adapter}.txt`),
      [...recorded].map(([step, dom]) => `### ${step}\n${dom}\n`).join("\n")
    )
  }

  // The same state, the same DOM, whatever rendered it.
  const [reference, ...others] = adapters as [string, ...string[]]
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
        console.log(`      ${reference}: ${a[line]?.trim()}\n      ${adapter}: ${b[line]?.trim()}`)
        break
      }
    }
    if (different === 0) {
      console.log(`same  ${adapter} = ${reference}  (${snapshots[reference]!.size} states)`)
    }
  }
} finally {
  await browser.close()
  for (const server of servers) await server.stop(true)
}

console.log(failed === 0 ? "\nconformance: passed" : `\nconformance: ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
