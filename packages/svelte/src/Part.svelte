<script lang="ts">
  import type { Part, PartProps } from "@kirana-ui/core"
  import type { Snippet } from "svelte"

  import { partProps } from "./runtime.svelte.ts"

  // A part's element, or the caller's own through `child`, which spreads the part's props.
  let {
    part,
    tag,
    child,
    children,
    ...rest
  }: {
    part: Part
    tag: string
    child?: Snippet<[{ props: PartProps }]>
    children?: Snippet
    [attribute: string]: unknown
  } = $props()

  const merged = partProps(
    () => part,
    () => rest
  )
</script>

{#if child}
  {@render child({ props: merged.current })}
{:else}
  <svelte:element this={tag} {...merged.current}>{@render children?.()}</svelte:element>
{/if}
