<script lang="ts">
  import { untrack } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useSelect } from "./context.ts"
  import type { ScrollDownArrowProps } from "./types.ts"

  // In the page while there is more of the list its way: it scrolls it under a moving pointer.
  let props: ScrollDownArrowProps = $props()
  const arrow = useSelect().scrollArrow("down")
  $effect(() => untrack(() => arrow.mount()))
  const mounted = fromSignal(arrow.mounted)
</script>

{#if mounted.current}
  <Part of={arrow.part} tag="div" {...props} />
{/if}
