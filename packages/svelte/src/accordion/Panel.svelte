<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useItem } from "./context.ts"

  // `keepMounted` keeps the closed panel in the page, `hidden`.
  let { keepMounted = false, ...rest } = $props()
  const item = useItem()
  const mounted = fromSignal(item.mounted)
</script>

{#if mounted.current || keepMounted}
  <Part part={item.panel} tag="div" {...rest} />
{/if}
