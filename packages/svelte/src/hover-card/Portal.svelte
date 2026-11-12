<script lang="ts">
  import type { Snippet } from "svelte"

  import Outlet from "../Portal.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useHoverCard } from "./context.ts"

  let { children }: { children?: Snippet } = $props()
  const mounted = fromSignal(useHoverCard().mounted)
</script>

<Outlet mounted={mounted.current} {children} />
