<script lang="ts">
  import type { Snippet } from "svelte"

  import Portal from "../Portal.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useHoverCard } from "./context.ts"

  let { children }: { children?: Snippet } = $props()
  const mounted = fromSignal(useHoverCard().mounted)
</script>

<Portal mounted={mounted.current} {children} />
