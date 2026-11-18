<script lang="ts">
  import Outlet from "../Portal.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useNavigation } from "./context.ts"
  import type { PortalProps } from "./types.ts"

  let { children }: PortalProps = $props()
  const mounted = fromSignal(useNavigation().mounted)
</script>

<Outlet mounted={mounted.current} {children} />
