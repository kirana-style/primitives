import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

import { createServer } from "vite-plus"
import type { ViteDevServer } from "vite-plus"
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test"

// Solid's JSX is compiled by Solid's own preset, which this project's tests do not run: a
// server of this test's own compiles the adapter as a project's build would, for a server.
const need = createRequire(import.meta.url)
const typescript = need("typescript") as {
  transpileModule(
    source: string,
    options: { fileName: string; compilerOptions: Record<string, unknown> }
  ): { outputText: string }
}
const babel = need("@babel/core") as {
  transformAsync(code: string, options: object): Promise<{ code: string } | null>
}

type Drawn = "plain" | "as" | "render"
interface Cases {
  controls: Record<string, (drawn: Drawn) => unknown>
  content: Record<string, () => unknown>
  primitive: Record<Drawn, () => unknown>
}

let server: ViteDevServer
let cases: Cases
let renderToString: (draw: () => unknown) => string

beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL("..", import.meta.url)),
    logLevel: "silent",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [
      {
        name: "solid-on-a-server",
        enforce: "pre",
        async transform(code: string, id: string) {
          const file = id.split("?")[0]!
          if (!file.endsWith(".tsx")) return null
          // TypeScript takes the types off and leaves the JSX for Solid's preset (its enums by
          // number: JSX preserved, ES2022, ES modules).
          const plain = typescript.transpileModule(code, {
            fileName: file,
            compilerOptions: { jsx: 1, target: 9, module: 99, verbatimModuleSyntax: true },
          }).outputText
          const built = await babel.transformAsync(plain, {
            filename: file.replace(/\.tsx$/, ".jsx"),
            babelrc: false,
            configFile: false,
            presets: [[need.resolve("babel-preset-solid"), { generate: "ssr", hydratable: true }]],
          })
          return { code: built!.code, map: null }
        },
      },
    ],
  })
  cases = (await server.ssrLoadModule("/test/cases.tsx")) as unknown as Cases
  ;({ renderToString } = (await server.ssrLoadModule("solid-js/web")) as unknown as {
    renderToString: typeof renderToString
  })
}, 60_000)

afterAll(() => server?.close())

/** What a server sends, without the keys and marks Solid writes for its own hydration. */
const html = (draw: () => unknown) =>
  renderToString(draw).replace(/ data-hk="?[\w-]+"?|<!--[^>]*-->/g, "")

/** The inputs an element holds, by the element's tag. */
function inputsIn(text: string, tag: string): string[] {
  const element = new RegExp(`<${tag}\\b[^>]*>(.*)</${tag}>`, "s").exec(text)?.[1] ?? ""
  return element.match(/<input\b[^>]*>/g) ?? []
}

describe("on the server", () => {
  const controls = [
    ["checkbox", "span", "a", 'type="checkbox"'],
    ["switch", "span", "a", 'type="checkbox"'],
    ["radio", "span", "a", 'type="radio"'],
    ["slider", "div", "a", 'type="hidden"'],
    ["number", "div", "section", 'type="hidden"'],
  ] as const

  it.each(controls)(
    "keeps a %s's native input inside the element, whoever draws it",
    (name, tag, other, kind) => {
      const draw = cases.controls[name]!
      const plain = inputsIn(
        html(() => draw("plain")),
        tag
      )
      expect(plain.filter((each) => each.includes(kind))).toHaveLength(1)
      // The same input, attribute for attribute, in another tag and in the caller's own element.
      expect(
        inputsIn(
          html(() => draw("as")),
          other
        )
      ).toEqual(plain)
      expect(
        inputsIn(
          html(() => draw("render")),
          other
        )
      ).toEqual(plain)
    }
  )

  it("hands a part's children to the caller's element, which holds them or places them", () => {
    expect(html(cases.content.handed!)).toMatch(/<a [^>]*href="\/more"[^>]*>More<\/a>/)
    const placed = html(cases.content.placed!)
    expect(placed).toContain("<b>Read</b>")
    expect(placed).toContain(" more</a>")
  })

  it("hands the text a part writes to the caller's element, as the children of its props", () => {
    const written = html(cases.content.written!)
    expect(written).toMatch(/<b [^>]*class="meter ?"[^>]*>40%<\/b>/)
    expect(written).toMatch(/<b [^>]*class="progress ?"[^>]*>25%<\/b>/)
    expect(written).toMatch(/<b [^>]*class="slider ?"[^>]*>30<\/b>/)
    expect(written).toMatch(/<b [^>]*class="select ?"[^>]*>Kiwi<\/b>/)
    expect(written).toMatch(/<h2[^>]*>March 2026<\/h2>/)
    expect(written).toMatch(/<i [^>]*>03<\/i>.*<i [^>]*>2026<\/i>/s)
    expect(written).toMatch(/<h3[^>]*>Saved<\/h3>/)
    expect(written).toMatch(/<p[^>]*>To the cloud<\/p>/)
    expect(written).toMatch(/<a[^>]*>Undo<\/a>/)
  })

  it("draws a plain element of one's own as a part is drawn, its state as attributes", () => {
    // The component's own class joined with its caller's, its state under both.
    expect(html(cases.primitive.plain!)).toMatch(
      /^<span data-active="" class="badge mine ?" title="own" data-kind="new" ?>New<\/span>$/
    )
    // Another tag, a later set winning an attribute, a state that does not hold absent.
    expect(html(cases.primitive.as!)).toMatch(/^<b class="badge ?" title="theirs" ?>New<\/b>$/)
    // The caller's own element, given the props and the state.
    expect(html(cases.primitive.render!)).toMatch(
      /^<a data-active="" class="badge mine ?" title="own" href="\/new" ?>On<\/a>$/
    )
  })

  it("leaves a caller's `part` attribute on the element, for `::part()`", () => {
    const named = html(cases.content.named!)
    expect(named).toMatch(/<div [^>]*part="root"/)
    expect(named).toMatch(/<button [^>]*part="trigger"[^>]*>Open<\/button>/)
    expect(named).toMatch(/<section [^>]*part="panel"[^>]*>Held<\/section>/)
  })
})
