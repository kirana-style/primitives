import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vite-plus/test"

import { Collapsible, Dialog, Select } from "./index.ts"

// Rendered with no DOM at all: making a controller and reading its parts touches no document.
describe("on the server", () => {
  it("renders an open collapsible with its panel and a closed one without", () => {
    const html = renderToString(
      <>
        <Collapsible.Root id="a" defaultOpen>
          <Collapsible.Trigger>Open</Collapsible.Trigger>
          <Collapsible.Panel>Shown</Collapsible.Panel>
        </Collapsible.Root>
        <Collapsible.Root id="b">
          <Collapsible.Trigger>Closed</Collapsible.Trigger>
          <Collapsible.Panel>Hidden</Collapsible.Panel>
        </Collapsible.Root>
      </>
    )
    expect(html).toContain('<div data-open="">')
    expect(html).toContain('aria-expanded="true" aria-controls="a-panel"')
    expect(html).toContain('id="a-panel"')
    expect(html).toContain("Shown")
    expect(html).not.toContain("Hidden")
    expect(html).not.toContain("data-starting-style")
  })

  it("renders a dialog's trigger and no popup, and a select's value and its hidden input", () => {
    const html = renderToString(
      <>
        <Dialog.Root id="d">
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>Content</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        <Select.Root
          id="s"
          name="fruit"
          defaultValue="kiwi"
          items={[{ value: "kiwi", label: "Kiwi" }]}
        >
          <Select.Trigger>
            <Select.Value placeholder="Pick" />
          </Select.Trigger>
        </Select.Root>
      </>
    )
    expect(html).toContain('aria-haspopup="dialog" aria-expanded="false"')
    expect(html).not.toContain("Content")
    expect(html).toContain("<span>Kiwi</span>")
    expect(html).toContain('<input type="hidden" name="fruit" value="kiwi"/>')
  })
})
