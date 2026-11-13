<script lang="ts">
  import type { Snippet } from "svelte"

  import Outlet from "../Portal.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useMenu } from "./context.ts"

  let { children }: { children?: Snippet } = $props()
  const mounted = fromSignal(useMenu().mounted)
</script>

<Outlet mounted={mounted.current} {children} />
