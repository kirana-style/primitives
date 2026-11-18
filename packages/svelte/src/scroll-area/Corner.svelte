<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useScrollArea } from "./context.ts"
  import type { CornerProps } from "./types.ts"

  let props: CornerProps = $props()
  const { corner } = useScrollArea()
  const shown = fromSignal(corner.shown)
</script>

{#if shown.current}
  <Part of={corner.part} tag="div" {...props} />
{/if}
