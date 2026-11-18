<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useParts } from "./context.ts"
  import type { Snippet } from "svelte"

  import type { ChildGiven, HeldText } from "../types.ts"

  // A part that says something of the toast's: the caller's own content when it has any, what
  // the toast was added with otherwise, and nothing in the page when there is neither.
  let {
    said,
    tag,
    child,
    children,
    ...rest
  }: {
    said: "title" | "description" | "action"
    tag: string
    child?: Snippet<[ChildGiven & HeldText]> | undefined
    children?: Snippet | undefined
    [attribute: string]: unknown
  } = $props()
  const parts = useParts()
  const toast = fromSignal(parts.record)
  const given = $derived(said === "action" ? toast.current?.action?.label : toast.current?.[said])
</script>

<!-- What it says is the part's own, not its content: with `child` the snippet is given it
     as `text`, to render inside the caller's element. -->
{#snippet written()}{#if children}{@render children()}{:else if typeof given === "string"}{given}{:else if given != null}{@render given()}{/if}{/snippet}

{#if child || children || given != null}
  <Part of={parts[said]} {tag} {child} {...rest} held={{ text: written }}>{@render written()}</Part>
{/if}
