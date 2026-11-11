import { Collapsible, Dialog, Popover, Select } from "@kirana-ui/react"
import { useState } from "react"

interface Preventable {
  preventKiranaHandler(): void
}

const FRUITS = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape"]

/**
 * The page every adapter draws, element for element: the conformance run walks it and compares
 * the DOM of each state across adapters. Change it in all three fixtures at once.
 */
export function App() {
  const [controlled, setControlled] = useState(false)
  const [fruit, setFruit] = useState<string | null>("Banana")
  const [presses, setPresses] = useState(0)
  const [locked, setLocked] = useState(false)
  return (
    <main>
      <section data-fixture="collapsible">
        <Collapsible.Root id="c1">
          <Collapsible.Trigger data-testid="c1-trigger">Details</Collapsible.Trigger>
          <Collapsible.Panel className="panel" data-testid="c1-panel">
            <p>Panel content</p>
            <Collapsible.Root id="c2">
              <Collapsible.Trigger data-testid="c2-trigger">Nested</Collapsible.Trigger>
              <Collapsible.Panel className="panel" data-testid="c2-panel">
                <p>Nested content</p>
              </Collapsible.Panel>
            </Collapsible.Root>
          </Collapsible.Panel>
        </Collapsible.Root>
      </section>

      <section data-fixture="collapsible-controlled">
        <button data-testid="c3-outside" onClick={() => setControlled((open) => !open)}>
          Toggle from outside
        </button>
        <Collapsible.Root id="c3" open={controlled} onOpenChange={setControlled}>
          <Collapsible.Trigger data-testid="c3-trigger">Controlled</Collapsible.Trigger>
          <Collapsible.Panel className="panel" data-testid="c3-panel" keepMounted>
            <p>Kept in the page</p>
          </Collapsible.Panel>
        </Collapsible.Root>
        <Collapsible.Root id="c4" defaultOpen disabled>
          <Collapsible.Trigger data-testid="c4-trigger">Disabled, open</Collapsible.Trigger>
          <Collapsible.Panel className="panel" data-testid="c4-panel">
            <p>Open from the start</p>
          </Collapsible.Panel>
        </Collapsible.Root>
      </section>

      <section data-fixture="composition">
        <label>
          <input
            type="checkbox"
            data-testid="k1-lock"
            checked={locked}
            onChange={(event) => setLocked(event.target.checked)}
          />
          Lock
        </label>
        <Collapsible.Root id="k1">
          <Collapsible.Trigger
            render={
              <button
                className="mine"
                type="submit"
                aria-expanded="true"
                data-testid="k1-trigger"
                onClick={(event) => {
                  setPresses((count) => count + 1)
                  if (locked) (event as unknown as Preventable).preventKiranaHandler()
                }}
              />
            }
          >
            Composed {presses}
          </Collapsible.Trigger>
          <Collapsible.Panel
            className="panel"
            data-testid="k1-panel"
            style={{ color: presses % 2 ? "red" : "blue" }}
          >
            <p>Composed content</p>
          </Collapsible.Panel>
        </Collapsible.Root>
      </section>

      <section data-fixture="dialog">
        <Dialog.Root id="d1">
          <Dialog.Trigger data-testid="d1-trigger">Open dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="backdrop" data-testid="d1-backdrop" />
            <Dialog.Popup className="dialog" data-testid="d1-popup">
              <Dialog.Title>Edit profile</Dialog.Title>
              <Dialog.Description>Change your name.</Dialog.Description>
              <input data-testid="d1-input" aria-label="Name" />
              <Dialog.Root id="d2">
                <Dialog.Trigger data-testid="d2-trigger">Open nested</Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Backdrop className="backdrop" data-testid="d2-backdrop" />
                  <Dialog.Popup className="dialog" data-testid="d2-popup">
                    <Dialog.Title>Are you sure?</Dialog.Title>
                    <Dialog.Close data-testid="d2-close">Back</Dialog.Close>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
              <Dialog.Close data-testid="d1-close">Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </section>

      <section data-fixture="popover">
        <Popover.Root id="p1">
          <Popover.Trigger data-testid="p1-trigger">Open popover</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8} align="start" data-testid="p1-positioner">
              <Popover.Popup className="popup" data-testid="p1-popup">
                <Popover.Title>Notifications</Popover.Title>
                <Popover.Description>You are all caught up.</Popover.Description>
                <Popover.Close data-testid="p1-close">Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </section>

      <section data-fixture="select">
        <form data-testid="s1-form">
          <Select.Root id="s1" name="fruit" value={fruit} onValueChange={setFruit}>
            <Select.Trigger data-testid="s1-trigger">
              <Select.Value placeholder="Pick a fruit" data-testid="s1-value" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner sideOffset={4} data-testid="s1-positioner">
                <Select.Popup className="popup" data-testid="s1-popup">
                  {FRUITS.map((each) => (
                    <Select.Item
                      key={each}
                      value={each}
                      disabled={each === "Blueberry"}
                      className="item"
                      data-testid={`s1-${each}`}
                    >
                      <Select.ItemText>{each}</Select.ItemText>
                      <Select.ItemIndicator>✓</Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </form>
        <output data-testid="s1-output">{fruit ?? "none"}</output>
      </section>
    </main>
  )
}
