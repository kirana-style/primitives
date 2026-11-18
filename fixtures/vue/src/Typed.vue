<script setup lang="ts">
// Never drawn: what `vue-tsc` holds the adapter's types to (`bun run types`). Each
// `@vue-expect-error` is a use that must be refused, for the reason it gives.
import type { ChangeDetails } from "@kirana-ui/core"
import {
  Accordion,
  Checkbox,
  Collapsible,
  Combobox,
  Dialog,
  Field,
  Menu,
  NavigationMenu,
  Popover,
  RadioGroup,
  Select,
  Slider,
  Tabs,
  ToggleGroup,
} from "@kirana-ui/vue"
import { Primitive } from "@kirana-ui/vue/primitive"
import { ref } from "vue"

import TypedTrigger from "./TypedTrigger.vue"

const position = ref("bottom")
const count = ref(1)
const open = ref(false)
const checked = ref(false)
const several = ref<string[]>([])
const fruit = ref<string | null>(null)
const range = ref([20, 80])
const level = ref(40)

const text = (value: string): string => value
const flag = (value: true | undefined): boolean => value === true
const told = (value: string, details: ChangeDetails): string => `${value} ${details.reason}`
const x = (event: MouseEvent): number => event.clientX
</script>

<template>
  <!-- A part's slot is given its state, by the vocabulary's names. -->
  <Collapsible.Root v-slot="{ state }" v-model:open="open">
    {{ flag(state.open) }}
    <Collapsible.Trigger v-slot="{ state: trigger }" @click="(event) => x(event)">
      {{ flag(trigger.panelOpen) }}
      <!-- @vue-expect-error a trigger has no such state -->
      {{ trigger.open }}
    </Collapsible.Trigger>
    <Collapsible.Panel v-slot="{ state: panel }" keep-mounted>
      {{ flag(panel.startingStyle) }}
    </Collapsible.Panel>
    <!-- @vue-expect-error `keep-mounted` is a boolean -->
    <Collapsible.Panel :keep-mounted="3" />
  </Collapsible.Root>
  <!-- @vue-expect-error `open` is a boolean -->
  <Collapsible.Root v-model:open="count" />
  <Popover.Root v-model:open="open">
    <Popover.Positioner v-slot="{ state }" side="top" :side-offset="4">
      {{ text(state.side ?? "bottom") }}
      <!-- @vue-expect-error a side is one of six -->
      {{ state.side === "middle" }}
    </Popover.Positioner>
    <!-- @vue-expect-error `side` is one of the sides -->
    <Popover.Positioner side="middle" />
  </Popover.Root>
  <!-- @vue-expect-error a root that draws no element takes no attribute of one -->
  <Dialog.Root href="/elsewhere" />

  <!-- A part takes its element's attributes and listeners, those of `as` when it is given. -->
  <Collapsible.Root>
    <Collapsible.Trigger
      class="wide"
      aria-label="More"
      data-kind="plain"
      :tabindex="0"
      :disabled="false"
      @click="(event) => x(event)"
      @keydown="(event) => text(event.key)"
      @pointerdown="(event) => event.preventKiranaHandler()"
    />
    <Collapsible.Trigger as="a" href="/more" target="_blank" />
    <!-- @vue-expect-error a `<button>` has no `href` -->
    <Collapsible.Trigger href="/more" />
    <!-- @vue-expect-error `tabindex` is a number or a string -->
    <Collapsible.Trigger :tabindex="{}" />
    <!-- @vue-expect-error a click's event is a `MouseEvent`, which has no `key` -->
    <Collapsible.Trigger @click="(event) => text(event.key)" />
  </Collapsible.Root>
  <Field.Root>
    <Field.Control as="textarea" :rows="3" />
    <!-- @vue-expect-error an `<input>` has no `rows` -->
    <Field.Control :rows="3" />
  </Field.Root>
  <Primitive as="a" href="/home" />
  <!-- @vue-expect-error a `<div>` has no `href` -->
  <Primitive href="/home" />

  <!-- A required prop of a part is asked for. -->
  <Tabs.Root
    v-model:value="position"
    default-value="top"
    @value-change="(value, by) => told(value, by)"
  >
    <Tabs.Tab value="top" disabled />
    <!-- @vue-expect-error a tab needs its `value` -->
    <Tabs.Tab />
    <Tabs.Panel value="top" keep-mounted />
  </Tabs.Root>

  <!-- A root's value is the type its caller gives it. -->
  <!-- @vue-expect-error a number is bound where the default is a string -->
  <Tabs.Root v-model:value="count" default-value="top" />
  <Tabs.Root v-model:value="count" :default-value="2" @value-change="(value) => value.toFixed()" />
  <!-- @vue-expect-error the value is a string, which has no `toFixed` -->
  <Tabs.Root v-model:value="position" @value-change="(value) => value.toFixed()" />
  <Menu.Root>
    <Menu.RadioGroup v-model:value="position" @value-change="(value, by) => told(value, by)">
      <Menu.RadioItem value="top" />
    </Menu.RadioGroup>
    <!-- @vue-expect-error a number is bound where the default is a string -->
    <Menu.RadioGroup v-model:value="count" default-value="top" />
    <Menu.CheckboxItem
      v-model:checked="checked"
      @checked-change="(now, by) => told(String(now), by)"
    />
  </Menu.Root>
  <Accordion.Root v-model:value="several" @value-change="(value) => value.map(text)" />
  <!-- @vue-expect-error an accordion's value is a list -->
  <Accordion.Root v-model:value="position" />
  <ToggleGroup v-model:value="several" @value-change="(value) => value.map(text)" />
  <!-- A value that can be put back to none says so: its caller holds `string | null`. -->
  <RadioGroup.Root v-model:value="fruit" @value-change="(value) => text(value ?? 'none')">
    <RadioGroup.Item value="apple" />
  </RadioGroup.Root>
  <!-- @vue-expect-error the group can be put back to none: `null` is not a string -->
  <RadioGroup.Root v-model:value="position" />
  <Select.Root v-model:value="fruit" v-model:values="several" v-model:open="open">
    <Select.Value v-slot="{ label, values, state }" placeholder="Pick"
      >{{ label }} {{ values.length }} {{ flag(state.placeholder) }}</Select.Value
    >
  </Select.Root>
  <!-- @vue-expect-error the values are strings where numbers are bound -->
  <Select.Root v-model:values="several" :default-values="[1]" />
  <Combobox.Root
    v-model:value="fruit"
    v-model:input-value="position"
    @value-change="(value, by) => told(value ?? 'none', by)"
  />
  <NavigationMenu.Root v-model:value="fruit" />
  <Checkbox.Root v-model:checked="checked" as-child><label /></Checkbox.Root>
  <!-- @vue-expect-error `checked` is a boolean -->
  <Checkbox.Root v-model:checked="position" />
  <!-- What a slider tells is what it was given: a number, or a list for a range. -->
  <Slider.Root v-model:value="range" @value-committed="(value) => value.map(String)">
    <Slider.Value v-slot="{ text: written, values }"
      >{{ text(written) }} {{ values.length }}</Slider.Value
    >
  </Slider.Root>
  <Slider.Root v-model:value="level" @value-change="(value) => value.toFixed()" />
  <!-- @vue-expect-error a slider's value is a number or a list of them -->
  <Slider.Root default-value="forty" />

  <!-- A wrapper declares a part's props by their exported type and hands them on. -->
  <Collapsible.Root><TypedTrigger as="span" as-child keep-mounted /></Collapsible.Root>
</template>
