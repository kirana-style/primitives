<script lang="ts">
  import { untrack } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCheckbox } from "./context.ts"
  import type { CheckboxItemIndicatorProps } from "./types.ts"

  let { keepMounted = false, ...rest }: CheckboxItemIndicatorProps = $props()
  const item = useCheckbox()
  // In the page while checked, and through its exit.
  $effect(() => untrack(() => item.indicator.mount()))
  const mounted = fromSignal(item.indicator.mounted)
</script>

{#if mounted.current || keepMounted}
  <Part of={item.indicator} tag="span" {...rest} />
{/if}
