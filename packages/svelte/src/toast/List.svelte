<script lang="ts">
  import { fromSignal } from "../runtime.svelte.ts"
  import { useToast } from "./context.ts"
  import type { ListProps } from "./types.ts"

  // Draws its snippet once for each toast, the newest first.
  let { children }: ListProps = $props()
  const toasts = fromSignal(useToast().toasts)
</script>

{#each toasts.current as toast (toast.id)}
  {@render children(toast)}
{/each}
