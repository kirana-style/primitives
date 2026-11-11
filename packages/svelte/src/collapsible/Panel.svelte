<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCollapsible } from "./context.ts"

  // `keepMounted` keeps the closed panel in the page, `hidden`.
  let { keepMounted = false, ...rest } = $props()
  const controller = useCollapsible()
  const mounted = fromSignal(controller.mounted)
</script>

{#if mounted.current || keepMounted}
  <Part part={controller.panel} tag="div" {...rest} />
{/if}
