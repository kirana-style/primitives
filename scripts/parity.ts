/**
 * Every adapter exports the same components with the same parts. React's is the list the others
 * are held to; a difference a framework's idiom needs is written in `IDIOM`, with why.
 *
 *   bun scripts/parity.ts
 */
import { readFileSync, readdirSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

import { canonical } from "./llms.ts"
import { declaredIn, entries as entriesOf, exportsOf, programOf, reference } from "./reference.ts"

const ROOT = join(import.meta.dirname, "..")
type Shape = Record<string, string[]>

// Solid's JSX is compiled by Solid's own compiler, as a project's build would: the same
// transform here, for a server, so its modules load and their exports can be read.
const compiler = createRequire(join(ROOT, "packages/solid/package.json"))("@solidjs/compiler") as {
  transform(code: string, options: object): { code: string }
}
// The workspace's TypeScript 7 has no JavaScript API; the Angular fixture's own TypeScript has.
const typescript = createRequire(join(ROOT, "fixtures/angular/package.json"))("typescript") as {
  transpileModule(
    source: string,
    options: { compilerOptions: Record<string, unknown> }
  ): { outputText: string }
}
Bun.plugin({
  name: "solid-jsx",
  setup(build) {
    build.onLoad({ filter: /\/packages\/solid\/src\/.*\.tsx$/ }, (args) => {
      // TypeScript takes the types off and leaves the JSX for Solid's compiler.
      const plain = typescript.transpileModule(readFileSync(args.path, "utf8"), {
        // Its enums by their numbers: JSX preserved, ES2022, ES modules.
        compilerOptions: { jsx: 1, target: 9, module: 99, verbatimModuleSyntax: true },
      }).outputText
      const built = compiler.transform(plain, {
        filename: args.path.replace(/\.tsx$/, ".jsx"),
        generate: "ssr",
      })
      return { contents: built.code, loader: "js" }
    })
  },
})

/** A module's exports as loaded: a namespace's keys are its parts. */
async function loaded(adapter: string): Promise<Shape> {
  const module = (await import(join(ROOT, "packages", adapter, "src/index.ts"))) as Record<
    string,
    unknown
  >
  const shape: Shape = {}
  for (const [name, value] of Object.entries(module)) {
    const parts =
      typeof value === "object" && value !== null && !("setup" in value) && !("render" in value)
        ? Object.keys(value)
        : []
    shape[name] = parts.sort()
  }
  return shape
}

const read = (path: string) => readFileSync(join(ROOT, path), "utf8")

/** The names an `export { a, b as c } from` or `export { default as A } from` list gives. */
function names(source: string): string[] {
  const found: string[] = []
  for (const [, list] of source.matchAll(/export\s*\{([^}]*)\}\s*from/g)) {
    for (const item of list!.split(",")) {
      const name = item
        .trim()
        .split(/\s+as\s+/)
        .pop()
      if (name && !name.startsWith("type ")) found.push(name)
    }
  }
  return found
}

/** Svelte's files are not modules a script can load: its indexes are read. */
function svelte(): Shape {
  const index = read("packages/svelte/src/index.ts")
  const shape: Shape = {}
  for (const [, name, path] of index.matchAll(/export \* as (\w+) from "\.\/([^"]+)"/g)) {
    shape[name!] = names(read(`packages/svelte/src/${path}`)).sort()
  }
  for (const name of names(index)) shape[name] = []
  return shape
}

/** Angular's parts are directives, `KpAccordionItem`: named back into component and part. */
function angular(components: string[]): Shape {
  const shape: Shape = {}
  const byLength = [...components].sort((a, b) => b.length - a.length)
  for (const name of names(read("packages/angular/src/index.ts"))) {
    if (!name.startsWith("Kp")) {
      shape[name] = []
      continue
    }
    const rest = name.slice(2)
    const component = byLength.find((each) => rest.startsWith(each))
    if (!component) {
      shape[rest] = []
      continue
    }
    const part = rest.slice(component.length)
    ;(shape[component] ??= []).push(part || "Root")
  }
  for (const parts of Object.values(shape)) parts.sort()
  return shape
}

/**
 * What an adapter names or shapes its own way. `rename` maps its export to React's; `without`
 * lists parts it does not have and `extra` parts only it has, each with the reason; `entries`
 * lists the entries only it has, which no component of the core stands behind.
 */
const RUNTIME =
  "what a part's directive is made with, from the one entry an Angular package has: the others have `./runtime`"

const DATE_PICKER =
  "inside `kpDatePicker` the date field's, the popover's and the calendar's own directives are its parts"

const IDIOM: Record<
  string,
  {
    rename?: Record<string, string>
    without?: Record<string, string>
    extra?: Record<string, string>
    entries?: Record<string, string>
  }
> = {
  // A plain element of one's own with the composition a part has, each in its framework's
  // form: React's `render`, Vue's `as` and `as-child`, Solid's `as` and `render`, Svelte's
  // `child` snippet. In Angular a directive is on the caller's own element and its host's
  // bindings join the element's own; a custom element's parts are the page's own elements.
  react: {
    entries: {
      "./use-render":
        "`render` is an element or a function the component draws: `useRender` and `mergeProps` give a plain element the same",
    },
  },
  vue: {
    entries: {
      "./primitive":
        "`as` and `as-child` are props a component reads: `Primitive` gives a plain element the same",
    },
  },
  solid: {
    entries: {
      "./primitive":
        "`as` and `render` are props a component reads: `Primitive` and `mergeProps` give a plain element the same",
    },
  },
  svelte: {
    entries: {
      "./primitive":
        "`child` is a snippet a component draws: `Primitive` and `mergeProps` give a plain element the same",
    },
  },
  angular: {
    // A directive is a provider by being on an element; a function that injects is `inject…`.
    rename: { Direction: "DirectionProvider", injectDirection: "useDirection" },
    without: {
      AlertDialog:
        "the dialog's directives under a root of its own, `kpAlertDialog`, which takes neither `modal` nor `dismissible`",
      Drawer: "the dialog's directives with another selector on the root: `kpDrawer`",
      Autocomplete: "the combobox's directives with another selector on the root: `kpAutocomplete`",
      "DatePicker.Cell": DATE_PICKER,
      "DatePicker.Day": DATE_PICKER,
      "DatePicker.Grid": DATE_PICKER,
      "DatePicker.HeadCell": DATE_PICKER,
      "DatePicker.Heading": DATE_PICKER,
      "DatePicker.Input": DATE_PICKER,
      "DatePicker.Months": DATE_PICKER,
      "DatePicker.Next": DATE_PICKER,
      "DatePicker.Popup": DATE_PICKER,
      "DatePicker.Portal": DATE_PICKER,
      "DatePicker.Positioner": DATE_PICKER,
      "DatePicker.Previous": DATE_PICKER,
      "DatePicker.Segment": DATE_PICKER,
      "DatePicker.Segments": DATE_PICKER,
      "DatePicker.Trigger": DATE_PICKER,
      "DatePicker.Weekdays": DATE_PICKER,
      "DatePicker.Weeks": DATE_PICKER,
      ContextMenu:
        "the menu's directives with another selector on the root, `kpContextMenu`, and its own trigger, `kpContextMenuTrigger`",
    },
    extra: {
      Ids: RUNTIME,
      Positioner: RUNTIME,
      hostInputs:
        "a design system's directive hosts a primitive's (`hostDirectives`), whose inputs Angular binds only from the element: this gives them. Elsewhere a design system passes props to the part it draws",
      hostPart: RUNTIME,
      injectDirectionAround: RUNTIME,
      innerPart: RUNTIME,
      inputsSignal: RUNTIME,
      mounted: RUNTIME,
      onServer: RUNTIME,
      presentWhile: RUNTIME,
      "Combobox.HiddenInput":
        "the root is an `<ng-container>`, with no element to hold the hidden input: it is written",
      "Select.Input":
        "the root is an `<ng-container>`, with no element to hold the hidden input: it is written",
    },
  },
}

const react = await loaded("react")
const shapes: Record<string, Shape> = {
  vue: await loaded("vue"),
  solid: await loaded("solid"),
  svelte: svelte(),
  angular: angular(Object.keys(react)),
}

let failed = 0

// The same entry per component in every package: `@kirana-ui/<adapter>/accordion`. Angular's is
// the exception: Angular's packager writes one flat module, which a project's build takes apart.
const entries = (adapter: string) =>
  Object.keys((JSON.parse(read(`packages/${adapter}/package.json`)) as { exports: object }).exports)
    .filter((each) => each !== ".")
    .sort()
const components = entries("core").filter(
  (each) =>
    !["./reactivity", "./dom", "./vocabulary", "./authoring", "./testing", "./agent"].includes(each)
)
// Each adapter's own: what its parts are made with, for a component of one's own, and the
// core's agent bridge and testing kit, so that the one package a project installs is enough.
const SHARED_ENTRIES = ["./runtime", "./agent", "./testing"]
for (const adapter of ["react", "vue", "solid", "svelte", "angular", "web"]) {
  for (const entry of ["./agent", "./testing"]) {
    if (entries(adapter).includes(entry)) continue
    failed++
    console.log(`DIFF  ${adapter} has no entry ${entry}`)
  }
}
for (const adapter of ["react", "vue", "solid", "svelte"]) {
  const given = entries(adapter).filter(
    (each) => !SHARED_ENTRIES.includes(each) && !IDIOM[adapter]?.entries?.[each]
  )
  const missing = components.filter((each) => !given.includes(each))
  const unknown = given.filter((each) => !components.includes(each))
  if (missing.length === 0 && unknown.length === 0) {
    console.log(`same  ${adapter} has the core's entries  (${given.length})`)
    continue
  }
  failed += missing.length + unknown.length
  for (const each of missing) console.log(`DIFF  ${adapter} has no entry ${each}`)
  for (const each of unknown) console.log(`DIFF  ${adapter} has ${each}, which the core has not`)
}
for (const [adapter, given] of Object.entries(shapes)) {
  const idiom = IDIOM[adapter] ?? {}
  const shape: Shape = {}
  for (const [name, parts] of Object.entries(given)) shape[idiom.rename?.[name] ?? name] = parts
  const problems: string[] = []
  for (const [name, parts] of Object.entries(react)) {
    const theirs = shape[name]
    // A component it makes from another's parts is not held to React's list of them.
    if (!theirs || idiom.without?.[name]) {
      if (!idiom.without?.[name]) problems.push(`has no ${name}`)
      continue
    }
    // A component with one part is the component itself; with several, Angular's root is `Root`.
    const mine = parts.length === 0 && theirs.join() === "Root" ? ["Root"] : parts
    for (const part of mine) {
      if (!theirs.includes(part) && !idiom.without?.[`${name}.${part}`])
        problems.push(`has no ${name}.${part}`)
    }
    for (const part of theirs) {
      if (!mine.includes(part) && !idiom.extra?.[`${name}.${part}`])
        problems.push(`has ${name}.${part}, which React's has not`)
    }
  }
  for (const name of Object.keys(shape)) {
    if (!(name in react) && !idiom.extra?.[name])
      problems.push(`has ${name}, which React's has not`)
  }
  if (problems.length === 0) {
    console.log(`same  ${adapter} = react  (${Object.keys(react).length} exports)`)
    continue
  }
  failed += problems.length
  for (const problem of problems) console.log(`DIFF  ${adapter} ${problem}`)
}
// Each part takes the same props of its own on every adapter: React's, by name, in each
// framework's idiom (`canonical` in `scripts/llms.ts`: Vue's `valueChange` and Angular's
// `valueChanged` are `onValueChange`, a structural directive's `kpTabsPanelKeepMounted` is
// `keepMounted`). What an idiom really writes another way is in `PROPS`, with why.
const ONE_DIALOG = "one directive is the root of a dialog and a drawer: its inputs are both's"
const ONE_COMBOBOX =
  "one directive is the root of a combobox and an autocomplete: its inputs are both's"
const OWN_VALUE =
  "the directive's own value: a structural directive is given what it needs after its name"
const MODEL =
  "`v-model` on what is typed in binds `modelValue`: React's is the element's own `value`"
const SRC =
  "the part waits for the picture before it draws an element, so the address is its own prop: React's reads its element's `src`"
const BOUND =
  "`bind:value` binds a prop the component declares: React's is the element's own `value`"
const ON_ROOT =
  "a structural directive's outputs cannot be bound from the element it draws: the root tells its image's loading"
const TAG =
  "another element (a `<textarea>`, a `<select>`) is asked for by its tag: React's `render` draws it"

interface PropIdiom {
  /** The adapter's name for a prop of React's: `Component.Part.itsName` → React's name. */
  rename?: Record<string, readonly [to: string, why: string]>
  /** Props only it has. */
  extra?: Record<string, string>
  /** Props of React's part it lacks, and why that is its idiom. */
  without?: Record<string, string>
  /**
   * Props of React's part it lacks and should have: a gap, not an idiom. An entry here is work
   * to do, kept in sight; the check fails on a gap that is not written down.
   */
  open?: Record<string, string>
}

const KEPT =
  "not built: the part is in the page only while it holds (the other adapters keep it with `keepMounted`)"
const WRITTEN =
  "not built: the part writes its text and takes no template to draw something else from the value"

/** By `Component.Part.prop`; `*` stands for every component or every part. */
const PROPS: Record<string, PropIdiom> = {
  vue: {
    rename: {
      "Autocomplete.Root.modelValue": ["value", MODEL],
      "NumberField.Root.modelValue": ["value", MODEL],
    },
    extra: {
      "Autosize.Textarea.modelValue": MODEL,
      "Input.Root.modelValue": MODEL,
      "Avatar.Image.src": SRC,
    },
  },
  svelte: {
    extra: {
      "Autosize.Textarea.value": BOUND,
      "Input.Root.value": BOUND,
      "Input.Root.as": TAG,
      "Field.Control.as": TAG,
      "Avatar.Image.src": SRC,
    },
  },
  solid: { extra: { "Avatar.Image.src": SRC } },
  angular: {
    rename: {
      "Accordion.Panel.kpAccordionPanel": [
        "keepMounted",
        'the directive\'s own value is its options: `*kpAccordionPanel="{ keepMounted: true }"`',
      ],
      "Collapsible.Panel.kpCollapsiblePanel": [
        "keepMounted",
        'the directive\'s own value is its options: `*kpCollapsiblePanel="{ keepMounted: true }"`',
      ],
      "ScrollArea.Scrollbar.kpScrollAreaScrollbar": ["orientation", OWN_VALUE],
      "Tabs.Panel.kpTabsPanel": ["value", OWN_VALUE],
      "Command.Root.onItemSelected": [
        "onSelect",
        "a text input's own `select` event bubbles to the root: the output is `itemSelected`",
      ],
      "Otp.Root.onCompleted": ["onComplete", "an output is named for what happened: `completed`"],
      "Avatar.Fallback.kpAvatarFallback": [
        "delay",
        'the directive\'s own value is its options: `*kpAvatarFallback="{ delay: 600 }"`',
      ],
    },
    without: {
      "Avatar.Image.onLoadingStatusChange": ON_ROOT,
      "Avatar.Image.keepMounted":
        "the image kept in the page is the directive's attribute form, `<img kpAvatarImage [src]>`",
    },
    extra: {
      "Avatar.Image.kpAvatarImage": SRC,
      "Avatar.Root.onLoadingStatusChange": ON_ROOT,
      "Dialog.Root.swipeDirection": ONE_DIALOG,
      "Dialog.Root.snapPoints": ONE_DIALOG,
      "Dialog.Root.snapPoint": ONE_DIALOG,
      "Dialog.Root.defaultSnapPoint": ONE_DIALOG,
      "Dialog.Root.onSnapPointChange": ONE_DIALOG,
      "Combobox.Root.mode": ONE_COMBOBOX,
      "Combobox.Root.openOnInputClick": ONE_COMBOBOX,
      "Autocomplete.Root.inputValue": ONE_COMBOBOX,
      "Autocomplete.Root.defaultInputValue": ONE_COMBOBOX,
      "Autocomplete.Root.onInputValueChange": ONE_COMBOBOX,
      "Autocomplete.Root.multiple": ONE_COMBOBOX,
      "Autocomplete.Root.values": ONE_COMBOBOX,
      "Autocomplete.Root.defaultValues": ONE_COMBOBOX,
      "Autocomplete.Root.onValuesChange": ONE_COMBOBOX,
      "Autocomplete.Root.inline": ONE_COMBOBOX,
    },
    open: {
      "*.Clear.keepMounted": KEPT,
      "*.Indicator.keepMounted": KEPT,
      "*.ItemIndicator.keepMounted": KEPT,
      "*.CheckboxItemIndicator.keepMounted": KEPT,
      "*.RadioItemIndicator.keepMounted": KEPT,
      "Meter.Value.children": WRITTEN,
      "Progress.Value.children": WRITTEN,
      "Slider.Value.children": WRITTEN,
    },
  },
}

// An entry that names nothing any more is a difference too: the list stays what is true.
const met = new Set<string>()

function listed<Entry>(
  list: Record<string, Entry> | undefined,
  component: string,
  part: string,
  prop: string
): Entry | undefined {
  for (const key of [
    `${component}.${part}.${prop}`,
    `*.${part}.${prop}`,
    `${component}.*.${prop}`,
    `*.*.${prop}`,
  ]) {
    const found = list?.[key]
    if (found === undefined) continue
    met.add(key)
    return found
  }
  return undefined
}

const theirs = await reference("react")
for (const adapter of ["vue", "svelte", "solid", "angular"]) {
  const own = await reference(adapter)
  const problems: string[] = []
  const gaps: string[] = []
  let compared = 0
  for (const [name, component] of theirs.components) {
    for (const part of component.parts) {
      const mine = own.components.get(name)?.parts.find((each) => each.part === part.part)
      if (!mine) continue
      compared++
      const selector = mine.directive && /\[(\w+)\]/.exec(mine.directive.selector)?.[1]
      const has = new Set(
        mine.props
          // `update:value` is what `v-model:value` hears: the prop `value`, bound.
          .filter((each) => !(each.kind === "emit" && each.name.startsWith("update:")))
          .map((each) => canonical(adapter, each, selector))
          .map((each) => listed(PROPS[adapter]?.rename, name, part.part, each)?.[0] ?? each)
      )
      // What a part gives its content: a function child here, a slot, a snippet, a template there.
      if (mine.slot?.length || mine.directive?.context.length) has.add("children")
      const wanted = new Set(part.props.map((each) => each.name))
      for (const prop of wanted) {
        if (has.has(prop) || listed(PROPS[adapter]?.without, name, part.part, prop)) continue
        if (listed(PROPS[adapter]?.open, name, part.part, prop)) {
          gaps.push(`${name}.${part.part}.${prop}`)
          continue
        }
        problems.push(`${name}.${part.part} has no ${prop}`)
      }
      for (const prop of has) {
        if (!wanted.has(prop) && !listed(PROPS[adapter]?.extra, name, part.part, prop))
          problems.push(`${name}.${part.part} has ${prop}, which React's has not`)
      }
    }
  }
  if (gaps.length > 0) console.log(`open  ${adapter} lacks, written down: ${gaps.join(", ")}`)
  const idiom = PROPS[adapter] ?? {}
  for (const key of [idiom.rename, idiom.extra, idiom.without, idiom.open].flatMap((each) =>
    Object.keys(each ?? {})
  )) {
    if (!met.has(key)) problems.push(`is said to differ in ${key}, and does not`)
  }
  met.clear()
  if (problems.length === 0) {
    console.log(`same  ${adapter} = react  (the own props of ${compared} parts)`)
    continue
  }
  failed += problems.length
  for (const problem of problems) console.log(`DIFF  ${adapter} ${problem}`)
}

// The core's types a prop names are exported by every adapter's own root, so a project that
// installed one package imports them from it (a strict installer keeps `@kirana-ui/core`, a
// dependency's dependency, out of reach). React's root is the list; what a framework's idiom
// exports beside it is in `TYPES`, with why.
const WEB_TOAST =
  "a toaster and its types are the toast's own entry's there, `@kirana-ui/web/toast`: the root defines the elements"
const TYPES: Record<string, { extra?: Record<string, string>; without?: Record<string, string> }> =
  {
    angular: {
      extra: {
        CalendarProps:
          "a date picker's stand-in for the calendar's root is typed by the core's props, which an input names",
        DateFieldProps:
          "a date picker's stand-in for the date field's root is typed by the core's props, which an input names",
      },
    },
    web: {
      without: {
        PartEvent: "no part takes a handler: the page's own listeners hear the platform's events",
        ToastActionOptions: WEB_TOAST,
        ToastOptions: WEB_TOAST,
        ToastRecord: WEB_TOAST,
        ToastState: WEB_TOAST,
        Toaster: WEB_TOAST,
        ToasterOptions: WEB_TOAST,
      },
    },
  }
const coreTypes = (adapter: string): string[] => {
  const program = programOf(adapter)
  const file = entriesOf(adapter).get(".")!
  return [...exportsOf(program, file)]
    .filter(([name, kind]) => {
      if (kind !== "type") return false
      const at = declaredIn(program, file, name)
      return at.length > 0 && at.at(-1)!.startsWith("packages/core/")
    })
    .map(([name]) => name)
    .sort()
}
const wanted = coreTypes("react")
for (const adapter of ["vue", "svelte", "solid", "angular", "web"]) {
  const given = coreTypes(adapter)
  const idiom = TYPES[adapter] ?? {}
  const problems = [
    ...wanted
      .filter((each) => !given.includes(each) && !idiom.without?.[each])
      .map((each) => `does not export the type ${each}`),
    ...given
      .filter((each) => !wanted.includes(each) && !idiom.extra?.[each])
      .map((each) => `exports the core's type ${each}, which React's root does not`),
    ...Object.keys(idiom.extra ?? {})
      .filter((each) => !given.includes(each) || wanted.includes(each))
      .map((each) => `is said to differ in the type ${each}, and does not`),
    ...Object.keys(idiom.without ?? {})
      .filter((each) => given.includes(each) || !wanted.includes(each))
      .map((each) => `is said to differ in the type ${each}, and does not`),
  ]
  if (wanted.length === 0) problems.push("React's root exports none of the core's types")
  if (problems.length === 0) {
    console.log(`same  ${adapter} = react  (${wanted.length} of the core's types, from its root)`)
    continue
  }
  failed += problems.length
  for (const problem of problems) console.log(`DIFF  ${adapter} ${problem}`)
}

// One version for the family (each adapter is only right for the core it was built with), which
// the release bumps in every manifest: a package the release's configuration does not list would
// stay behind.
const manifest = (path: string) => JSON.parse(read(path)) as { version: string }
const release = (JSON.parse(read(".release-please-manifest.json")) as Record<string, string>)["."]
const bumped = (
  JSON.parse(read("release-please-config.json")) as {
    packages: { ".": { "extra-files": { path: string }[] } }
  }
).packages["."]["extra-files"].map((each) => each.path)
const packages = readdirSync(join(ROOT, "packages")).map((each) => `packages/${each}/package.json`)
for (const path of packages) {
  if (!bumped.includes(path)) {
    failed++
    console.log(`DIFF  release-please-config.json does not bump ${path}`)
  }
  if (manifest(path).version !== release) {
    failed++
    console.log(`DIFF  ${path} is ${manifest(path).version}, the release is ${release}`)
  }
}
for (const path of bumped.filter((each) => !packages.includes(each))) {
  failed++
  console.log(`DIFF  release-please-config.json bumps ${path}, which is not a package`)
}
console.log(`same  ${packages.length} packages at ${release}, each bumped by a release`)

console.log(failed === 0 ? "\nparity: passed" : `\nparity: ${failed} differences`)
process.exit(failed === 0 ? 0 : 1)
