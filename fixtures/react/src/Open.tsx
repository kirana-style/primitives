import { Collapsible, Field, Popover, Tabs } from "@kirana-ui/react"

// The second page: no part is given an id, and a popover is open when the page is first drawn.
// What a server and a client must agree on without help. The same in all five fixtures.
export function Open() {
  return (
    <main data-generated-ids="">
      <section data-fixture="ids">
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger data-testid="o-c-trigger">Details</Collapsible.Trigger>
          <Collapsible.Panel className="panel" data-testid="o-c-panel">
            <p>Panel content</p>
          </Collapsible.Panel>
        </Collapsible.Root>
        <Tabs.Root defaultValue="one">
          <Tabs.List className="tabs">
            <Tabs.Tab value="one" data-testid="o-t-one">
              One
            </Tabs.Tab>
            <Tabs.Tab value="two" data-testid="o-t-two">
              Two
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="one" data-testid="o-t-panel-one">
            First
          </Tabs.Panel>
          <Tabs.Panel value="two" data-testid="o-t-panel-two">
            Second
          </Tabs.Panel>
        </Tabs.Root>
        <Field.Root name="email">
          <Field.Label data-testid="o-f-label">Email</Field.Label>
          <Field.Control type="email" data-testid="o-f-control" />
          <Field.Description data-testid="o-f-description">Your work address</Field.Description>
        </Field.Root>
      </section>
      <section data-fixture="open-popup">
        <Popover.Root defaultOpen>
          <Popover.Trigger data-testid="o-p-trigger">Open popover</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8} align="start" data-testid="o-p-positioner">
              <Popover.Popup className="popup" data-testid="o-p-popup">
                <Popover.Title>Notifications</Popover.Title>
                <Popover.Description>You are all caught up.</Popover.Description>
                <Popover.Close data-testid="o-p-close">Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </section>
    </main>
  )
}
