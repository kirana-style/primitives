import { defineConfig } from "vite-plus"

const FIXTURES = ["react", "vue", "svelte", "solid", "angular"]

/**
 * The workspace's sources, named rather than traced: tracing a task's file access can miss reads
 * of workspace packages and makes starting a native binary fail (the Kirana repository found both).
 */
const SOURCES = [
  "**/*.{ts,tsx,js,mjs,json,svelte,vue,css,html,md,yml,yaml}",
  "!**/node_modules/**",
  "!**/dist/**",
  "!**/dist-server/**",
  "!dist-packages/**",
  "!tests/conformance/out/**",
  "!bench/out/**",
  "!.agents/**",
  "!.claude/**",
  "bun.lock",
]

export default defineConfig({
  test: {
    include: ["packages/*/src/**/*.test.{ts,tsx}"],
  },
  // The workspace's tasks: `vp run <name>`. A cached task replays its output and restores its
  // files on a hit; `vp run --dry-run <name>` says whether it would hit, `vp run -v <name>` why it
  // missed.
  run: {
    tasks: {
      // Oxfmt, Oxlint with types, and the type check; warnings fail.
      check: {
        command: "vp check --deny-warnings",
        cache: { input: SOURCES, output: [] },
      },
      // The core's reactivity and the React adapter on the server, with no DOM.
      test: {
        command: "vp test run",
        cache: { input: SOURCES, output: [] },
      },
      // `@kirana-ui/vocabulary` from the core's part definitions; a test fails when it is stale.
      vocabulary: { command: "bun scripts/vocabulary.ts", cache: false },
      // Each adapter's fixture: the page the conformance run walks, the same page rendered on a
      // server for the run to hydrate, and its bench page. Angular's
      // compiler checks its adapter here, and Svelte's compiles its files.
      build: {
        command: FIXTURES.map((each) => `bun run --cwd fixtures/${each} build`).join(" && "),
        cache: {
          input: SOURCES,
          output: FIXTURES.flatMap((each) => [
            `fixtures/${each}/dist/**`,
            `fixtures/${each}/dist-server/**`,
          ]),
        },
      },
      // One set of scenarios on every adapter in a real browser, the DOM compared across them.
      conformance: {
        command: "bun tests/conformance/run.ts",
        dependsOn: ["build"],
        cache: false,
      },
      // Mount time, memory and interaction against each framework's reference library.
      bench: { command: "bun bench/run.ts", dependsOn: ["build"], cache: false },
      // Gzip per component, the framework left out, against the limits in budgets.json.
      // (`bun scripts/budgets.ts` prints the table with Base UI's beside it.)
      budgets: { command: "bun scripts/budgets.ts --check", cache: false },
      // Every adapter exports the same components and parts, and the same entry per component.
      parity: { command: "bun scripts/parity.ts", cache: false },
      // The packages as they would be published (dist-packages/), then used from an empty
      // project: installed, every export loaded, rendered on a server, type-checked.
      pack: { command: "bun scripts/pack.ts && bun scripts/consume.ts", cache: false },
      // The release path, tried against a registry of its own: `scripts/publish.ts` with a
      // refused package, lost and half-stored uploads, a release continued, then installed.
      rehearse: { command: "bun scripts/rehearse.ts", cache: false },
      // The templates' types, which `vp check` does not read: the Vue fixture's with `vue-tsc`,
      // and the Svelte fixture's with the Svelte adapter's own components with `svelte-check`.
      types: {
        command: "bun run --cwd fixtures/vue types && bun run --cwd fixtures/svelte types",
        cache: { input: SOURCES, output: [] },
      },
      // What the pre-push hook and CI run.
      prepush: {
        command:
          "vp run check && vp run types && vp run test && vp run parity && vp run budgets && vp run pack && vp run rehearse && vp run conformance",
        cache: false,
      },
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    endOfLine: "lf",
    semi: false,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "es5",
    printWidth: 100,
    sortPackageJson: false,
    ignorePatterns: [
      "**/dist/**",
      "**/dist-server/**",
      "dist-packages/**",
      "**/out/**",
      "bun.lock",
      ".agents/**",
      ".claude/**",
      // Written by release-please, in its own hand.
      "CHANGELOG.md",
      ".release-please-manifest.json",
      // Generated (`vp run vocabulary`), and compared byte for byte with what the generator writes.
      "packages/vocabulary/src/vocabulary.json",
      "packages/vocabulary/src/index.ts",
      "packages/vocabulary/src/keys.ts",
      "packages/vocabulary/REFERENCE.md",
    ],
  },
  lint: {
    plugins: ["import", "typescript", "unicorn", "react", "oxc"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    categories: {
      correctness: "error",
    },
    env: {
      builtin: true,
      es2022: true,
      browser: true,
    },
    ignorePatterns: [
      "**/dist/**",
      "**/dist-server/**",
      "dist-packages/**",
      "**/out/**",
      "**/vite.config.*.timestamp-*.*",
    ],
    rules: {
      // Deliberate here: `String(value)` on a caller's value, and a part's method handed on.
      "typescript/unbound-method": "off",
      "typescript/no-base-to-string": "off",
      "typescript/restrict-template-expressions": "off",
      // React Compiler's rules read an adapter's own plumbing as a mistake: the ref it merges
      // and hands on, and the reactive graph's nodes.
      "react/refs": "off",
      "react/immutability": "off",
      "no-shadow": "error",
      "no-var": "error",
      "prefer-const": "error",
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-commonjs": "error",
      "import/no-duplicates": "error",
      "unicorn/prefer-node-protocol": "error",
      "typescript/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "typescript/no-namespace": "error",
      "typescript/prefer-as-const": "error",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
})
