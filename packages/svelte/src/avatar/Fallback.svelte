<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useAvatar } from "./context.ts"
  import type { FallbackProps } from "./types.ts"

  // What shows until the picture has loaded, or when it cannot.
  let props: FallbackProps = $props()
  const controller = useAvatar()
  const status = fromSignal(controller.status)
</script>

{#if status.current !== "loaded"}
  <Part of={controller.fallback} tag="span" {...props} />
{/if}
