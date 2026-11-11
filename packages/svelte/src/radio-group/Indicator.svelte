<script lang="ts">
  import { getContext, untrack } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { ITEM, useRadioGroup } from "./context.ts"

  // `keepMounted` keeps the mark in the page while its item is not the chosen one.
  let { keepMounted = false, ...rest } = $props()
  const indicator = useRadioGroup().indicator(getContext(ITEM))
  $effect(() => untrack(() => indicator.mount()))
  const mounted = fromSignal(indicator.mounted)
</script>

{#if mounted.current || keepMounted}
  <Part part={indicator.part} tag="span" {...rest} />
{/if}
