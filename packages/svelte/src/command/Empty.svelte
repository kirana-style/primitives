<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCommand } from "./context.ts"
  import type { EmptyProps } from "./types.ts"

  // Drawn while no item is shown for what was typed.
  let props: EmptyProps = $props()
  const controller = useCommand()
  const empty = fromSignal(controller.empty)
</script>

{#if empty.current}
  <Part of={controller.emptyPart} tag="div" {...props} />
{/if}
