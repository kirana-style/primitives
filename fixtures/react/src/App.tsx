import {
  Accordion,
  AlertDialog,
  Avatar,
  Button,
  Checkbox,
  Collapsible,
  Dialog,
  DirectionProvider,
  Field,
  Fieldset,
  Form,
  HoverCard,
  Meter,
  Popover,
  Progress,
  RadioGroup,
  Select,
  Separator,
  Slider,
  Switch,
  Tabs,
  Toggle,
  Tooltip,
} from "@kirana-ui/react"
import { useState } from "react"

interface Preventable {
  preventKiranaHandler(): void
}

// A picture of one pixel, and an address that is not a picture.
const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
const BROKEN = "data:image/png;base64,AAAA"
// What the fixture writes for a field's validity, and its own check of a value.
const word = (valid: boolean | null) => (valid === null ? "unchecked" : valid ? "valid" : "invalid")
const taken = (value: string) => (value === "admin" ? "Taken" : null)
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
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(40)
  const [pictures, setPictures] = useState(false)
  const [sent, setSent] = useState("")
  const [sent2, setSent2] = useState("")
  const [reading, setReading] = useState<"ltr" | "rtl">("rtl")
  const [rejected, setRejected] = useState<Record<string, string> | undefined>(undefined)
  const [span, setSpan] = useState<number[]>([20, 80])
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
                  setPresses((value) => value + 1)
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

      <section data-fixture="hover">
        <button data-testid="h0">Before</button>
        <Tooltip.Root id="h1" delay={100}>
          <Tooltip.Trigger data-testid="h1-trigger">Save</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={8} data-testid="h1-positioner">
              <Tooltip.Popup className="tip" data-testid="h1-popup">
                Save the file
                <Tooltip.Arrow className="arrow" data-testid="h1-arrow" />
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
        <Tooltip.Root id="h2" delay={100}>
          <Tooltip.Trigger data-testid="h2-trigger">Open</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={8} data-testid="h2-positioner">
              <Tooltip.Popup className="tip" data-testid="h2-popup">
                Open a file
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
        <HoverCard.Root id="v1" delay={100} closeDelay={100}>
          <HoverCard.Trigger href="#profile" data-testid="v1-trigger">
            @kirana
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Positioner side="bottom" sideOffset={8} data-testid="v1-positioner">
              <HoverCard.Popup className="tip" data-testid="v1-popup">
                <p>Styles, compiled.</p>
                <a href="#follow" data-testid="v1-link">
                  Follow
                </a>
              </HoverCard.Popup>
            </HoverCard.Positioner>
          </HoverCard.Portal>
        </HoverCard.Root>
      </section>

      <section data-fixture="simple">
        <Button data-testid="b1" onClick={() => setCount((value) => value + 1)}>
          Count {count}
        </Button>
        <Button disabled focusableWhenDisabled data-testid="b2">
          Disabled, in the tab order
        </Button>
        <Button
          nativeButton={false}
          render={<span />}
          data-testid="b3"
          onClick={() => setCount((value) => value + 1)}
        >
          Not a button element
        </Button>
        <Toggle aria-label="Bold" data-testid="g1">
          B
        </Toggle>
        <Separator data-testid="sp1" />
        <Separator orientation="vertical" data-testid="sp2" />
        <button data-testid="pr1-more" onClick={() => setDone(100)}>
          Finish
        </button>
        <Progress.Root id="pr1" value={done} data-testid="pr1">
          <Progress.Label>Upload</Progress.Label>
          <Progress.Track className="track">
            <Progress.Indicator className="fill" data-testid="pr1-fill" />
          </Progress.Track>
          <Progress.Value data-testid="pr1-value" />
        </Progress.Root>
        <Progress.Root id="pr2" value={null} data-testid="pr2">
          <Progress.Track className="track">
            <Progress.Indicator className="fill" data-testid="pr2-fill" />
          </Progress.Track>
        </Progress.Root>
        <Meter.Root id="m1" value={30} max={60} data-testid="m1">
          <Meter.Label>Disk</Meter.Label>
          <Meter.Track className="track">
            <Meter.Indicator className="fill" data-testid="m1-fill" />
          </Meter.Track>
          <Meter.Value data-testid="m1-value" />
        </Meter.Root>
        <button data-testid="av-load" onClick={() => setPictures(true)}>
          Load pictures
        </button>
        <Avatar.Root className="avatar" data-testid="av1">
          <Avatar.Image src={pictures ? PIXEL : undefined} alt="Kirana" data-testid="av1-image" />
          <Avatar.Fallback data-testid="av1-fallback">K</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root className="avatar" data-testid="av2">
          <Avatar.Image src={pictures ? BROKEN : undefined} alt="Nobody" data-testid="av2-image" />
          <Avatar.Fallback data-testid="av2-fallback">N</Avatar.Fallback>
        </Avatar.Root>
        <AlertDialog.Root id="ad1">
          <AlertDialog.Trigger data-testid="ad1-trigger">Delete</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Backdrop className="backdrop" data-testid="ad1-backdrop" />
            <AlertDialog.Popup className="dialog" data-testid="ad1-popup">
              <AlertDialog.Title>Delete the file?</AlertDialog.Title>
              <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
              <AlertDialog.Close data-testid="ad1-cancel">Cancel</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
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
      <section data-fixture="slider">
        <Slider.Root id="sl1" defaultValue={40} name="volume" data-testid="sl1">
          <Slider.Value data-testid="sl1-value" />
          <Slider.Control className="slider" data-testid="sl1-control">
            <Slider.Track className="slider-track">
              <Slider.Indicator className="fill" data-testid="sl1-fill" />
              <Slider.Thumb className="thumb" aria-label="Volume" data-testid="sl1-thumb" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <Slider.Root
          id="sl2"
          value={span}
          onValueChange={(value) => setSpan(value as number[])}
          step={5}
          data-testid="sl2"
        >
          <Slider.Value data-testid="sl2-value" />
          <Slider.Control className="slider" data-testid="sl2-control">
            <Slider.Track className="slider-track">
              <Slider.Indicator className="fill" data-testid="sl2-fill" />
              <Slider.Thumb index={0} className="thumb" aria-label="From" data-testid="sl2-from" />
              <Slider.Thumb index={1} className="thumb" aria-label="To" data-testid="sl2-to" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <span data-testid="sl2-output">{span.join(",")}</span>
        <Slider.Root id="sl3" defaultValue={30} orientation="vertical" disabled data-testid="sl3">
          <Slider.Control className="slider" data-testid="sl3-control">
            <Slider.Track className="slider-track">
              <Slider.Indicator className="fill" data-testid="sl3-fill" />
              <Slider.Thumb className="thumb" aria-label="Level" data-testid="sl3-thumb" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </section>
      <section data-fixture="field">
        <Form
          errors={rejected}
          onFormSubmit={(values) => setSent(JSON.stringify(values))}
          data-testid="f1"
        >
          <Fieldset.Root id="fs1" data-testid="fs1">
            <Fieldset.Legend data-testid="fs1-legend">Account</Fieldset.Legend>
            <Field.Root id="fd1" name="email" data-testid="fd1">
              <Field.Label data-testid="fd1-label">Email</Field.Label>
              <Field.Control type="email" required data-testid="fd1-control" />
              <Field.Description data-testid="fd1-description">Your work address</Field.Description>
              <Field.Error data-testid="fd1-error" />
              <Field.Validity>
                {(validity) => <span data-testid="fd1-validity">{word(validity.valid)}</span>}
              </Field.Validity>
            </Field.Root>
            <Field.Root
              id="fd2"
              name="user"
              validationMode="onBlur"
              validate={taken}
              data-testid="fd2"
            >
              <Field.Label>User</Field.Label>
              <Field.Control data-testid="fd2-control" />
              <Field.Error data-testid="fd2-error" />
            </Field.Root>
          </Fieldset.Root>
          <button type="submit" data-testid="f1-submit">
            Send
          </button>
        </Form>
        <button data-testid="f1-reject" onClick={() => setRejected({ user: "Reserved" })}>
          Reject
        </button>
        <span data-testid="f1-sent">{sent}</span>
      </section>
      <section data-fixture="field-controls">
        <Form onFormSubmit={(values) => setSent2(JSON.stringify(values))} data-testid="f2">
          <Field.Root id="fc1" name="terms" data-testid="fc1">
            <Checkbox.Root required className="box" data-testid="fc1-box">
              <Checkbox.Indicator className="mark">✓</Checkbox.Indicator>
            </Checkbox.Root>
            <Field.Label data-testid="fc1-label">Accept</Field.Label>
            <Field.Error data-testid="fc1-error" />
          </Field.Root>
          <Field.Root id="fc2" name="plan" data-testid="fc2">
            <Field.Label data-testid="fc2-label">Plan</Field.Label>
            <RadioGroup.Root required data-testid="fc2-group">
              <RadioGroup.Item value="free" className="radio" data-testid="fc2-free" />
              <RadioGroup.Item value="pro" className="radio" data-testid="fc2-pro" />
            </RadioGroup.Root>
            <Field.Error data-testid="fc2-error" />
          </Field.Root>
          <Field.Root id="fc3" name="level" disabled data-testid="fc3">
            <Field.Label>Level</Field.Label>
            <Slider.Root defaultValue={10} data-testid="fc3-slider">
              <Slider.Control className="slider">
                <Slider.Track className="slider-track">
                  <Slider.Thumb className="thumb" data-testid="fc3-thumb" />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
          </Field.Root>
          <Field.Root id="fc4" name="alerts" data-testid="fc4">
            <Field.Label data-testid="fc4-label">Alerts</Field.Label>
            <Switch.Root className="switch" data-testid="fc4-switch">
              <Switch.Thumb className="thumb" />
            </Switch.Root>
          </Field.Root>
          <Field.Root id="fc5" name="fruit" data-testid="fc5">
            <Field.Label data-testid="fc5-label">Fruit</Field.Label>
            <Select.Root id="fc5s" required>
              <Select.Trigger data-testid="fc5-trigger">
                <Select.Value placeholder="Pick a fruit" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner sideOffset={4}>
                  <Select.Popup className="popup" data-testid="fc5-popup">
                    <Select.Item value="Apple" className="item" data-testid="fc5-Apple">
                      <Select.ItemText>Apple</Select.ItemText>
                    </Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <Field.Error data-testid="fc5-error" />
          </Field.Root>
          <button type="submit" data-testid="f2-submit">
            Send
          </button>
        </Form>
        <span data-testid="f2-sent">{sent2}</span>
      </section>
      <section data-fixture="direction">
        <button
          type="button"
          data-testid="dir-turn"
          onClick={() => setReading((now) => (now === "rtl" ? "ltr" : "rtl"))}
        >
          Turn
        </button>
        <div dir={reading} data-testid="dir-box">
          <DirectionProvider direction={reading}>
            <Tabs.Root id="dt1" defaultValue="one" data-testid="dt1">
              <Tabs.List className="tabs" data-testid="dt1-list">
                <Tabs.Tab value="one" data-testid="dt1-one">
                  One
                </Tabs.Tab>
                <Tabs.Tab value="two" data-testid="dt1-two">
                  Two
                </Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="one">First</Tabs.Panel>
              <Tabs.Panel value="two">Second</Tabs.Panel>
            </Tabs.Root>
            <Slider.Root id="ds1" defaultValue={40} data-testid="ds1">
              <Slider.Control className="slider" data-testid="ds1-control">
                <Slider.Track className="slider-track">
                  <Slider.Indicator className="fill" />
                  <Slider.Thumb className="thumb" aria-label="Volume" data-testid="ds1-thumb" />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
            <Popover.Root id="dp1">
              <Popover.Trigger data-testid="dp1-trigger">Open popover</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner sideOffset={8} align="start" data-testid="dp1-positioner">
                  <Popover.Popup className="popup" data-testid="dp1-popup">
                    <Popover.Title>Notifications</Popover.Title>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </DirectionProvider>
        </div>
      </section>
    </main>
  )
}
