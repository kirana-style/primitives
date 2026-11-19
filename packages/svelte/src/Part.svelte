<!--
  @component
  The element of a part (`of`, drawn as `tag`), or the caller's own through `child`: for a
  component of one's own, made on the core's services.
-->
<script lang="ts">
  import type { Part } from "@kirana-ui/core"
  import type { Snippet } from "svelte"

  import { partProps } from "./runtime.svelte.ts"

  // The element of a part (`of`), or the caller's own through `child`, which spreads the
  // part's props and is given the part's state. `held` is what the part keeps in its element
  // beside its content (a control's native input, the text it writes, each as a snippet): the
  // caller's element is the caller's to draw, so `child` is given it too, to put inside.
  let {
    of,
    tag,
    child,
    held,
    children,
    ...rest
  }: {
    of: Part
    tag: string
    // Each part's own file says what its snippet is given: here it is any part's.
    // oxlint-disable-next-line typescript/no-explicit-any
    child?: Snippet<[any]> | undefined
    held?: Record<string, unknown> | undefined
    children?: Snippet | undefined
    [attribute: string]: unknown
  } = $props()

  const merged = partProps(
    () => of,
    () => rest
  )
</script>

<script lang="ts" module>
  // An element that holds nothing is drawn with no content block: Svelte warns on every render
  // of a void element given one, children or not.
  const VOID = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "source",
    "track",
    "wbr",
  ])
</script>

{#if child}
  {@render child({ ...held, props: merged.current, state: merged.state })}
{:else if VOID.has(tag)}
  <svelte:element this={tag} {...merged.current} />
{:else}
  <svelte:element this={tag} {...merged.current}>{@render children?.()}</svelte:element>
{/if}
