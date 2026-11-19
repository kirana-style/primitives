<script lang="ts">
  import { untrack } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useAvatar } from "./context.ts"
  import type { FallbackProps } from "./types.ts"

  // What shows until the picture has loaded, or when it cannot; after `delay`, when given one.
  let { delay, ...props }: FallbackProps = $props()
  const controller = useAvatar()
  const presence = controller.fallbackPresence({ delay: untrack(() => delay) })
  $effect(() => untrack(() => presence.mount()))
  const shown = fromSignal(presence.shown)
</script>

{#if shown.current}
  <Part of={controller.fallback} tag="span" {...props} />
{/if}
