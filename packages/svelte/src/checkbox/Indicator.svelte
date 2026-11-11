<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCheckbox } from "./context.ts"

  // `keepMounted` keeps the mark in the page while the box is unchecked.
  let { keepMounted = false, ...rest } = $props()
  const controller = useCheckbox()
  const mounted = fromSignal(controller.indicatorMounted)
</script>

{#if mounted.current || keepMounted}
  <Part part={controller.indicator} tag="span" {...rest} />
{/if}
