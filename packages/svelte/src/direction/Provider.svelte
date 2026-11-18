<!--
  @component
  States the reading direction for the components inside. It draws nothing: set the page's
  own `dir` attribute with it.
-->
<script lang="ts">
  import { createDirection } from "@kirana-ui/core/direction"

  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { DirectionProviderProps } from "./types.ts"

  // It draws nothing: set the page's own `dir` attribute with it.
  let { direction, children }: DirectionProviderProps = $props()

  provide(controller(createDirection, () => ({ direction })).direction)
</script>

{@render children?.()}
