import {
  Accordion,
  Checkbox,
  Collapsible,
  Dialog,
  Popover,
  RadioGroup,
  Select,
  Switch,
  Tabs,
} from "@kirana-ui/react"
import { useState } from "react"

interface Preventable {
  preventKiranaHandler(): void
}

const SECTIONS = ["one", "two", "three", "four"]
const PLANS = ["free", "pro", "team", "max"]
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
  const [alerts, setAlerts] = useState(false)
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

      <section data-fixture="controls">
        <form data-testid="f1-form">
          <label data-testid="x1-label">
            <Checkbox.Root id="x1" name="terms" className="box" data-testid="x1">
              <Checkbox.Indicator className="mark">✓</Checkbox.Indicator>
            </Checkbox.Root>
            Accept
          </label>
          <Checkbox.Root id="x2" defaultChecked disabled className="box" data-testid="x2">
            <Checkbox.Indicator className="mark">✓</Checkbox.Indicator>
          </Checkbox.Root>
          <Checkbox.Root id="x3" indeterminate className="box" data-testid="x3">
            <Checkbox.Indicator className="mark">–</Checkbox.Indicator>
          </Checkbox.Root>
          <Switch.Root
            id="w1"
            name="alerts"
            checked={alerts}
            onCheckedChange={setAlerts}
            className="switch"
            data-testid="w1"
          >
            <Switch.Thumb className="thumb" />
          </Switch.Root>
          <label htmlFor="w1" data-testid="w1-label">
            Alerts
          </label>
          <RadioGroup.Root id="r1" name="plan" defaultValue="pro" data-testid="r1">
            {PLANS.map((each) => (
              <label key={each}>
                <RadioGroup.Item
                  value={each}
                  disabled={each === "team"}
                  className="radio"
                  data-testid={`r1-${each}`}
                >
                  <RadioGroup.Indicator className="dot" />
                </RadioGroup.Item>
                {each}
              </label>
            ))}
          </RadioGroup.Root>
        </form>
        <output data-testid="w1-output">{alerts ? "on" : "off"}</output>
      </section>

      <section data-fixture="tabs">
        <Tabs.Root id="t1" defaultValue="account" data-testid="t1">
          <Tabs.List className="tabs" data-testid="t1-list">
            <Tabs.Tab value="account" data-testid="t1-account">
              Account
            </Tabs.Tab>
            <Tabs.Tab value="password" data-testid="t1-password">
              Password
            </Tabs.Tab>
            <Tabs.Tab value="billing" disabled data-testid="t1-billing">
              Billing
            </Tabs.Tab>
            <Tabs.Tab value="team" data-testid="t1-team">
              Team
            </Tabs.Tab>
            <Tabs.Indicator className="tab-mark" data-testid="t1-mark" />
          </Tabs.List>
          <Tabs.Panel value="account" data-testid="t1-panel-account">
            <p>Account settings</p>
            <Tabs.Root id="t2" defaultValue="one" data-testid="t2">
              <Tabs.List className="tabs" data-testid="t2-list">
                <Tabs.Tab value="one" data-testid="t2-one">
                  One
                </Tabs.Tab>
                <Tabs.Tab value="two" data-testid="t2-two">
                  Two
                </Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="one" data-testid="t2-panel-one">
                First
              </Tabs.Panel>
              <Tabs.Panel value="two" data-testid="t2-panel-two">
                Second
              </Tabs.Panel>
            </Tabs.Root>
          </Tabs.Panel>
          <Tabs.Panel value="password" data-testid="t1-panel-password">
            <p>Password settings</p>
          </Tabs.Panel>
          <Tabs.Panel value="billing" data-testid="t1-panel-billing">
            <p>Billing settings</p>
          </Tabs.Panel>
          <Tabs.Panel value="team" data-testid="t1-panel-team">
            <p>Team settings</p>
          </Tabs.Panel>
        </Tabs.Root>
      </section>

      <section data-fixture="accordion">
        <Accordion.Root id="a1" data-testid="a1">
          {SECTIONS.map((each) => (
            <Accordion.Item
              key={each}
              value={each}
              disabled={each === "three"}
              data-testid={`a1-${each}`}
            >
              <Accordion.Header>
                <Accordion.Trigger data-testid={`a1-${each}-trigger`}>
                  Section {each}
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="fold" data-testid={`a1-${each}-panel`}>
                <p>Content {each}</p>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
        <Accordion.Root id="a2" multiple defaultValue={["x"]} data-testid="a2">
          {["x", "y"].map((each) => (
            <Accordion.Item key={each} value={each} data-testid={`a2-${each}`}>
              <Accordion.Header>
                <Accordion.Trigger data-testid={`a2-${each}-trigger`}>
                  Part {each}
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="fold" data-testid={`a2-${each}-panel`}>
                <p>Content {each}</p>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
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
