<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCombobox } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // Drawn while no item is shown for what was typed.
  let props: PartAttributes = $props()
  const controller = useCombobox()
  const empty = fromSignal(controller.empty)
</script>

{#if empty.current}
  <Part part={controller.emptyPart} tag="div" {...props} />
{/if}
