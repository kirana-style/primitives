<script lang="ts">
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCombobox } from "./context.ts"
  import type { ValueProps } from "./types.ts"

  // The chosen value's label, or `placeholder` while nothing is chosen. `children`, a snippet,
  // draws something else: it is given what is chosen (`value` and `label`; with `multiple`,
  // `values` and `labels`, in the order they were chosen). It draws no element.
  let { placeholder = "", children }: ValueProps = $props()
  const shown = fromSignal(useCombobox().shown)
</script>

{#if children}{@render children(shown.current)}{:else}{shown.current.label ?? placeholder}{/if}
