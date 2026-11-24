// This file alone runs on a server's runtime: the adapter itself is checked without its types.
/// <reference types="bun" />
import { execFileSync } from "node:child_process"
import path from "node:path"

import { describe, expect, it } from "vite-plus/test"

// Svelte's components are not modules until Svelte compiles them, and this project's tests
// run without its plugin: the page below is compiled and rendered in a process of its own,
// with no DOM at all, as a server renders a page.
const PAGE = `
<script lang="ts">
  import * as Calendar from "./src/calendar/index.ts"
  import * as Checkbox from "./src/checkbox/index.ts"
  import * as Collapsible from "./src/collapsible/index.ts"
  import * as DateField from "./src/date-field/index.ts"
  import * as Field from "./src/field/index.ts"
  import * as Meter from "./src/meter/index.ts"
  import * as NumberField from "./src/number-field/index.ts"
  import * as Otp from "./src/otp/index.ts"
  import * as Progress from "./src/progress/index.ts"
  import * as RadioGroup from "./src/radio-group/index.ts"
  import * as Select from "./src/select/index.ts"
  import * as Slider from "./src/slider/index.ts"
  import * as Switch from "./src/switch/index.ts"
  import * as Toast from "./src/toast/index.ts"
  import { createToaster } from "./src/toast.ts"
  import { Primitive, mergeProps } from "./src/primitive.ts"

  const toaster = createToaster({ duration: Infinity })
  toaster.add({ id: "t", title: "Saved", description: "To the cloud", action: { label: "Undo", onAction() {} } })
</script>

<Checkbox.Root id="plain" name="plain">Plain</Checkbox.Root>
<Checkbox.Root id="box" name="terms" defaultChecked>
  {#snippet child({ props, state, input })}
    <label {...props} data-on={state.checked}>Terms{@render input()}</label>
  {/snippet}
</Checkbox.Root>
<Checkbox.Root id="bare" name="bare">
  {#snippet child({ props })}<label {...props}>Bare</label>{/snippet}
</Checkbox.Root>
<Switch.Root id="switch" name="alerts">
  {#snippet child({ props, input })}<label {...props}>{@render input()}</label>{/snippet}
</Switch.Root>
<RadioGroup.Root id="radio" name="size" defaultValue="s">
  <RadioGroup.Item value="s">
    {#snippet child({ props, input })}<b {...props}>{@render input()}</b>{/snippet}
  </RadioGroup.Item>
</RadioGroup.Root>
<Slider.Root id="slider" name="volume" defaultValue={40}>
  <Slider.Thumb>
    {#snippet child({ props, input })}<i {...props}>{@render input()}</i>{/snippet}
  </Slider.Thumb>
</Slider.Root>
<NumberField.Root id="named" name="count" defaultValue={3}>
  {#snippet child({ props, input })}<section {...props}>{@render input()}</section>{/snippet}
</NumberField.Root>
<NumberField.Root id="nameless" defaultValue={3}>
  {#snippet child({ props, input })}<article {...props}>{@render input()}</article>{/snippet}
</NumberField.Root>
<Otp.Root id="otp" length={2} defaultValue="7">
  <Otp.Slot index={0}>
    {#snippet child({ props, char })}<em {...props}>{char}</em>{/snippet}
  </Otp.Slot>
</Otp.Root>
<Meter.Root id="meter" value={40}>
  <Meter.Value>
    {#snippet child({ props, text })}<b {...props} class="meter">{@render text()}</b>{/snippet}
  </Meter.Value>
</Meter.Root>
<Progress.Root id="progress" value={25}>
  <Progress.Value>
    {#snippet child({ props, text })}<b {...props} class="progress">{@render text()}</b>{/snippet}
  </Progress.Value>
</Progress.Root>
<Slider.Root id="written" defaultValue={30}>
  <Slider.Value>
    {#snippet child({ props, text })}<b {...props} class="slider">{@render text()}</b>{/snippet}
  </Slider.Value>
</Slider.Root>
<Select.Root id="select" defaultValue="kiwi" items={{ kiwi: "Kiwi" }}>
  <Select.Value>
    {#snippet child({ props, text })}<b {...props} class="select">{@render text()}</b>{/snippet}
  </Select.Value>
</Select.Root>
<Calendar.Root id="calendar" defaultValue="2026-03-09" locale="en-US">
  <Calendar.Heading>
    {#snippet child({ props, text })}<h2 {...props}>{@render text()}</h2>{/snippet}
  </Calendar.Heading>
  <Calendar.Cell date="2026-03-09">
    {#snippet child({ props })}<td data-disabled="true" data-selected="true" {...props} data-kind="before">9</td>{/snippet}
  </Calendar.Cell>
  <Calendar.Cell date="2026-03-09">
    {#snippet child({ props })}<td {...props} data-disabled="true" data-selected="true" data-kind="after">9</td>{/snippet}
  </Calendar.Cell>
</Calendar.Root>
<DateField.Root id="date" defaultValue="2026-03-09" locale="en-US">
  <DateField.Segments>
    {#snippet children(segment)}
      <DateField.Segment {segment}>
        {#snippet child({ props, text })}<i {...props}>{@render text()}</i>{/snippet}
      </DateField.Segment>
    {/snippet}
  </DateField.Segments>
</DateField.Root>
<Field.Root id="field" invalid>
  <Field.Error match>
    {#snippet child({ props, text })}<em {...props} class="error">Wrong: {@render text()}</em>{/snippet}
  </Field.Error>
</Field.Root>
<Toast.Viewport id="ts" {toaster}>
  <Toast.List>
    {#snippet children(toast)}
      <Toast.Root {toast}>
        <Toast.Title>
          {#snippet child({ props, text })}<h3 {...props}>{@render text()}</h3>{/snippet}
        </Toast.Title>
        <Toast.Description>
          {#snippet child({ props, text })}<p {...props}>{@render text()}</p>{/snippet}
        </Toast.Description>
        <Toast.Action>
          {#snippet child({ props, text })}<a {...props}>{@render text()}</a>{/snippet}
        </Toast.Action>
      </Toast.Root>
    {/snippet}
  </Toast.List>
</Toast.Viewport>
<Primitive as="span" {...mergeProps({ class: "badge", title: "own" }, { class: "mine" })} state={{ active: true }} data-kind="new">New</Primitive>
<Primitive as="b" {...mergeProps({ class: "badge", title: "own" }, { title: "theirs" })} state={{ active: false }}>Bold</Primitive>
<Primitive {...mergeProps({ class: "badge", title: "own" }, { class: "mine" })} state={{ active: true }}>
  {#snippet child({ props, state })}<a {...props} href="/new">{state.active ? "On" : "Off"}</a>{/snippet}
</Primitive>
<Primitive as="input" class="void" value="kept" />
<Collapsible.Root id="shadow" part="root">
  <Collapsible.Trigger part="trigger">Open</Collapsible.Trigger>
  <Collapsible.Panel part="panel" keepMounted>
    {#snippet child({ props })}<section {...props}>Held</section>{/snippet}
  </Collapsible.Panel>
</Collapsible.Root>
`

// Every part drawn as a void element (an input, an image), each as plainly as it is written.
const VOID = `
<script lang="ts">
  import { signal } from "@kirana-ui/core"

  import Part from "./src/Part.svelte"
  import * as Checkbox from "./src/checkbox/index.ts"
  import * as Combobox from "./src/combobox/index.ts"
  import * as Command from "./src/command/index.ts"
  import * as DateField from "./src/date-field/index.ts"
  import * as Field from "./src/field/index.ts"
  import Input from "./src/input/Input.svelte"
  import * as NumberField from "./src/number-field/index.ts"
  import * as Otp from "./src/otp/index.ts"
  import * as RadioGroup from "./src/radio-group/index.ts"
  import * as Select from "./src/select/index.ts"
  import * as Slider from "./src/slider/index.ts"
  import * as Switch from "./src/switch/index.ts"
  import * as Toolbar from "./src/toolbar/index.ts"

  // An avatar's image is drawn once its picture has loaded, which a server never sees.
  const image = { props: signal({ src: "a.png", alt: "" }), attach: () => () => {} }
</script>

<Part of={image} tag="img" />
<Checkbox.Root id="v-box" name="box" />
<Switch.Root id="v-switch" name="switch" />
<RadioGroup.Root id="v-radio" name="radio"><RadioGroup.Item value="a" /></RadioGroup.Root>
<Slider.Root id="v-slider" name="slider" defaultValue={10}><Slider.Thumb /></Slider.Root>
<Otp.Root id="v-otp" length={2}><Otp.Input /></Otp.Root>
<Command.Root id="v-command"><Command.Input /></Command.Root>
<Combobox.Root id="v-combobox" name="combobox"><Combobox.Input /></Combobox.Root>
<Select.Root id="v-select" name="select" />
<NumberField.Root id="v-number" name="number"><NumberField.Input /></NumberField.Root>
<DateField.Root id="v-date" name="date" locale="en-US"><DateField.Input /></DateField.Root>
<Toolbar.Root id="v-toolbar"><Toolbar.Input /></Toolbar.Root>
<Field.Root id="v-field"><Field.Control /></Field.Root>
<Input id="v-input" />
`

const RENDER = `
import { readFileSync } from "node:fs"
import { compile, compileModule } from "svelte/compiler"

const root = process.cwd()
const types = new Bun.Transpiler({ loader: "ts" })
// With \`DEV\`, as a development build compiles it, and a warning of Svelte's is a failure.
const dev = Boolean(process.env.DEV)
const warned = []
if (dev) console.warn = (...given) => void warned.push(given.join(" "))
const server = (source, filename) => compile(source, { generate: "server", filename, dev }).js.code
Bun.plugin({
  name: "svelte",
  setup(build) {
    build.module("virtual:page", () => ({
      contents: server(process.env.PAGE, root + "/Page.svelte").replaceAll('"./src/', '"' + root + "/src/"),
      loader: "js",
    }))
    build.onLoad({ filter: /\\.svelte$/ }, (args) => ({
      contents: server(readFileSync(args.path, "utf8"), args.path),
      loader: "js",
    }))
    build.onLoad({ filter: /\\.svelte\\.ts$/ }, (args) => ({
      contents: compileModule(types.transformSync(readFileSync(args.path, "utf8")), {
        generate: "server",
        filename: args.path,
      }).js.code,
      loader: "js",
    }))
  },
})
const { default: Page } = await import("virtual:page")
const { render } = await import("svelte/server")
const body = render(Page).body
if (warned.length) {
  process.stderr.write(warned.join("\\n"))
  process.exit(1)
}
process.stdout.write(body)
`

function rendered(page = PAGE, dev = false): string {
  const html = execFileSync("bun", ["--conditions", "svelte", "-e", RENDER], {
    cwd: path.join(import.meta.dirname, ".."),
    env: { ...process.env, PAGE: page, ...(dev ? { DEV: "1" } : {}) },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
  // Svelte's own marks for hydration are not the page's.
  return html.replace(/<!--[^>]*-->/g, "")
}

describe("on the server", () => {
  const html = rendered()

  it("keeps a control's native input as the last child of the element it draws", () => {
    expect(html).toContain(
      '<span role="checkbox" tabindex="0" aria-checked="false" data-unchecked="">Plain<input type="checkbox" id="plain" name="plain" hidden="" tabindex="-1" aria-hidden="true"></span>'
    )
  })

  it("hands `child` the native input, to render inside the caller's element", () => {
    expect(html).toContain(
      '<label role="checkbox" tabindex="0" aria-checked="true" data-checked="" data-on="true">Terms<input type="checkbox" id="box" name="terms" checked="" hidden="" tabindex="-1" aria-hidden="true"></label>'
    )
    expect(html).toMatch(
      /<label role="switch"[^>]*><input type="checkbox" id="switch" name="alerts"/
    )
    expect(html).toMatch(
      /<b role="radio"[^>]*><input type="radio" name="size" value="s" checked=""/
    )
    expect(html).toMatch(
      /<i role="slider"[^>]*><input type="hidden" name="volume" value="40"><\/i>/
    )
    expect(html).toMatch(/<section[^>]*><input type="hidden" name="count" value="3"><\/section>/)
  })

  it("draws a plain element of one's own as a part is drawn, its state as attributes", () => {
    // The component's own class joined with its caller's, its state under both.
    expect(html).toContain(
      '<span data-active="" class="badge mine" title="own" data-kind="new">New</span>'
    )
    // Another tag, a later set winning an attribute, a state that does not hold absent.
    expect(html).toContain('<b class="badge" title="theirs">Bold</b>')
    // The caller's own element, given the props and the state.
    expect(html).toContain('<a data-active="" class="badge mine" title="own" href="/new">On</a>')
    // An element that holds nothing holds nothing.
    expect(html).toContain('<input class="void" value="kept">')
  })

  it("leaves what the caller's element writes before the props where the part has nothing to say", () => {
    // The cell is chosen and not disabled: written before the props, the element's chosen
    // state is the part's and its `data-disabled` its own; written after them, both its own.
    const before = html.match(/<td[^>]*data-kind="before"[^>]*>/)![0]
    expect(before).toContain('data-selected=""')
    expect(before).toContain('data-disabled="true"')
    const after = html.match(/<td[^>]*data-kind="after"[^>]*>/)![0]
    expect(after).toContain('data-selected="true"')
    expect(after).toContain('data-disabled="true"')
  })

  it("draws no input a snippet did not render, and none for a number field with no name", () => {
    expect(html).toMatch(/<label role="checkbox"[^>]*>Bare<\/label>/)
    expect(html).toMatch(/<article[^>]*><\/article>/)
  })

  it("hands a code cell's `child` its character", () => {
    expect(html).toContain('<em data-index="0" data-filled="">7</em>')
  })

  it("hands `child` the text a part writes, to render inside the caller's element", () => {
    expect(html).toMatch(/<b [^>]*class="meter"[^>]*>40%<\/b>/)
    expect(html).toMatch(/<b [^>]*class="progress"[^>]*>25%<\/b>/)
    expect(html).toMatch(/<b [^>]*class="slider"[^>]*>30<\/b>/)
    expect(html).toMatch(/<b [^>]*class="select"[^>]*>Kiwi<\/b>/)
    expect(html).toMatch(/<h2[^>]*>March 2026<\/h2>/)
    expect(html).toMatch(/<i [^>]*>03<\/i>.*<i [^>]*>2026<\/i>/s)
    expect(html).toMatch(/<h3[^>]*>Saved<\/h3>/)
    expect(html).toMatch(/<p[^>]*>To the cloud<\/p>/)
    expect(html).toMatch(/<a[^>]*>Undo<\/a>/)
    // A field's error has no words on a server: its snippet is still given `text` to render.
    expect(html).toMatch(/<em [^>]*class="error"[^>]*>Wrong: <\/em>/)
  })

  it("leaves a caller's `part` attribute on the element, for `::part()`", () => {
    expect(html).toMatch(/<div [^>]*part="root"/)
    expect(html).toMatch(/<button [^>]*part="trigger"[^>]*>Open<\/button>/)
    expect(html).toMatch(/<section [^>]*part="panel"[^>]*>Held<\/section>/)
  })
})

describe("in a development build", () => {
  it("draws a void element with no content, so Svelte has nothing to warn of", () => {
    const html = rendered(VOID, true)
    expect(html).toContain('<img src="a.png" alt="">')
    expect(html).toMatch(/<input type="radio" name="radio" value="a"/)
    expect(html).toMatch(/<input[^>]*name="combobox"/)
  })
})
