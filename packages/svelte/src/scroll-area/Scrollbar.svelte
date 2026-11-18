<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { provideScrollbar, useScrollArea } from "./context.ts"
  import type { ScrollbarProps } from "./types.ts"

  // `orientation` is which way it scrolls (`vertical` by default).
  let { orientation = "vertical", keepMounted = false, ...rest }: ScrollbarProps = $props()
  // A scrollbar is its orientation for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const bar = provideScrollbar(useScrollArea().scrollbar(orientation))
  const shown = fromSignal(bar.shown)
</script>

{#if shown.current || keepMounted}
  <Part of={bar.part} tag="div" {...rest} />
{/if}
