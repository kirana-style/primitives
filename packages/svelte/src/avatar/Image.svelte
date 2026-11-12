<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useAvatar } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // The picture: in the page once `src` has loaded.
  let { src, ...rest }: { src?: string } & PartAttributes = $props()
  const controller = useAvatar()
  $effect.pre(() => {
    controller.source.set(src)
  })
  const status = fromSignal(controller.status)
</script>

{#if status.current === "loaded"}
  <Part part={controller.image} tag="img" {...rest} />
{/if}
