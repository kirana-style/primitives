<script setup lang="ts">
import type { DateRange, OffsetFunction, PartEvent } from "@kirana-ui/vue"
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
} from "@kirana-ui/vue"
import { Primitive } from "@kirana-ui/vue/primitive"
import { ref } from "vue"

// The page every adapter draws, element for element: the conformance run walks it and compares
// the DOM of each state across adapters. Change it in every fixture at once.
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
const WIDE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='40'%3E%3C/svg%3E"
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
const controlled = ref(false)
const alerts = ref(false)
const toppings = ref<string[]>(["ham"])
const count = ref(0)
const done = ref(40)
const tipKept = ref(true)
const pictures = ref(false)
const heard = ref("none")
const sent = ref("")
const sent2 = ref("")
const reading = ref<"ltr" | "rtl">("rtl")
const rejected = ref<Record<string, string> | undefined>(undefined)
const span = ref<number[]>([20, 80])
const low = ref(true)
const moved = ref(false)
const sought = ref<string | null>(null)
const looked = ref("")
const sealed = ref(true)
const firstAnchor = ref<HTMLElement | null>(null)
const secondAnchor = ref<HTMLElement | null>(null)
const fruit = ref<string | null>("Banana")
const basket = ref<string[]>(["Banana"])
const action = ref("none")
const picked = ref("none")
const code = ref("none")
const shares = ref("25,75")
const slide = ref("0")
const toastAction = ref("")
const drawn = ref("closed")
const born = ref("none")
const box = ref<HTMLElement | null>(null)
const due = ref("2026-03-14")
const paged = ref("1")
const qty = ref("5")
const place = ref("")
const named = ref("")
const did = ref("none")
const dated = ref("none")
const stay = ref("none")
// The two calendars' values, held by their caller: what it gives back must keep the days.
const pickedDay = ref<string | null>(null)
const pickedRange = ref<DateRange | null>(null)
const chosenDays = ref("none")
const shownMonth = ref("2026-03-01")
const rests = ref("0.5")
const said = ref(8)
// Bound, not written in the template: the type checker trips on `//` in a plain attribute.
const LINK = "https://kirana.style"
// A page's toasts are made once: a long time, so a test reads them.
const toaster = createToaster({ duration: 600_000 })
const first = ref(0)
const ran = ref<unknown>("none")
const tags = ref<string[]>(["New"])
const scrolled = (event: Event) => {
  first.value = firstRow((event.currentTarget as HTMLElement).scrollTop)
}
const align = ref<string[]>(["left"])
const tall = ref(false)
const rowLoaded = ref(false)
const chosen = ref<string[]>(["Banana"])
const pick = ref<string | null>(null)
const outside = ref(0)
const view = ref<unknown>("list")
const presses = ref(0)
const locked = ref(false)
const handed = ref(0)
const asked = ref(0)
const marks = ref(0)
const marked = ref(false)
const tipOff = ref(false)
// On the caller's own element, whose listener Vue types as any button's.
function ask(event: Event & { preventKiranaHandler?: () => void }) {
  asked.value += 1
  if (locked.value) event.preventKiranaHandler?.()
}

function press(event: PartEvent<MouseEvent>) {
  presses.value += 1
  if (locked.value) event.preventKiranaHandler()
}
</script>

<template>
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
      <button data-testid="c3-outside" @click="controlled = !controlled">
        Toggle from outside
      </button>
      <Collapsible.Root id="c3" v-model:open="controlled">
        <Collapsible.Trigger data-testid="c3-trigger">Controlled</Collapsible.Trigger>
        <Collapsible.Panel class="panel" data-testid="c3-panel" keep-mounted>
          <p>Kept in the page</p>
        </Collapsible.Panel>
      </Collapsible.Root>
      <Collapsible.Root id="c4" default-open disabled>
        <Collapsible.Trigger data-testid="c4-trigger">Disabled, open</Collapsible.Trigger>
        <Collapsible.Panel class="panel" data-testid="c4-panel">
          <p>Open from the start</p>
        </Collapsible.Panel>
      </Collapsible.Root>
    </section>

    <section data-fixture="composition">
      <label>
        <input v-model="locked" type="checkbox" data-testid="k1-lock" />
        Lock
      </label>
      <Collapsible.Root id="k1">
        <Collapsible.Trigger
          as-child
          class="mine"
          type="submit"
          aria-expanded="true"
          @click="press"
        >
          <button data-testid="k1-trigger">Composed {{ presses }}</button>
        </Collapsible.Trigger>
        <Collapsible.Panel
          class="panel"
          data-testid="k1-panel"
          :style="{ color: presses % 2 ? 'red' : 'blue' }"
        >
          <p>Composed content</p>
        </Collapsible.Panel>
      </Collapsible.Root>
      <Collapsible.Root id="k2">
        <Collapsible.Trigger as-child class="handed" title="handed" lang="en" @click="handed += 1">
          <button class="asked" title="asked" data-testid="k2-trigger" @click="ask">
            Layered {{ handed }}/{{ asked }}
          </button>
        </Collapsible.Trigger>
        <Collapsible.Trigger v-slot="{ state }" data-testid="k2-state">
          {{ state.panelOpen ? "Open" : "Closed" }}
        </Collapsible.Trigger>
        <Collapsible.Panel class="panel" data-testid="k2-panel">
          <p>Layered content</p>
        </Collapsible.Panel>
      </Collapsible.Root>
      <div class="item">
        <Primitive as-child class="tag" title="handed">
          <a class="asked" href="#k2" data-testid="k3-tag">Tag</a>
        </Primitive>
        <Primitive as="span" class="tag" data-testid="k3-plain">Plain</Primitive>
      </div>
      <div class="item">
        <Primitive
          as="button"
          as-child
          class="mark"
          type="button"
          :data-active="marked ? '' : undefined"
          @click="marked = !marked"
        >
          <button class="mine" data-testid="k4-mark" @click="marks += 1">
            {{ marked ? "On" : "Off" }} {{ marks }}
          </button>
        </Primitive>
      </div>
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
        <input v-model="tipOff" type="checkbox" data-testid="ds2-off" />
        Off
      </label>
      <Tooltip.Root id="ds2" :delay="0" :disabled="tipOff">
        <Tooltip.Trigger data-testid="ds2-trigger">Quick</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner :side-offset="8">
            <Tooltip.Popup class="tip" data-testid="ds2-popup">At once</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <div class="item">
        <Otp.Root id="ds3a" :length="2" mode="text">
          <Otp.Input aria-label="Text code" data-testid="ds3a-input" />
        </Otp.Root>
        <Otp.Root id="ds3b" :length="2" mode="numeric">
          <Otp.Input aria-label="Number code" data-testid="ds3b-input" />
        </Otp.Root>
      </div>
      <div class="item">
        <Otp.Root id="ds3c" :length="2" mode="numeric" value="42">
          <Otp.Input aria-label="Given code" data-testid="ds3c-input" />
        </Otp.Root>
        <Otp.Root id="ds3d" :length="2" mode="text">
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
        <Checkbox.Root id="x2" default-checked disabled class="box" data-testid="x2">
          <Checkbox.Indicator class="mark">✓</Checkbox.Indicator>
        </Checkbox.Root>
        <Checkbox.Root id="x3" indeterminate class="box" data-testid="x3">
          <Checkbox.Indicator class="mark">–</Checkbox.Indicator>
        </Checkbox.Root>
        <Switch.Root id="w1" v-model:checked="alerts" name="alerts" class="switch" data-testid="w1">
          <Switch.Thumb class="thumb" />
        </Switch.Root>
        <label for="w1" data-testid="w1-label">Alerts</label>
        <RadioGroup.Root id="r1" name="plan" default-value="pro" data-testid="r1">
          <label v-for="each in PLANS" :key="each">
            <RadioGroup.Item
              :value="each"
              :disabled="each === 'team'"
              class="radio"
              :data-testid="`r1-${each}`"
              :id="`r1-${each}-radio`"
            >
              <RadioGroup.Indicator class="dot" />
            </RadioGroup.Item>
            {{ each }}
          </label>
        </RadioGroup.Root>
        <label for="r1-free-radio" data-testid="r1-label">Free plan</label>
        <button type="reset" data-testid="f1-reset">Reset</button>
      </form>
      <output data-testid="w1-output">{{ alerts ? "on" : "off" }}</output>
    </section>

    <section data-fixture="tabs">
      <Tabs.Root id="t1" default-value="account" data-testid="t1">
        <Tabs.List class="tabs" data-testid="t1-list">
          <Tabs.Tab value="account" data-testid="t1-account">Account</Tabs.Tab>
          <Tabs.Tab value="password" data-testid="t1-password">Password</Tabs.Tab>
          <Tabs.Tab value="billing" disabled data-testid="t1-billing">Billing</Tabs.Tab>
          <Tabs.Tab value="team" data-testid="t1-team">Team</Tabs.Tab>
          <Tabs.Indicator class="tab-mark" data-testid="t1-mark" />
        </Tabs.List>
        <Tabs.Panel value="account" data-testid="t1-panel-account">
          <p>Account settings</p>
          <Tabs.Root id="t2" default-value="one" data-testid="t2">
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
        <Accordion.Item
          v-for="each in SECTIONS"
          :key="each"
          :value="each"
          :disabled="each === 'three'"
          :data-testid="`a1-${each}`"
        >
          <Accordion.Header>
            <Accordion.Trigger :data-testid="`a1-${each}-trigger`"
              >Section {{ each }}</Accordion.Trigger
            >
          </Accordion.Header>
          <Accordion.Panel class="fold" :data-testid="`a1-${each}-panel`">
            <p>Content {{ each }}</p>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
      <Accordion.Root id="a2" multiple :default-value="['x']" data-testid="a2">
        <Accordion.Item
          v-for="each in ['x', 'y']"
          :key="each"
          :value="each"
          :data-testid="`a2-${each}`"
        >
          <Accordion.Header>
            <Accordion.Trigger :data-testid="`a2-${each}-trigger`"
              >Part {{ each }}</Accordion.Trigger
            >
          </Accordion.Header>
          <Accordion.Panel class="fold" :data-testid="`a2-${each}-panel`">
            <p>Content {{ each }}</p>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </section>

    <section data-fixture="hover">
      <button data-testid="h0">Before</button>
      <Tooltip.Root id="h1" :delay="100">
        <Tooltip.Trigger data-testid="h1-trigger">Save</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner :side-offset="8" data-testid="h1-positioner">
            <Tooltip.Popup class="tip" data-testid="h1-popup">
              Save the file
              <Tooltip.Arrow class="arrow" data-testid="h1-arrow" />
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Tooltip.Root id="h2" :delay="100">
        <Tooltip.Trigger data-testid="h2-trigger">Open</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner :side-offset="8" data-testid="h2-positioner">
            <Tooltip.Popup class="tip" data-testid="h2-popup">Open a file</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <HoverCard.Root id="v1" :delay="100" :close-delay="100">
        <HoverCard.Trigger href="#profile" data-testid="v1-trigger">@kirana</HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Positioner side="bottom" :side-offset="8" data-testid="v1-positioner">
            <HoverCard.Popup class="tip" data-testid="v1-popup">
              <p>Styles, compiled.</p>
              <a href="#follow" data-testid="v1-link">Follow</a>
            </HoverCard.Popup>
          </HoverCard.Positioner>
        </HoverCard.Portal>
      </HoverCard.Root>
      <Tooltip.Root v-if="tipKept" id="h3" :delay="100" :close-delay="2000">
        <Tooltip.Trigger data-testid="h3-trigger">Share</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner :side-offset="8" data-testid="h3-positioner">
            <Tooltip.Popup class="tip" data-testid="h3-popup">Share the file</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <button data-testid="h3-remove" @click="tipKept = false">Remove</button>
    </section>

    <section data-fixture="simple">
      <Button data-testid="b1" @click="count += 1">Count {{ count }}</Button>
      <Button disabled focusable-when-disabled data-testid="b2">Disabled, in the tab order</Button>
      <Button as="span" :native-button="false" data-testid="b3" @click="count += 1">
        Not a button element
      </Button>
      <Toggle aria-label="Bold" data-testid="g1">B</Toggle>
      <Separator data-testid="sp1" />
      <Separator orientation="vertical" data-testid="sp2" />
      <button data-testid="pr1-more" @click="done = 100">Finish</button>
      <Progress.Root id="pr1" :value="done" data-testid="pr1">
        <Progress.Label>Upload</Progress.Label>
        <Progress.Track class="track">
          <Progress.Indicator class="fill" data-testid="pr1-fill" />
        </Progress.Track>
        <Progress.Value data-testid="pr1-value" />
      </Progress.Root>
      <Progress.Root id="pr2" :value="null" data-testid="pr2">
        <Progress.Track class="track">
          <Progress.Indicator class="fill" data-testid="pr2-fill" />
        </Progress.Track>
      </Progress.Root>
      <Meter.Root id="m1" :value="30" :max="60" data-testid="m1">
        <Meter.Label>Disk</Meter.Label>
        <Meter.Track class="track">
          <Meter.Indicator class="fill" data-testid="m1-fill" />
        </Meter.Track>
        <Meter.Value data-testid="m1-value" />
      </Meter.Root>
      <button data-testid="av-load" @click="pictures = true">Load pictures</button>
      <Avatar.Root class="avatar" data-testid="av1">
        <Avatar.Image
          :src="pictures ? PIXEL : undefined"
          alt="Kirana"
          data-testid="av1-image"
          @loading-status-change="(status) => (heard = status)"
        />
        <Avatar.Fallback data-testid="av1-fallback">K</Avatar.Fallback>
      </Avatar.Root>
      <span data-testid="av1-status">{{ heard }}</span>
      <Avatar.Root class="avatar" data-testid="av2">
        <Avatar.Image :src="pictures ? BROKEN : undefined" alt="Nobody" data-testid="av2-image" />
        <Avatar.Fallback data-testid="av2-fallback">N</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root class="avatar" data-testid="av3">
        <Avatar.Image
          keep-mounted
          :src="pictures ? PIXEL : undefined"
          alt="Kept"
          data-testid="av3-image"
        />
        <Avatar.Fallback :delay="60000" data-testid="av3-fallback">L</Avatar.Fallback>
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
          <Popover.Positioner :side-offset="8" align="start" data-testid="p1-positioner">
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
        <Select.Root id="s1" v-model:value="fruit" name="fruit">
          <Select.Trigger data-testid="s1-trigger">
            <Select.Value placeholder="Pick a fruit" data-testid="s1-value" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner :side-offset="4" data-testid="s1-positioner">
              <Select.Popup class="popup" data-testid="s1-popup">
                <Select.Item
                  v-for="each in FRUITS"
                  :key="each"
                  :value="each"
                  :disabled="each === 'Blueberry'"
                  class="item"
                  :data-testid="`s1-${each}`"
                >
                  <Select.ItemText>{{ each }}</Select.ItemText>
                  <Select.ItemIndicator>✓</Select.ItemIndicator>
                </Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </form>
      <output data-testid="s1-output">{{ fruit ?? "none" }}</output>
    </section>
    <section data-fixture="select-multiple">
      <form class="bar" data-testid="sm1-form">
        <Select.Root id="sm1" v-model:values="basket" name="basket" multiple>
          <Select.Trigger data-testid="sm1-trigger">
            <Select.Value placeholder="Pick fruits" data-testid="sm1-value" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner :side-offset="4" data-testid="sm1-positioner">
              <Select.Popup class="popup" data-testid="sm1-popup">
                <Select.Item
                  v-for="each in FRUITS"
                  :key="each"
                  :value="each"
                  :disabled="each === 'Blueberry'"
                  class="item"
                  :data-testid="`sm1-${each}`"
                >
                  <Select.ItemText>{{ each }}</Select.ItemText>
                  <Select.ItemIndicator>✓</Select.ItemIndicator>
                </Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <button type="reset" data-testid="sm1-reset">Reset</button>
      </form>
      <output data-testid="sm1-output">{{ basket.join(",") || "none" }}</output>
      <Select.Root id="sm2" :items="SIZES" default-value="m">
        <Select.Trigger data-testid="sm2-trigger">
          <Select.Value v-slot="{ value, label }" data-testid="sm2-value">
            {{ label }} ({{ value }})
          </Select.Value>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner :side-offset="4" data-testid="sm2-positioner">
            <Select.Popup class="popup" data-testid="sm2-popup">
              <Select.Item
                v-for="each in SIZE_KEYS"
                :key="each"
                :value="each"
                class="item"
                :data-testid="`sm2-${each}`"
              >
                <Select.ItemText>{{ SIZES[each] }}</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <Select.Root id="sm3" :items="SIZES" multiple :default-values="['l', 's']">
        <Select.Trigger data-testid="sm3-trigger">
          <Select.Value v-slot="{ values, labels }" class="bar" data-testid="sm3-value">
            <b v-for="(label, at) in labels" :key="String(values[at])">{{ label }}</b>
          </Select.Value>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner :side-offset="4" data-testid="sm3-positioner">
            <Select.Popup class="popup" data-testid="sm3-popup">
              <Select.Item
                v-for="each in SIZE_KEYS"
                :key="each"
                :value="each"
                class="item"
                :data-testid="`sm3-${each}`"
              >
                <Select.ItemText>{{ SIZES[each] }}</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </section>
    <section data-fixture="menu">
      <Menu.Root id="mn1">
        <Menu.Trigger data-testid="mn1-trigger">File</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner :side-offset="4" data-testid="mn1-positioner">
            <Menu.Popup class="popup" data-testid="mn1-popup">
              <Menu.GroupLabel data-testid="mn1-lone">Document</Menu.GroupLabel>
              <Menu.Item class="item" data-testid="mn1-new" @click="action = 'new'">
                <span>New</span><kbd aria-hidden="true">⌘N</kbd>
              </Menu.Item>
              <Menu.Item class="item" disabled data-testid="mn1-open"> Open </Menu.Item>
              <Menu.Item class="item" data-testid="mn1-print" @click="action = 'print'">
                Print
              </Menu.Item>
              <Menu.Separator data-testid="mn1-separator" />
              <Menu.CheckboxItem class="item" default-checked data-testid="mn1-wrap">
                <Menu.CheckboxItemIndicator>✓</Menu.CheckboxItemIndicator>
                <span>Word wrap</span>
              </Menu.CheckboxItem>
              <Menu.Group id="mn1-g" data-testid="mn1-group">
                <Menu.GroupLabel data-testid="mn1-label">View</Menu.GroupLabel>
                <Menu.RadioGroup v-model:value="view" data-testid="mn1-views">
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
                      <Menu.Item class="item" data-testid="mn1s-mail" @click="action = 'mail'">
                        Mail
                      </Menu.Item>
                      <Menu.Item class="item" data-testid="mn1s-link" @click="action = 'link'">
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
      <output data-testid="mn1-output"> {{ action }} {{ view }} </output>
    </section>
    <section data-fixture="context-menu">
      <ContextMenu.Root id="cm1">
        <ContextMenu.Trigger class="area" data-testid="cm1-area"> Press here </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner data-testid="cm1-positioner">
            <ContextMenu.Popup class="popup" aria-label="Actions" data-testid="cm1-popup">
              <ContextMenu.Item class="item" data-testid="cm1-copy" @click="picked = 'cm1-copy'">
                Copy
              </ContextMenu.Item>
              <ContextMenu.Item class="item" data-testid="cm1-paste" @click="picked = 'cm1-paste'">
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
                <Menu.Item class="item" data-testid="mb1f-new" @click="picked = 'mb1f-new'">
                  New
                </Menu.Item>
                <Menu.Item class="item" data-testid="mb1f-save" @click="picked = 'mb1f-save'">
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
                <Menu.Item class="item" data-testid="mb1e-undo" @click="picked = 'mb1e-undo'">
                  Undo
                </Menu.Item>
                <Menu.SubmenuRoot id="mb1em">
                  <Menu.SubmenuTrigger class="item" data-testid="mb1e-find">
                    Find
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner data-testid="mb1em-positioner">
                      <Menu.Popup class="popup" data-testid="mb1em-popup">
                        <Menu.Item
                          class="item"
                          data-testid="mb1em-next"
                          @click="picked = 'mb1em-next'"
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
              <Menu.Popup class="popup" data-testid="mb1v-popup">
                <Menu.Item class="item" data-testid="mb1v-zoom" @click="picked = 'mb1v-zoom'">
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
                <Menu.Item class="item" data-testid="mb1h-about" @click="picked = 'mb1h-about'">
                  About
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menubar>
      <output data-testid="mb1-output">{{ picked }}</output>
    </section>
    <section data-fixture="listbox">
      <Listbox.Root id="lb1" aria-label="Fruit" v-model:value="chosen" data-testid="lb1">
        <Listbox.Item
          v-for="each in FRUITS"
          :key="each"
          :value="each"
          :disabled="each === 'Blueberry'"
          class="item"
          :data-testid="`lb1-${each}`"
        >
          <span>{{ each }}</span>
          <Listbox.ItemIndicator>✓</Listbox.ItemIndicator>
        </Listbox.Item>
      </Listbox.Root>
      <Listbox.Root id="lb2" aria-label="Plans" multiple data-testid="lb2">
        <Listbox.Group id="lb2-g" data-testid="lb2-group">
          <Listbox.GroupLabel data-testid="lb2-label">Plans</Listbox.GroupLabel>
          <Listbox.Item
            v-for="each in PLANS"
            :key="each"
            :value="each"
            class="item"
            :data-testid="`lb2-${each}`"
          >
            <span>{{ each }}</span>
          </Listbox.Item>
        </Listbox.Group>
      </Listbox.Root>
      <output data-testid="lb1-output">{{ chosen.join(",") }}</output>
    </section>
    <section data-fixture="combobox">
      <form data-testid="cb1-form">
        <Combobox.Root id="cb1" name="pick" auto-highlight v-model:value="pick">
          <Combobox.Input aria-label="Fruit" data-testid="cb1-input" />
          <Combobox.Trigger aria-label="Show fruits" data-testid="cb1-trigger">
            ▾
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner :side-offset="4" data-testid="cb1-positioner">
              <Combobox.Popup class="popup" aria-label="Fruits" data-testid="cb1-popup">
                <Combobox.Item
                  v-for="each in FRUITS"
                  :key="each"
                  :value="each"
                  :id="`cb1-${each}`"
                  :disabled="each === 'Blueberry'"
                  class="item"
                  :data-testid="`cb1-${each}`"
                >
                  <span>{{ each }}</span>
                  <Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
                </Combobox.Item>
                <Combobox.Empty data-testid="cb1-empty">No fruit</Combobox.Empty>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      </form>
      <output data-testid="cb1-output">{{ pick ?? "none" }}</output>
    </section>
    <section data-fixture="menu-more">
      <div class="bar">
        <button type="button" data-testid="mm1-outside" @click="outside += 1">Outside</button>
        <Menu.Root id="mm1" modal>
          <Menu.Trigger data-testid="mm1-trigger">Modal</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner data-testid="mm1-positioner">
              <Menu.Popup class="popup" data-testid="mm1-popup">
                <Menu.Item class="item" data-testid="mm1-plain"> Plain </Menu.Item>
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
                <Menu.Item class="item" data-testid="vb1a-x"> Alpha </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
        <Menu.Root id="vb1b">
          <Menu.Trigger data-testid="vb1-two">Two</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner data-testid="vb1b-positioner">
              <Menu.Popup class="popup" data-testid="vb1b-popup">
                <Menu.Item class="item" data-testid="vb1b-x"> Beta </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menubar>
      <output data-testid="mm1-output">{{ outside }}</output>
    </section>
    <section data-fixture="toolbar">
      <ToggleGroup aria-label="Alignment" v-model:value="align" class="bar" data-testid="tg1">
        <Toggle value="left" data-testid="tg1-left"> Left </Toggle>
        <Toggle value="centre" data-testid="tg1-centre"> Centre </Toggle>
        <Toggle value="justify" disabled data-testid="tg1-justify"> Justify </Toggle>
        <Toggle value="right" data-testid="tg1-right"> Right </Toggle>
      </ToggleGroup>
      <output data-testid="tg1-output">{{ align.join(",") }}</output>
      <Toolbar.Root aria-label="Editing" class="bar" data-testid="tb1">
        <Toolbar.Button data-testid="tb1-save">Save</Toolbar.Button>
        <Toolbar.Button disabled data-testid="tb1-gone"> Gone </Toolbar.Button>
        <Toolbar.Link href="#tb1-help" data-testid="tb1-link"> Help </Toolbar.Link>
        <Toolbar.Separator data-testid="tb1-line" />
        <Toolbar.Input aria-label="Zoom" value="100" data-testid="tb1-zoom" />
        <Toolbar.Group data-testid="tb1-group">
          <ToggleGroup multiple aria-label="Marks" class="bar" data-testid="tb1-marks">
            <Toggle value="bold" data-testid="tb1-bold"> Bold </Toggle>
            <Toggle value="italic" data-testid="tb1-italic"> Italic </Toggle>
          </ToggleGroup>
        </Toolbar.Group>
        <Toggle data-testid="tb1-pin">Pin</Toggle>
      </Toolbar.Root>
    </section>
    <section data-fixture="scroll-area">
      <ScrollArea.Root class="scroll" data-testid="sa1">
        <ScrollArea.Viewport class="scroll-view" data-testid="sa1-view">
          <ScrollArea.Content data-testid="sa1-content">
            <div :class="tall ? 'scroll-tall' : 'scroll-short'" data-testid="sa1-box">Content</div>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar class="scroll-bar" data-testid="sa1-y">
          <ScrollArea.Thumb class="scroll-thumb" data-testid="sa1-y-thumb" />
        </ScrollArea.Scrollbar>
        <ScrollArea.Scrollbar orientation="horizontal" class="scroll-bar" data-testid="sa1-x">
          <ScrollArea.Thumb class="scroll-thumb" data-testid="sa1-x-thumb" />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner class="scroll-corner" data-testid="sa1-corner" />
      </ScrollArea.Root>
      <button type="button" data-testid="sa1-grow" @click="tall = !tall">Grow</button>
      <ScrollArea.Root class="scroll-wide" data-testid="sa2">
        <ScrollArea.Viewport class="scroll-view" data-testid="sa2-view">
          <div class="scroll-pictures" data-testid="sa2-row">
            <div class="scroll-figure">
              <img
                class="scroll-picture"
                :src="rowLoaded ? WIDE : undefined"
                alt=""
                data-testid="sa2-picture-1"
              />
            </div>
            <div class="scroll-figure">
              <img
                class="scroll-picture"
                :src="rowLoaded ? WIDE : undefined"
                alt=""
                data-testid="sa2-picture-2"
              />
            </div>
            <div class="scroll-figure">
              <img
                class="scroll-picture"
                :src="rowLoaded ? WIDE : undefined"
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
      <button type="button" data-testid="sa2-load" @click="rowLoaded = true">Load pictures</button>
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
              <NavigationMenu.Link href="#apps" data-testid="nm1-apps"> apps </NavigationMenu.Link>
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
          <NavigationMenu.Positioner :side-offset="4" data-testid="nm1-positioner">
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
        :virtualized="ROWS"
        class="virtual"
        data-testid="vl1"
        @scroll="scrolled"
      >
        <div class="virtual-space">
          <Listbox.Item
            v-for="each in rowsFrom(first)"
            :key="each"
            :value="each"
            :index="each"
            class="item virtual-row"
            :style="{ top: `${each * VROW}px` }"
            :data-testid="`vl1-${each}`"
          >
            {{ `Row ${each}` }}
          </Listbox.Item>
        </div>
      </Listbox.Root>
      <Combobox.Root id="cp1" inline auto-highlight @value-change="(next: unknown) => (ran = next)">
        <Combobox.Input aria-label="Command" data-testid="cp1-input" />
        <Combobox.Popup class="palette" aria-label="Commands" data-testid="cp1-list">
          <Combobox.Item
            v-for="each in COMMANDS"
            :key="each"
            :value="each"
            :id="`cp1-${each}`"
            class="item"
            :data-testid="`cp1-${each}`"
          >
            {{ each }}
          </Combobox.Item>
          <Combobox.Empty data-testid="cp1-empty">Nothing found</Combobox.Empty>
        </Combobox.Popup>
      </Combobox.Root>
      <output data-testid="cp1-output">{{ ran }}</output>
      <Field.Root id="fcb" name="city" data-testid="fcb">
        <Field.Label data-testid="fcb-label">City</Field.Label>
        <Combobox.Root id="fcbc" required auto-highlight>
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
        <Combobox.Root id="cbm" v-model:values="tags" name="tags" multiple auto-highlight>
          <Combobox.Chips class="bar" data-testid="cbm-chips">
            <Combobox.Chip
              v-for="each in tags"
              :key="each"
              :value="each"
              class="chip"
              :data-testid="`cbm-chip-${each}`"
            >
              <span>{{ each }}</span>
              <Combobox.ChipRemove
                :aria-label="`Remove ${each}`"
                :data-testid="`cbm-remove-${each}`"
              >
                ×
              </Combobox.ChipRemove>
            </Combobox.Chip>
            <Combobox.Input aria-label="Tags" data-testid="cbm-input" />
          </Combobox.Chips>
          <Combobox.Portal>
            <Combobox.Positioner data-testid="cbm-positioner">
              <Combobox.Popup class="popup" aria-label="Tags" data-testid="cbm-popup">
                <Combobox.Item
                  v-for="each in COMMANDS"
                  :key="each"
                  :value="each"
                  :id="`cbm-${each}`"
                  class="item"
                  :data-testid="`cbm-${each}`"
                >
                  {{ each }}
                </Combobox.Item>
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
          :length="4"
          name="code"
          class="otp"
          data-testid="otp1"
          @complete="(next: string) => (code = next)"
        >
          <Otp.Input aria-label="Code" class="otp-input" data-testid="otp1-input" />
          <Otp.Group class="otp-group">
            <Otp.Slot :index="0" class="otp-slot" data-testid="otp1-0">
              <Otp.Caret class="otp-caret" />
            </Otp.Slot>
            <Otp.Slot :index="1" class="otp-slot" data-testid="otp1-1">
              <Otp.Caret class="otp-caret" />
            </Otp.Slot>
          </Otp.Group>
          <Otp.Separator class="otp-mark" />
          <Otp.Group class="otp-group">
            <Otp.Slot :index="2" class="otp-slot" data-testid="otp1-2">
              <Otp.Caret class="otp-caret" />
            </Otp.Slot>
            <Otp.Slot :index="3" class="otp-slot" data-testid="otp1-3">
              <Otp.Caret class="otp-caret" />
            </Otp.Slot>
          </Otp.Group>
        </Otp.Root>
      </form>
      <output data-testid="otp1-output">{{ code }}</output>
      <div class="otp-row">
        <Otp.Root id="otp2" :length="2" mode="alphabetic" class="otp" data-testid="otp2">
          <Otp.Input aria-label="Letters" class="otp-input" data-testid="otp2-input" />
          <Otp.Group class="otp-group">
            <Otp.Slot :index="0" class="otp-slot" data-testid="otp2-0" />
            <Otp.Slot :index="1" class="otp-slot" data-testid="otp2-1" />
          </Otp.Group>
        </Otp.Root>
        <Otp.Root id="otp3" :length="3" pattern="[A-F0-9]" class="otp" data-testid="otp3">
          <Otp.Input aria-label="Hex" class="otp-input" data-testid="otp3-input" />
          <Otp.Group class="otp-group">
            <Otp.Slot :index="0" class="otp-slot" data-testid="otp3-0" />
            <Otp.Slot :index="1" class="otp-slot" data-testid="otp3-1" />
            <Otp.Slot :index="2" class="otp-slot" data-testid="otp3-2" />
          </Otp.Group>
        </Otp.Root>
      </div>
      <Resizable.Group
        id="rs1"
        class="split"
        data-testid="rs1"
        @sizes-change="(next: number[]) => (shares = next.map(Math.round).join(','))"
      >
        <Resizable.Panel :default-size="25" :min-size="10" class="split-panel" data-testid="rs1-a">
          A
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize" class="split-bar" data-testid="rs1-bar" />
        <Resizable.Panel :default-size="75" class="split-panel" data-testid="rs1-b">
          B
        </Resizable.Panel>
      </Resizable.Group>
      <output data-testid="rs1-output">{{ shares }}</output>
    </section>
    <section data-fixture="pieces">
      <QrCode.Root id="qr1" :value="LINK" class="qr" data-testid="qr1">
        <QrCode.Frame aria-label="A link" class="qr-frame" data-testid="qr1-frame">
          <QrCode.Pattern data-testid="qr1-pattern" />
        </QrCode.Frame>
      </QrCode.Root>
      <Autosize.Textarea aria-label="Note" rows="1" class="note" data-testid="au1" />
      <Carousel.Root
        id="cr1"
        aria-label="Pictures"
        class="carousel"
        data-testid="cr1"
        @index-change="(next: number) => (slide = String(next))"
      >
        <Carousel.Viewport class="carousel-view" data-testid="cr1-view">
          <Carousel.Item :index="0" class="carousel-item" data-testid="cr1-0">One</Carousel.Item>
          <Carousel.Item :index="1" class="carousel-item" data-testid="cr1-1">Two</Carousel.Item>
          <Carousel.Item :index="2" class="carousel-item" data-testid="cr1-2">Three</Carousel.Item>
        </Carousel.Viewport>
        <Carousel.Previous data-testid="cr1-previous">Previous</Carousel.Previous>
        <Carousel.Next data-testid="cr1-next">Next</Carousel.Next>
        <Carousel.Indicator :index="0" aria-label="Slide 1" data-testid="cr1-dot-0" />
        <Carousel.Indicator :index="1" aria-label="Slide 2" data-testid="cr1-dot-1" />
        <Carousel.Indicator :index="2" aria-label="Slide 3" data-testid="cr1-dot-2" />
      </Carousel.Root>
      <output data-testid="cr1-output">{{ slide }}</output>
    </section>
    <section data-fixture="toast">
      <button
        type="button"
        data-testid="ts1-add"
        @click="
          toaster.add({ title: 'Saved', description: 'Your changes are kept.', type: 'success' })
        "
      >
        Add a toast
      </button>
      <button
        type="button"
        data-testid="ts1-brief"
        @click="toaster.add({ title: 'Gone soon', duration: 300 })"
      >
        Add a brief toast
      </button>
      <button
        type="button"
        data-testid="ts1-undo"
        @click="
          toaster.add({
            title: 'Deleted',
            action: { label: 'Undo', onAction: () => (toastAction = 'undone') },
          })
        "
      >
        Add a toast with an action
      </button>
      <button
        type="button"
        data-testid="ts1-alert"
        @click="toaster.add({ title: 'Connection lost', type: 'error', priority: 'assertive' })"
      >
        Add an urgent toast
      </button>
      <output data-testid="ts1-output">{{ toastAction }}</output>
      <Toast.Viewport id="ts1" :toaster="toaster" class="toasts" data-testid="ts1">
        <Toast.List v-slot="{ toast }">
          <Toast.Root :toast="toast" class="toast" :data-testid="`ts1-${toast.id}`">
            <Toast.Content class="toast-content" :data-testid="`ts1-${toast.id}-content`">
              <Toast.Title class="toast-title">{{ toast.title }}</Toast.Title>
              <Toast.Description />
            </Toast.Content>
            <Toast.Action :data-testid="`ts1-${toast.id}-action`" />
            <Toast.Close aria-label="Close" :data-testid="`ts1-${toast.id}-close`">
              Close
            </Toast.Close>
          </Toast.Root>
        </Toast.List>
      </Toast.Viewport>
    </section>
    <section data-fixture="sheets">
      <Drawer.Root
        id="dw1"
        @open-change="
          (open: boolean, details: { reason: string }) => (drawn = open ? 'open' : details.reason)
        "
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
      <output data-testid="dw1-output">{{ drawn }}</output>
      <Drawer.Root
        id="dw2"
        :snap-points="[0.5, 1]"
        @snap-point-change="(next: number | string) => (rests = String(next))"
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
      <output data-testid="dw2-output">{{ rests }}</output>
      <MessageScroller.Root id="ms1" class="chat" data-testid="ms1">
        <MessageScroller.Viewport class="chat-view" data-testid="ms1-view">
          <MessageScroller.Content class="chat-lines" data-testid="ms1-content">
            <p v-for="line in said" :key="line" class="chat-line">Message {{ line }}</p>
          </MessageScroller.Content>
        </MessageScroller.Viewport>
        <MessageScroller.Button data-testid="ms1-button">Newest</MessageScroller.Button>
      </MessageScroller.Root>
      <button type="button" data-testid="ms1-add" @click="said += 1">Add a message</button>
    </section>
    <section data-fixture="dates">
      <Calendar.Root
        id="cal1"
        locale="en-US"
        default-focused-value="2026-03-15"
        class="calendar"
        data-testid="cal1"
        v-model:value="pickedDay"
        @value-change="(next: unknown) => (dated = String(next))"
      >
        <Calendar.Previous aria-label="Previous month" data-testid="cal1-previous">
          Previous
        </Calendar.Previous>
        <Calendar.Heading data-testid="cal1-heading" />
        <Calendar.Next aria-label="Next month" data-testid="cal1-next">Next</Calendar.Next>
        <Calendar.Grid data-testid="cal1-grid">
          <thead>
            <tr>
              <Calendar.Weekdays v-slot="{ weekday }">
                <Calendar.HeadCell :weekday="weekday">{{ weekday.short }}</Calendar.HeadCell>
              </Calendar.Weekdays>
            </tr>
          </thead>
          <tbody>
            <Calendar.Weeks v-slot="{ week }">
              <tr>
                <Calendar.Cell v-for="day in week" :key="day.date" :date="day.date">
                  <Calendar.Day :date="day.date" :data-testid="`cal1-${day.date}`">
                    {{ day.label }}
                  </Calendar.Day>
                </Calendar.Cell>
              </tr>
            </Calendar.Weeks>
          </tbody>
        </Calendar.Grid>
      </Calendar.Root>
      <output data-testid="cal1-output">{{ dated }}</output>
      <form data-testid="df1-form">
        <DateField.Root
          id="df1"
          locale="en-US"
          name="born"
          aria-label="Date of birth"
          class="date-field"
          data-testid="df1"
          @value-change="(next: string | null) => (born = String(next))"
        >
          <DateField.Segments v-slot="{ segment }">
            <DateField.Segment
              :segment="segment"
              :data-testid="`df1-${segment.type}-${segment.index}`"
            />
          </DateField.Segments>
          <DateField.Input />
        </DateField.Root>
      </form>
      <output data-testid="df1-output">{{ born }}</output>
    </section>
    <section data-fixture="calendars">
      <Calendar.Root
        id="cal2"
        locale="en-US"
        mode="range"
        :months="2"
        default-month="2026-03-01"
        default-focused-value="2026-03-15"
        class="calendar calendar-months"
        data-testid="cal2"
        v-model:value="pickedRange"
        @value-change="(next: unknown) => (stay = JSON.stringify(next))"
      >
        <Calendar.Previous aria-label="Previous month" data-testid="cal2-previous">
          Previous
        </Calendar.Previous>
        <Calendar.Next aria-label="Next month" data-testid="cal2-next">Next</Calendar.Next>
        <div class="months">
          <Calendar.Months v-slot="{ month }">
            <div :data-testid="`cal2-month-${month.index}`">
              <Calendar.Heading :data-testid="`cal2-heading-${month.index}`" />
              <Calendar.Grid :data-testid="`cal2-grid-${month.index}`">
                <thead>
                  <tr>
                    <Calendar.Weekdays v-slot="{ weekday }">
                      <Calendar.HeadCell :weekday="weekday">{{ weekday.short }}</Calendar.HeadCell>
                    </Calendar.Weekdays>
                  </tr>
                </thead>
                <tbody>
                  <Calendar.Weeks v-slot="{ week }">
                    <tr>
                      <Calendar.Cell v-for="day in week" :key="day.date" :date="day.date">
                        <Calendar.Day
                          :date="day.date"
                          :data-testid="`cal2-${month.index}-${day.date}`"
                        >
                          {{ day.label }}
                        </Calendar.Day>
                      </Calendar.Cell>
                    </tr>
                  </Calendar.Weeks>
                </tbody>
              </Calendar.Grid>
            </div>
          </Calendar.Months>
        </div>
      </Calendar.Root>
      <output data-testid="cal2-output">{{ stay }}</output>
      <form data-testid="cal3-form">
        <Calendar.Root
          id="cal3"
          locale="en-US"
          mode="multiple"
          name="days"
          :max-days="3"
          :default-value="['2026-03-02']"
          default-focused-value="2026-03-15"
          class="calendar"
          data-testid="cal3"
          @value-change="(next: unknown) => (chosenDays = String(next))"
        >
          <Calendar.Heading data-testid="cal3-heading" />
          <Calendar.Grid data-testid="cal3-grid">
            <tbody>
              <Calendar.Weeks v-slot="{ week }">
                <tr>
                  <Calendar.Cell v-for="day in week" :key="day.date" :date="day.date">
                    <Calendar.Day :date="day.date" :data-testid="`cal3-${day.date}`">
                      {{ day.label }}
                    </Calendar.Day>
                  </Calendar.Cell>
                </tr>
              </Calendar.Weeks>
            </tbody>
          </Calendar.Grid>
          <Calendar.Input data-testid="cal3-input" />
        </Calendar.Root>
        <button type="reset" data-testid="cal3-reset">Reset</button>
      </form>
      <output data-testid="cal3-output">{{ chosenDays }}</output>
      <Calendar.Root
        id="cal4"
        v-model:month="shownMonth"
        locale="en-US"
        default-focused-value="2026-03-15"
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
            <Calendar.Weeks v-slot="{ week }">
              <tr>
                <Calendar.Cell v-for="day in week" :key="day.date" :date="day.date">
                  <Calendar.Day :date="day.date" :data-testid="`cal4-${day.date}`">
                    {{ day.label }}
                  </Calendar.Day>
                </Calendar.Cell>
              </tr>
            </Calendar.Weeks>
          </tbody>
        </Calendar.Grid>
      </Calendar.Root>
      <button type="button" data-testid="cal4-jump" @click="shownMonth = '2030-12-01'">
        December 2030
      </button>
      <output data-testid="cal4-output">{{ shownMonth }}</output>
    </section>
    <section data-fixture="command">
      <Label for="in1" data-testid="in1-label">Name</Label>
      <Input id="in1" data-testid="in1" @value-change="(next: string) => (named = next)" />
      <output data-testid="in1-output">{{ named }}</output>
      <Field.Root id="in2" name="email" data-testid="in2">
        <Label data-testid="in2-label">Email</Label>
        <Input type="email" required data-testid="in2-input" />
      </Field.Root>
      <Command.Root
        id="cm1"
        loop
        class="command"
        data-testid="cm1"
        @select="(next: string) => (did = next)"
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
              :keywords="LOAD"
              class="item"
              data-testid="cm1-open"
            >
              Open
            </Command.Item>
          </Command.Group>
          <Command.Separator class="separator" data-testid="cm1-separator" />
          <Command.Group id="cm1-edit" data-testid="cm1-edit">
            <Command.GroupHeading data-testid="cm1-edit-heading">Edit</Command.GroupHeading>
            <Command.Item id="cm1-copy" class="item" data-testid="cm1-copy"> Copy </Command.Item>
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
      <output data-testid="cm1-output">{{ did }}</output>
    </section>
    <section data-fixture="slider">
      <Slider.Root id="sl1" :default-value="40" name="volume" data-testid="sl1">
        <Slider.Value data-testid="sl1-value" />
        <Slider.Control class="slider" data-testid="sl1-control">
          <Slider.Track class="slider-track">
            <Slider.Indicator class="fill" data-testid="sl1-fill" />
            <Slider.Thumb class="thumb" aria-label="Volume" data-testid="sl1-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Slider.Root id="sl2" v-model:value="span" :step="5" data-testid="sl2">
        <Slider.Value data-testid="sl2-value" />
        <Slider.Control class="slider" data-testid="sl2-control">
          <Slider.Track class="slider-track">
            <Slider.Indicator class="fill" data-testid="sl2-fill" />
            <Slider.Thumb :index="0" class="thumb" aria-label="From" data-testid="sl2-from" />
            <Slider.Thumb :index="1" class="thumb" aria-label="To" data-testid="sl2-to" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <span data-testid="sl2-output">{{ span.join(",") }}</span>
      <Slider.Root id="sl3" :default-value="30" orientation="vertical" disabled data-testid="sl3">
        <Slider.Control class="slider" data-testid="sl3-control">
          <Slider.Track class="slider-track">
            <Slider.Indicator class="fill" data-testid="sl3-fill" />
            <Slider.Thumb class="thumb" aria-label="Level" data-testid="sl3-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Slider.Root id="sl5" :default-value="[20, 50, 80]" data-testid="sl5">
        <Slider.Control class="slider" data-testid="sl5-control">
          <Slider.Track class="slider-track">
            <Slider.Thumb v-if="low" class="thumb" aria-label="Low" data-testid="sl5-low" />
            <Slider.Thumb class="thumb" aria-label="Middle" data-testid="sl5-middle" />
            <Slider.Thumb class="thumb" aria-label="High" data-testid="sl5-high" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <button data-testid="sl5-toggle" @click="low = !low">Low</button>
    </section>
    <section data-fixture="measures">
      <Slider.Root id="sl4" :default-value="0" thumb-alignment="edge" data-testid="sl4">
        <Slider.Control class="slider" data-testid="sl4-control">
          <Slider.Track class="slider-track">
            <Slider.Indicator class="fill" data-testid="sl4-fill" />
            <Slider.Thumb class="thumb thumb-inside" aria-label="Inside" data-testid="sl4-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Select.Root id="s3" default-value="Cherry">
        <Select.Trigger class="select-trigger" data-testid="s3-trigger">
          <Select.Value data-testid="s3-value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner align-item-with-trigger data-testid="s3-positioner">
            <Select.Popup class="popup" data-testid="s3-popup">
              <Select.Item
                v-for="each in FRUITS"
                :key="each"
                :value="each"
                class="item"
                :data-testid="`s3-${each}`"
              >
                <Select.ItemText :data-testid="`s3-${each}-text`">{{ each }}</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </section>
    <section data-fixture="entry">
      <NumberField.Root
        id="nf1"
        name="qty"
        :default-value="5"
        :min="0"
        :max="10"
        class="number-field"
        data-testid="nf1"
        @value-change="(next: number | null) => (qty = String(next))"
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
      <output data-testid="nf1-output">{{ qty }}</output>
      <Autocomplete.Root id="ac1" name="place" @value-change="(next: string) => (place = next)">
        <Autocomplete.Input aria-label="Place" data-testid="ac1-input" />
        <Autocomplete.Portal>
          <Autocomplete.Positioner :side-offset="4" data-testid="ac1-positioner">
            <Autocomplete.Popup class="popup" aria-label="Places" data-testid="ac1-popup">
              <Autocomplete.Item
                v-for="each in PLACES"
                :id="`ac1-${each}`"
                :key="each"
                :value="each"
                class="item"
                :data-testid="`ac1-${each}`"
              >
                {{ each }}
              </Autocomplete.Item>
              <Autocomplete.Empty data-testid="ac1-empty">No place</Autocomplete.Empty>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
      <output data-testid="ac1-output">{{ place }}</output>
      <Select.Root id="s4" default-value="Row 1">
        <Select.Trigger data-testid="s4-trigger">
          <Select.Value data-testid="s4-value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner :side-offset="4" data-testid="s4-positioner">
            <Select.Popup class="popup arrowed" data-testid="s4-popup">
              <Select.ScrollUpArrow class="scroll-arrow" data-testid="s4-up" />
              <Select.List class="arrowed-list" data-testid="s4-list">
                <Select.Item
                  v-for="each in LINES"
                  :key="each"
                  :value="each"
                  class="item"
                  :data-testid="`s4-${each}`"
                >
                  <Select.ItemText>{{ each }}</Select.ItemText>
                </Select.Item>
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
        default-value="2026-03-14"
        @value-change="(next: string | null) => (due = String(next))"
      >
        <DatePicker.Field aria-label="Due" class="date-field" data-testid="dk1-field">
          <DatePicker.Segments v-slot="{ segment }">
            <DatePicker.Segment
              :segment="segment"
              :data-testid="`dk1-${segment.type}-${segment.index}`"
            />
          </DatePicker.Segments>
          <DatePicker.Input />
        </DatePicker.Field>
        <DatePicker.Trigger aria-label="Pick a day" data-testid="dk1-trigger"
          >Pick</DatePicker.Trigger
        >
        <DatePicker.Portal>
          <DatePicker.Positioner :side-offset="4" data-testid="dk1-positioner">
            <DatePicker.Popup class="popup" aria-label="Calendar" data-testid="dk1-popup">
              <DatePicker.Calendar class="calendar" data-testid="dk1-calendar">
                <DatePicker.Previous aria-label="Previous month" data-testid="dk1-previous">
                  Previous
                </DatePicker.Previous>
                <DatePicker.Heading data-testid="dk1-heading" />
                <DatePicker.Next aria-label="Next month" data-testid="dk1-next"
                  >Next</DatePicker.Next
                >
                <DatePicker.Grid data-testid="dk1-grid">
                  <thead>
                    <tr>
                      <DatePicker.Weekdays v-slot="{ weekday }">
                        <DatePicker.HeadCell :weekday="weekday">{{
                          weekday.short
                        }}</DatePicker.HeadCell>
                      </DatePicker.Weekdays>
                    </tr>
                  </thead>
                  <tbody>
                    <DatePicker.Weeks v-slot="{ week }">
                      <tr>
                        <DatePicker.Cell v-for="day in week" :key="day.date" :date="day.date">
                          <DatePicker.Day :date="day.date" :data-testid="`dk1-${day.date}`">
                            {{ day.label }}
                          </DatePicker.Day>
                        </DatePicker.Cell>
                      </tr>
                    </DatePicker.Weeks>
                  </tbody>
                </DatePicker.Grid>
              </DatePicker.Calendar>
            </DatePicker.Popup>
          </DatePicker.Positioner>
        </DatePicker.Portal>
      </DatePicker.Root>
      <output data-testid="dk1-output">{{ due }}</output>
      <Pagination.Root
        id="pg1"
        :count="200"
        class="pagination"
        data-testid="pg1"
        @page-change="(next: number) => (paged = String(next))"
      >
        <Pagination.Previous data-testid="pg1-previous">Previous</Pagination.Previous>
        <Pagination.Items v-slot="{ entry }">
          <Pagination.Item
            v-if="entry.type === 'page'"
            :page="entry.page"
            :data-testid="`pg1-${entry.page}`"
          >
            {{ entry.page }}
          </Pagination.Item>
          <Pagination.Ellipsis v-else :data-testid="`pg1-${entry.key}`">…</Pagination.Ellipsis>
        </Pagination.Items>
        <Pagination.Next data-testid="pg1-next">Next</Pagination.Next>
      </Pagination.Root>
      <output data-testid="pg1-output">{{ paged }}</output>
      <Select.Root id="s5" default-value="Apple">
        <Select.Trigger data-testid="s5-trigger">
          <Select.Value data-testid="s5-value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner :side-offset="4" data-testid="s5-positioner">
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
      <Autocomplete.Root id="ac2" default-value="Par">
        <Autocomplete.Input aria-label="City" data-testid="ac2-input" />
        <Autocomplete.Portal>
          <Autocomplete.Positioner :side-offset="4" data-testid="ac2-positioner">
            <Autocomplete.Popup class="popup" aria-label="Cities" data-testid="ac2-popup">
              <Autocomplete.GroupLabel data-testid="ac2-lone">Cities</Autocomplete.GroupLabel>
              <Autocomplete.Group id="ac2-north" data-testid="ac2-north">
                <Autocomplete.GroupLabel data-testid="ac2-north-label"
                  >North</Autocomplete.GroupLabel
                >
                <Autocomplete.Item value="Oslo" id="ac2-Oslo" class="item" data-testid="ac2-Oslo">
                  Oslo
                </Autocomplete.Item>
              </Autocomplete.Group>
              <Autocomplete.Separator data-testid="ac2-separator" />
              <Autocomplete.Group id="ac2-west" data-testid="ac2-west">
                <Autocomplete.GroupLabel data-testid="ac2-west-label">West</Autocomplete.GroupLabel>
                <Autocomplete.Item
                  value="Paris"
                  id="ac2-Paris"
                  class="item"
                  data-testid="ac2-Paris"
                >
                  Paris
                </Autocomplete.Item>
              </Autocomplete.Group>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    </section>
    <section data-fixture="container">
      <div ref="box" data-testid="pc1-box"></div>
      <PortalProvider :container="box">
        <Popover.Root id="pc1">
          <Popover.Trigger data-testid="pc1-trigger">Open in the box</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner :side-offset="4" data-testid="pc1-positioner">
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
        :errors="rejected"
        data-testid="f1"
        @form-submit="(values: unknown) => (sent = JSON.stringify(values))"
      >
        <Fieldset.Root id="fs1" data-testid="fs1">
          <Fieldset.Legend data-testid="fs1-legend">Account</Fieldset.Legend>
          <Field.Root id="fd1" name="email" data-testid="fd1">
            <Field.Label data-testid="fd1-label">Email</Field.Label>
            <Field.Control type="email" required data-testid="fd1-control" />
            <Field.Description data-testid="fd1-description">Your work address</Field.Description>
            <Field.Error data-testid="fd1-error" />
            <Field.Validity v-slot="{ validity }">
              <span data-testid="fd1-validity">{{ word(validity.valid) }}</span>
            </Field.Validity>
          </Field.Root>
          <Field.Root
            id="fd2"
            name="user"
            validation-mode="onBlur"
            :validate="taken"
            data-testid="fd2"
          >
            <Field.Label>User</Field.Label>
            <Field.Control data-testid="fd2-control" />
            <Field.Error data-testid="fd2-error" />
          </Field.Root>
        </Fieldset.Root>
        <button type="submit" data-testid="f1-submit">Send</button>
      </Form>
      <button data-testid="f1-reject" @click="rejected = { user: 'Reserved' }">Reject</button>
      <span data-testid="f1-sent">{{ sent }}</span>
    </section>
    <section data-fixture="field-controls">
      <Form data-testid="f2" @form-submit="(values: unknown) => (sent2 = JSON.stringify(values))">
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
          <Slider.Root :default-value="10" data-testid="fc3-slider">
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
              <Select.Positioner :side-offset="4">
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
      <span data-testid="f2-sent">{{ sent2 }}</span>
    </section>
    <section data-fixture="checkbox-group">
      <form data-testid="cg1-form">
        <CheckboxGroup
          id="cg1"
          v-model:value="toppings"
          :all-values="TOPPINGS"
          class="bar"
          data-testid="cg1"
        >
          <Checkbox.Root
            parent
            id="cg1-all-input"
            class="box"
            aria-label="All"
            data-testid="cg1-all"
          >
            <Checkbox.Indicator class="mark">✓</Checkbox.Indicator>
          </Checkbox.Root>
          <Checkbox.Root
            v-for="each in TOPPINGS"
            :id="`cg1-${each}-input`"
            :key="each"
            name="topping"
            :value="each"
            class="box"
            :aria-label="each"
            :data-testid="`cg1-${each}`"
          >
            <Checkbox.Indicator class="mark">✓</Checkbox.Indicator>
          </Checkbox.Root>
        </CheckboxGroup>
        <button type="reset" data-testid="cg1-reset">Reset</button>
      </form>
      <output data-testid="cg1-output">{{ toppings.join(",") }}</output>
      <Field.Root id="cg2" name="extras" data-testid="cg2">
        <Field.Label data-testid="cg2-label">Extras</Field.Label>
        <CheckboxGroup :default-value="['napkins']" class="bar" data-testid="cg2-group">
          <Checkbox.Root
            v-for="each in EXTRAS"
            :id="`cg2-${each}-input`"
            :key="each"
            :value="each"
            class="box"
            :aria-label="each"
            :data-testid="`cg2-${each}`"
          >
            <Checkbox.Indicator class="mark">✓</Checkbox.Indicator>
          </Checkbox.Root>
        </CheckboxGroup>
      </Field.Root>
    </section>
    <section data-fixture="read-only">
      <Slider.Root id="ro1" :default-value="40" read-only data-testid="ro1">
        <Slider.Control class="slider" data-testid="ro1-control">
          <Slider.Track class="slider-track">
            <Slider.Indicator class="fill" />
            <Slider.Thumb class="thumb" aria-label="Level" data-testid="ro1-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Select.Root id="ro2" default-value="Banana" read-only>
        <Select.Trigger data-testid="ro2-trigger">
          <Select.Value data-testid="ro2-value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner :side-offset="4">
            <Select.Popup class="popup" data-testid="ro2-popup">
              <Select.Item
                v-for="each in LOCKED"
                :key="each"
                :value="each"
                class="item"
                :data-testid="`ro2-${each}`"
              >
                <Select.ItemText>{{ each }}</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </section>
    <section data-fixture="direction">
      <button
        type="button"
        data-testid="dir-turn"
        @click="reading = reading === 'rtl' ? 'ltr' : 'rtl'"
      >
        Turn
      </button>
      <div :dir="reading" data-testid="dir-box">
        <DirectionProvider :direction="reading">
          <Tabs.Root id="dt1" default-value="one" data-testid="dt1">
            <Tabs.List class="tabs" data-testid="dt1-list">
              <Tabs.Tab value="one" data-testid="dt1-one">One</Tabs.Tab>
              <Tabs.Tab value="two" data-testid="dt1-two">Two</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="one">First</Tabs.Panel>
            <Tabs.Panel value="two">Second</Tabs.Panel>
          </Tabs.Root>
          <Slider.Root id="ds1" :default-value="40" data-testid="ds1">
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
              <Popover.Positioner :side-offset="8" align="start" data-testid="dp1-positioner">
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
            <Popover.Positioner side="inline-end" :side-offset="8" data-testid="pl1-positioner">
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
          <span ref="firstAnchor" id="pl2-first" class="anchor" data-testid="pl2-first">First</span>
          <span ref="secondAnchor" id="pl2-second" class="anchor" data-testid="pl2-second">
            Second
          </span>
          <Popover.Portal>
            <Popover.Positioner
              :anchor="moved ? secondAnchor : firstAnchor"
              align="start"
              :side-offset="4"
              data-testid="pl2-positioner"
            >
              <Popover.Popup class="popup" data-testid="pl2-popup">
                <Popover.Title>Anchored</Popover.Title>
                <button type="button" data-testid="pl2-move" @click="moved = !moved">Move</button>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
      <div class="bar">
        <Combobox.Root id="pl3" v-model:value="sought">
          <Combobox.Trigger data-testid="pl3-trigger">Pick a fruit</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner :side-offset="4" data-testid="pl3-positioner">
              <Combobox.Popup class="popup" aria-label="Pick a fruit" data-testid="pl3-popup">
                <Combobox.Input class="search" aria-label="Search fruits" data-testid="pl3-input" />
                <Combobox.List aria-label="Fruits" data-testid="pl3-list">
                  <Combobox.Item
                    v-for="each in FRUITS"
                    :key="each"
                    :value="each"
                    :id="`pl3-${each}`"
                    class="item"
                    :data-testid="`pl3-${each}`"
                    >{{ each }}</Combobox.Item
                  >
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        <output data-testid="pl3-output">{{ sought ?? "none" }}</output>
      </div>
    </section>
    <section data-fixture="popover-more">
      <div class="bar">
        <Popover.Root id="pm1" modal>
          <Popover.Trigger data-testid="pm1-trigger">Modal popover</Popover.Trigger>
          <Popover.Portal>
            <Popover.Backdrop class="backdrop" data-testid="pm1-backdrop" />
            <Popover.Positioner
              :side-offset="8"
              :arrow-padding="8"
              sticky
              data-testid="pm1-positioner"
            >
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
          <Popover.Trigger open-on-hover :delay="50" data-testid="pm2-trigger">
            Hover popover
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner :side-offset="8" data-testid="pm2-positioner">
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
              position-method="fixed"
              :side-offset="anchorHigh"
              :collision-padding="{ left: 12, right: 12 }"
              :collision-avoidance="{ side: 'none' }"
              data-testid="pm3-positioner"
            >
              <Popover.Popup class="popup" aria-label="Placed" data-testid="pm3-popup">
                Placed
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </section>
    <section data-fixture="combobox-data">
      <div class="bar">
        <Combobox.Root
          id="cd1"
          :items="PANTRY"
          auto-highlight
          @input-value-change="(text: string) => (looked = text)"
        >
          <Combobox.Trigger data-testid="cd1-trigger">
            <span data-testid="cd1-value"><Combobox.Value placeholder="Pick one" /></span>
          </Combobox.Trigger>
          <Combobox.Status data-testid="cd1-status">{{ pantryLeft(looked) }}</Combobox.Status>
          <Combobox.Portal>
            <Combobox.Positioner :side-offset="4" data-testid="cd1-positioner">
              <Combobox.Popup class="popup" aria-label="Pantry" data-testid="cd1-popup">
                <Combobox.Input
                  class="search"
                  aria-label="Search the pantry"
                  data-testid="cd1-input"
                />
                <Combobox.List aria-label="Pantry" data-testid="cd1-list">
                  <Combobox.Collection v-slot="{ entry: group }">
                    <Combobox.Group
                      :id="`cd1-g-${group.value}`"
                      :data-testid="`cd1-g-${group.value}`"
                    >
                      <Combobox.GroupLabel>{{ group.label }}</Combobox.GroupLabel>
                      <Combobox.Collection :of="group" v-slot="{ entry: item }">
                        <Combobox.Item
                          :value="item.value"
                          :id="`cd1-${item.value}`"
                          :disabled="item.disabled"
                          class="item"
                          :data-testid="`cd1-${item.value}`"
                          >{{ item.label }}</Combobox.Item
                        >
                      </Combobox.Collection>
                    </Combobox.Group>
                  </Combobox.Collection>
                </Combobox.List>
                <Combobox.Empty data-testid="cd1-empty">Nothing in the pantry</Combobox.Empty>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      </div>
      <div class="bar">
        <Combobox.Root
          id="cd2"
          name="berry"
          :items="BERRIES"
          default-value="cherry"
          :read-only="sealed"
          auto-highlight
        >
          <Combobox.Input aria-label="Berry" data-testid="cd2-input" />
          <Combobox.Clear aria-label="Clear the berry" data-testid="cd2-clear">×</Combobox.Clear>
          <Combobox.Portal>
            <Combobox.Positioner :side-offset="4" data-testid="cd2-positioner">
              <Combobox.Popup class="popup" aria-label="Berries" data-testid="cd2-popup">
                <Combobox.Collection v-slot="{ entry: item }">
                  <Combobox.Item
                    :value="item.value"
                    :id="`cd2-${item.value}`"
                    class="item"
                    :data-testid="`cd2-${item.value}`"
                    >{{ item.label }}</Combobox.Item
                  >
                </Combobox.Collection>
                <Combobox.Empty data-testid="cd2-empty">No berry</Combobox.Empty>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        <button type="button" data-testid="cd2-unlock" @click="sealed = false">Unlock</button>
      </div>
    </section>
  </main>
</template>
