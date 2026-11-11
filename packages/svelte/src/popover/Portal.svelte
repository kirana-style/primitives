<script lang="ts">
  import type { Snippet } from "svelte"

  import Portal from "../Portal.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { usePopover } from "./context.ts"

  let { children }: { children?: Snippet } = $props()
  const mounted = fromSignal(usePopover().mounted)
</script>

<Portal mounted={mounted.current} {children} />
