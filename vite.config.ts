import { defineConfig } from "vite-plus"

const FIXTURES = ["react", "svelte", "angular"]

/**
 * The workspace's sources, named rather than traced: tracing a task's file access can miss reads
 * of workspace packages and makes starting a native binary fail (the Kirana repository found both).
 */
const SOURCES = [
  "**/*.{ts,tsx,js,mjs,json,svelte,css,html,md,yml,yaml}",
  "!**/node_modules/**",
  "!**/dist/**",
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
      // Each adapter's fixture: the page the conformance run walks, and its bench page. Angular's
      // compiler checks its adapter here, and Svelte's compiles its files.
      build: {
        command: FIXTURES.map((each) => `bun run --cwd fixtures/${each} build`).join(" && "),
        cache: {
          input: SOURCES,
          output: FIXTURES.map((each) => `fixtures/${each}/dist/**`),
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
      // Gzip per component, the framework left out.
      budgets: { command: "bun scripts/budgets.ts", cache: false },
      // What the pre-push hook and CI run.
      prepush: {
        command: "vp run check && vp run test && vp run conformance",
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
    ignorePatterns: ["**/dist/**", "**/out/**", "bun.lock", ".agents/**", ".claude/**"],
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
    ignorePatterns: ["**/dist/**", "**/out/**", "**/vite.config.*.timestamp-*.*"],
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
