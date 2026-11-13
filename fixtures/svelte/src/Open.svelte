<script lang="ts">
  import { Checkbox, Collapsible, Field, Popover, Tabs } from "@kirana-ui/svelte"
  import { onMount } from "svelte"

  // The second page: no part is given an id, and a popover is open when the page is first drawn.
  // What a server and a client must agree on without help. The same in all five fixtures.
  // Then what only shows once the page is in a browser: a panel its caller opens as the page
  // mounts, a box in a `<fieldset disabled>`, an input whose caller rewrites what is typed.
  let late = $state(false)
  let unlocked = $state(false)
  let nick = $state("")
  onMount(() => {
    late = true
  })
</script>

<main data-generated-ids="">
  <section data-fixture="ids">
    <Collapsible.Root defaultOpen>
      <Collapsible.Trigger data-testid="o-c-trigger">Details</Collapsible.Trigger>
      <Collapsible.Panel class="panel" data-testid="o-c-panel">
        <p>Panel content</p>
      </Collapsible.Panel>
    </Collapsible.Root>
    <Tabs.Root defaultValue="one">
      <Tabs.List class="tabs">
        <Tabs.Tab value="one" data-testid="o-t-one">One</Tabs.Tab>
        <Tabs.Tab value="two" data-testid="o-t-two">Two</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="one" data-testid="o-t-panel-one">First</Tabs.Panel>
      <Tabs.Panel value="two" data-testid="o-t-panel-two">Second</Tabs.Panel>
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
          <Popover.Popup class="popup" data-testid="o-p-popup">
            <Popover.Title>Notifications</Popover.Title>
            <Popover.Description>You are all caught up.</Popover.Description>
            <Popover.Close data-testid="o-p-close">Close</Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  </section>
  <section data-fixture="late">
    <Collapsible.Root bind:open={late}>
      <Collapsible.Trigger data-testid="o-l-trigger">Late</Collapsible.Trigger>
      <Collapsible.Panel class="panel" data-testid="o-l-panel">
        <p>Opened as the page mounted</p>
      </Collapsible.Panel>
    </Collapsible.Root>
    <fieldset disabled={!unlocked} data-testid="o-s-set">
      <Checkbox.Root name="terms" class="box" data-testid="o-s-box">
        <Checkbox.Indicator class="mark">✓</Checkbox.Indicator>
      </Checkbox.Root>
    </fieldset>
    <button data-testid="o-s-unlock" onclick={() => (unlocked = !unlocked)}>Unlock</button>
    <Field.Root name="nick">
      <Field.Label>Nickname</Field.Label>
      <Field.Control
        value={nick}
        oninput={(event: Event) =>
          (nick = (event.currentTarget as HTMLInputElement).value.toUpperCase())}
        data-testid="o-h-control"
      />
    </Field.Root>
    <output data-testid="o-h-output">{nick}</output>
  </section>
</main>
