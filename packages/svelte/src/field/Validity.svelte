<script lang="ts">
  import { fromSignal } from "../runtime.svelte.ts"
  import { useField } from "./context.ts"
  import type { ValidityProps } from "./types.ts"

  // Draws nothing itself: `children`, a snippet, is given the field's validity.
  let { children }: ValidityProps = $props()
  const validity = fromSignal(useField().validity)
</script>

{@render children(validity.current)}
