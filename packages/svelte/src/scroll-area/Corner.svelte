<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useScrollArea } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const { corner } = useScrollArea()
  const shown = fromSignal(corner.shown)
</script>

{#if shown.current}
  <Part part={corner.part} tag="div" {...props} />
{/if}
