<script lang="ts">
  import { untrack } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useAvatar } from "./context.ts"
  import type { ImageProps } from "./types.ts"

  // The picture: in the page once `src` has loaded, or all along with `keepMounted`.
  let { src, onLoadingStatusChange, keepMounted, ...rest }: ImageProps = $props()
  const controller = useAvatar()
  $effect.pre(() => {
    controller.source.set(src)
  })
  const report = controller.statusReport(() => onLoadingStatusChange)
  $effect(() => untrack(() => report.mount()))
  const mounted = fromSignal(controller.imageMounted)
</script>

{#if keepMounted}
  <Part of={controller.keptImage} tag="img" {src} {...rest} />
{:else if mounted.current}
  <Part of={controller.image} tag="img" {...rest} />
{/if}
