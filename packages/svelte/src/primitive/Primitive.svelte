<!--
  @component
  A plain element of one's own (a badge, a breadcrumb's link) with the composition a part has:
  `as` for another tag (a `div` unless said), or `child` for the caller's own element, given the
  props to spread and the state. `state` is written as `data-*` attributes under the attributes
  given. Merge the component's own props with its caller's through `mergeProps`, as a part's
  are merged.
-->
<script
  lang="ts"
  generics="Name extends Tag = 'div', State extends Record<string, unknown> = Record<string, never>"
>
  import { stateAttributes } from "@kirana-ui/core"

  import type { Tag } from "../types.ts"
  import type { PrimitiveProps } from "./types.ts"

  let { as, child, state, children, ...rest }: PrimitiveProps<Name, State> = $props()

  // Elements that hold nothing: Svelte refuses content in them.
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
  const given = $derived({ ...stateAttributes(state ?? {}), ...rest })
  const tag = $derived(as ?? "div")
</script>

{#if child}
  {@render child({ props: given, state: state ?? ({} as State) })}
{:else if VOID.has(tag)}
  <svelte:element this={tag} {...given} />
{:else}
  <svelte:element this={tag} {...given}>{@render children?.()}</svelte:element>
{/if}
