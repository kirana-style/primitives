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
<Collapsible.Root id="shadow" part="root">
  <Collapsible.Trigger part="trigger">Open</Collapsible.Trigger>
  <Collapsible.Panel part="panel" keepMounted>
    {#snippet child({ props })}<section {...props}>Held</section>{/snippet}
  </Collapsible.Panel>
</Collapsible.Root>
`

const RENDER = `
import { readFileSync } from "node:fs"
import { compile, compileModule } from "svelte/compiler"

const root = process.cwd()
const types = new Bun.Transpiler({ loader: "ts" })
const server = (source, filename) => compile(source, { generate: "server", filename }).js.code
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
process.stdout.write(render(Page).body)
`

function rendered(): string {
  const html = execFileSync("bun", ["--conditions", "svelte", "-e", RENDER], {
    cwd: path.join(import.meta.dirname, ".."),
    env: { ...process.env, PAGE },
    encoding: "utf8",
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
