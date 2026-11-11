<script setup lang="ts">
import { Collapsible, Dialog, Popover, Select } from "@kirana-ui/vue"
import { ref } from "vue"

// The page every adapter draws, element for element: the conformance run walks it and compares
// the DOM of each state across adapters. Change it in every fixture at once.
const FRUITS = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape"]
const controlled = ref(false)
const fruit = ref<string | null>("Banana")
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
  </main>
</template>
