<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCombobox } from "./context.ts"
  import type { ClearProps } from "./types.ts"

  // A button that empties the input and the value. Drawn while there is something to clear.
  let { keepMounted = false, ...rest }: ClearProps = $props()
  const controller = useCombobox()
  const clearable = fromSignal(controller.clearable)
</script>

{#if clearable.current || keepMounted}
  <Part of={controller.clear} tag="button" {...rest} />
{/if}
