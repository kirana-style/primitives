<script lang="ts">
  import {
    Accordion,
    AlertDialog,
    Avatar,
    Button,
    Checkbox,
    Collapsible,
    Dialog,
    HoverCard,
    Meter,
    Popover,
    Progress,
    RadioGroup,
    Select,
    Separator,
    Switch,
    Tabs,
    Toggle,
    Tooltip,
  } from "@kirana-ui/svelte"

  // The page every adapter draws, element for element: the conformance run walks it and compares
  // the DOM of each state across adapters. Change it in all three fixtures at once.
  const FRUITS = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape"]
  // A picture of one pixel, and an address that is not a picture.
  const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  const BROKEN = "data:image/png;base64,AAAA"
  const SECTIONS = ["one", "two", "three", "four"]
  const PLANS = ["free", "pro", "team", "max"]
  let controlled = $state(false)
  let alerts = $state(false)
  let count = $state(0)
  let done = $state(40)
  let pictures = $state(false)
  let fruit = $state<string | null>("Banana")
  let presses = $state(0)
  let locked = $state(false)

  function press(event: Event & { preventKiranaHandler?: () => void }) {
    presses += 1
    if (locked) event.preventKiranaHandler?.()
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
            >
              <RadioGroup.Indicator class="dot" />
            </RadioGroup.Item>
            {each}
          </label>
        {/each}
      </RadioGroup.Root>
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
  </section>

  <section data-fixture="simple">
    <Button data-testid="b1" onclick={() => (count += 1)}>Count {count}</Button>
    <Button disabled focusableWhenDisabled data-testid="b2">Disabled, in the tab order</Button>
    <Button nativeButton={false} onclick={() => (count += 1)}>
      {#snippet child({ props })}
        <span {...props} data-testid="b3">Not a button element</span>
      {/snippet}
    </Button>
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
      <Avatar.Image src={pictures ? PIXEL : undefined} alt="Kirana" data-testid="av1-image" />
      <Avatar.Fallback data-testid="av1-fallback">K</Avatar.Fallback>
    </Avatar.Root>
    <Avatar.Root class="avatar" data-testid="av2">
      <Avatar.Image src={pictures ? BROKEN : undefined} alt="Nobody" data-testid="av2-image" />
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
</main>
