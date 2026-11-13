<script setup lang="ts">
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
  Combobox,
  ContextMenu,
  Listbox,
  Menu,
  Menubar,
  Meter,
  NavigationMenu,
  Popover,
  Progress,
  RadioGroup,
  Select,
  Separator,
  Slider,
  Switch,
  Tabs,
  ScrollArea,
  Toggle,
  ToggleGroup,
  Toolbar,
  Tooltip,
} from "@kirana-ui/vue"
import { ref } from "vue"

// The page every adapter draws, element for element: the conformance run walks it and compares
// the DOM of each state across adapters. Change it in every fixture at once.
const FRUITS = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape"]
// A picture of one pixel, and an address that is not a picture.
const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
const BROKEN = "data:image/png;base64,AAAA"
// What the fixture writes for a field's validity, and its own check of a value.
const word = (valid: boolean | null) => (valid === null ? "unchecked" : valid ? "valid" : "invalid")
const taken = (value: string) => (value === "admin" ? "Taken" : null)
const SECTIONS = ["one", "two", "three", "four"]
const PLANS = ["free", "pro", "team", "max"]
const controlled = ref(false)
const alerts = ref(false)
const count = ref(0)
const done = ref(40)
const pictures = ref(false)
const sent = ref("")
const sent2 = ref("")
const reading = ref<"ltr" | "rtl">("rtl")
const rejected = ref<Record<string, string> | undefined>(undefined)
const span = ref<number[]>([20, 80])
const fruit = ref<string | null>("Banana")
const action = ref("none")
const picked = ref("none")
const align = ref<string[]>(["left"])
const tall = ref(false)
const chosen = ref<string[]>(["Banana"])
const pick = ref<string | null>(null)
const outside = ref(0)
const view = ref<unknown>("list")
const presses = ref(0)
const locked = ref(false)

function press(event: Event & { preventKiranaHandler?: () => void }) {
  presses.value += 1
  if (locked.value) event.preventKiranaHandler?.()
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
            >
              <RadioGroup.Indicator class="dot" />
            </RadioGroup.Item>
            {{ each }}
          </label>
        </RadioGroup.Root>
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
        <Avatar.Image :src="pictures ? PIXEL : undefined" alt="Kirana" data-testid="av1-image" />
        <Avatar.Fallback data-testid="av1-fallback">K</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root class="avatar" data-testid="av2">
        <Avatar.Image :src="pictures ? BROKEN : undefined" alt="Nobody" data-testid="av2-image" />
        <Avatar.Fallback data-testid="av2-fallback">N</Avatar.Fallback>
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
        <Combobox.Root id="cb1" name="pick" v-model:value="pick">
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
          <NavigationMenu.Item value="docs">
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
  </main>
</template>
