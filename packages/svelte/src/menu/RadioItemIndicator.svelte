<script lang="ts">
  import { getContext, untrack } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { RADIO_ITEM, useRadioGroup } from "./context.ts"
  import type { RadioItemIndicatorProps } from "./types.ts"

  let { keepMounted = false, ...rest }: RadioItemIndicatorProps = $props()
  const group = useRadioGroup()
  const value = getContext(RADIO_ITEM)
  const part = group.indicator(value)
  // In the page while chosen, and through its exit.
  $effect(() => untrack(() => part.mount()))
  const mounted = fromSignal(part.mounted)
</script>

{#if mounted.current || keepMounted}
  <Part of={part} tag="span" {...rest} />
{/if}
