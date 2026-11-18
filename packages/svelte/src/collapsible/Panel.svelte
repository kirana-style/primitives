<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCollapsible } from "./context.ts"
  import type { PanelProps } from "./types.ts"

  let { keepMounted = false, ...rest }: PanelProps = $props()
  const controller = useCollapsible()
  const mounted = fromSignal(controller.mounted)
</script>

{#if mounted.current || keepMounted}
  <Part of={controller.panel} tag="div" {...rest} />
{/if}
