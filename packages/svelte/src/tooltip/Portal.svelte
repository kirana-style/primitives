<script lang="ts">
  import type { Snippet } from "svelte"

  import Portal from "../Portal.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useTooltip } from "./context.ts"

  let { children }: { children?: Snippet } = $props()
  const mounted = fromSignal(useTooltip().mounted)
</script>

<Portal mounted={mounted.current} {children} />
