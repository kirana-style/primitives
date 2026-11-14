<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useOtp, useSlot } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // Drawn in its cell while the cell is the active one and empty.
  let props: PartAttributes = $props()
  const controller = useOtp()
  const shown = fromSignal(useSlot().caret)
</script>

{#if shown.current}
  <Part part={controller.caretPart} tag="div" {...props} />
{/if}
