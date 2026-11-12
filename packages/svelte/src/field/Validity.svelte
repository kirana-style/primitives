<script lang="ts">
  import type { FieldValidity } from "@kirana-ui/core/field"
  import type { Snippet } from "svelte"

  import { fromSignal } from "../runtime.svelte.ts"
  import { useField } from "./context.ts"

  // Draws nothing itself: `children`, a snippet, is given the field's validity.
  let { children }: { children: Snippet<[FieldValidity]> } = $props()
  const validity = fromSignal(useField().validity)
</script>

{@render children(validity.current)}
