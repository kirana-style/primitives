<script setup lang="ts">
import { Collapsible as Ark } from "@ark-ui/vue/collapsible"
import { Collapsible } from "@kirana-ui/vue"

const props = defineProps<{ lib: string; count: number }>()
const rows = Array.from({ length: props.count }, (_, index) => index)
</script>

<template>
  <template v-if="lib === 'other'">
    <Ark.Root v-for="index in rows" :key="index" lazy-mount unmount-on-exit>
      <Ark.Trigger>Row {{ index }}</Ark.Trigger>
      <Ark.Content>Content {{ index }}</Ark.Content>
    </Ark.Root>
  </template>
  <template v-else>
    <Collapsible.Root v-for="index in rows" :key="index">
      <Collapsible.Trigger>Row {{ index }}</Collapsible.Trigger>
      <Collapsible.Panel>Content {{ index }}</Collapsible.Panel>
    </Collapsible.Root>
  </template>
</template>
