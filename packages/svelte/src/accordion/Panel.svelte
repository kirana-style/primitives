<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useItem } from "./context.ts"
  import type { PanelProps } from "./types.ts"

  // `keepMounted` keeps the closed panel in the page, `hidden`.
  let { keepMounted = false, ...rest }: PanelProps = $props()
  const item = useItem()
  const mounted = fromSignal(item.mounted)
</script>

{#if mounted.current || keepMounted}
  <Part of={item.panel} tag="div" {...rest} />
{/if}
