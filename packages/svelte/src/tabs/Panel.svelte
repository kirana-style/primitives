<script lang="ts">
  import { untrack } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useTabs } from "./context.ts"

  // `keepMounted` keeps the panel in the page, `hidden`, while its tab is not the active one.
  let { value, keepMounted = false, ...rest } = $props()
  // svelte-ignore state_referenced_locally
  const panel = useTabs().panel(value)
  $effect(() => untrack(() => panel.mount()))
  const mounted = fromSignal(panel.mounted)
</script>

{#if mounted.current || keepMounted}
  <Part part={panel.part} tag="div" {...rest} />
{/if}
