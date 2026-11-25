<script lang="ts">
  import { getContext, untrack } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { ITEM, useSelect } from "./context.ts"
  import type { ItemIndicatorProps } from "./types.ts"

  let { keepMounted = false, ...rest }: ItemIndicatorProps = $props()
  const controller = useSelect()
  const value = getContext(ITEM)
  const part = controller.itemIndicator(value)
  // In the page while chosen, and through its exit.
  $effect(() => untrack(() => part.mount()))
  const mounted = fromSignal(part.mounted)
</script>

{#if mounted.current || keepMounted}
  <Part of={part} tag="span" {...rest} />
{/if}
