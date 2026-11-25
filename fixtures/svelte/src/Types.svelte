<script lang="ts">
  // What a caller's editor knows of the parts, held by `svelte-check` (`bun run types`): no
  // page draws this file. The markup is what must be accepted; what must be refused is here,
  // each under its `@ts-expect-error`, which fails the check once the line is accepted.
  import {
    Accordion,
    Calendar,
    Checkbox,
    Collapsible,
    Combobox,
    Dialog,
    Field,
    Listbox,
    Menu,
    NavigationMenu,
    NumberField,
    Otp,
    Popover,
    RadioGroup,
    Select,
    Slider,
    Switch,
    Tabs,
    ToggleGroup,
  } from "@kirana-ui/svelte"
  import type { ButtonProps } from "@kirana-ui/svelte"
  import { Primitive, mergeProps } from "@kirana-ui/svelte/primitive"
  import type { PrimitiveProps } from "@kirana-ui/svelte/primitive"
  import type { TriggerProps } from "@kirana-ui/svelte/collapsible"
  import type { RootProps as CalendarProps } from "@kirana-ui/svelte/calendar"
  import type { RootProps as TabsProps } from "@kirana-ui/svelte/tabs"
  import type { ComponentProps } from "svelte"

  let open = $state(false)
  let checked = $state(false)
  let position = $state("bottom")
  let fruit = $state<string | null>("apple")
  let basket = $state(["apple"])
  let panels = $state(["one"])
  let amount = $state<number | null>(3)
  let level = $state(40)
  let range = $state([20, 80])
  let element: HTMLButtonElement | undefined = $state()
  let anchor: HTMLAnchorElement | undefined = $state()
  let box: HTMLElement | undefined = $state()

  // A wrapper's props are the part's, by name or from the component: the same type.
  let { wrapped }: { wrapped: TriggerProps } = $props()
  const same = (): ComponentProps<typeof Collapsible.Trigger> => wrapped
  const button: ButtonProps = { disabled: true, type: "submit" }
  const named: Collapsible.PanelProps = { keepMounted: true }
  void [same, button, named]

  type PanelState = Parameters<NonNullable<Collapsible.PanelProps["child"]>>[0]["state"]

  // A design system's own element takes its tag's attributes and its own state.
  const badge: PrimitiveProps<"a", { active: boolean }> = { href: "/", state: { active: true } }
  const merged = mergeProps({ class: "badge", title: "own" }, badge)
  const titled: string | null | undefined = merged.title
  // @ts-expect-error a `div`, the element when no `as` is given, has no `href`
  const plainLink: PrimitiveProps = { href: "/" }
  // @ts-expect-error the state is the component's own type
  const wrongState: PrimitiveProps<"span", { active: boolean }> = { state: { active: "yes" } }
  void [titled, plainLink, wrongState]
  // @ts-expect-error a class is text, a list or an object of conditions, never a number
  const number: ComponentProps<typeof Dialog.Trigger> = { class: 42 }
  // @ts-expect-error `keepMounted` is a boolean
  const kept: ComponentProps<typeof Collapsible.Panel> = { keepMounted: 3 }
  // @ts-expect-error a tab has a `value`
  const tab: ComponentProps<typeof Tabs.Tab> = {}
  // @ts-expect-error a button has no `href`
  const link: ComponentProps<typeof Dialog.Trigger> = { href: "/" }
  // @ts-expect-error `open` is a boolean
  const opened: ComponentProps<typeof Collapsible.Root> = { open: 1 }
  // @ts-expect-error `checked` is a boolean
  const ticked: ComponentProps<typeof Checkbox.Root> = { checked: "yes" }
  // @ts-expect-error a slider's value is a number, or several
  const slid: ComponentProps<typeof Slider.Root> = { value: "forty" }
  // @ts-expect-error a root that draws no element takes no attribute
  const drawn: ComponentProps<typeof Dialog.Root> = { class: "dialog" }
  // @ts-expect-error a trigger's click is a mouse's event: it has no `key`
  const pressed: TriggerProps = { onclick: (event) => event.key }
  // @ts-expect-error the element is a button, not an input
  const reached: TriggerProps = { onclick: (event) => event.currentTarget.valueAsNumber }
  // @ts-expect-error a panel's state has no `side`
  const side = (state: PanelState) => state.side
  // @ts-expect-error the values are text where the default is text
  const mixed: TabsProps<string> = { defaultValue: "top", value: 0 }
  // @ts-expect-error a day where the mode chooses several
  const several: CalendarProps<"multiple"> = { mode: "multiple", value: "2026-03-02" }
  void [number, kept, tab, link, opened, ticked, slid, drawn, pressed, reached, side, mixed, several]

  // As the markup gives a component its props, the value's type read from them.
  function refused() {
    // @ts-expect-error a number is bound where the default is text
    Tabs.Root(null, { defaultValue: "top", value: 0 })
    // @ts-expect-error the callback is told text, not a number
    RadioGroup.Root(null, { value: "a", onValueChange: (value: number | null) => value })
    // @ts-expect-error the values are text
    Accordion.Root(null, { value: ["a"], onValueChange: (value: number[]) => value })
    // @ts-expect-error a range's list is told where a list was given
    Slider.Root(null, { value: [20, 80], onValueChange: (value: number) => value })
  }
  void refused
</script>

<Collapsible.Root bind:open data-testid="typed" class={["a", open && "b", { c: open }]}>
  <Collapsible.Trigger
    onclick={(event) => {
      const target: HTMLButtonElement = event.currentTarget
      const x: number = event.clientX
      void [target, x]
      // Keeps the part's own handler out of this press.
      event.preventKiranaHandler()
    }}
    {@attach (node) => {
      element = node
    }}
  >
    Open
  </Collapsible.Trigger>
  <Collapsible.Panel>
    {#snippet child({ props, state })}
      <section {...props}>{state.open ? "open" : state.closed ? "closed" : element?.type}</section>
    {/snippet}
  </Collapsible.Panel>
</Collapsible.Root>

<Dialog.Root bind:open>
  <Dialog.Trigger part="trigger" class="trigger" data-slot="dialog-trigger" aria-label="Open">Open</Dialog.Trigger>
</Dialog.Root>

<Popover.Root bind:open>
  <Popover.Positioner side="top" sideOffset={4}>
    {#snippet child({ props, state })}
      <div {...props}>{state.side === "top" ? "above" : state.align}</div>
    {/snippet}
  </Popover.Positioner>
</Popover.Root>

<Tabs.Root
  bind:value={position}
  onValueChange={(value, details) => {
    const text: string = value
    void [text, details.reason]
  }}
>
  <Tabs.List>
    <Tabs.Tab value="top">Top</Tabs.Tab>
  </Tabs.List>
</Tabs.Root>

<RadioGroup.Root
  bind:value={position}
  onValueChange={(value) => {
    const text: string | null = value
    void text
  }}
>
  <RadioGroup.Item value="top">
    {#snippet child({ props, state, input })}
      <label {...props}>{state.checked ? "on" : "off"}{@render input()}</label>
    {/snippet}
  </RadioGroup.Item>
</RadioGroup.Root>

<Select.Root
  bind:value={fruit}
  bind:open
  items={{ apple: "Apple" }}
  onValueChange={(value) => {
    const text: string | null = value
    void text
  }}
/>
<Calendar.Root
  mode="multiple"
  defaultValue={["2026-03-02"]}
  onValueChange={(value) => {
    const days: readonly string[] = value
    void days
  }}
/>
<Calendar.Root
  onValueChange={(value) => {
    const day: string | null = value
    void day
  }}
/>
<Select.Root multiple bind:values={basket} onValuesChange={(values) => void values.join()} />
<!-- Base UI's shape: with `multiple`, `value` and what `onValueChange` is told are a list. -->
<Select.Root
  multiple
  bind:value={basket}
  onValueChange={(value) => {
    const chosen: string[] = value
    void chosen
  }}
/>
<Combobox.Root multiple defaultValue={["apple"]} onValueChange={(value) => void value.join()} />
<Combobox.Root bind:value={fruit} bind:values={basket} bind:open />
<Listbox.Root bind:value={basket} onValueChange={(value) => void value.join()} />
<Accordion.Root bind:value={panels} onValueChange={(value) => void value.join()} />
<ToggleGroup bind:value={basket} onValueChange={(value) => void value.join()} />
<NavigationMenu.Root bind:value={fruit} />
<Menu.Root bind:open>
  <Menu.RadioGroup bind:value={position} onValueChange={(value) => void value.trim()} />
</Menu.Root>

<Checkbox.Root bind:checked>
  {#snippet child({ props, state, input })}
    <label {...props}>{state.indeterminate ? "some" : "all"}{@render input()}</label>
  {/snippet}
</Checkbox.Root>
<Switch.Root bind:checked>
  {#snippet child({ props, input })}<label {...props}>{@render input()}</label>{/snippet}
</Switch.Root>
<Slider.Root bind:value={level} onValueChange={(value) => void value.toFixed()} />
<Slider.Root bind:value={range} onValueCommitted={(value) => void value.join()} />
<Slider.Root onValueChange={(value) => void value.toFixed()} />
<Slider.Root>
  <Slider.Value>
    {#snippet child({ props, state, text })}
      <output {...props}>{state.dragging ? "moving" : ""}{@render text()}</output>
    {/snippet}
  </Slider.Value>
  <Slider.Thumb>
    {#snippet child({ props, state, input })}
      <div {...props}>{state.dragging ? "moving" : "still"}{@render input()}</div>
    {/snippet}
  </Slider.Thumb>
</Slider.Root>
<NumberField.Root bind:value={amount}>
  {#snippet child({ props, input })}<div {...props}>{@render input()}</div>{/snippet}
</NumberField.Root>
<Otp.Root length={4}>
  <Otp.Slot index={0}>
    {#snippet child({ props, char })}<span {...props}>{char.toUpperCase()}</span>{/snippet}
  </Otp.Slot>
</Otp.Root>

<Field.Root>
  <Field.Control type="email" oninput={(event) => void event.currentTarget.valueAsNumber} />
  <Field.Control as="textarea" rows={3} oninput={(event) => void event.currentTarget.textLength} />
</Field.Root>

<Primitive as="a" href="/x" onclick={(event) => void event.currentTarget.href}>Link</Primitive>
<!-- Its element is reached with an attachment, typed by its tag, as a part's is. -->
<Primitive
  as="a"
  href="/x"
  {@attach (node) => {
    anchor = node
  }}>Link</Primitive
>
<Primitive
  {@attach (node) => {
    // @ts-expect-error a `div` is not a link
    anchor = node
    box = node
  }}
/>
<Primitive {...merged}>
  {#snippet child({ props, state })}<a {...props}>{state.active ? "On" : "Off"}</a>{/snippet}
</Primitive>
