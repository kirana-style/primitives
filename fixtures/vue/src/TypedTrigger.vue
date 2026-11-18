<script setup lang="ts">
// Never drawn: a wrapper that declares a part's props by their exported type (`Typed.vue`).
import { Collapsible } from "@kirana-ui/vue/collapsible"
import type { PanelProps } from "@kirana-ui/vue/collapsible"

const props = defineProps<PanelProps>()
</script>

<template>
  <Collapsible.Panel v-bind="props" class="wrapped"><slot /></Collapsible.Panel>
</template>
