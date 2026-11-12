<script lang="ts">
  import type { Direction } from "@kirana-ui/core"
  import { createDirection } from "@kirana-ui/core/direction"
  import type { Snippet } from "svelte"

  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"

  // It draws nothing: set the page's own `dir` attribute with it.
  let { direction, children }: { direction?: Direction; children?: Snippet } = $props()

  provide(controller(createDirection, () => ({ direction })).direction)
</script>

{@render children?.()}
