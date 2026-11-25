<script lang="ts">
  import type { DateRange, FileRejection, OffsetFunction, PartEvent } from "@kirana-ui/svelte"

  import Mark from "./Mark.svelte"
  import Tag from "./Tag.svelte"
  import {
    Calendar,
    Autocomplete,
    Command,
    DateField,
    DatePicker,
    Input,
    Label,
    NumberField,
    Pagination,
    Rating,
    Steps,
    Editable,
    PasswordInput,
    TagsInput,
    FileUpload,
    TimeField,
    Tree,
    ColorPicker,
    Tour,
    PortalProvider,
    Drawer,
    MessageScroller,
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
    CheckboxGroup,
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
  } from "@kirana-ui/svelte"

  // The page every adapter draws, element for element: the conformance run walks it and compares
  // the DOM of each state across adapters. Change it in all three fixtures at once.
  // A gap as tall as the anchor: what a positioner asks a function for.
  const anchorHigh: OffsetFunction = ({ anchor }) => anchor.height

  const FRUITS = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape"]
  // A combobox's items as data, in groups: the combobox filters them, and a collection draws them.
  const PANTRY = [
    {
      value: "Fruits",
      items: [
        { value: "apple", label: "Apple" },
        { value: "apricot", label: "Apricot" },
        { value: "banana", label: "Banana", disabled: true },
      ],
    },
    {
      value: "Roots",
      items: [
        { value: "beet", label: "Beet" },
        { value: "carrot", label: "Carrot" },
      ],
    },
  ]
  const STEPS = ["Account", "Profile", "Review"]
  const BERRIES = [
    { value: "blackberry", label: "Blackberry" },
    { value: "blueberry", label: "Blueberry" },
    { value: "cherry", label: "Cherry" },
  ]
  /** What a status says of the pantry for what was typed: how many of its items hold the text. */
  function pantryLeft(text: string): string {
    if (text === "") return ""
    const all = PANTRY.flatMap((each) => each.items)
    return `${all.filter((each) => each.label.toLowerCase().includes(text.toLowerCase())).length} left`
  }
  // Labels by value: what a select names its values with before its list has been opened.
  const SIZES = { s: "Small", m: "Medium", l: "Large" }
  const SIZE_KEYS = ["s", "m", "l"] as const
  // A picture of one pixel, and an address that is not a picture.
  const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  const BROKEN = "data:image/png;base64,AAAA"
  // A picture 160 wide: a row of three is wider than its scroll area once they have loaded.
  const WIDE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='40'%3E%3C/svg%3E"
  // What the fixture writes for a field's validity, and its own check of a value.
  const word = (valid: boolean | null) => (valid === null ? "unchecked" : valid ? "valid" : "invalid")
  const taken = (value: string) => (value === "admin" ? "Taken" : null)
  const SECTIONS = ["one", "two", "three", "four"]
  const PLANS = ["free", "pro", "team", "max"]
  const TOPPINGS = ["cheese", "ham", "olives"]
  const EXTRAS = ["napkins", "straw"]
  const LOCKED = ["Apple", "Banana"]
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
  const PLACES = ["Oslo", "Osaka", "Paris"]
  const LINES = Array.from({ length: 20 }, (_each, at) => `Row ${at + 1}`)
  const LOAD = ["load"]
  // A tour's steps: what each says is the page's own, kept beside the step. One is about an element
  // of its own section, one about another section's, and the last about none.
  interface PageStep {
    id: string
    target?: string
    title: string
    body: string
  }
  const TOUR: PageStep[] = [
    { id: "files", target: '[data-testid="tr1"]', title: "Files", body: "Documents and music." },
    { id: "stars", target: '[data-testid="rt1"]', title: "Stars", body: "How much it was liked." },
    { id: "done", title: "All set", body: "That is the whole page." },
  ]
  let controlled = $state(false)
  let alerts = $state(false)
  let toppings = $state<string[]>(["ham"])
  let count = $state(0)
  let submits = $state(0)
  let done = $state(40)
  let tipKept = $state(true)
  let pictures = $state(false)
  let heard = $state("none")
  let sent = $state("")
  let sent2 = $state("")
  let reading = $state<"ltr" | "rtl">("rtl")
  let rejected = $state<Record<string, string> | undefined>(undefined)
  let span = $state<number[]>([20, 80])
  let low = $state(true)
  let moved = $state(false)
  let sought = $state<string | null>(null)
  let looked = $state("")
  let sealed = $state(true)
  // The editing section's callers: what each control last told them.
  let stars = $state("2")
  let stepped = $state("0")
  let titled = $state("Apollo")
  let revealed = $state("false")
  // The tagging section's callers.
  let tagged = $state("red,green")
  let timed = $state("09:30")
  let refused = $state("")
  let uploaded = $state("")
  let turnedAway = $state("")
  // The exploring section's callers.
  let opened = $state("docs")
  let picks = $state("letter")
  let hue = $state("#ff0000ff")
  let kept = $state("")
  let written = $state("hex")
  let touring = $state(false)
  let toured = $state("0")
  let firstAnchor = $state<HTMLElement>()
  let secondAnchor = $state<HTMLElement>()
  let fruit = $state<string | null>("Banana")
  let basket = $state<string[]>(["Banana"])
  let action = $state("none")
  let picked = $state("none")
  let code = $state("none")
  let shares = $state("25,75")
  let slide = $state("0")
  let toastAction = $state("")
  let drawn = $state("closed")
  let born = $state("none")
  let box = $state<HTMLElement | null>(null)
  let due = $state("2026-03-14")
  let paged = $state("1")
  let qty = $state("5")
  let place = $state("")
  let named = $state("")
  let did = $state("none")
  let dated = $state("none")
  let stay = $state("none")
  // The two calendars' values, held by their caller: what it gives back must keep the days.
  let pickedDay = $state<string | null>(null)
  let pickedRange = $state<DateRange | null>(null)
  let chosenDays = $state("none")
  let shownMonth = $state("2026-03-01")
  let rests = $state("0.5")
  let said = $state(8)
  // A page's toasts are made once: a long time, so a test reads them.
  const toaster = createToaster({ duration: 600_000 })
  let first = $state(0)
  let ran = $state<unknown>("none")
  let tags = $state<readonly unknown[] | undefined>(["New"])
  let align = $state<readonly unknown[] | undefined>(["left"])
  let tall = $state(false)
  let rowLoaded = $state(false)
  let chosen = $state<readonly unknown[] | undefined>(["Banana"])
  let pick = $state<unknown>(null)
  let outside = $state(0)
  let view = $state<unknown>("list")
  let presses = $state(0)
  let locked = $state(false)
  let handed = $state(0)
  let asked = $state(0)
  let marks = $state(0)
  let plain: Element | undefined
  let mark: Element | undefined
  let tipOff = $state(false)
  function pressLayered(event: PartEvent<MouseEvent>) {
    handed += 1
    asked += 1
    if (locked) event.preventKiranaHandler()
  }

  function press(event: PartEvent<MouseEvent>) {
    presses += 1
    if (locked) event.preventKiranaHandler()
  }
</script>

<main>
  <section data-fixture="collapsible">
    <Collapsible.Root id="c1">
      <Collapsible.Trigger data-testid="c1-trigger">Details</Collapsible.Trigger>
      <Collapsible.Panel class="panel" data-testid="c1-panel">
        <p>Panel content</p>
        <Collapsible.Root id="c2">
          <Collapsible.Trigger data-testid="c2-trigger">Nested</Collapsible.Trigger>
          <Collapsible.Panel class="panel" data-testid="c2-panel">
            <p>Nested content</p>
          </Collapsible.Panel>
        </Collapsible.Root>
      </Collapsible.Panel>
    </Collapsible.Root>
  </section>

  <section data-fixture="collapsible-controlled">
    <button data-testid="c3-outside" onclick={() => (controlled = !controlled)}>
      Toggle from outside
    </button>
    <Collapsible.Root id="c3" bind:open={controlled}>
      <Collapsible.Trigger data-testid="c3-trigger">Controlled</Collapsible.Trigger>
      <Collapsible.Panel class="panel" data-testid="c3-panel" keepMounted>
        <p>Kept in the page</p>
      </Collapsible.Panel>
    </Collapsible.Root>
    <Collapsible.Root id="c4" defaultOpen disabled>
      <Collapsible.Trigger data-testid="c4-trigger">Disabled, open</Collapsible.Trigger>
      <Collapsible.Panel class="panel" data-testid="c4-panel">
        <p>Open from the start</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  </section>

  <section data-fixture="composition">
    <label>
      <input type="checkbox" data-testid="k1-lock" bind:checked={locked} />
      Lock
    </label>
    <Collapsible.Root id="k1">
      <Collapsible.Trigger class="mine" type="submit" aria-expanded="true" onclick={press}>
        {#snippet child({ props })}
          <button {...props} data-testid="k1-trigger">Composed {presses}</button>
        {/snippet}
      </Collapsible.Trigger>
      <Collapsible.Panel
        class="panel"
        data-testid="k1-panel"
        style={`color: ${presses % 2 ? "red" : "blue"}`}
      >
        <p>Composed content</p>
      </Collapsible.Panel>
    </Collapsible.Root>
    <Collapsible.Root id="k2">
      <Collapsible.Trigger class="handed" title="handed" lang="en" onclick={pressLayered}>
        {#snippet child({ props })}
          <button {...props} class="{props.class} asked" title="asked" data-testid="k2-trigger">
            Layered {handed}/{asked}
          </button>
        {/snippet}
      </Collapsible.Trigger>
      <Collapsible.Trigger>
        {#snippet child({ props, state })}
          <button {...props} data-testid="k2-state">{state.panelOpen ? "Open" : "Closed"}</button>
        {/snippet}
      </Collapsible.Trigger>
      <Collapsible.Panel class="panel" data-testid="k2-panel">
        <p>Layered content</p>
      </Collapsible.Panel>
    </Collapsible.Root>
    <div class="item">
      <Tag title="handed">
        {#snippet child({ props })}
          <a {...props} class={[props.class, "asked"]} href="#k2" data-testid="k3-tag">Tag</a>
        {/snippet}
      </Tag>
      <Tag
        data-testid="k3-plain"
        {@attach (element) => {
          plain = element
        }}>Plain</Tag
      >
    </div>
    <div class="item">
      <!-- Each element is reached through an attachment, the plain one's and the one drawn
           through `child`: the count goes up only once both are the elements on the page. -->
      <Mark
        class="mine"
        onclick={(event) => (marks += event.currentTarget === mark && plain?.localName === "span" ? 1 : 0)}
        {@attach (element) => {
          mark = element
        }}
      >
        {#snippet child({ props, state })}
          <button {...props} data-testid="k4-mark">{state.active ? "On" : "Off"} {marks}</button>
        {/snippet}
      </Mark>
    </div>
  </section>

  <section data-fixture="own-attributes">
    <Collapsible.Root id="k5">
      <Collapsible.Trigger>
        {#snippet child({ props })}
          <!-- Its own attributes before the props: those the part has a value for are the part's. -->
          <button aria-controls="k5-note" aria-expanded="true" {...props} data-testid="k5-trigger">
            Own trigger
          </button>
        {/snippet}
      </Collapsible.Trigger>
      <span id="k5-note">Note</span>
      <Collapsible.Panel class="panel" data-testid="k5-panel">
        <p>Own content</p>
      </Collapsible.Panel>
    </Collapsible.Root>
    <Calendar.Root id="k6" locale="en-US" defaultMonth="2026-04-01" class="item">
      <Calendar.Heading data-testid="k6-heading">A caption of its own</Calendar.Heading>
      <Calendar.Next aria-label="Next month" data-testid="k6-next">Next</Calendar.Next>
      <Calendar.Grid data-testid="k6-grid" />
    </Calendar.Root>
  </section>

  <section data-fixture="design">
    <Dialog.Root id="ds1">
      <Dialog.Trigger data-testid="ds1-trigger">Wrapped dialog</Dialog.Trigger>
      <div>
        <Dialog.Portal>
          <Dialog.Backdrop class="backdrop" />
          <Dialog.Popup class="dialog" data-testid="ds1-popup">
            <Dialog.Title data-testid="ds1-title">Wrapped title</Dialog.Title>
            <Dialog.Close data-testid="ds1-close">Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </div>
    </Dialog.Root>
    <label class="item">
      <input type="checkbox" data-testid="ds2-off" bind:checked={tipOff} />
      Off
    </label>
    <Tooltip.Root id="ds2" delay={0} disabled={tipOff}>
      <Tooltip.Trigger data-testid="ds2-trigger">Quick</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8}>
          <Tooltip.Popup class="tip" data-testid="ds2-popup">At once</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
    <div class="item">
      <Otp.Root id="ds3a" length={2} mode="text">
        <Otp.Input aria-label="Text code" data-testid="ds3a-input" />
      </Otp.Root>
      <Otp.Root id="ds3b" length={2} mode="numeric">
        <Otp.Input aria-label="Number code" data-testid="ds3b-input" />
      </Otp.Root>
    </div>
    <div class="item">
      <Otp.Root id="ds3c" length={2} mode="numeric" value="42">
        <Otp.Input aria-label="Given code" data-testid="ds3c-input" />
      </Otp.Root>
      <Otp.Root id="ds3d" length={2} mode="text">
        <Otp.Input aria-label="Own code" data-testid="ds3d-input" />
      </Otp.Root>
    </div>
  </section>

  <section data-fixture="controls">
    <form data-testid="f1-form">
      <label data-testid="x1-label">
        <Checkbox.Root id="x1" name="terms" class="box" data-testid="x1">
          <Checkbox.Indicator class="mark">✓</Checkbox.Indicator>
        </Checkbox.Root>
        Accept
      </label>
      <Checkbox.Root id="x2" defaultChecked disabled class="box" data-testid="x2">
        <Checkbox.Indicator class="mark">✓</Checkbox.Indicator>
      </Checkbox.Root>
      <Checkbox.Root id="x3" indeterminate class="box" data-testid="x3">
        <Checkbox.Indicator class="mark">–</Checkbox.Indicator>
      </Checkbox.Root>
      <Switch.Root id="w1" name="alerts" bind:checked={alerts} class="switch" data-testid="w1">
        <Switch.Thumb class="thumb" />
      </Switch.Root>
      <label for="w1" data-testid="w1-label">Alerts</label>
      <RadioGroup.Root id="r1" name="plan" defaultValue="pro" data-testid="r1">
        {#each PLANS as each (each)}
          <label>
            <RadioGroup.Item
              value={each}
              disabled={each === "team"}
              class="radio"
              data-testid={`r1-${each}`}
              id={`r1-${each}-radio`}
            >
              <RadioGroup.Indicator class="dot" />
            </RadioGroup.Item>
            {each}
          </label>
        {/each}
      </RadioGroup.Root>
      <label for="r1-free-radio" data-testid="r1-label">Free plan</label>
      <button type="reset" data-testid="f1-reset">Reset</button>
    </form>
    <output data-testid="w1-output">{alerts ? "on" : "off"}</output>
  </section>

  <section data-fixture="tabs">
    <Tabs.Root id="t1" defaultValue="account" data-testid="t1">
      <Tabs.List class="tabs" data-testid="t1-list">
        <Tabs.Tab value="account" data-testid="t1-account">Account</Tabs.Tab>
        <Tabs.Tab value="password" data-testid="t1-password">Password</Tabs.Tab>
        <Tabs.Tab value="billing" disabled data-testid="t1-billing">Billing</Tabs.Tab>
        <Tabs.Tab value="team" data-testid="t1-team">Team</Tabs.Tab>
        <Tabs.Indicator class="tab-mark" data-testid="t1-mark" />
      </Tabs.List>
      <Tabs.Panel value="account" data-testid="t1-panel-account">
        <p>Account settings</p>
        <Tabs.Root id="t2" defaultValue="one" data-testid="t2">
          <Tabs.List class="tabs" data-testid="t2-list">
            <Tabs.Tab value="one" data-testid="t2-one">One</Tabs.Tab>
            <Tabs.Tab value="two" data-testid="t2-two">Two</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="one" data-testid="t2-panel-one">First</Tabs.Panel>
          <Tabs.Panel value="two" data-testid="t2-panel-two">Second</Tabs.Panel>
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
      {#each SECTIONS as each (each)}
        <Accordion.Item value={each} disabled={each === "three"} data-testid={`a1-${each}`}>
          <Accordion.Header>
            <Accordion.Trigger data-testid={`a1-${each}-trigger`}>Section {each}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel class="fold" data-testid={`a1-${each}-panel`}>
            <p>Content {each}</p>
          </Accordion.Panel>
        </Accordion.Item>
      {/each}
    </Accordion.Root>
    <Accordion.Root id="a2" multiple defaultValue={["x"]} data-testid="a2">
      {#each ["x", "y"] as each (each)}
        <Accordion.Item value={each} data-testid={`a2-${each}`}>
          <Accordion.Header>
            <Accordion.Trigger data-testid={`a2-${each}-trigger`}>Part {each}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel class="fold" data-testid={`a2-${each}-panel`}>
            <p>Content {each}</p>
          </Accordion.Panel>
        </Accordion.Item>
      {/each}
    </Accordion.Root>
  </section>

  <section data-fixture="hover">
    <button data-testid="h0">Before</button>
    <Tooltip.Root id="h1" delay={100}>
      <Tooltip.Trigger data-testid="h1-trigger">Save</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8} data-testid="h1-positioner">
          <Tooltip.Popup class="tip" data-testid="h1-popup">
            Save the file
            <Tooltip.Arrow class="arrow" data-testid="h1-arrow" />
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
    <Tooltip.Root id="h2" delay={100}>
      <Tooltip.Trigger data-testid="h2-trigger">Open</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8} data-testid="h2-positioner">
          <Tooltip.Popup class="tip" data-testid="h2-popup">Open a file</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
    <Tooltip.Root id="h4" delay={100}>
      <!-- A snippet draws an element the part cannot know on a server: it says it takes no type. -->
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <a {...props} type={undefined} href="#guide" data-testid="h4-trigger">Guide</a>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8}>
          <Tooltip.Popup class="tip">Read the guide</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
    <HoverCard.Root id="v1" delay={100} closeDelay={100}>
      <HoverCard.Trigger href="#profile" data-testid="v1-trigger">@kirana</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Positioner side="bottom" sideOffset={8} data-testid="v1-positioner">
          <HoverCard.Popup class="tip" data-testid="v1-popup">
            <p>Styles, compiled.</p>
            <a href="#follow" data-testid="v1-link">Follow</a>
          </HoverCard.Popup>
        </HoverCard.Positioner>
      </HoverCard.Portal>
    </HoverCard.Root>
    {#if tipKept}
      <Tooltip.Root id="h3" delay={100} closeDelay={2000}>
        <Tooltip.Trigger data-testid="h3-trigger">Share</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8} data-testid="h3-positioner">
            <Tooltip.Popup class="tip" data-testid="h3-popup">Share the file</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    {/if}
    <button data-testid="h3-remove" onclick={() => (tipKept = false)}>Remove</button>
  </section>

  <section data-fixture="simple">
    <Button data-testid="b1" onclick={() => (count += 1)}>Count {count}</Button>
    <Button disabled focusableWhenDisabled data-testid="b2">Disabled, in the tab order</Button>
    <Button nativeButton={false} onclick={() => (count += 1)}>
      {#snippet child({ props })}
        <span {...props} data-testid="b3">Not a button element</span>
      {/snippet}
    </Button>
    <!-- A snippet draws an element the part cannot know on a server: it says it is a link. -->
    <Button nativeButton={false} onclick={() => (count += 1)}>
      {#snippet child({ props })}
        <a {...props} role={undefined} tabindex={undefined} href="#bl1-docs" data-testid="bl1">Docs</a>
      {/snippet}
    </Button>
    <form
      data-testid="b4-form"
      onsubmit={(event) => {
        event.preventDefault()
        submits += 1
      }}
    >
      <Button type="submit" data-testid="b4">Sent {submits}</Button>
    </form>
    <Toggle aria-label="Bold" data-testid="g1">B</Toggle>
    <Separator data-testid="sp1" />
    <Separator orientation="vertical" data-testid="sp2" />
    <button data-testid="pr1-more" onclick={() => (done = 100)}>Finish</button>
    <Progress.Root id="pr1" value={done} data-testid="pr1">
      <Progress.Label>Upload</Progress.Label>
      <Progress.Track class="track">
        <Progress.Indicator class="fill" data-testid="pr1-fill" />
      </Progress.Track>
      <Progress.Value data-testid="pr1-value" />
    </Progress.Root>
    <Progress.Root id="pr2" value={null} data-testid="pr2">
      <Progress.Track class="track">
        <Progress.Indicator class="fill" data-testid="pr2-fill" />
      </Progress.Track>
    </Progress.Root>
    <Meter.Root id="m1" value={30} max={60} data-testid="m1">
      <Meter.Label>Disk</Meter.Label>
      <Meter.Track class="track">
        <Meter.Indicator class="fill" data-testid="m1-fill" />
      </Meter.Track>
      <Meter.Value data-testid="m1-value" />
    </Meter.Root>
    <button data-testid="av-load" onclick={() => (pictures = true)}>Load pictures</button>
    <Avatar.Root class="avatar" data-testid="av1">
      <Avatar.Image
        src={pictures ? PIXEL : undefined}
        alt="Kirana"
        data-testid="av1-image"
        onLoadingStatusChange={(status) => (heard = status)}
      />
      <Avatar.Fallback data-testid="av1-fallback">K</Avatar.Fallback>
    </Avatar.Root>
    <span data-testid="av1-status">{heard}</span>
    <Avatar.Root class="avatar" data-testid="av2">
      <Avatar.Image src={pictures ? BROKEN : undefined} alt="Nobody" data-testid="av2-image" />
      <Avatar.Fallback data-testid="av2-fallback">N</Avatar.Fallback>
    </Avatar.Root>
    <Avatar.Root class="avatar" data-testid="av3">
      <Avatar.Image
        keepMounted
        src={pictures ? PIXEL : undefined}
        alt="Kept"
        data-testid="av3-image"
      />
      <Avatar.Fallback delay={60000} data-testid="av3-fallback">L</Avatar.Fallback>
    </Avatar.Root>
    <AlertDialog.Root id="ad1">
      <AlertDialog.Trigger data-testid="ad1-trigger">Delete</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop class="backdrop" data-testid="ad1-backdrop" />
        <AlertDialog.Popup class="dialog" data-testid="ad1-popup">
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
        <Dialog.Backdrop class="backdrop" data-testid="d1-backdrop" />
        <Dialog.Popup class="dialog" data-testid="d1-popup">
          <Dialog.Title>Edit profile</Dialog.Title>
          <Dialog.Description>Change your name.</Dialog.Description>
          <input data-testid="d1-input" aria-label="Name" />
          <Dialog.Root id="d2">
            <Dialog.Trigger data-testid="d2-trigger">Open nested</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop class="backdrop" data-testid="d2-backdrop" />
              <Dialog.Popup class="dialog" data-testid="d2-popup">
                <Dialog.Title>Are you sure?</Dialog.Title>
                <Dialog.Close data-testid="d2-close">Back</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Close data-testid="d1-close">Close</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
    <Dialog.Root id="d3">
      <Dialog.Trigger data-testid="d3-trigger">Open long dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop class="backdrop" data-testid="d3-backdrop" />
        <Dialog.Viewport class="viewport" data-testid="d3-viewport">
          <Dialog.Popup class="dialog long" data-testid="d3-popup">
            <Dialog.Title>Terms</Dialog.Title>
            <Dialog.Description>Longer than the page: its viewport scrolls.</Dialog.Description>
            <Dialog.Close data-testid="d3-close">Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  </section>

  <section data-fixture="popover">
    <Popover.Root id="p1">
      <Popover.Trigger data-testid="p1-trigger">Open popover</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start" data-testid="p1-positioner">
          <Popover.Popup class="popup" data-testid="p1-popup">
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
      <Select.Root id="s1" name="fruit" bind:value={fruit}>
        <Select.Trigger data-testid="s1-trigger">
          <Select.Value placeholder="Pick a fruit" data-testid="s1-value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={4} data-testid="s1-positioner">
            <Select.Popup class="popup" data-testid="s1-popup">
              {#each FRUITS as each (each)}
                <Select.Item
                  value={each}
                  disabled={each === "Blueberry"}
                  class="item"
                  data-testid={`s1-${each}`}
                >
                  <Select.ItemText>{each}</Select.ItemText>
                  <Select.ItemIndicator>✓</Select.ItemIndicator>
                </Select.Item>
              {/each}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </form>
    <output data-testid="s1-output">{fruit ?? "none"}</output>
  </section>
  <section data-fixture="select-multiple">
    <form class="bar" data-testid="sm1-form">
      <Select.Root id="sm1" name="basket" multiple bind:values={basket}>
        <Select.Trigger data-testid="sm1-trigger">
          <Select.Value placeholder="Pick fruits" data-testid="sm1-value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={4} data-testid="sm1-positioner">
            <Select.Popup class="popup" data-testid="sm1-popup">
              {#each FRUITS as each (each)}
                <Select.Item
                  value={each}
                  disabled={each === "Blueberry"}
                  class="item"
                  data-testid={`sm1-${each}`}
                >
                  <Select.ItemText>{each}</Select.ItemText>
                  <Select.ItemIndicator>✓</Select.ItemIndicator>
                </Select.Item>
              {/each}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <button type="reset" data-testid="sm1-reset">Reset</button>
    </form>
    <output data-testid="sm1-output">{basket.join(",") || "none"}</output>
    <Select.Root id="sm2" items={SIZES} defaultValue="m">
      <Select.Trigger data-testid="sm2-trigger">
        <Select.Value data-testid="sm2-value">
          {#snippet children({ value, label })}{label} ({value}){/snippet}
        </Select.Value>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={4} data-testid="sm2-positioner">
          <Select.Popup class="popup" data-testid="sm2-popup">
            {#each SIZE_KEYS as each (each)}
              <Select.Item value={each} class="item" data-testid={`sm2-${each}`}>
                <Select.ItemText>{SIZES[each]}</Select.ItemText>
              </Select.Item>
            {/each}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
    <Select.Root id="sm3" items={SIZES} multiple defaultValues={["l", "s"]}>
      <Select.Trigger data-testid="sm3-trigger">
        <Select.Value class="bar" data-testid="sm3-value">
          {#snippet children({ values, labels })}
            {#each labels as label, at (values[at])}<b>{label}</b>{/each}
          {/snippet}
        </Select.Value>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={4} data-testid="sm3-positioner">
          <Select.Popup class="popup" data-testid="sm3-popup">
            {#each SIZE_KEYS as each (each)}
              <Select.Item value={each} class="item" data-testid={`sm3-${each}`}>
                <Select.ItemText>{SIZES[each]}</Select.ItemText>
              </Select.Item>
            {/each}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  </section>
  <section data-fixture="menu">
    <Menu.Root id="mn1">
      <Menu.Trigger data-testid="mn1-trigger">File</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} data-testid="mn1-positioner">
          <Menu.Popup class="popup" data-testid="mn1-popup">
            <Menu.GroupLabel data-testid="mn1-lone">Document</Menu.GroupLabel>
            <Menu.Item class="item" data-testid="mn1-new" onclick={() => (action = "new")}>
              <span>New</span><kbd aria-hidden="true">⌘N</kbd>
            </Menu.Item>
            <Menu.Item class="item" disabled data-testid="mn1-open">
              Open
            </Menu.Item>
            <Menu.Item class="item" data-testid="mn1-print" onclick={() => (action = "print")}>
              Print
            </Menu.Item>
            <Menu.Separator data-testid="mn1-separator" />
            <Menu.CheckboxItem class="item" defaultChecked data-testid="mn1-wrap">
              <Menu.CheckboxItemIndicator>✓</Menu.CheckboxItemIndicator>
              <span>Word wrap</span>
            </Menu.CheckboxItem>
            <Menu.Group id="mn1-g" data-testid="mn1-group">
              <Menu.GroupLabel data-testid="mn1-label">View</Menu.GroupLabel>
              <Menu.RadioGroup bind:value={view} data-testid="mn1-views">
                <Menu.RadioItem value="list" class="item" data-testid="mn1-list">
                  <Menu.RadioItemIndicator>•</Menu.RadioItemIndicator>
                  <span>List</span>
                </Menu.RadioItem>
                <Menu.RadioItem value="grid" class="item" data-testid="mn1-grid">
                  <Menu.RadioItemIndicator>•</Menu.RadioItemIndicator>
                  <span>Grid</span>
                </Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Group>
            <Menu.SubmenuRoot id="mn1s">
              <Menu.SubmenuTrigger class="item" data-testid="mn1-share">
                Share
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner data-testid="mn1s-positioner">
                  <Menu.Popup class="popup" data-testid="mn1s-popup">
                    <Menu.Item
                      class="item"
                      data-testid="mn1s-mail"
                      onclick={() => (action = "mail")}
                    >
                      Mail
                    </Menu.Item>
                    <Menu.Item
                      class="item"
                      data-testid="mn1s-link"
                      onclick={() => (action = "link")}
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
      <ContextMenu.Trigger class="area" data-testid="cm1-area">
        Press here
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner data-testid="cm1-positioner">
          <ContextMenu.Popup class="popup" aria-label="Actions" data-testid="cm1-popup">
            <ContextMenu.Item
              class="item"
              data-testid="cm1-copy"
              onclick={() => (picked = "cm1-copy")}
            >
              Copy
            </ContextMenu.Item>
            <ContextMenu.Item
              class="item"
              data-testid="cm1-paste"
              onclick={() => (picked = "cm1-paste")}
            >
              Paste
            </ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  </section>
  <section data-fixture="menubar">
    <Menubar id="mb1" class="bar" data-testid="mb1">
      <Menu.Root id="mb1f">
        <Menu.Trigger data-testid="mb1-file">File</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner data-testid="mb1f-positioner">
            <Menu.Popup class="popup" data-testid="mb1f-popup">
              <Menu.Item class="item" data-testid="mb1f-new" onclick={() => (picked = "mb1f-new")}>
                New
              </Menu.Item>
              <Menu.Item class="item" data-testid="mb1f-save" onclick={() => (picked = "mb1f-save")}>
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
            <Menu.Popup class="popup" data-testid="mb1e-popup">
              <Menu.Item class="item" data-testid="mb1e-undo" onclick={() => (picked = "mb1e-undo")}>
                Undo
              </Menu.Item>
              <Menu.SubmenuRoot id="mb1em">
                <Menu.SubmenuTrigger class="item" data-testid="mb1e-find">
                  Find
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner data-testid="mb1em-positioner">
                    <Menu.Popup class="popup" data-testid="mb1em-popup">
                      <Menu.Item class="item" data-testid="mb1em-next" onclick={() => (picked = "mb1em-next")}>
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
            <Menu.Popup class="popup" data-testid="mb1v-popup">
              <Menu.Item class="item" data-testid="mb1v-zoom" onclick={() => (picked = "mb1v-zoom")}>
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
            <Menu.Popup class="popup" data-testid="mb1h-popup">
              <Menu.Item class="item" data-testid="mb1h-about" onclick={() => (picked = "mb1h-about")}>
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
      bind:value={chosen}
      data-testid="lb1"
    >
      {#each FRUITS as each (each)}
        <Listbox.Item
          value={each}
          disabled={each === "Blueberry"}
          class="item"
          data-testid={`lb1-${each}`}
        >
          <span>{each}</span>
          <Listbox.ItemIndicator>✓</Listbox.ItemIndicator>
        </Listbox.Item>
      {/each}
    </Listbox.Root>
    <Listbox.Root id="lb2" aria-label="Plans" multiple data-testid="lb2">
      <Listbox.Group id="lb2-g" data-testid="lb2-group">
        <Listbox.GroupLabel data-testid="lb2-label">Plans</Listbox.GroupLabel>
        {#each PLANS as each (each)}
          <Listbox.Item value={each} class="item" data-testid={`lb2-${each}`}>
            <span>{each}</span>
          </Listbox.Item>
        {/each}
      </Listbox.Group>
    </Listbox.Root>
    <output data-testid="lb1-output">{(chosen as string[]).join(",")}</output>
  </section>
  <section data-fixture="combobox">
    <form data-testid="cb1-form">
      <Combobox.Root
        id="cb1"
        name="pick"
        autoHighlight
        bind:value={pick}
      >
        <Combobox.Input aria-label="Fruit" data-testid="cb1-input" />
        <Combobox.Trigger aria-label="Show fruits" data-testid="cb1-trigger">
          ▾
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4} data-testid="cb1-positioner">
            <Combobox.Popup class="popup" aria-label="Fruits" data-testid="cb1-popup">
              {#each FRUITS as each (each)}
                <Combobox.Item
                  value={each}
                  id={`cb1-${each}`}
                  disabled={each === "Blueberry"}
                  class="item"
                  data-testid={`cb1-${each}`}
                >
                  <span>{each}</span>
                  <Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
                </Combobox.Item>
              {/each}
              <Combobox.Empty data-testid="cb1-empty">No fruit</Combobox.Empty>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </form>
    <output data-testid="cb1-output">{pick ?? "none"}</output>
  </section>
  <section data-fixture="menu-more">
    <div class="bar">
      <button type="button" data-testid="mm1-outside" onclick={() => (outside += 1)}>
        Outside
      </button>
      <Menu.Root id="mm1" modal>
        <Menu.Trigger data-testid="mm1-trigger">Modal</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner data-testid="mm1-positioner">
            <Menu.Popup class="popup" data-testid="mm1-popup">
              <Menu.Item class="item" data-testid="mm1-plain">
                Plain
              </Menu.Item>
              <Menu.LinkItem class="item" href="#mm1-linked" data-testid="mm1-link">
                Link
              </Menu.LinkItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
    <Menubar id="vb1" orientation="vertical" class="column" data-testid="vb1">
      <Menu.Root id="vb1a">
        <Menu.Trigger data-testid="vb1-one">One</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner data-testid="vb1a-positioner">
            <Menu.Popup class="popup" data-testid="vb1a-popup">
              <Menu.Item class="item" data-testid="vb1a-x">
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
            <Menu.Popup class="popup" data-testid="vb1b-popup">
              <Menu.Item class="item" data-testid="vb1b-x">
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
      bind:value={align}
      class="bar"
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
    <output data-testid="tg1-output">{(align as string[]).join(",")}</output>
    <Toolbar.Root aria-label="Editing" class="bar" data-testid="tb1">
      <Toolbar.Button data-testid="tb1-save">Save</Toolbar.Button>
      <Toolbar.Button disabled data-testid="tb1-gone">
        Gone
      </Toolbar.Button>
      <Toolbar.Link href="#tb1-help" data-testid="tb1-link">
        Help
      </Toolbar.Link>
      <Toolbar.Separator data-testid="tb1-line" />
      <Toolbar.Input aria-label="Zoom" value="100" data-testid="tb1-zoom" />
      <Toolbar.Group data-testid="tb1-group">
        <ToggleGroup multiple aria-label="Marks" class="bar" data-testid="tb1-marks">
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
    <ScrollArea.Root class="scroll" data-testid="sa1">
      <ScrollArea.Viewport class="scroll-view" data-testid="sa1-view">
        <ScrollArea.Content data-testid="sa1-content">
          <div class={tall ? "scroll-tall" : "scroll-short"} data-testid="sa1-box">
            Content
          </div>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar class="scroll-bar" data-testid="sa1-y">
        <ScrollArea.Thumb class="scroll-thumb" data-testid="sa1-y-thumb" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar
        orientation="horizontal"
        class="scroll-bar"
        data-testid="sa1-x"
      >
        <ScrollArea.Thumb class="scroll-thumb" data-testid="sa1-x-thumb" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner class="scroll-corner" data-testid="sa1-corner" />
    </ScrollArea.Root>
    <button type="button" data-testid="sa1-grow" onclick={() => (tall = !tall)}>
      Grow
    </button>
    <ScrollArea.Root class="scroll-wide" data-testid="sa2">
      <ScrollArea.Viewport class="scroll-view" data-testid="sa2-view">
        <div class="scroll-pictures" data-testid="sa2-row">
          <div class="scroll-figure">
          <img
            class="scroll-picture"
            src={rowLoaded ? WIDE : undefined}
            alt=""
            data-testid="sa2-picture-1"
          />
        </div>
          <div class="scroll-figure">
          <img
            class="scroll-picture"
            src={rowLoaded ? WIDE : undefined}
            alt=""
            data-testid="sa2-picture-2"
          />
        </div>
          <div class="scroll-figure">
          <img
            class="scroll-picture"
            src={rowLoaded ? WIDE : undefined}
            alt=""
            data-testid="sa2-picture-3"
          />
        </div>
        </div>
        <ScrollArea.Scrollbar orientation="horizontal" class="scroll-bar" data-testid="sa2-x">
          <ScrollArea.Thumb class="scroll-thumb" data-testid="sa2-x-thumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar class="scroll-bar" data-testid="sa2-y">
        <ScrollArea.Thumb class="scroll-thumb" data-testid="sa2-y-thumb" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner class="scroll-corner" data-testid="sa2-corner" />
    </ScrollArea.Root>
    <button type="button" data-testid="sa2-load" onclick={() => (rowLoaded = true)}>
      Load pictures
    </button>
  </section>
  <section data-fixture="navigation-menu">
    <NavigationMenu.Root id="nm1" aria-label="Site" data-testid="nm1">
      <NavigationMenu.List class="nav-list" data-testid="nm1-list">
        <NavigationMenu.Item value="products">
          <NavigationMenu.Trigger class="nav-trigger" data-testid="nm1-products">
            <span>Products</span>
            <NavigationMenu.Icon>▾</NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content class="nav-content" data-testid="nm1-products-content">
          <NavigationMenu.Link href="#apps" data-testid="nm1-apps">
            apps
          </NavigationMenu.Link>
          <NavigationMenu.Link href="#tools" data-testid="nm1-tools">
            tools
          </NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger class="nav-trigger" data-testid="nm1-docs">
            <span>Docs</span>
            <NavigationMenu.Icon>▾</NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content class="nav-content nav-narrow" data-testid="nm1-docs-content">
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
          <NavigationMenu.Popup class="popup" data-testid="nm1-popup">
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
      class="virtual"
      data-testid="vl1"
      onscroll={(event: { currentTarget: HTMLElement }) =>
        (first = firstRow(event.currentTarget.scrollTop))}
    >
      <div class="virtual-space">
        {#each rowsFrom(first) as each (each)}
          <Listbox.Item
            value={each}
            index={each}
            class="item virtual-row"
            style={`top: ${each * VROW}px`}
            data-testid={`vl1-${each}`}
          >
            {`Row ${each}`}
          </Listbox.Item>
        {/each}
      </div>
    </Listbox.Root>
    <Combobox.Root id="cp1" inline autoHighlight onValueChange={(next) => (ran = next)}>
      <Combobox.Input aria-label="Command" data-testid="cp1-input" />
      <Combobox.Popup class="palette" aria-label="Commands" data-testid="cp1-list">
        {#each COMMANDS as each (each)}
          <Combobox.Item value={each} id={`cp1-${each}`} class="item" data-testid={`cp1-${each}`}>
            {each}
          </Combobox.Item>
        {/each}
        <Combobox.Empty data-testid="cp1-empty">Nothing found</Combobox.Empty>
      </Combobox.Popup>
    </Combobox.Root>
    <output data-testid="cp1-output">{ran}</output>
    <Field.Root id="fcb" name="city" data-testid="fcb">
      <Field.Label data-testid="fcb-label">City</Field.Label>
      <Combobox.Root id="fcbc" required autoHighlight>
        <Combobox.Input data-testid="fcb-input" />
        <Combobox.Clear aria-label="Clear" data-testid="fcb-clear">×</Combobox.Clear>
        <Combobox.Portal>
          <Combobox.Positioner data-testid="fcb-positioner">
            <Combobox.Popup class="popup" aria-label="Cities" data-testid="fcb-popup">
              <Combobox.Item value="Oslo" id="fcb-Oslo" class="item" data-testid="fcb-Oslo">
                Oslo
              </Combobox.Item>
              <Combobox.Item value="Rome" id="fcb-Rome" class="item" data-testid="fcb-Rome">
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
        autoHighlight
        bind:values={tags}
      >
        <Combobox.Chips class="bar" data-testid="cbm-chips">
          {#each tags as string[] as each (each)}
            <Combobox.Chip
              value={each}
              class="chip"
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
          {/each}
          <Combobox.Input aria-label="Tags" data-testid="cbm-input" />
        </Combobox.Chips>
        <Combobox.Portal>
          <Combobox.Positioner data-testid="cbm-positioner">
            <Combobox.Popup class="popup" aria-label="Tags" data-testid="cbm-popup">
              {#each COMMANDS as each (each)}
                <Combobox.Item
                  value={each}
                  id={`cbm-${each}`}
                  class="item"
                  data-testid={`cbm-${each}`}
                >
                  {each}
                </Combobox.Item>
              {/each}
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
        class="otp"
        data-testid="otp1"
        onComplete={(next: string) => (code = next)}
      >
        <Otp.Input aria-label="Code" class="otp-input" data-testid="otp1-input" />
        <Otp.Group class="otp-group">
          <Otp.Slot index={0} class="otp-slot" data-testid="otp1-0">
            <Otp.Caret class="otp-caret" />
          </Otp.Slot>
          <Otp.Slot index={1} class="otp-slot" data-testid="otp1-1">
            <Otp.Caret class="otp-caret" />
          </Otp.Slot>
        </Otp.Group>
        <Otp.Separator class="otp-mark" />
        <Otp.Group class="otp-group">
          <Otp.Slot index={2} class="otp-slot" data-testid="otp1-2">
            <Otp.Caret class="otp-caret" />
          </Otp.Slot>
          <Otp.Slot index={3} class="otp-slot" data-testid="otp1-3">
            <Otp.Caret class="otp-caret" />
          </Otp.Slot>
        </Otp.Group>
      </Otp.Root>
    </form>
    <output data-testid="otp1-output">{code}</output>
    <div class="otp-row">
      <Otp.Root id="otp2" length={2} mode="alphabetic" class="otp" data-testid="otp2">
        <Otp.Input aria-label="Letters" class="otp-input" data-testid="otp2-input" />
        <Otp.Group class="otp-group">
          <Otp.Slot index={0} class="otp-slot" data-testid="otp2-0" />
          <Otp.Slot index={1} class="otp-slot" data-testid="otp2-1" />
        </Otp.Group>
      </Otp.Root>
      <Otp.Root id="otp3" length={3} pattern="[A-F0-9]" class="otp" data-testid="otp3">
        <Otp.Input aria-label="Hex" class="otp-input" data-testid="otp3-input" />
        <Otp.Group class="otp-group">
          <Otp.Slot index={0} class="otp-slot" data-testid="otp3-0" />
          <Otp.Slot index={1} class="otp-slot" data-testid="otp3-1" />
          <Otp.Slot index={2} class="otp-slot" data-testid="otp3-2" />
        </Otp.Group>
      </Otp.Root>
    </div>
    <Resizable.Group
      id="rs1"
      class="split"
      data-testid="rs1"
      onSizesChange={(next: number[]) => (shares = next.map(Math.round).join(","))}
    >
      <Resizable.Panel defaultSize={25} minSize={10} class="split-panel" data-testid="rs1-a">
        A
      </Resizable.Panel>
      <Resizable.Handle aria-label="Resize" class="split-bar" data-testid="rs1-bar" />
      <Resizable.Panel defaultSize={75} class="split-panel" data-testid="rs1-b">
        B
      </Resizable.Panel>
    </Resizable.Group>
    <output data-testid="rs1-output">{shares}</output>
  </section>
  <section data-fixture="pieces">
    <QrCode.Root id="qr1" value="https://kirana.style" class="qr" data-testid="qr1">
      <QrCode.Frame aria-label="A link" class="qr-frame" data-testid="qr1-frame">
        <QrCode.Pattern data-testid="qr1-pattern" />
      </QrCode.Frame>
    </QrCode.Root>
    <Autosize.Textarea aria-label="Note" rows={1} class="note" data-testid="au1" />
    <Carousel.Root
      id="cr1"
      aria-label="Pictures"
      class="carousel"
      data-testid="cr1"
      onIndexChange={(next: number) => (slide = String(next))}
    >
      <Carousel.Viewport class="carousel-view" data-testid="cr1-view">
        <Carousel.Item index={0} class="carousel-item" data-testid="cr1-0">One</Carousel.Item>
        <Carousel.Item index={1} class="carousel-item" data-testid="cr1-1">Two</Carousel.Item>
        <Carousel.Item index={2} class="carousel-item" data-testid="cr1-2">Three</Carousel.Item>
      </Carousel.Viewport>
      <Carousel.Previous data-testid="cr1-previous">Previous</Carousel.Previous>
      <Carousel.Next data-testid="cr1-next">Next</Carousel.Next>
      <Carousel.Indicator index={0} aria-label="Slide 1" data-testid="cr1-dot-0" />
      <Carousel.Indicator index={1} aria-label="Slide 2" data-testid="cr1-dot-1" />
      <Carousel.Indicator index={2} aria-label="Slide 3" data-testid="cr1-dot-2" />
    </Carousel.Root>
    <output data-testid="cr1-output">{slide}</output>
  </section>
  <section data-fixture="toast">
    <button
      type="button"
      data-testid="ts1-add"
      onclick={() =>
        toaster.add({ title: "Saved", description: "Your changes are kept.", type: "success" })}
    >
      Add a toast
    </button>
    <button
      type="button"
      data-testid="ts1-brief"
      onclick={() => toaster.add({ title: "Gone soon", duration: 300 })}
    >
      Add a brief toast
    </button>
    <button
      type="button"
      data-testid="ts1-undo"
      onclick={() =>
        toaster.add({
          title: "Deleted",
          action: { label: "Undo", onAction: () => (toastAction = "undone") },
        })}
    >
      Add a toast with an action
    </button>
    <button
      type="button"
      data-testid="ts1-alert"
      onclick={() =>
        toaster.add({ title: "Connection lost", type: "error", priority: "assertive" })}
    >
      Add an urgent toast
    </button>
    <output data-testid="ts1-output">{toastAction}</output>
    <Toast.Viewport id="ts1" {toaster} class="toasts" data-testid="ts1">
      <Toast.List>
        {#snippet children(toast)}
          <Toast.Root {toast} class="toast" data-testid={`ts1-${toast.id}`}>
            <Toast.Content class="toast-content" data-testid={`ts1-${toast.id}-content`}>
              <Toast.Title class="toast-title">{toast.title}</Toast.Title>
              <Toast.Description />
            </Toast.Content>
            <Toast.Action data-testid={`ts1-${toast.id}-action`} />
            <Toast.Close aria-label="Close" data-testid={`ts1-${toast.id}-close`}>Close</Toast.Close>
          </Toast.Root>
        {/snippet}
      </Toast.List>
    </Toast.Viewport>
  </section>
  <section data-fixture="sheets">
    <Drawer.Root
      id="dw1"
      onOpenChange={(open: boolean, details: { reason: string }) =>
        (drawn = open ? "open" : details.reason)}
    >
      <Drawer.Trigger data-testid="dw1-trigger">Open drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop class="backdrop" data-testid="dw1-backdrop" />
        <Drawer.Popup class="drawer" data-testid="dw1-popup">
          <Drawer.Title>Filters</Drawer.Title>
          <button type="button" data-testid="dw1-apply">Apply</button>
          <Drawer.Close data-testid="dw1-close">Close</Drawer.Close>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
    <output data-testid="dw1-output">{drawn}</output>
    <Drawer.Root
      id="dw2"
      snapPoints={[0.5, 1]}
      onSnapPointChange={(next: number | string) => (rests = String(next))}
    >
      <Drawer.Trigger data-testid="dw2-trigger">Open a drawer that rests</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop class="backdrop" data-testid="dw2-backdrop" />
        <Drawer.Popup class="drawer" data-testid="dw2-popup">
          <Drawer.Title>Details</Drawer.Title>
          <Drawer.Close data-testid="dw2-close">Close</Drawer.Close>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
    <output data-testid="dw2-output">{rests}</output>
    <MessageScroller.Root id="ms1" class="chat" data-testid="ms1">
      <MessageScroller.Viewport class="chat-view" data-testid="ms1-view">
        <MessageScroller.Content class="chat-lines" data-testid="ms1-content">
          {#each Array.from({ length: said }, (_, at) => at + 1) as line (line)}
            <p class="chat-line">Message {line}</p>
          {/each}
        </MessageScroller.Content>
      </MessageScroller.Viewport>
      <MessageScroller.Button data-testid="ms1-button">Newest</MessageScroller.Button>
    </MessageScroller.Root>
    <button type="button" data-testid="ms1-add" onclick={() => (said += 1)}>Add a message</button>
  </section>
  <section data-fixture="dates">
    <Calendar.Root
      id="cal1"
      locale="en-US"
      defaultFocusedValue="2026-03-15"
      class="calendar"
      data-testid="cal1"
      bind:value={pickedDay}
      onValueChange={(next: unknown) => (dated = String(next))}
    >
      <Calendar.Previous aria-label="Previous month" data-testid="cal1-previous">
        Previous
      </Calendar.Previous>
      <Calendar.Heading data-testid="cal1-heading" />
      <Calendar.Next aria-label="Next month" data-testid="cal1-next">Next</Calendar.Next>
      <Calendar.Grid data-testid="cal1-grid">
        <thead>
          <tr>
            <Calendar.Weekdays>
              {#snippet children(weekday)}
                <Calendar.HeadCell {weekday}>{weekday.short}</Calendar.HeadCell>
              {/snippet}
            </Calendar.Weekdays>
          </tr>
        </thead>
        <tbody>
          <Calendar.Weeks>
            {#snippet children(week)}
              <tr>
                {#each week as day (day.date)}
                  <Calendar.Cell date={day.date}>
                    <Calendar.Day date={day.date} data-testid={`cal1-${day.date}`}>
                      {day.label}
                    </Calendar.Day>
                  </Calendar.Cell>
                {/each}
              </tr>
            {/snippet}
          </Calendar.Weeks>
        </tbody>
      </Calendar.Grid>
    </Calendar.Root>
    <output data-testid="cal1-output">{dated}</output>
    <form data-testid="df1-form">
      <DateField.Root
        id="df1"
        locale="en-US"
        name="born"
        aria-label="Date of birth"
        class="date-field"
        data-testid="df1"
        onValueChange={(next: string | null) => (born = String(next))}
      >
        <DateField.Segments>
          {#snippet children(segment)}
            <DateField.Segment {segment} data-testid={`df1-${segment.type}-${segment.index}`} />
          {/snippet}
        </DateField.Segments>
        <DateField.Input />
      </DateField.Root>
    </form>
    <output data-testid="df1-output">{born}</output>
  </section>
  <section data-fixture="calendars">
    <Calendar.Root
      id="cal2"
      locale="en-US"
      mode="range"
      months={2}
      defaultMonth="2026-03-01"
      defaultFocusedValue="2026-03-15"
      class="calendar calendar-months"
      data-testid="cal2"
      bind:value={pickedRange}
      onValueChange={(next: unknown) => (stay = JSON.stringify(next))}
    >
      <Calendar.Previous aria-label="Previous month" data-testid="cal2-previous">
        Previous
      </Calendar.Previous>
      <Calendar.Next aria-label="Next month" data-testid="cal2-next">Next</Calendar.Next>
      <div class="months">
        <Calendar.Months>
          {#snippet children(month)}
            <div data-testid={`cal2-month-${month.index}`}>
              <Calendar.Heading data-testid={`cal2-heading-${month.index}`} />
              <Calendar.Grid data-testid={`cal2-grid-${month.index}`}>
                <thead>
                  <tr>
                    <Calendar.Weekdays>
                      {#snippet children(weekday)}
                        <Calendar.HeadCell {weekday}>{weekday.short}</Calendar.HeadCell>
                      {/snippet}
                    </Calendar.Weekdays>
                  </tr>
                </thead>
                <tbody>
                  <Calendar.Weeks>
                    {#snippet children(week)}
                      <tr>
                        {#each week as day (day.date)}
                          <Calendar.Cell date={day.date}>
                            <Calendar.Day date={day.date} data-testid={`cal2-${month.index}-${day.date}`}>
                              {day.label}
                            </Calendar.Day>
                          </Calendar.Cell>
                        {/each}
                      </tr>
                    {/snippet}
                  </Calendar.Weeks>
                </tbody>
              </Calendar.Grid>
            </div>
          {/snippet}
        </Calendar.Months>
      </div>
    </Calendar.Root>
    <output data-testid="cal2-output">{stay}</output>
    <form data-testid="cal3-form">
      <Calendar.Root
        id="cal3"
        locale="en-US"
        mode="multiple"
        name="days"
        maxDays={3}
        required
        defaultValue={["2026-03-02"]}
        defaultFocusedValue="2026-03-15"
        class="calendar"
        data-testid="cal3"
        onValueChange={(next: unknown) => (chosenDays = String(next))}
      >
        <Calendar.Heading data-testid="cal3-heading" />
        <Calendar.Grid data-testid="cal3-grid">
          <tbody>
            <Calendar.Weeks>
              {#snippet children(week)}
                <tr>
                  {#each week as day (day.date)}
                    <Calendar.Cell date={day.date}>
                      <Calendar.Day date={day.date} data-testid={`cal3-${day.date}`}>
                        {day.label}
                      </Calendar.Day>
                    </Calendar.Cell>
                  {/each}
                </tr>
              {/snippet}
            </Calendar.Weeks>
          </tbody>
        </Calendar.Grid>
        <Calendar.Input data-testid="cal3-input" />
      </Calendar.Root>
      <button type="reset" data-testid="cal3-reset">Reset</button>
    </form>
    <output data-testid="cal3-output">{chosenDays}</output>
    <Calendar.Root
      id="cal4"
      locale="en-US"
      bind:month={shownMonth}
      defaultFocusedValue="2026-03-15"
      class="calendar"
      data-testid="cal4"
    >
      <Calendar.Previous aria-label="Previous month" data-testid="cal4-previous">
        Previous
      </Calendar.Previous>
      <Calendar.Heading data-testid="cal4-heading" />
      <Calendar.Next aria-label="Next month" data-testid="cal4-next">Next</Calendar.Next>
      <Calendar.Grid data-testid="cal4-grid">
        <tbody>
          <Calendar.Weeks>
            {#snippet children(week)}
              <tr>
                {#each week as day (day.date)}
                  <Calendar.Cell date={day.date}>
                    <Calendar.Day date={day.date} data-testid={`cal4-${day.date}`}>
                      {day.label}
                    </Calendar.Day>
                  </Calendar.Cell>
                {/each}
              </tr>
            {/snippet}
          </Calendar.Weeks>
        </tbody>
      </Calendar.Grid>
    </Calendar.Root>
    <button type="button" data-testid="cal4-jump" onclick={() => (shownMonth = "2030-12-01")}>
      December 2030
    </button>
    <output data-testid="cal4-output">{shownMonth}</output>
  </section>
  <section data-fixture="command">
      <Label for="in1" data-testid="in1-label">
        Name
      </Label>
      <Input id="in1" data-testid="in1" onValueChange={(next: string) => (named = next)} />
      <output data-testid="in1-output">{named}</output>
      <Field.Root id="in2" name="email" data-testid="in2">
        <Label data-testid="in2-label">Email</Label>
        <Input type="email" required data-testid="in2-input" />
      </Field.Root>
      <Command.Root
        id="cm1"
        loop
        class="command"
        data-testid="cm1"
        onSelect={(next: string) => (did = next)}
      >
        <Command.Input aria-label="Command" data-testid="cm1-input" />
        <Command.List class="palette" aria-label="Commands" data-testid="cm1-list">
          <Command.Group id="cm1-file" data-testid="cm1-file">
            <Command.GroupHeading data-testid="cm1-file-heading">File</Command.GroupHeading>
            <Command.Item value="new" id="cm1-new" class="item" data-testid="cm1-new">
              New
            </Command.Item>
            <Command.Item
              value="open"
              id="cm1-open"
              keywords={LOAD}
              class="item"
              data-testid="cm1-open"
            >
              Open
            </Command.Item>
          </Command.Group>
          <Command.Separator class="separator" data-testid="cm1-separator" />
          <Command.Group id="cm1-edit" data-testid="cm1-edit">
            <Command.GroupHeading data-testid="cm1-edit-heading">Edit</Command.GroupHeading>
            <Command.Item id="cm1-copy" class="item" data-testid="cm1-copy">
              Copy
            </Command.Item>
            <Command.Item
              value="paste"
              id="cm1-paste"
              disabled
              class="item"
              data-testid="cm1-paste"
            >
              Paste
            </Command.Item>
          </Command.Group>
          <Command.Empty data-testid="cm1-empty">Nothing found</Command.Empty>
        </Command.List>
      </Command.Root>
      <output data-testid="cm1-output">{did}</output>
  </section>
  <section data-fixture="slider">
    <Slider.Root id="sl1" defaultValue={40} name="volume" data-testid="sl1">
      <Slider.Value data-testid="sl1-value" />
      <Slider.Control class="slider" data-testid="sl1-control">
        <Slider.Track class="slider-track">
          <Slider.Indicator class="fill" data-testid="sl1-fill" />
          <Slider.Thumb class="thumb" aria-label="Volume" data-testid="sl1-thumb" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
    <Slider.Root id="sl2" bind:value={span} step={5} data-testid="sl2">
      <Slider.Value data-testid="sl2-value" />
      <Slider.Control class="slider" data-testid="sl2-control">
        <Slider.Track class="slider-track">
          <Slider.Indicator class="fill" data-testid="sl2-fill" />
          <Slider.Thumb index={0} class="thumb" aria-label="From" data-testid="sl2-from" />
          <Slider.Thumb index={1} class="thumb" aria-label="To" data-testid="sl2-to" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
    <span data-testid="sl2-output">{span.join(",")}</span>
    <Slider.Root id="sl3" defaultValue={30} orientation="vertical" disabled data-testid="sl3">
      <Slider.Control class="slider" data-testid="sl3-control">
        <Slider.Track class="slider-track">
          <Slider.Indicator class="fill" data-testid="sl3-fill" />
          <Slider.Thumb class="thumb" aria-label="Level" data-testid="sl3-thumb" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
    <Slider.Root id="sl5" defaultValue={[20, 50, 80]} data-testid="sl5">
      <Slider.Control class="slider" data-testid="sl5-control">
        <Slider.Track class="slider-track">
          {#if low}<Slider.Thumb class="thumb" aria-label="Low" data-testid="sl5-low" />{/if}
          <Slider.Thumb class="thumb" aria-label="Middle" data-testid="sl5-middle" />
          <Slider.Thumb class="thumb" aria-label="High" data-testid="sl5-high" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
    <button data-testid="sl5-toggle" onclick={() => (low = !low)}>Low</button>
  </section>
  <section data-fixture="measures">
      <Slider.Root id="sl4" defaultValue={0} thumbAlignment="edge" data-testid="sl4">
        <Slider.Control class="slider" data-testid="sl4-control">
          <Slider.Track class="slider-track">
            <Slider.Indicator class="fill" data-testid="sl4-fill" />
            <Slider.Thumb class="thumb thumb-inside" aria-label="Inside" data-testid="sl4-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Select.Root id="s3" defaultValue="Cherry">
        <Select.Trigger class="select-trigger" data-testid="s3-trigger">
          <Select.Value data-testid="s3-value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner alignItemWithTrigger data-testid="s3-positioner">
            <Select.Popup class="popup" data-testid="s3-popup">
              {#each FRUITS as each (each)}
                  <Select.Item value={each} class="item" data-testid={`s3-${each}`}>
                    <Select.ItemText data-testid={`s3-${each}-text`}>{each}</Select.ItemText>
                  </Select.Item>
              {/each}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
  </section>
  <section data-fixture="entry">
      <NumberField.Root
        id="nf1"
        name="qty"
        defaultValue={5}
        min={0}
        max={10}
        class="number-field"
        data-testid="nf1"
        onValueChange={(next: number | null) => (qty = String(next))}
      >
        <NumberField.ScrubArea class="scrub" data-testid="nf1-scrub">
          <span>Quantity</span>
          <NumberField.ScrubAreaCursor class="scrub-cursor" />
        </NumberField.ScrubArea>
        <NumberField.Group class="number-group" data-testid="nf1-group">
          <NumberField.Decrement data-testid="nf1-down">-</NumberField.Decrement>
          <NumberField.Input aria-label="Quantity" data-testid="nf1-input" />
          <NumberField.Increment data-testid="nf1-up">+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
      <output data-testid="nf1-output">{qty}</output>
      <Autocomplete.Root id="ac1" name="place" onValueChange={(next: string) => (place = next)}>
        <Autocomplete.Input aria-label="Place" data-testid="ac1-input" />
        <Autocomplete.Portal>
          <Autocomplete.Positioner sideOffset={4} data-testid="ac1-positioner">
            <Autocomplete.Popup class="popup" aria-label="Places" data-testid="ac1-popup">
              {#each PLACES as each (each)}
                  <Autocomplete.Item
                    value={each}
                    id={`ac1-${each}`}
                    class="item"
                    data-testid={`ac1-${each}`}
                  >
                    {each}
                  </Autocomplete.Item>
              {/each}
              <Autocomplete.Empty data-testid="ac1-empty">No place</Autocomplete.Empty>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
      <output data-testid="ac1-output">{place}</output>
      <Select.Root id="s4" defaultValue="Row 1">
        <Select.Trigger data-testid="s4-trigger">
          <Select.Value data-testid="s4-value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={4} data-testid="s4-positioner">
            <Select.Popup class="popup arrowed" data-testid="s4-popup">
              <Select.ScrollUpArrow class="scroll-arrow" data-testid="s4-up" />
              <Select.List class="arrowed-list" data-testid="s4-list">
                {#each LINES as each (each)}
                    <Select.Item value={each} class="item" data-testid={`s4-${each}`}>
                      <Select.ItemText>{each}</Select.ItemText>
                    </Select.Item>
                {/each}
              </Select.List>
              <Select.ScrollDownArrow class="scroll-arrow" data-testid="s4-down" />
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
  </section>
  <section data-fixture="picking">
    <DatePicker.Root
      id="dk1"
      locale="en-US"
      name="due"
      defaultValue="2026-03-14"
      onValueChange={(next: string | null) => (due = String(next))}
    >
      <DatePicker.Field aria-label="Due" class="date-field" data-testid="dk1-field">
        <DatePicker.Segments>
            {#snippet children(segment)}
              <DatePicker.Segment {segment} data-testid={`dk1-${segment.type}-${segment.index}`} />
            {/snippet}
          </DatePicker.Segments>
        <DatePicker.Input />
      </DatePicker.Field>
      <DatePicker.Trigger aria-label="Pick a day" data-testid="dk1-trigger">
        Pick
      </DatePicker.Trigger>
      <DatePicker.Portal>
        <DatePicker.Positioner sideOffset={4} data-testid="dk1-positioner">
          <DatePicker.Popup class="popup" aria-label="Calendar" data-testid="dk1-popup">
            <DatePicker.Calendar class="calendar" data-testid="dk1-calendar">
              <DatePicker.Previous aria-label="Previous month" data-testid="dk1-previous">
                  Previous
                </DatePicker.Previous>
                <DatePicker.Heading data-testid="dk1-heading" />
                <DatePicker.Next aria-label="Next month" data-testid="dk1-next">Next</DatePicker.Next>
                <DatePicker.Grid data-testid="dk1-grid">
                  <thead>
                    <tr>
                      <DatePicker.Weekdays>
                        {#snippet children(weekday)}
                          <DatePicker.HeadCell {weekday}>{weekday.short}</DatePicker.HeadCell>
                        {/snippet}
                      </DatePicker.Weekdays>
                    </tr>
                  </thead>
                  <tbody>
                    <DatePicker.Weeks>
                      {#snippet children(week)}
                        <tr>
                          {#each week as day (day.date)}
                            <DatePicker.Cell date={day.date}>
                              <DatePicker.Day date={day.date} data-testid={`dk1-${day.date}`}>
                                {day.label}
                              </DatePicker.Day>
                            </DatePicker.Cell>
                          {/each}
                        </tr>
                      {/snippet}
                    </DatePicker.Weeks>
                  </tbody>
                </DatePicker.Grid>
            </DatePicker.Calendar>
          </DatePicker.Popup>
        </DatePicker.Positioner>
      </DatePicker.Portal>
    </DatePicker.Root>
    <output data-testid="dk1-output">{due}</output>
    <Pagination.Root
      id="pg1"
      count={200}
      class="pagination"
      data-testid="pg1"
      onPageChange={(next: number) => (paged = String(next))}
    >
      <Pagination.Previous data-testid="pg1-previous">Previous</Pagination.Previous>
      <Pagination.Items>
        {#snippet children(entry)}
          {#if entry.type === "page"}
            <Pagination.Item page={entry.page} data-testid={`pg1-${entry.page}`}>{entry.page}</Pagination.Item>
          {:else}
            <Pagination.Ellipsis data-testid={`pg1-${entry.key}`}>…</Pagination.Ellipsis>
          {/if}
        {/snippet}
      </Pagination.Items>
      <Pagination.Next data-testid="pg1-next">Next</Pagination.Next>
    </Pagination.Root>
    <output data-testid="pg1-output">{paged}</output>
    <Select.Root id="s5" defaultValue="Apple">
      <Select.Trigger data-testid="s5-trigger">
        <Select.Value data-testid="s5-value" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={4} data-testid="s5-positioner">
          <Select.Popup class="popup" data-testid="s5-popup">
            <Select.GroupLabel data-testid="s5-lone">Produce</Select.GroupLabel>
            <Select.Group id="s5-fruit" data-testid="s5-fruit">
              <Select.GroupLabel data-testid="s5-fruit-label">Fruit</Select.GroupLabel>
              <Select.Item value="Apple" class="item" data-testid="s5-Apple">
                <Select.ItemText>Apple</Select.ItemText>
              </Select.Item>
              <Select.Item value="Pear" class="item" data-testid="s5-Pear">
                <Select.ItemText>Pear</Select.ItemText>
              </Select.Item>
            </Select.Group>
            <Select.Separator data-testid="s5-separator" />
            <Select.Group id="s5-roots" data-testid="s5-roots">
              <Select.GroupLabel data-testid="s5-roots-label">Roots</Select.GroupLabel>
              <Select.Item value="Carrot" class="item" data-testid="s5-Carrot">
                <Select.ItemText>Carrot</Select.ItemText>
              </Select.Item>
            </Select.Group>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  </section>
  <section data-fixture="groups">
    <Autocomplete.Root id="ac2" defaultValue="Par">
      <Autocomplete.Input aria-label="City" data-testid="ac2-input" />
      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={4} data-testid="ac2-positioner">
          <Autocomplete.Popup class="popup" aria-label="Cities" data-testid="ac2-popup">
            <Autocomplete.GroupLabel data-testid="ac2-lone">Cities</Autocomplete.GroupLabel>
            <Autocomplete.Group id="ac2-north" data-testid="ac2-north">
              <Autocomplete.GroupLabel data-testid="ac2-north-label">North</Autocomplete.GroupLabel>
              <Autocomplete.Item value="Oslo" id="ac2-Oslo" class="item" data-testid="ac2-Oslo">
                Oslo
              </Autocomplete.Item>
            </Autocomplete.Group>
            <Autocomplete.Separator data-testid="ac2-separator" />
            <Autocomplete.Group id="ac2-west" data-testid="ac2-west">
              <Autocomplete.GroupLabel data-testid="ac2-west-label">West</Autocomplete.GroupLabel>
              <Autocomplete.Item value="Paris" id="ac2-Paris" class="item" data-testid="ac2-Paris">
                Paris
              </Autocomplete.Item>
            </Autocomplete.Group>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  </section>
  <section data-fixture="container">
    <div bind:this={box} data-testid="pc1-box"></div>
    <PortalProvider container={box}>
      <Popover.Root id="pc1">
        <Popover.Trigger data-testid="pc1-trigger">Open in the box</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={4} data-testid="pc1-positioner">
            <Popover.Popup class="popup" aria-label="In the box" data-testid="pc1-popup">
              Inside
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </PortalProvider>
  </section>
  <section data-fixture="field">
    <Form
      errors={rejected}
      onFormSubmit={(values: unknown) => (sent = JSON.stringify(values))}
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
            {#snippet children(validity)}
              <span data-testid="fd1-validity">{word(validity.valid)}</span>
            {/snippet}
          </Field.Validity>
        </Field.Root>
        <Field.Root id="fd2" name="user" validationMode="onBlur" validate={taken} data-testid="fd2">
          <Field.Label>User</Field.Label>
          <Field.Control data-testid="fd2-control" />
          <Field.Error data-testid="fd2-error" />
        </Field.Root>
      </Fieldset.Root>
      <button type="submit" data-testid="f1-submit">Send</button>
    </Form>
    <button data-testid="f1-reject" onclick={() => (rejected = { user: "Reserved" })}>Reject</button>
    <span data-testid="f1-sent">{sent}</span>
  </section>
  <section data-fixture="field-controls">
    <Form onFormSubmit={(values: unknown) => (sent2 = JSON.stringify(values))} data-testid="f2">
      <Field.Root id="fc1" name="terms" data-testid="fc1">
        <Checkbox.Root required class="box" data-testid="fc1-box">
          <Checkbox.Indicator class="mark">✓</Checkbox.Indicator>
        </Checkbox.Root>
        <Field.Label data-testid="fc1-label">Accept</Field.Label>
        <Field.Error data-testid="fc1-error" />
      </Field.Root>
      <Field.Root id="fc2" name="plan" data-testid="fc2">
        <Field.Label data-testid="fc2-label">Plan</Field.Label>
        <RadioGroup.Root required data-testid="fc2-group">
          <RadioGroup.Item value="free" class="radio" data-testid="fc2-free" />
          <RadioGroup.Item value="pro" class="radio" data-testid="fc2-pro" />
        </RadioGroup.Root>
        <Field.Error data-testid="fc2-error" />
      </Field.Root>
      <Field.Root id="fc3" name="level" disabled data-testid="fc3">
        <Field.Label>Level</Field.Label>
        <Slider.Root defaultValue={10} data-testid="fc3-slider">
          <Slider.Control class="slider">
            <Slider.Track class="slider-track">
              <Slider.Thumb class="thumb" data-testid="fc3-thumb" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </Field.Root>
      <Field.Root id="fc4" name="alerts" data-testid="fc4">
        <Field.Label data-testid="fc4-label">Alerts</Field.Label>
        <Switch.Root class="switch" data-testid="fc4-switch">
          <Switch.Thumb class="thumb" />
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
              <Select.Popup class="popup" data-testid="fc5-popup">
                <Select.Item value="Apple" class="item" data-testid="fc5-Apple">
                  <Select.ItemText>Apple</Select.ItemText>
                </Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <Field.Error data-testid="fc5-error" />
      </Field.Root>
      <button type="submit" data-testid="f2-submit">Send</button>
    </Form>
    <span data-testid="f2-sent">{sent2}</span>
  </section>
  <section data-fixture="checkbox-group">
    <form data-testid="cg1-form">
      <CheckboxGroup id="cg1" bind:value={toppings} allValues={TOPPINGS} class="bar" data-testid="cg1">
        <Checkbox.Root parent id="cg1-all-input" class="box" aria-label="All" data-testid="cg1-all">
          <Checkbox.Indicator class="mark">✓</Checkbox.Indicator>
        </Checkbox.Root>
        {#each TOPPINGS as each (each)}
          <Checkbox.Root
            id={`cg1-${each}-input`}
            name="topping"
            value={each}
            class="box"
            aria-label={each}
            data-testid={`cg1-${each}`}
          >
            <Checkbox.Indicator class="mark">✓</Checkbox.Indicator>
          </Checkbox.Root>
        {/each}
      </CheckboxGroup>
      <button type="reset" data-testid="cg1-reset">Reset</button>
    </form>
    <output data-testid="cg1-output">{toppings.join(",")}</output>
    <Field.Root id="cg2" name="extras" data-testid="cg2">
      <Field.Label data-testid="cg2-label">Extras</Field.Label>
      <CheckboxGroup defaultValue={["napkins"]} class="bar" data-testid="cg2-group">
        {#each EXTRAS as each (each)}
          <Checkbox.Root
            id={`cg2-${each}-input`}
            value={each}
            class="box"
            aria-label={each}
            data-testid={`cg2-${each}`}
          >
            <Checkbox.Indicator class="mark">✓</Checkbox.Indicator>
          </Checkbox.Root>
        {/each}
      </CheckboxGroup>
    </Field.Root>
  </section>
  <section data-fixture="read-only">
    <Slider.Root id="ro1" defaultValue={40} readOnly data-testid="ro1">
      <Slider.Control class="slider" data-testid="ro1-control">
        <Slider.Track class="slider-track">
          <Slider.Indicator class="fill" />
          <Slider.Thumb class="thumb" aria-label="Level" data-testid="ro1-thumb" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
    <Select.Root id="ro2" defaultValue="Banana" readOnly>
      <Select.Trigger data-testid="ro2-trigger">
        <Select.Value data-testid="ro2-value" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={4}>
          <Select.Popup class="popup" data-testid="ro2-popup">
            {#each LOCKED as each (each)}
              <Select.Item value={each} class="item" data-testid={`ro2-${each}`}>
                <Select.ItemText>{each}</Select.ItemText>
              </Select.Item>
            {/each}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  </section>
  <section data-fixture="direction">
    <button
      type="button"
      data-testid="dir-turn"
      onclick={() => (reading = reading === "rtl" ? "ltr" : "rtl")}
    >
      Turn
    </button>
    <div dir={reading} data-testid="dir-box">
      <DirectionProvider direction={reading}>
        <Tabs.Root id="dt1" defaultValue="one" data-testid="dt1">
          <Tabs.List class="tabs" data-testid="dt1-list">
            <Tabs.Tab value="one" data-testid="dt1-one">One</Tabs.Tab>
            <Tabs.Tab value="two" data-testid="dt1-two">Two</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="one">First</Tabs.Panel>
          <Tabs.Panel value="two">Second</Tabs.Panel>
        </Tabs.Root>
        <Slider.Root id="ds1" defaultValue={40} data-testid="ds1">
          <Slider.Control class="slider" data-testid="ds1-control">
            <Slider.Track class="slider-track">
              <Slider.Indicator class="fill" />
              <Slider.Thumb class="thumb" aria-label="Volume" data-testid="ds1-thumb" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <Popover.Root id="dp1">
          <Popover.Trigger data-testid="dp1-trigger">Open popover</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8} align="start" data-testid="dp1-positioner">
              <Popover.Popup class="popup" data-testid="dp1-popup">
                <Popover.Title>Notifications</Popover.Title>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </DirectionProvider>
    </div>
  </section>

  <section data-fixture="placing">
    <div dir="rtl" data-testid="pl1-box">
      <Popover.Root id="pl1">
        <Popover.Trigger data-testid="pl1-trigger">Beside</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="inline-end" sideOffset={8} data-testid="pl1-positioner">
            <Popover.Popup class="popup" data-testid="pl1-popup">
              <Popover.Title>Beside</Popover.Title>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
    <div class="bar">
      <Popover.Root id="pl2">
        <Popover.Trigger data-testid="pl2-trigger">Anchored</Popover.Trigger>
        <span bind:this={firstAnchor} id="pl2-first" class="anchor" data-testid="pl2-first">First</span>
        <span bind:this={secondAnchor} id="pl2-second" class="anchor" data-testid="pl2-second">Second</span>
        <Popover.Portal>
          <Popover.Positioner
            anchor={moved ? secondAnchor : firstAnchor}
            align="start"
            sideOffset={4}
            data-testid="pl2-positioner"
          >
            <Popover.Popup class="popup" data-testid="pl2-popup">
              <Popover.Title>Anchored</Popover.Title>
              <button type="button" data-testid="pl2-move" onclick={() => (moved = !moved)}>Move</button>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
    <div class="bar">
      <Combobox.Root id="pl3" bind:value={sought}>
        <Combobox.Trigger data-testid="pl3-trigger">Pick a fruit</Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4} data-testid="pl3-positioner">
            <Combobox.Popup class="popup" aria-label="Pick a fruit" data-testid="pl3-popup">
              <Combobox.Input class="search" aria-label="Search fruits" data-testid="pl3-input" />
              <Combobox.List aria-label="Fruits" data-testid="pl3-list">
                {#each FRUITS as each (each)}
                  <Combobox.Item value={each} id={`pl3-${each}`} class="item" data-testid={`pl3-${each}`}>{each}</Combobox.Item>
                {/each}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      <output data-testid="pl3-output">{sought ?? "none"}</output>
    </div>
  </section>
  <section data-fixture="popover-more">
    <div class="bar">
      <Popover.Root id="pm1" modal>
        <Popover.Trigger data-testid="pm1-trigger">Modal popover</Popover.Trigger>
        <Popover.Portal>
          <Popover.Backdrop class="backdrop" data-testid="pm1-backdrop" />
          <Popover.Positioner sideOffset={8} arrowPadding={8} sticky data-testid="pm1-positioner">
            <Popover.Popup class="popup pointed" data-testid="pm1-popup">
              <Popover.Arrow class="arrow" data-testid="pm1-arrow" />
              <Popover.Title>Modal</Popover.Title>
              <button type="button" data-testid="pm1-first">First</button>
              <Popover.Close data-testid="pm1-close">Close</Popover.Close>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <Popover.Root id="pm2" modal="trap-focus">
        <Popover.Trigger openOnHover delay={50} data-testid="pm2-trigger">Hover popover</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8} data-testid="pm2-positioner">
            <Popover.Popup class="popup" data-testid="pm2-popup">
              <Popover.Title>Hovered</Popover.Title>
              <button type="button" data-testid="pm2-first">First</button>
              <Popover.Close data-testid="pm2-close">Close</Popover.Close>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <Popover.Root id="pm3">
        <Popover.Trigger data-testid="pm3-trigger">Placed popover</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            side="top"
            align="start"
            positionMethod="fixed"
            sideOffset={anchorHigh}
            collisionPadding={{ left: 12, right: 12 }}
            collisionAvoidance={{ side: "none" }}
            data-testid="pm3-positioner"
          >
            <Popover.Popup class="popup" aria-label="Placed" data-testid="pm3-popup">Placed</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  </section>
  <section data-fixture="combobox-data">
    <div class="bar">
      <Combobox.Root id="cd1" items={PANTRY} autoHighlight onInputValueChange={(text) => (looked = text)}>
        <Combobox.Trigger data-testid="cd1-trigger">
          <span data-testid="cd1-value"><Combobox.Value placeholder="Pick one" /></span>
        </Combobox.Trigger>
        <Combobox.Status data-testid="cd1-status">{pantryLeft(looked)}</Combobox.Status>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4} data-testid="cd1-positioner">
            <Combobox.Popup class="popup" aria-label="Pantry" data-testid="cd1-popup">
              <Combobox.Input class="search" aria-label="Search the pantry" data-testid="cd1-input" />
              <Combobox.List aria-label="Pantry" data-testid="cd1-list">
                <Combobox.Collection>
                  {#snippet children(group)}
                    <Combobox.Group id={`cd1-g-${group.value}`} data-testid={`cd1-g-${group.value}`}>
                      <Combobox.GroupLabel>{group.label}</Combobox.GroupLabel>
                      <Combobox.Collection of={group}>
                        {#snippet children(item)}
                          <Combobox.Item value={item.value} id={`cd1-${item.value}`} disabled={item.disabled} class="item" data-testid={`cd1-${item.value}`}>{item.label}</Combobox.Item>
                        {/snippet}
                      </Combobox.Collection>
                    </Combobox.Group>
                  {/snippet}
                </Combobox.Collection>
              </Combobox.List>
              <Combobox.Empty data-testid="cd1-empty">Nothing in the pantry</Combobox.Empty>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
    <div class="bar">
      <Combobox.Root id="cd2" name="berry" items={BERRIES} defaultValue="cherry" readOnly={sealed} autoHighlight>
        <Combobox.Input aria-label="Berry" data-testid="cd2-input" />
        <Combobox.Clear aria-label="Clear the berry" data-testid="cd2-clear">×</Combobox.Clear>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4} data-testid="cd2-positioner">
            <Combobox.Popup class="popup" aria-label="Berries" data-testid="cd2-popup">
              <Combobox.Collection>
                {#snippet children(item)}
                  <Combobox.Item value={item.value} id={`cd2-${item.value}`} class="item" data-testid={`cd2-${item.value}`}>{item.label}</Combobox.Item>
                {/snippet}
              </Combobox.Collection>
              <Combobox.Empty data-testid="cd2-empty">No berry</Combobox.Empty>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      <button type="button" data-testid="cd2-unlock" onclick={() => (sealed = false)}>Unlock</button>
    </div>
  </section>
  <section data-fixture="editing">
    <form class="editing" data-testid="ef1-form">
      <div class="item">
        <Rating.Root
          id="rt1"
          name="stars"
          defaultValue={2}
          allowHalf
          aria-label="Stars"
          class="rating"
          data-testid="rt1"
          onValueChange={(next: number) => (stars = String(next))}
        >
          <Rating.Items>
            {#snippet children(star)}
              <Rating.Item place={star} class="star" data-testid={`rt1-${star}`}>★</Rating.Item>
            {/snippet}
          </Rating.Items>
        </Rating.Root>
        <output form="" data-testid="rt1-output">{stars}</output>
      </div>
      <Steps.Root id="st1" count={3} linear class="steps" data-testid="st1" onStepChange={(next: number) => (stepped = String(next))}>
        <Steps.List class="item" aria-label="Sign up" data-testid="st1-list">
          {#each STEPS as each, index (each)}
            <Steps.Item {index} class="item" data-testid={`st1-item-${index}`}>
              <Steps.Trigger data-testid={`st1-trigger-${index}`}><Steps.Indicator class="step-mark" data-testid={`st1-indicator-${index}`}>{index + 1}</Steps.Indicator>{each}</Steps.Trigger>
              <Steps.Separator class="step-line" data-testid={`st1-separator-${index}`} />
            </Steps.Item>
          {/each}
        </Steps.List>
        {#each STEPS as each, index (each)}
          <Steps.Content {index} data-testid={`st1-content-${index}`}>{each} details</Steps.Content>
        {/each}
        <Steps.Completed data-testid="st1-completed">All done</Steps.Completed>
        <div class="item">
          <Steps.Previous data-testid="st1-previous">Back</Steps.Previous>
          <Steps.Next data-testid="st1-next">Next</Steps.Next>
          <output form="" data-testid="st1-output">{stepped}</output>
        </div>
      </Steps.Root>
      <Editable.Root
        id="ed1"
        name="title"
        defaultValue="Apollo"
        placeholder="Untitled"
        class="item"
        data-testid="ed1"
        onValueChange={(next: string) => (titled = next)}
      >
        <Editable.Preview class="editable-preview" data-testid="ed1-preview" />
        <Editable.Input aria-label="Title" data-testid="ed1-input" />
        <Editable.EditTrigger data-testid="ed1-edit">Edit</Editable.EditTrigger>
        <Editable.SubmitTrigger data-testid="ed1-submit">Save</Editable.SubmitTrigger>
        <Editable.CancelTrigger data-testid="ed1-cancel">Cancel</Editable.CancelTrigger>
        <output form="" data-testid="ed1-output">{titled}</output>
      </Editable.Root>
      <PasswordInput.Root class="item" data-testid="pw1" onVisibleChange={(next: boolean) => (revealed = String(next))}>
        <PasswordInput.Input
          id="pw1-input"
          name="secret"
          aria-label="Password"
          autocomplete="current-password"
          data-testid="pw1-input"
        />
        <PasswordInput.Toggle data-testid="pw1-toggle">
          <PasswordInput.Indicator class="eye" data-testid="pw1-indicator" />
        </PasswordInput.Toggle>
        <output form="" data-testid="pw1-output">{revealed}</output>
      </PasswordInput.Root>
      <button type="reset" data-testid="ef1-reset">Reset</button>
    </form>
  </section>
  <section data-fixture="tagging">
    <form class="editing" data-testid="tf1-form">
      <TagsInput.Root
        id="ti1"
        name="colors"
        defaultValue={["red", "green"]}
        max={4}
        class="tags"
        data-testid="ti1"
        onValueChange={(next: string[]) => (tagged = next.join(","))}
        onValueInvalid={(text: string, reason: string) => (refused = `${text}:${reason}`)}
      >
        <TagsInput.List class="item" aria-label="Colors" data-testid="ti1-list">
          <TagsInput.Items>
            {#snippet children(entry)}
              <TagsInput.Item {entry} class="tag" data-testid={`ti1-item-${entry.value}`}>
                <TagsInput.ItemText data-testid={`ti1-text-${entry.value}`} />
                <TagsInput.ItemInput data-testid={`ti1-edit-${entry.value}`} />
                <TagsInput.ItemRemove data-testid={`ti1-remove-${entry.value}`}>×</TagsInput.ItemRemove>
              </TagsInput.Item>
            {/snippet}
          </TagsInput.Items>
        </TagsInput.List>
        <TagsInput.Input aria-label="Add a color" data-testid="ti1-input" />
        <TagsInput.Clear data-testid="ti1-clear">Clear</TagsInput.Clear>
        <output form="" data-testid="ti1-output">{tagged}</output>
        <output form="" data-testid="ti1-refused">{refused}</output>
      </TagsInput.Root>
      <FileUpload.Root
        id="fu1"
        name="docs"
        multiple
        accept=".txt"
        maxFiles={2}
        class="upload"
        data-testid="fu1"
        onFilesChange={(next: File[]) => (uploaded = next.map((each) => each.name).join(","))}
        onFilesReject={(next: FileRejection[]) =>
          (turnedAway = next.map((each) => `${each.file.name}:${each.reasons.join("+")}`).join(","))}
      >
        <FileUpload.Dropzone class="dropzone" aria-label="Documents" data-testid="fu1-dropzone">
          <FileUpload.Trigger data-testid="fu1-trigger">Browse</FileUpload.Trigger>
        </FileUpload.Dropzone>
        <FileUpload.List class="files" data-testid="fu1-list">
          <FileUpload.Items>
            {#snippet children(entry)}
              <FileUpload.Item {entry} class="item" data-testid={`fu1-item-${entry.file.name}`}>
                <FileUpload.ItemName data-testid={`fu1-name-${entry.file.name}`} />
                <FileUpload.ItemSize locale="en" data-testid={`fu1-size-${entry.file.name}`} />
                <FileUpload.ItemRemove data-testid={`fu1-remove-${entry.file.name}`}>×</FileUpload.ItemRemove>
              </FileUpload.Item>
            {/snippet}
          </FileUpload.Items>
        </FileUpload.List>
        <FileUpload.Clear data-testid="fu1-clear">Clear</FileUpload.Clear>
        <output form="" data-testid="fu1-output">{uploaded}</output>
        <output form="" data-testid="fu1-rejected">{turnedAway}</output>
      </FileUpload.Root>
      <div class="item">
        <TimeField.Root
          id="tm1"
          name="at"
          locale="en-US"
          defaultValue="09:30"
          aria-label="Time"
          class="date-field"
          data-testid="tm1"
          onValueChange={(next: string | null) => (timed = String(next))}
        >
          <TimeField.Segments>
            {#snippet children(segment)}
              <TimeField.Segment {segment} data-testid={`tm1-${segment.type}-${segment.index}`} />
            {/snippet}
          </TimeField.Segments>
          <TimeField.Input />
        </TimeField.Root>
        <output form="" data-testid="tm1-output">{timed}</output>
      </div>
      <button type="reset" data-testid="tf1-reset">Reset</button>
    </form>
  </section>
  <section data-fixture="exploring">
    <div class="item">
      <Tree.Root
        id="tr1"
        aria-label="Files"
        defaultExpandedValue={["docs"]}
        defaultSelectedValue={["letter"]}
        class="tree"
        data-testid="tr1"
        onExpandedChange={(next: unknown[]) => (opened = next.join(","))}
        onSelectedChange={(next: unknown[]) => (picks = next.join(","))}
      >
        <Tree.Item value="docs" branch data-testid="tr1-docs">
          <Tree.ItemRow class="tree-row" data-testid="tr1-docs-row">
            <Tree.ItemIndicator class="tree-mark" data-testid="tr1-docs-mark">›</Tree.ItemIndicator>
            <Tree.ItemText data-testid="tr1-docs-text">Documents</Tree.ItemText>
          </Tree.ItemRow>
          <Tree.Group class="tree-group" data-testid="tr1-docs-group">
            <Tree.Item value="work" branch data-testid="tr1-work">
              <Tree.ItemRow class="tree-row">
                <Tree.ItemIndicator class="tree-mark" data-testid="tr1-work-mark">›</Tree.ItemIndicator>
                <Tree.ItemText>Work</Tree.ItemText>
              </Tree.ItemRow>
              <Tree.Group class="tree-group" data-testid="tr1-work-group">
                <Tree.Item value="report" data-testid="tr1-report">
                  <Tree.ItemRow class="tree-row">
                    <Tree.ItemText>Report</Tree.ItemText>
                  </Tree.ItemRow>
                </Tree.Item>
                <Tree.Item value="budget" data-testid="tr1-budget">
                  <Tree.ItemRow class="tree-row">
                    <Tree.ItemText>Budget</Tree.ItemText>
                  </Tree.ItemRow>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
            <Tree.Item value="letter" data-testid="tr1-letter">
              <Tree.ItemRow class="tree-row">
                <Tree.ItemText>Letter</Tree.ItemText>
              </Tree.ItemRow>
            </Tree.Item>
            <Tree.Item value="old" disabled data-testid="tr1-old">
              <Tree.ItemRow class="tree-row">
                <Tree.ItemText>Old letter</Tree.ItemText>
              </Tree.ItemRow>
            </Tree.Item>
          </Tree.Group>
        </Tree.Item>
        <Tree.Item value="music" branch data-testid="tr1-music">
          <Tree.ItemRow class="tree-row">
            <Tree.ItemIndicator class="tree-mark" data-testid="tr1-music-mark">›</Tree.ItemIndicator>
            <Tree.ItemText>Music</Tree.ItemText>
          </Tree.ItemRow>
          <Tree.Group class="tree-group" data-testid="tr1-music-group">
            <Tree.Item value="song" data-testid="tr1-song">
              <Tree.ItemRow class="tree-row">
                <Tree.ItemText>Song</Tree.ItemText>
              </Tree.ItemRow>
            </Tree.Item>
          </Tree.Group>
        </Tree.Item>
        <Tree.Item value="notes" data-testid="tr1-notes">
          <Tree.ItemRow class="tree-row">
            <Tree.ItemText>Notes</Tree.ItemText>
          </Tree.ItemRow>
        </Tree.Item>
      </Tree.Root>
      <output form="" data-testid="tr1-expanded">{opened}</output>
      <output form="" data-testid="tr1-selected">{picks}</output>
    </div>
    <form class="editing" data-testid="pk1-form">
      <ColorPicker.Root
        id="pk1"
        name="color"
        defaultValue="#ff0000"
        alpha
        class="color-picker"
        data-testid="pk1"
        onValueChange={(next: string) => (hue = next)}
        onValueCommitted={(next: string) => (kept = next)}
        onFormatChange={(next: string) => (written = next)}
      >
        <ColorPicker.Area class="color-area" data-testid="pk1-area">
          <ColorPicker.AreaThumb class="color-thumb" aria-label="Colour" data-testid="pk1-area-thumb" />
        </ColorPicker.Area>
        <ColorPicker.ChannelSlider channel="hue" class="slider" data-testid="pk1-hue">
          <ColorPicker.ChannelSliderTrack class="slider-track" data-testid="pk1-hue-track">
            <ColorPicker.ChannelSliderThumb class="thumb" aria-label="Hue" data-testid="pk1-hue-thumb" />
          </ColorPicker.ChannelSliderTrack>
        </ColorPicker.ChannelSlider>
        <ColorPicker.ChannelSlider channel="alpha" class="slider" data-testid="pk1-alpha">
          <ColorPicker.ChannelSliderTrack class="slider-track" data-testid="pk1-alpha-track">
            <ColorPicker.ChannelSliderThumb class="thumb" aria-label="Alpha" data-testid="pk1-alpha-thumb" />
          </ColorPicker.ChannelSliderTrack>
        </ColorPicker.ChannelSlider>
        <div class="item">
          <ColorPicker.Swatch class="swatch" data-testid="pk1-swatch" />
          <ColorPicker.ChannelInput channel="hex" aria-label="Hex" data-testid="pk1-hex" />
          <ColorPicker.SwatchTrigger value="#0000ff" aria-label="Blue" class="swatch" data-testid="pk1-blue" />
          <ColorPicker.SwatchTrigger
            value="#00800080"
            aria-label="Green"
            class="swatch"
            data-testid="pk1-green"
          />
        </div>
        <div class="item">
          <ColorPicker.ValueText data-testid="pk1-text" />
          <ColorPicker.FormatTrigger data-testid="pk1-format" />
        </div>
      </ColorPicker.Root>
      <div class="item">
        <output form="" data-testid="pk1-output">{hue}</output>
        <output form="" data-testid="pk1-committed">{kept}</output>
        <output form="" data-testid="pk1-written">{written}</output>
      </div>
      <button type="reset" data-testid="pk1-reset">Reset</button>
    </form>
    <div class="item">
      <button type="button" data-testid="tu1-open" onclick={() => (touring = true)}>Tour</button>
      <output form="" data-testid="tu1-output">{String(touring)}</output>
      <output form="" data-testid="tu1-step">{toured}</output>
    </div>
    <Tour.Root
      id="tu1"
      steps={TOUR}
      open={touring}
      onOpenChange={(next: boolean) => (touring = next)}
      onStepChange={(next: number) => (toured = String(next))}
    >
      <Tour.Portal>
        <Tour.Spotlight class="spotlight" data-testid="tu1-spotlight" />
        <Tour.Positioner sideOffset={8} data-testid="tu1-positioner">
          <Tour.Popup class="tour-popup" data-testid="tu1-popup">
            {#snippet children({ step, current, total }: Tour.TourShownStep<PageStep>)}
              <Tour.Arrow class="arrow" data-testid="tu1-arrow" />
              <Tour.Title class="tour-title" data-testid="tu1-title">{step?.title}</Tour.Title>
              <Tour.Description data-testid="tu1-description">{step?.body}</Tour.Description>
              <div class="item">
                <span data-testid="tu1-count">{current} of {total}</span>
                <Tour.Previous data-testid="tu1-previous">Back</Tour.Previous>
                <Tour.Next data-testid="tu1-next">{current === total ? "Done" : "Next"}</Tour.Next>
                <Tour.Close data-testid="tu1-close">Skip</Tour.Close>
              </div>
            {/snippet}
          </Tour.Popup>
        </Tour.Positioner>
      </Tour.Portal>
    </Tour.Root>
  </section>
</main>
