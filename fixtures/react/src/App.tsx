import {
  Autosize,
  Carousel,
  QrCode,
  Toast,
  createToaster,
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
  Combobox,
  ContextMenu,
  Listbox,
  Menu,
  Menubar,
  Meter,
  NavigationMenu,
  Otp,
  Popover,
  Progress,
  RadioGroup,
  Select,
  Separator,
  Slider,
  Switch,
  Tabs,
  Resizable,
  ScrollArea,
  Toggle,
  ToggleGroup,
  Toolbar,
  Tooltip,
} from "@kirana-ui/react"
import { useState } from "react"

// A page's toasts are made once, apart from any component: a long time, so a test reads them.
const toaster = createToaster({ duration: 600_000 })

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
// A list of ten thousand rows of which a window is drawn: the fixture's own few lines of
// virtualizing, so no library's are part of what is compared.
const VROW = 24
const VCOUNT = 10_000
const firstRow = (top: number) => Math.max(0, Math.floor(top / VROW) - 1)
const rowsFrom = (first: number) =>
  Array.from({ length: 13 }, (_, at) => first + at).filter((each) => each < VCOUNT)
const ROWS = {
  count: VCOUNT,
  label: (index: number) => `Row ${index}`,
  indexOf: (value: unknown) => value as number,
  scrollToIndex(index: number) {
    const list = document.getElementById("vl1")!
    const top = index * VROW
    if (top < list.scrollTop) list.scrollTop = top
    else if (top + VROW > list.scrollTop + list.clientHeight)
      list.scrollTop = top + VROW - list.clientHeight
  },
}
const COMMANDS = ["New", "Open", "Print"]

const FRUITS = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape"]

/**
 * The page every adapter draws, element for element: the conformance run walks it and compares
 * the DOM of each state across adapters. Change it in all three fixtures at once.
 */
export function App() {
  const [controlled, setControlled] = useState(false)
  const [fruit, setFruit] = useState<string | null>("Banana")
  const [action, setAction] = useState("none")
  const [picked, setPicked] = useState("none")
  const [code, setCode] = useState("none")
  const [shares, setShares] = useState("25,75")
  const [slide, setSlide] = useState("0")
  const [first, setFirst] = useState(0)
  const [ran, setRan] = useState("none")
  const [tags, setTags] = useState<string[]>(["New"])
  const [align, setAlign] = useState<string[]>(["left"])
  const [tall, setTall] = useState(false)
  const [chosen, setChosen] = useState<string[]>(["Banana"])
  const [pick, setPick] = useState<string | null>(null)
  const [outside, setOutside] = useState(0)
  const [view, setView] = useState("list")
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
          <button type="reset" data-testid="f1-reset">
            Reset
          </button>
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
      <section data-fixture="menu">
        <Menu.Root id="mn1">
          <Menu.Trigger data-testid="mn1-trigger">File</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner sideOffset={4} data-testid="mn1-positioner">
              <Menu.Popup className="popup" data-testid="mn1-popup">
                <Menu.GroupLabel data-testid="mn1-lone">Document</Menu.GroupLabel>
                <Menu.Item className="item" data-testid="mn1-new" onClick={() => setAction("new")}>
                  <span>New</span>
                  <kbd aria-hidden="true">⌘N</kbd>
                </Menu.Item>
                <Menu.Item className="item" disabled data-testid="mn1-open">
                  Open
                </Menu.Item>
                <Menu.Item
                  className="item"
                  data-testid="mn1-print"
                  onClick={() => setAction("print")}
                >
                  Print
                </Menu.Item>
                <Menu.Separator data-testid="mn1-separator" />
                <Menu.CheckboxItem className="item" defaultChecked data-testid="mn1-wrap">
                  <Menu.CheckboxItemIndicator>✓</Menu.CheckboxItemIndicator>
                  <span>Word wrap</span>
                </Menu.CheckboxItem>
                <Menu.Group id="mn1-g" data-testid="mn1-group">
                  <Menu.GroupLabel data-testid="mn1-label">View</Menu.GroupLabel>
                  <Menu.RadioGroup
                    value={view}
                    onValueChange={(next) => setView(next as string)}
                    data-testid="mn1-views"
                  >
                    <Menu.RadioItem value="list" className="item" data-testid="mn1-list">
                      <Menu.RadioItemIndicator>•</Menu.RadioItemIndicator>
                      <span>List</span>
                    </Menu.RadioItem>
                    <Menu.RadioItem value="grid" className="item" data-testid="mn1-grid">
                      <Menu.RadioItemIndicator>•</Menu.RadioItemIndicator>
                      <span>Grid</span>
                    </Menu.RadioItem>
                  </Menu.RadioGroup>
                </Menu.Group>
                <Menu.SubmenuRoot id="mn1s">
                  <Menu.SubmenuTrigger className="item" data-testid="mn1-share">
                    Share
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner data-testid="mn1s-positioner">
                      <Menu.Popup className="popup" data-testid="mn1s-popup">
                        <Menu.Item
                          className="item"
                          data-testid="mn1s-mail"
                          onClick={() => setAction("mail")}
                        >
                          Mail
                        </Menu.Item>
                        <Menu.Item
                          className="item"
                          data-testid="mn1s-link"
                          onClick={() => setAction("link")}
                        >
                          Link
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
        <output data-testid="mn1-output">
          {action} {view}
        </output>
      </section>
      <section data-fixture="context-menu">
        <ContextMenu.Root id="cm1">
          <ContextMenu.Trigger className="area" data-testid="cm1-area">
            Press here
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner data-testid="cm1-positioner">
              <ContextMenu.Popup className="popup" aria-label="Actions" data-testid="cm1-popup">
                <ContextMenu.Item
                  className="item"
                  data-testid="cm1-copy"
                  onClick={() => setPicked("cm1-copy")}
                >
                  Copy
                </ContextMenu.Item>
                <ContextMenu.Item
                  className="item"
                  data-testid="cm1-paste"
                  onClick={() => setPicked("cm1-paste")}
                >
                  Paste
                </ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      </section>
      <section data-fixture="menubar">
        <Menubar id="mb1" className="bar" data-testid="mb1">
          <Menu.Root id="mb1f">
            <Menu.Trigger data-testid="mb1-file">File</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner data-testid="mb1f-positioner">
                <Menu.Popup className="popup" data-testid="mb1f-popup">
                  <Menu.Item
                    className="item"
                    data-testid="mb1f-new"
                    onClick={() => setPicked("mb1f-new")}
                  >
                    New
                  </Menu.Item>
                  <Menu.Item
                    className="item"
                    data-testid="mb1f-save"
                    onClick={() => setPicked("mb1f-save")}
                  >
                    Save
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <Menu.Root id="mb1e">
            <Menu.Trigger data-testid="mb1-edit">Edit</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner data-testid="mb1e-positioner">
                <Menu.Popup className="popup" data-testid="mb1e-popup">
                  <Menu.Item
                    className="item"
                    data-testid="mb1e-undo"
                    onClick={() => setPicked("mb1e-undo")}
                  >
                    Undo
                  </Menu.Item>
                  <Menu.SubmenuRoot id="mb1em">
                    <Menu.SubmenuTrigger className="item" data-testid="mb1e-find">
                      Find
                    </Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner data-testid="mb1em-positioner">
                        <Menu.Popup className="popup" data-testid="mb1em-popup">
                          <Menu.Item
                            className="item"
                            data-testid="mb1em-next"
                            onClick={() => setPicked("mb1em-next")}
                          >
                            Next
                          </Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.SubmenuRoot>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <Menu.Root id="mb1v" disabled>
            <Menu.Trigger data-testid="mb1-view">View</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner data-testid="mb1v-positioner">
                <Menu.Popup className="popup" data-testid="mb1v-popup">
                  <Menu.Item
                    className="item"
                    data-testid="mb1v-zoom"
                    onClick={() => setPicked("mb1v-zoom")}
                  >
                    Zoom
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <Menu.Root id="mb1h">
            <Menu.Trigger data-testid="mb1-help">Help</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner data-testid="mb1h-positioner">
                <Menu.Popup className="popup" data-testid="mb1h-popup">
                  <Menu.Item
                    className="item"
                    data-testid="mb1h-about"
                    onClick={() => setPicked("mb1h-about")}
                  >
                    About
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menubar>
        <output data-testid="mb1-output">{picked}</output>
      </section>
      <section data-fixture="listbox">
        <Listbox.Root
          id="lb1"
          aria-label="Fruit"
          value={chosen}
          onValueChange={(next) => setChosen(next as string[])}
          data-testid="lb1"
        >
          {FRUITS.map((each) => (
            <Listbox.Item
              key={each}
              value={each}
              disabled={each === "Blueberry"}
              className="item"
              data-testid={`lb1-${each}`}
            >
              <span>{each}</span>
              <Listbox.ItemIndicator>✓</Listbox.ItemIndicator>
            </Listbox.Item>
          ))}
        </Listbox.Root>
        <Listbox.Root id="lb2" aria-label="Plans" multiple data-testid="lb2">
          <Listbox.Group id="lb2-g" data-testid="lb2-group">
            <Listbox.GroupLabel data-testid="lb2-label">Plans</Listbox.GroupLabel>
            {PLANS.map((each) => (
              <Listbox.Item key={each} value={each} className="item" data-testid={`lb2-${each}`}>
                <span>{each}</span>
              </Listbox.Item>
            ))}
          </Listbox.Group>
        </Listbox.Root>
        <output data-testid="lb1-output">{chosen.join(",")}</output>
      </section>
      <section data-fixture="combobox">
        <form data-testid="cb1-form">
          <Combobox.Root
            id="cb1"
            name="pick"
            value={pick}
            onValueChange={(next) => setPick(next as string | null)}
          >
            <Combobox.Input aria-label="Fruit" data-testid="cb1-input" />
            <Combobox.Trigger aria-label="Show fruits" data-testid="cb1-trigger">
              ▾
            </Combobox.Trigger>
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={4} data-testid="cb1-positioner">
                <Combobox.Popup className="popup" aria-label="Fruits" data-testid="cb1-popup">
                  {FRUITS.map((each) => (
                    <Combobox.Item
                      key={each}
                      value={each}
                      id={`cb1-${each}`}
                      disabled={each === "Blueberry"}
                      className="item"
                      data-testid={`cb1-${each}`}
                    >
                      <span>{each}</span>
                      <Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
                    </Combobox.Item>
                  ))}
                  <Combobox.Empty data-testid="cb1-empty">No fruit</Combobox.Empty>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </form>
        <output data-testid="cb1-output">{pick ?? "none"}</output>
      </section>
      <section data-fixture="menu-more">
        <div className="bar">
          <button type="button" data-testid="mm1-outside" onClick={() => setOutside(outside + 1)}>
            Outside
          </button>
          <Menu.Root id="mm1" modal>
            <Menu.Trigger data-testid="mm1-trigger">Modal</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner data-testid="mm1-positioner">
                <Menu.Popup className="popup" data-testid="mm1-popup">
                  <Menu.Item className="item" data-testid="mm1-plain">
                    Plain
                  </Menu.Item>
                  <Menu.LinkItem className="item" href="#mm1-linked" data-testid="mm1-link">
                    Link
                  </Menu.LinkItem>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
        <Menubar id="vb1" orientation="vertical" className="column" data-testid="vb1">
          <Menu.Root id="vb1a">
            <Menu.Trigger data-testid="vb1-one">One</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner data-testid="vb1a-positioner">
                <Menu.Popup className="popup" data-testid="vb1a-popup">
                  <Menu.Item className="item" data-testid="vb1a-x">
                    Alpha
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <Menu.Root id="vb1b">
            <Menu.Trigger data-testid="vb1-two">Two</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner data-testid="vb1b-positioner">
                <Menu.Popup className="popup" data-testid="vb1b-popup">
                  <Menu.Item className="item" data-testid="vb1b-x">
                    Beta
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menubar>
        <output data-testid="mm1-output">{outside}</output>
      </section>
      <section data-fixture="toolbar">
        <ToggleGroup
          aria-label="Alignment"
          value={align}
          onValueChange={(next) => setAlign(next as string[])}
          className="bar"
          data-testid="tg1"
        >
          <Toggle value="left" data-testid="tg1-left">
            Left
          </Toggle>
          <Toggle value="centre" data-testid="tg1-centre">
            Centre
          </Toggle>
          <Toggle value="justify" disabled data-testid="tg1-justify">
            Justify
          </Toggle>
          <Toggle value="right" data-testid="tg1-right">
            Right
          </Toggle>
        </ToggleGroup>
        <output data-testid="tg1-output">{align.join(",")}</output>
        <Toolbar.Root aria-label="Editing" className="bar" data-testid="tb1">
          <Toolbar.Button data-testid="tb1-save">Save</Toolbar.Button>
          <Toolbar.Button disabled data-testid="tb1-gone">
            Gone
          </Toolbar.Button>
          <Toolbar.Link href="#tb1-help" data-testid="tb1-link">
            Help
          </Toolbar.Link>
          <Toolbar.Separator data-testid="tb1-line" />
          <Toolbar.Input aria-label="Zoom" defaultValue="100" data-testid="tb1-zoom" />
          <Toolbar.Group data-testid="tb1-group">
            <ToggleGroup multiple aria-label="Marks" className="bar" data-testid="tb1-marks">
              <Toggle value="bold" data-testid="tb1-bold">
                Bold
              </Toggle>
              <Toggle value="italic" data-testid="tb1-italic">
                Italic
              </Toggle>
            </ToggleGroup>
          </Toolbar.Group>
          <Toggle data-testid="tb1-pin">Pin</Toggle>
        </Toolbar.Root>
      </section>
      <section data-fixture="scroll-area">
        <ScrollArea.Root className="scroll" data-testid="sa1">
          <ScrollArea.Viewport className="scroll-view" data-testid="sa1-view">
            <ScrollArea.Content data-testid="sa1-content">
              <div className={tall ? "scroll-tall" : "scroll-short"} data-testid="sa1-box">
                Content
              </div>
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className="scroll-bar" data-testid="sa1-y">
            <ScrollArea.Thumb className="scroll-thumb" data-testid="sa1-y-thumb" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal" className="scroll-bar" data-testid="sa1-x">
            <ScrollArea.Thumb className="scroll-thumb" data-testid="sa1-x-thumb" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Corner className="scroll-corner" data-testid="sa1-corner" />
        </ScrollArea.Root>
        <button type="button" data-testid="sa1-grow" onClick={() => setTall(!tall)}>
          Grow
        </button>
      </section>
      <section data-fixture="navigation-menu">
        <NavigationMenu.Root id="nm1" aria-label="Site" data-testid="nm1">
          <NavigationMenu.List className="nav-list" data-testid="nm1-list">
            <NavigationMenu.Item value="products">
              <NavigationMenu.Trigger className="nav-trigger" data-testid="nm1-products">
                <span>Products</span>
                <NavigationMenu.Icon>▾</NavigationMenu.Icon>
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="nav-content" data-testid="nm1-products-content">
                <NavigationMenu.Link href="#apps" data-testid="nm1-apps">
                  apps
                </NavigationMenu.Link>
                <NavigationMenu.Link href="#tools" data-testid="nm1-tools">
                  tools
                </NavigationMenu.Link>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
            <NavigationMenu.Item value="docs">
              <NavigationMenu.Trigger className="nav-trigger" data-testid="nm1-docs">
                <span>Docs</span>
                <NavigationMenu.Icon>▾</NavigationMenu.Icon>
              </NavigationMenu.Trigger>
              <NavigationMenu.Content
                className="nav-content nav-narrow"
                data-testid="nm1-docs-content"
              >
                <NavigationMenu.Link href="#guide" data-testid="nm1-guide">
                  guide
                </NavigationMenu.Link>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link href="#pricing" active data-testid="nm1-pricing">
                Pricing
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
          <NavigationMenu.Portal>
            <NavigationMenu.Positioner sideOffset={4} data-testid="nm1-positioner">
              <NavigationMenu.Popup className="popup" data-testid="nm1-popup">
                <NavigationMenu.Viewport data-testid="nm1-viewport" />
              </NavigationMenu.Popup>
            </NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        </NavigationMenu.Root>
      </section>
      <section data-fixture="virtual">
        <Listbox.Root
          id="vl1"
          aria-label="Rows"
          virtualized={ROWS}
          className="virtual"
          data-testid="vl1"
          onScroll={(event: { currentTarget: HTMLElement }) =>
            setFirst(firstRow(event.currentTarget.scrollTop))
          }
        >
          <div className="virtual-space">
            {rowsFrom(first).map((each) => (
              <Listbox.Item
                key={each}
                value={each}
                index={each}
                className="item virtual-row"
                style={{ top: `${each * VROW}px` }}
                data-testid={`vl1-${each}`}
              >
                {`Row ${each}`}
              </Listbox.Item>
            ))}
          </div>
        </Listbox.Root>
        <Combobox.Root id="cp1" inline onValueChange={(next) => setRan(next as string)}>
          <Combobox.Input aria-label="Command" data-testid="cp1-input" />
          <Combobox.Popup className="palette" aria-label="Commands" data-testid="cp1-list">
            {COMMANDS.map((each) => (
              <Combobox.Item
                key={each}
                value={each}
                id={`cp1-${each}`}
                className="item"
                data-testid={`cp1-${each}`}
              >
                {each}
              </Combobox.Item>
            ))}
            <Combobox.Empty data-testid="cp1-empty">Nothing found</Combobox.Empty>
          </Combobox.Popup>
        </Combobox.Root>
        <output data-testid="cp1-output">{ran}</output>
        <Field.Root id="fcb" name="city" data-testid="fcb">
          <Field.Label data-testid="fcb-label">City</Field.Label>
          <Combobox.Root id="fcbc" required>
            <Combobox.Input data-testid="fcb-input" />
            <Combobox.Clear aria-label="Clear" data-testid="fcb-clear">
              ×
            </Combobox.Clear>
            <Combobox.Portal>
              <Combobox.Positioner data-testid="fcb-positioner">
                <Combobox.Popup className="popup" aria-label="Cities" data-testid="fcb-popup">
                  <Combobox.Item value="Oslo" id="fcb-Oslo" className="item" data-testid="fcb-Oslo">
                    Oslo
                  </Combobox.Item>
                  <Combobox.Item value="Rome" id="fcb-Rome" className="item" data-testid="fcb-Rome">
                    Rome
                  </Combobox.Item>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </Field.Root>
        <form data-testid="cbm-form">
          <Combobox.Root
            id="cbm"
            name="tags"
            multiple
            values={tags}
            onValuesChange={(next) => setTags(next as string[])}
          >
            <Combobox.Chips className="bar" data-testid="cbm-chips">
              {tags.map((each) => (
                <Combobox.Chip
                  key={each}
                  value={each}
                  className="chip"
                  data-testid={`cbm-chip-${each}`}
                >
                  <span>{each}</span>
                  <Combobox.ChipRemove
                    aria-label={`Remove ${each}`}
                    data-testid={`cbm-remove-${each}`}
                  >
                    ×
                  </Combobox.ChipRemove>
                </Combobox.Chip>
              ))}
              <Combobox.Input aria-label="Tags" data-testid="cbm-input" />
            </Combobox.Chips>
            <Combobox.Portal>
              <Combobox.Positioner data-testid="cbm-positioner">
                <Combobox.Popup className="popup" aria-label="Tags" data-testid="cbm-popup">
                  {COMMANDS.map((each) => (
                    <Combobox.Item
                      key={each}
                      value={each}
                      id={`cbm-${each}`}
                      className="item"
                      data-testid={`cbm-${each}`}
                    >
                      {each}
                    </Combobox.Item>
                  ))}
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </form>
      </section>
      <section data-fixture="widgets">
        <form data-testid="otp1-form">
          <Otp.Root
            id="otp1"
            length={4}
            name="code"
            className="otp"
            data-testid="otp1"
            onComplete={(next: string) => setCode(next)}
          >
            <Otp.Input aria-label="Code" className="otp-input" data-testid="otp1-input" />
            <Otp.Group className="otp-group">
              <Otp.Slot index={0} className="otp-slot" data-testid="otp1-0">
                <Otp.Caret className="otp-caret" />
              </Otp.Slot>
              <Otp.Slot index={1} className="otp-slot" data-testid="otp1-1">
                <Otp.Caret className="otp-caret" />
              </Otp.Slot>
            </Otp.Group>
            <Otp.Separator className="otp-mark" />
            <Otp.Group className="otp-group">
              <Otp.Slot index={2} className="otp-slot" data-testid="otp1-2">
                <Otp.Caret className="otp-caret" />
              </Otp.Slot>
              <Otp.Slot index={3} className="otp-slot" data-testid="otp1-3">
                <Otp.Caret className="otp-caret" />
              </Otp.Slot>
            </Otp.Group>
          </Otp.Root>
        </form>
        <output data-testid="otp1-output">{code}</output>
        <Resizable.Group
          id="rs1"
          className="split"
          data-testid="rs1"
          onSizesChange={(next: number[]) => setShares(next.map(Math.round).join(","))}
        >
          <Resizable.Panel
            defaultSize={25}
            minSize={10}
            className="split-panel"
            data-testid="rs1-a"
          >
            A
          </Resizable.Panel>
          <Resizable.Handle aria-label="Resize" className="split-bar" data-testid="rs1-bar" />
          <Resizable.Panel defaultSize={75} className="split-panel" data-testid="rs1-b">
            B
          </Resizable.Panel>
        </Resizable.Group>
        <output data-testid="rs1-output">{shares}</output>
      </section>
      <section data-fixture="pieces">
        <QrCode.Root id="qr1" value="https://kirana.style" className="qr" data-testid="qr1">
          <QrCode.Frame aria-label="A link" className="qr-frame" data-testid="qr1-frame">
            <QrCode.Pattern data-testid="qr1-pattern" />
          </QrCode.Frame>
        </QrCode.Root>
        <Autosize.Textarea aria-label="Note" rows={1} className="note" data-testid="au1" />
        <Carousel.Root
          id="cr1"
          aria-label="Pictures"
          className="carousel"
          data-testid="cr1"
          onIndexChange={(next: number) => setSlide(String(next))}
        >
          <Carousel.Viewport className="carousel-view" data-testid="cr1-view">
            <Carousel.Item index={0} className="carousel-item" data-testid="cr1-0">
              One
            </Carousel.Item>
            <Carousel.Item index={1} className="carousel-item" data-testid="cr1-1">
              Two
            </Carousel.Item>
            <Carousel.Item index={2} className="carousel-item" data-testid="cr1-2">
              Three
            </Carousel.Item>
          </Carousel.Viewport>
          <Carousel.Previous data-testid="cr1-previous">Previous</Carousel.Previous>
          <Carousel.Next data-testid="cr1-next">Next</Carousel.Next>
          <Carousel.Indicator index={0} aria-label="Slide 1" data-testid="cr1-dot-0" />
          <Carousel.Indicator index={1} aria-label="Slide 2" data-testid="cr1-dot-1" />
          <Carousel.Indicator index={2} aria-label="Slide 3" data-testid="cr1-dot-2" />
        </Carousel.Root>
        <output data-testid="cr1-output">{slide}</output>
        <button
          type="button"
          data-testid="ts1-add"
          onClick={() =>
            toaster.add({ title: "Saved", description: "Your changes are kept.", type: "success" })
          }
        >
          Add a toast
        </button>
        <button
          type="button"
          data-testid="ts1-brief"
          onClick={() => toaster.add({ title: "Gone soon", duration: 300 })}
        >
          Add a brief toast
        </button>
        <Toast.Viewport id="ts1" toaster={toaster} className="toasts" data-testid="ts1">
          <Toast.List>
            {(toast) => (
              <Toast.Root toast={toast} className="toast" data-testid={`ts1-${toast.id}`}>
                <Toast.Title className="toast-title">{toast.title}</Toast.Title>
                <Toast.Description>{toast.description}</Toast.Description>
                <Toast.Close aria-label="Close" data-testid={`ts1-${toast.id}-close`}>
                  Close
                </Toast.Close>
              </Toast.Root>
            )}
          </Toast.List>
        </Toast.Viewport>
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
