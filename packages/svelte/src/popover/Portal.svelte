<script lang="ts">
  import type { Snippet } from "svelte"

  import Outlet from "../Portal.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { usePopover } from "./context.ts"

  let { children }: { children?: Snippet } = $props()
  const mounted = fromSignal(usePopover().mounted)
</script>

<Outlet mounted={mounted.current} {children} />
