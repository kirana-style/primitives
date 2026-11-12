<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useItem } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // `keepMounted` keeps the closed panel in the page, `hidden`.
  let { keepMounted = false, ...rest }: PartAttributes = $props()
  const item = useItem()
  const mounted = fromSignal(item.mounted)
</script>

{#if mounted.current || keepMounted}
  <Part part={item.panel} tag="div" {...rest} />
{/if}
