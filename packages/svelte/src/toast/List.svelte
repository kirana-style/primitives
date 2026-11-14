<script lang="ts">
  import type { ToastRecord } from "@kirana-ui/core/toast"
  import type { Snippet } from "svelte"

  import { fromSignal } from "../runtime.svelte.ts"
  import { useToast } from "./context.ts"

  // Draws its snippet once for each toast, the newest first.
  let { children }: { children: Snippet<[ToastRecord]> } = $props()
  const toasts = fromSignal(useToast().toasts)
</script>

{#each toasts.current as toast (toast.id)}
  {@render children(toast)}
{/each}
