<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCollapsible } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // `keepMounted` keeps the closed panel in the page, `hidden`.
  let { keepMounted = false, ...rest }: PartAttributes = $props()
  const controller = useCollapsible()
  const mounted = fromSignal(controller.mounted)
</script>

{#if mounted.current || keepMounted}
  <Part part={controller.panel} tag="div" {...rest} />
{/if}
