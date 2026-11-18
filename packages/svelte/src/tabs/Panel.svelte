<script lang="ts">
  import { untrack } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useTabs } from "./context.ts"
  import type { PanelProps } from "./types.ts"

  let { value, keepMounted = false, ...rest }: PanelProps = $props()
  // svelte-ignore state_referenced_locally
  const panel = useTabs().panel(value)
  $effect(() => untrack(() => panel.mount()))
  const mounted = fromSignal(panel.mounted)
</script>

{#if mounted.current || keepMounted}
  <Part of={panel.part} tag="div" {...rest} />
{/if}
