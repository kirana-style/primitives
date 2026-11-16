/**
 * Writes an `llms.txt` into each adapter's package: what a model (or a person in a hurry)
 * needs to use the components without reading their source. Generated, so it cannot drift:
 *
 *   the components and their parts   from the adapter's own exports
 *   each root's props, with what they mean   from the core's interfaces and their comments
 *   each part's attributes and variables   from the vocabulary the parts are held to
 *
 *   bun scripts/llms.ts            writes them
 *   bun scripts/llms.ts --check    fails when one is out of date
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

import type { PartDefinition } from "../packages/core/src/part.ts"
import { vocabulary } from "../packages/core/src/vocabulary.ts"

const ROOT = join(import.meta.dirname, "..")
const read = (path: string) => readFileSync(join(ROOT, path), "utf8")

// The workspace's TypeScript 7 has no JavaScript API; the Angular fixture's own TypeScript has.
type Node = {
  kind: number
  name?: { text: string }
  members?: Node[]
  questionToken?: unknown
  type?: Node
  heritageClauses?: { types: { expression: { text?: string } }[] }[]
  getText(source: unknown): string
  jsDoc?: { comment?: string | { text: string }[] }[]
}
const ts = createRequire(join(ROOT, "fixtures/angular/package.json"))("typescript") as {
  createSourceFile(name: string, text: string, target: number, parents: boolean): Node
  forEachChild(node: Node, visit: (child: Node) => void): void
  SyntaxKind: {
    InterfaceDeclaration: number
    TypeAliasDeclaration: number
    PropertySignature: number
  }
}

interface Prop {
  name: string
  optional: boolean
  type: string
  doc: string
}
interface Shape {
  props: Prop[]
  extends: string[]
}

const oneLine = (text: string) => text.replace(/\s+/g, " ").trim()
const docOf = (node: Node) =>
  oneLine(
    (node.jsDoc ?? [])
      .map((each) =>
        typeof each.comment === "string"
          ? each.comment
          : (each.comment ?? []).map((part) => part.text).join("")
      )
      .join(" ")
  )

/** Every `…Props` interface of the core, by name, and every alias of one. */
function interfaces(): { shapes: Map<string, Shape>; aliases: Map<string, string> } {
  const shapes = new Map<string, Shape>()
  const aliases = new Map<string, string>()
  const directory = "packages/core/src"
  for (const file of readdirSync(join(ROOT, directory)).sort()) {
    if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue
    const source = ts.createSourceFile(file, read(`${directory}/${file}`), 99, true)
    ts.forEachChild(source, (node) => {
      const name = node.name?.text
      if (!name?.endsWith("Props")) return
      if (node.kind === ts.SyntaxKind.TypeAliasDeclaration && node.type) {
        const to = /^[A-Za-z]+Props$/.exec(node.type.getText(source))
        if (to) aliases.set(name, to[0])
        return
      }
      if (node.kind !== ts.SyntaxKind.InterfaceDeclaration) return
      const props: Prop[] = []
      for (const member of node.members ?? []) {
        if (member.kind !== ts.SyntaxKind.PropertySignature || !member.name) continue
        props.push({
          name: member.name.text,
          optional: Boolean(member.questionToken),
          type: oneLine(member.type?.getText(source) ?? "unknown").replace(/ \| undefined$/, ""),
          doc: docOf(member),
        })
      }
      shapes.set(name, {
        props,
        extends: (node.heritageClauses ?? []).flatMap((clause) =>
          clause.types.map((each) => each.expression.text ?? "")
        ),
      })
    })
  }
  return { shapes, aliases }
}

const { shapes, aliases } = interfaces()

/** A root's props: its own after what it extends, the id left out (each adapter makes one). */
function propsOf(name: string, seen = new Set<string>()): Prop[] {
  const resolved = aliases.get(name) ?? name
  const shape = shapes.get(resolved)
  if (!shape || seen.has(resolved)) return []
  seen.add(resolved)
  const inherited = shape.extends.flatMap((each) => propsOf(each, seen))
  const own = new Set(shape.props.map((each) => each.name))
  return [...inherited.filter((each) => !own.has(each.name)), ...shape.props].filter(
    (each) => each.name !== "id"
  )
}

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
const camel = (name: string) => name[0]!.toLowerCase() + name.slice(1)

/** React's components and their parts, which every adapter has (`bun scripts/parity.ts`). */
async function components(): Promise<Map<string, string[]>> {
  const module = (await import(join(ROOT, "packages/react/src/index.ts"))) as Record<
    string,
    unknown
  >
  const found = new Map<string, string[]>()
  for (const [name, value] of Object.entries(module).sort(([a], [b]) => a.localeCompare(b))) {
    if (!/^[A-Z]/.test(name)) continue
    found.set(name, typeof value === "object" && value !== null ? Object.keys(value) : [])
  }
  return found
}

/** Angular's directives by class name, each with the selector it is written as. */
function directives(): Map<string, string> {
  const found = new Map<string, string>()
  const directory = "packages/angular/src"
  for (const file of readdirSync(join(ROOT, directory)).sort()) {
    if (!file.endsWith(".ts")) continue
    const text = read(`${directory}/${file}`)
    for (const [, selector, name] of text.matchAll(
      /@Directive\(\{\s*selector:\s*"([^"]+)"[\s\S]*?\}\)\s*export class (Kui\w+)/g
    )) {
      found.set(name!, selector!)
    }
  }
  return found
}

interface Idiom {
  title: string
  /** How a component is brought in, given its name and its entry. */
  bring(name: string, entry: string): string
  part(component: string, part: string): string
  use: string[]
}

const SHARED = [
  "No CSS is shipped and no styles are injected. A part is styled by its element, its `class`, and the attributes and CSS variables listed for it below.",
  'A boolean state is an attribute that is present or absent (`[data-open]`), never `="false"`.',
  "An entrance starts from `[data-starting-style]` and an exit ends at `[data-ending-style]`: write the hidden style under both and transition between. A part leaves the page when its own motion has ended.",
  "A popup is drawn in a portal at the end of `<body>` and placed by its `Positioner`, which carries `--anchor-width`, `--available-height`, `--transform-origin` and `data-side`.",
  "Every change callback is `(value, details)`: `details.reason`, `details.event`, `details.source` (mouse, touch, pen, keyboard, virtual, programmatic), and `details.cancel()` to keep the value as it was.",
  "A value is controlled when it is given (`value`) and the component's own when it is not (`defaultValue`). `open`/`defaultOpen` and the others pair the same way.",
  "A control with a `name` is submitted with the form around it and follows the form's reset. Inside a `Field` it is the field's control.",
]

const IDIOMS: Record<string, Idiom> = {
  react: {
    title: "React",
    bring: (name, entry) => `import { ${name} } from "@kirana-ui/react/${entry}"`,
    part: (component, part) => `<${component}.${part}>`,
    use: [
      "Each component is a namespace of parts: `<Dialog.Root>`, `<Dialog.Trigger>`. A component with one part is the component: `<Button>`.",
      "A part renders its own element and takes that element's props. `render` draws another element or component in its place: `<Dialog.Trigger render={<a href=\"/x\" />} />`, or a function `(props, state) => …`. The part's attributes win over the caller's; handlers run the caller's first.",
      "Controlled: `value` with `onValueChange`. Uncontrolled: `defaultValue`.",
      "Works in React 18 and 19, on a server, and in StrictMode.",
    ],
  },
  vue: {
    title: "Vue",
    bring: (name, entry) => `import { ${name} } from "@kirana-ui/vue/${entry}"`,
    part: (component, part) => `<${component}.${part}>`,
    use: [
      "Each component is a namespace of parts: `<Dialog.Root>`, `<Dialog.Trigger>`. A component with one part is the component: `<Button>`.",
      'A part renders its own element and takes that element\'s attributes. `as="a"` draws another element; `as-child` puts the part on the element in its slot.',
      'Props are written in kebab case (`default-value`). A value binds with `v-model:value` (`v-model:open`, `v-model:page` …); the matching event carries the details: `@value-change="(value, details) => …"`.',
      'A part that draws a list gives each entry to its slot: `v-slot="{ segment }"`.',
    ],
  },
  svelte: {
    title: "Svelte",
    bring: (name, entry) => `import { ${name} } from "@kirana-ui/svelte/${entry}"`,
    part: (component, part) => `<${component}.${part}>`,
    use: [
      "Each component is a namespace of parts: `<Dialog.Root>`, `<Dialog.Trigger>`. A component with one part is the component: `<Button>`.",
      "A part renders its own element and takes that element's attributes. A `child` snippet draws the caller's own element, spreading the part's props: `{#snippet child({ props })}<a {...props}>…</a>{/snippet}`.",
      "A value binds with `bind:value` (`bind:open`, `bind:page` …); `onValueChange={(value, details) => …}` carries the details.",
      "A part that draws a list gives each entry to its `children` snippet: `{#snippet children(segment)}…{/snippet}`.",
      "Svelte 5.",
    ],
  },
  solid: {
    title: "Solid",
    bring: (name, entry) => `import { ${name} } from "@kirana-ui/solid/${entry}"`,
    part: (component, part) => `<${component}.${part}>`,
    use: [
      "Each component is a namespace of parts: `<Dialog.Root>`, `<Dialog.Trigger>`. A component with one part is the component: `<Button>`.",
      'A part renders its own element and takes that element\'s attributes (`class`, not `className`). `as="a"` draws another element.',
      "Controlled: `value={value()}` with `onValueChange`. Uncontrolled: `defaultValue`.",
      "A part that draws a list gives each entry to its function child: `{(segment) => …}`.",
    ],
  },
  angular: {
    title: "Angular",
    bring: (name) => `import { Kui${name} } from "@kirana-ui/angular"`,
    part: (component, part) => `Kui${component}${part === "Root" ? "" : part}`,
    use: [
      "Each part is a standalone directive on the caller's own element: `<button kuiDialogTrigger>`. Import the directives a template uses into the component's `imports`.",
      "A root that draws nothing can sit on `<ng-container>`. A part that is in the page only some of the time is a structural directive: `<div *kuiDialogPopup>`.",
      "Props are inputs. Bind them (`[defaultValue]=\"'a'\"`): a static attribute stays on the element. An `id` is given as `[kuiId]`.",
      'A value binds two ways with `[(value)]` (`[(open)]`, `[(page)]` …); the output with the details is `(valueChanged)="…($event.value, $event.details)"` (`(openChanged)`, `(pageChanged)` …).',
      'A part that draws a list is structural and gives each entry: `*kuiDateFieldSegments="let segment"`.',
      "Angular 20 and later, with signals; it renders on a server and hydrates.",
    ],
  },
}

function partLines(part: PartDefinition): string[] {
  const lines: string[] = []
  for (const each of Object.values(part.states ?? {})) {
    const values = each.values ? `="${each.values.join(" | ")}"` : ""
    lines.push(`    - \`${each.attribute}${values}\`: ${each.description}`)
  }
  for (const [name, description] of Object.entries(part.variables ?? {})) {
    lines.push(`    - \`${name}\`: ${description}`)
  }
  return lines
}

export async function build(): Promise<Record<string, string>> {
  const all = await components()
  const selectors = directives()
  const files: Record<string, string> = {}
  for (const [adapter, idiom] of Object.entries(IDIOMS)) {
    const out: string[] = [
      `# @kirana-ui/${adapter}`,
      "",
      `> Kirana UI Primitives for ${idiom.title}: headless, accessible components with no styles of their own. The same components, parts, attributes and behaviour as on the other four frameworks, from one core.`,
      "",
      "Generated from the library's own definitions (`bun scripts/llms.ts`): what is here is what the components do.",
      "",
      "## Using it",
      "",
      ...idiom.use.map((each) => `- ${each}`),
      ...SHARED.map((each) => `- ${each}`),
      "",
      "## Components",
    ]
    for (const [name, parts] of all) {
      const definition = (vocabulary as Record<string, Record<string, PartDefinition>>)[camel(name)]
      const props = propsOf(`${name}Props`)
      const entry = kebab(name)
      // In Angular a component made of another's directives is a selector of that one's root.
      const owner =
        adapter === "angular" && !selectors.has(`Kui${name}`)
          ? [...selectors.entries()].find(([, selector]) =>
              selector.split(",").includes(`[kui${name}]`)
            )?.[0]
          : undefined
      const bring = owner ? idiom.bring(owner.slice(3), entry) : idiom.bring(name, entry)
      out.push("", `### ${name}`, "", "```", bring, "```", "")
      if (parts.length > 0) {
        const named = parts.map((part) => {
          if (adapter !== "angular") return `\`${idiom.part(name, part)}\``
          const directive = idiom.part(name, part)
          const selector = selectors.get(directive)
          return selector ? `\`${selector}\`` : undefined
        })
        const listed = named.filter(Boolean)
        if (listed.length > 0) out.push(`Parts: ${listed.join(", ")}.`, "")
        if (owner) {
          out.push(
            `Its root is \`[kui${name}]\`, a selector of \`${owner}\`: inside it, that component's directives are its parts.`,
            ""
          )
        } else if (adapter === "angular" && listed.length < parts.length) {
          const others = parts.filter((_part, at) => !named[at])
          out.push(
            `Its other parts (${others.join(", ")}) are the directives of the components it is made of, used inside it.`,
            ""
          )
        }
      }
      if (props.length > 0) {
        out.push(parts.length > 0 ? "Props of its root:" : "Props:", "")
        for (const each of props) {
          const doc = each.doc ? `: ${each.doc}` : ""
          out.push(`- \`${each.name}${each.optional ? "?" : ""}: ${each.type}\`${doc}`)
        }
        out.push("")
      }
      if (definition) {
        const described = Object.entries(definition).filter(
          ([, part]) => partLines(part).length > 0
        )
        if (described.length > 0) {
          out.push("Attributes and CSS variables, by part:", "")
          for (const [part, each] of described) {
            out.push(`- ${part}: ${each.description}`, ...partLines(each))
          }
          out.push("")
        }
      }
      while (out.at(-1) === "") out.pop()
    }
    files[`packages/${adapter}/llms.txt`] = `${out.join("\n")}\n`
  }
  return files
}

if (import.meta.main) {
  const files = await build()
  const check = process.argv.includes("--check")
  let stale = 0
  for (const [path, text] of Object.entries(files)) {
    const at = join(ROOT, path)
    if (check) {
      if (!existsSync(at) || readFileSync(at, "utf8") !== text) {
        console.log(`stale  ${path}  (bun scripts/llms.ts)`)
        stale++
      }
    } else {
      writeFileSync(at, text)
      console.log(`wrote ${path}  ${(text.length / 1024).toFixed(1)} KB`)
    }
  }
  if (check) {
    console.log(stale === 0 ? "llms: current" : `llms: ${stale} out of date`)
    process.exit(stale === 0 ? 0 : 1)
  }
}
