<script lang="ts">
  import type { Snippet } from "svelte"

  import Outlet from "../Portal.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useDialog } from "./context.ts"

  let { children }: { children?: Snippet } = $props()
  const mounted = fromSignal(useDialog().mounted)
</script>

<Outlet mounted={mounted.current} {children} />
